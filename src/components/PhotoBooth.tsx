import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import * as faceapi from 'face-api.js';
import { motion, AnimatePresence } from 'framer-motion';
import { playChime, playSparkle, playHeartbeat, playPlink } from '../utils/sfx';

type Expression = 'happy' | 'surprised' | 'neutral' | 'sad' | 'angry' | 'fearful' | 'disgusted';

// Smart multi-path checking (handles case-sensitivity on GitHub Pages, .GIF vs .gif, and subfolder paths)
const getPaths = (name: string) => {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const upName = name.charAt(0).toUpperCase() + name.slice(1);
  
  return [
    `${cleanBase}reactions/${name}.gif`,
    `${cleanBase}reactions/${name}.GIF`,
    `${cleanBase}reactions/${upName}.gif`,
    `${cleanBase}reactions/${upName}.GIF`,
    `${cleanBase}${name}.gif`,
    `${cleanBase}${name}.GIF`,
    `reactions/${name}.gif`,
    `reactions/${name}.GIF`
  ];
};

const REACTIONS: Record<Expression, { emoji: string; text: string; img: string[]; color: string }> = {
  happy:     { emoji: '💕', text: 'I LOVE YOU!',       img: getPaths('happy'),     color: '#F4C2D7' },
  surprised: { emoji: '✨', text: 'WOAAAAA',      img: [...getPaths('surprised'), ...getPaths('suprised')], color: '#CAF0F8' },
  neutral:   { emoji: '😊', text: 'Smile na loveey!',  img: getPaths('neutral'),   color: '#FFF5F8' },
  sad:       { emoji: '🥺', text: "wawa naman ang bebe",    img: getPaths('sad'),       color: '#DDE8FA' },
  angry:     { emoji: '😤', text: 'Gagalet yarn?',  img: getPaths('angry'),     color: '#FFD6D6' },
  fearful:   { emoji: '😱', text: 'Skeriii',           img: getPaths('fearful'),   color: '#E8D4F5' },
  disgusted: { emoji: '🤢', text: 'KADERDERRRR!',      img: getPaths('disgusted'), color: '#D4F5D4' },
};

const COUNTDOWN_OPTIONS = [
  { value: 0,  label: 'Instant' },
  { value: 3,  label: '3 sec' },
  { value: 5,  label: '5 sec' },
];

interface SnapResult {
  photo: string;
  expression: Expression;
  timestamp: number;
}

export default function PhotoBooth() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentExpression, setCurrentExpression] = useState<Expression | null>(null);
  const [countdownChoice, setCountdownChoice] = useState(3);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<SnapResult[]>([]);
  const [imgErrorIndex, setImgErrorIndex] = useState<Record<string, number>>({});
  const [latestSnap, setLatestSnap] = useState<SnapResult | null>(null);
  const [flashActive, setFlashActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const detectionRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load AI models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const base = import.meta.env.BASE_URL || '/';
        const cleanBase = base.endsWith('/') ? base : `${base}/`;
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(`${cleanBase}models`),
          faceapi.nets.faceExpressionNet.loadFromUri(`${cleanBase}models`),
        ]);
        setModelsLoaded(true);
        playSparkle();
      } catch (err) {
        console.error('Model load error:', err);
        setError('Failed to load AI models. Check public/models/ folder.');
      }
    };
    loadModels();
  }, []);

  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setWebcamActive(true);
        setError(null);
        playChime();
      }
    } catch {
      setError('Camera access denied. Please allow camera permission! 📸');
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setWebcamActive(false);
    setCurrentExpression(null);
  }, []);

  // Face detection loop
  useEffect(() => {
    if (!modelsLoaded || !webcamActive) return;
    let lastDetect = 0;

    const detect = async () => {
      const now = Date.now();
      if (now - lastDetect < 300) {
        detectionRef.current = requestAnimationFrame(detect);
        return;
      }
      lastDetect = now;

      const video = videoRef.current;
      const canvas = overlayCanvasRef.current;
      if (!video || !canvas || video.readyState !== 4) {
        detectionRef.current = requestAnimationFrame(detect);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
        .withFaceExpressions();

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (detection) {
        const sorted = Object.entries(detection.expressions).sort((a, b) => b[1] - a[1]);
        const topExpr = sorted[0][0] as Expression;
        const confidence = sorted[0][1];

        if (confidence > 0.4) {
          setCurrentExpression(topExpr);
        } else {
          setCurrentExpression('neutral');
        }

        const box = detection.detection.box;
        ctx.strokeStyle = '#F4C2D7';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(box.x, box.y, box.width, box.height);
      } else {
        setCurrentExpression(null);
      }

      detectionRef.current = requestAnimationFrame(detect);
    };

    detectionRef.current = requestAnimationFrame(detect);
    return () => { if (detectionRef.current) cancelAnimationFrame(detectionRef.current); };
  }, [modelsLoaded, webcamActive]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = `${canvas.width * 0.025}px "VT323", monospace`;
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 2;
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    ctx.fillText(dateStr, canvas.width - 250, canvas.height - 15);
    ctx.shadowBlur = 0;

    const dataUrl = canvas.toDataURL('image/png');
    const expr = currentExpression || 'happy';
    const snap: SnapResult = { photo: dataUrl, expression: expr, timestamp: Date.now() };

    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 200);

    setCapturedPhotos(prev => [snap, ...prev]);
    setLatestSnap(snap);
    playHeartbeat();
    playChime();
    setTimeout(() => playSparkle(), 300);
  }, [currentExpression]);

  const startCountdown = useCallback(() => {
    if (isCountingDown || !webcamActive) return;
    setIsCountingDown(true);

    if (countdownChoice === 0) {
      capturePhoto();
      setIsCountingDown(false);
      return;
    }

    let count = countdownChoice;
    setCountdownValue(count);
    playPlink();

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownValue(count);
        playPlink();
      } else {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setCountdownValue(null);
        setIsCountingDown(false);
        capturePhoto();
      }
    }, 1000);
  }, [countdownChoice, webcamActive, isCountingDown, capturePhoto]);

  const saveToScrapbook = useCallback((photo: string) => {
    try {
      const existing = JSON.parse(localStorage.getItem('yzam_scrapbook_v1') || '[]');
      existing.push({
        id: Date.now().toString(),
        url: photo,
        caption: '📸 PhotoBooth snap!',
        date: new Date().toLocaleDateString(),
      });
      localStorage.setItem('yzam_scrapbook_v1', JSON.stringify(existing));
      playChime();
      alert('Saved to Scrapbook! 💕📸');
    } catch {
      alert('Saved locally!');
    }
  }, []);

  const deletePhoto = (index: number) => {
    setCapturedPhotos(prev => prev.filter((_, i) => i !== index));
    playPlink();
  };

  const handleImgError = (expr: Expression) => {
    setImgErrorIndex(prev => ({
      ...prev,
      [expr]: (prev[expr] || 0) + 1,
    }));
  };

  const getCurrentImage = (expr: Expression) => {
    const list = REACTIONS[expr].img;
    const errIdx = imgErrorIndex[expr] || 0;
    if (errIdx < list.length) {
      return list[errIdx];
    }
    return null;
  };

  useEffect(() => {
    return () => {
      stopWebcam();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [stopWebcam]);

  return (
    <div className="flex flex-col gap-3 p-3 font-['Quicksand'] h-full">

      {/* HEADER */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-3xl">📸</span>
        <div className="flex-1">
          <h2 className="text-xl font-black text-[#5C233B]">YZAM SnapCam</h2>
          <p className="text-xs text-[#5C233B]/60 font-['VT323'] text-sm">
            Pose → SNAP → Photo + Reaction pop up together! 💕
          </p>
        </div>
      </div>

      {!modelsLoaded && !error && (
        <div className="bg-[#FFF5F8] border-2 border-[#F4C2D7] rounded-lg p-6 text-center">
          <div className="text-3xl mb-2 animate-bounce">🤖</div>
          <p className="font-black text-[#5C233B] text-sm">Loading AI Brain...</p>
          <div className="mt-2 w-40 h-2 bg-[#F4C2D7]/30 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-[#F4C2D7] rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 text-center">
          <p className="text-red-600 font-bold text-sm">⚠️ {error}</p>
        </div>
      )}

      {modelsLoaded && (
        <>
          {/* 📸 CAMERA */}
          <div className="flex justify-center flex-shrink-0">
            <div className="relative bg-black rounded-lg overflow-hidden border-4 border-[#F4C2D7] shadow-[4px_4px_0px_rgba(0,0,0,0.9)] w-full max-w-xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-[4/3] object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />

              {webcamActive && (
                <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: 'scaleX(-1)' }} />
              )}

              {/* ⚡ Camera flash */}
              <AnimatePresence>
                {flashActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 bg-white z-40 pointer-events-none"
                  />
                )}
              </AnimatePresence>

              {countdownValue !== null && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 bg-black/40">
                  <motion.span
                    key={countdownValue}
                    initial={{ scale: 2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-7xl font-black text-white drop-shadow-[4px_4px_0px_rgba(0,0,0,0.9)]"
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    {countdownValue}
                  </motion.span>
                </div>
              )}

              {webcamActive && currentExpression && !isCountingDown && (
                <div className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-bold text-[#5C233B] shadow-retro-sm z-10">
                  {REACTIONS[currentExpression].emoji} {currentExpression}
                </div>
              )}

              {!webcamActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#272426]">
                  <span className="text-5xl mb-2">📷</span>
                  <p className="text-white/60 font-['VT323'] text-base">Camera is off</p>
                </div>
              )}
            </div>
          </div>

          {/* CONTROLS */}
          <div className="flex flex-wrap gap-2 flex-shrink-0 max-w-xl mx-auto w-full">
            {!webcamActive ? (
              <button onClick={startWebcam} className="flex-1 py-2.5 bg-[#F4C2D7] text-[#5C233B] font-black rounded-lg border-2 border-[#5C233B] shadow-[3px_3px_0px_rgba(0,0,0,0.9)] hover:translate-y-[-1px] active:translate-y-[2px] active:shadow-none transition-all text-sm">📸 Open Camera</button>
            ) : (
              <button onClick={stopWebcam} className="flex-1 py-2.5 bg-gray-300 text-gray-700 font-black rounded-lg border-2 border-gray-600 shadow-[3px_3px_0px_rgba(0,0,0,0.9)] hover:translate-y-[-1px] active:translate-y-[2px] active:shadow-none transition-all text-sm">⏹️ Close</button>
            )}
            <button onClick={startCountdown} disabled={!webcamActive || isCountingDown} className="flex-1 py-2.5 bg-[#812D45] text-white font-black rounded-lg border-2 border-[#272426] shadow-[3px_3px_0px_rgba(0,0,0,0.9)] hover:translate-y-[-1px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              {isCountingDown ? '⏳ Pose!' : '📸 SNAP!'}
            </button>
          </div>

          {/* TIMER OPTIONS */}
          {webcamActive && (
            <div className="max-w-xl mx-auto w-full flex items-center justify-between bg-[#FFF5F8] p-2 rounded-lg border-2 border-[#F4C2D7]">
              <span className="text-xs font-bold text-[#5C233B] font-['VT323']">⏱️ Timer:</span>
              <div className="flex gap-1">
                {COUNTDOWN_OPTIONS.map(c => (
                  <button key={c.value} onClick={() => { setCountdownChoice(c.value); playPlink(); }} className={`px-3 py-1 rounded text-xs font-bold border-2 transition-all ${countdownChoice === c.value ? 'bg-[#CAF0F8] border-[#0F4C5C] text-[#0F4C5C]' : 'bg-white border-gray-300 text-gray-500 hover:border-[#CAF0F8]'}`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CAPTURED GALLERY */}
          {capturedPhotos.length > 0 && (
            <div className="flex-shrink-0">
              <p className="text-xs font-black text-[#5C233B] mb-2">📸 Captured ({capturedPhotos.length})</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {capturedPhotos.map((snap, i) => {
                  const r = REACTIONS[snap.expression];
                  return (
                    <div key={snap.timestamp || i} className="relative group bg-white p-1 border-2 border-[#F4C2D7] rounded-lg shadow-[2px_2px_0px_rgba(0,0,0,0.9)]">
                      <img src={snap.photo} alt={`snap ${i}`} className="w-full rounded" />
                      <div className="absolute -top-1 -right-1 text-lg bg-white rounded-full w-6 h-6 flex items-center justify-center border-2 border-[#F4C2D7] shadow-sm">
                        {r.emoji}
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-1">
                        <button onClick={() => { setLatestSnap(snap); playChime(); }} className="px-1.5 py-0.5 bg-white rounded text-[10px] font-black text-[#5C233B]">👁️</button>
                        <button onClick={() => saveToScrapbook(snap.photo)} className="px-1.5 py-0.5 bg-[#F4C2D7] rounded text-[10px] font-black text-[#5C233B]">💕</button>
                        <button onClick={() => deletePhoto(i)} className="px-1.5 py-0.5 bg-red-300 rounded text-[10px] font-black text-red-800">🗑️</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <canvas ref={captureCanvasRef} className="hidden" />

          {/* 🎉 BIG POP-UP: Photo + Reaction GIF side by side — portaled to body */}
          {createPortal(
            <AnimatePresence>
              {latestSnap && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                  onClick={() => { setLatestSnap(null); playPlink(); }}
                >
                  <motion.div
                    initial={{ scale: 0.5, y: 50, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.5, y: 50, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                    className="relative bg-gradient-to-br from-[#FFF5F8] to-[#F4FCFE] rounded-2xl border-4 border-[#F4C2D7] shadow-[6px_6px_0px_rgba(0,0,0,0.9)] p-5 max-w-3xl w-full opacity-100"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={() => { setLatestSnap(null); playPlink(); }}
                      className="absolute -top-3 -right-3 w-10 h-10 bg-red-400 text-white rounded-full border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,0.9)] font-black text-lg flex items-center justify-center hover:scale-110 transition-transform z-10"
                    >
                      ✕
                    </button>

                    <div className="text-center mb-4">
                      <motion.p
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring' }}
                        className="font-black text-xl text-[#5C233B]"
                      >
                        ✨ Snap Captured! ✨
                      </motion.p>
                      <p className="text-xs text-[#5C233B]/60 font-['VT323'] text-sm mt-0.5">
                        Yza & Zam PhotoBooth 💕
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      <motion.div
                        initial={{ x: -100, opacity: 0, rotate: -8 }}
                        animate={{ x: 0, opacity: 1, rotate: -3 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 150 }}
                        className="bg-white p-2 pb-6 shadow-[4px_4px_0px_rgba(0,0,0,0.9)] border-2 border-[#272426]"
                      >
                        <img src={latestSnap.photo} alt="snap" className="w-full rounded" />
                        <p className="text-center font-['VT323'] text-sm text-[#5C233B] mt-1">
                          📸 Your pose!
                        </p>
                      </motion.div>

                      <motion.div
                        initial={{ x: 100, opacity: 0, rotate: 8 }}
                        animate={{ x: 0, opacity: 1, rotate: 3 }}
                        transition={{ delay: 0.4, type: 'spring', stiffness: 150 }}
                        className="bg-white p-2 pb-6 shadow-[4px_4px_0px_rgba(0,0,0,0.9)] border-2 border-[#272426]"
                        style={{ backgroundColor: REACTIONS[latestSnap.expression].color }}
                      >
                        {getCurrentImage(latestSnap.expression) ? (
                          <img
                            src={getCurrentImage(latestSnap.expression)!}
                            alt="reaction"
                            className="w-full aspect-[4/3] object-contain rounded bg-white"
                            onError={() => handleImgError(latestSnap.expression)}
                          />
                        ) : (
                          <div className="w-full aspect-[4/3] flex flex-col items-center justify-center bg-white rounded p-2 text-center">
                            <span className="text-7xl mb-1">{REACTIONS[latestSnap.expression].emoji}</span>
                          </div>
                        )}
                        <p className="text-center font-['VT323'] text-sm text-[#5C233B] mt-1 font-bold">
                          {REACTIONS[latestSnap.expression].emoji} {REACTIONS[latestSnap.expression].text}
                        </p>
                      </motion.div>
                    </div>

                    <motion.div
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.7 }}
                      className="flex gap-2 mt-5 justify-center"
                    >
                      <button
                        onClick={() => { saveToScrapbook(latestSnap.photo); setLatestSnap(null); }}
                        className="px-5 py-2 bg-[#F4C2D7] text-[#5C233B] font-black rounded-lg border-2 border-[#5C233B] shadow-[3px_3px_0px_rgba(0,0,0,0.9)] hover:translate-y-[-1px] active:translate-y-[2px] active:shadow-none transition-all text-sm"
                      >
                        💕 Save to Scrapbook
                      </button>
                      <button
                        onClick={() => { setLatestSnap(null); playPlink(); }}
                        className="px-5 py-2 bg-white text-[#5C233B] font-black rounded-lg border-2 border-[#5C233B] shadow-[3px_3px_0px_rgba(0,0,0,0.9)] hover:translate-y-[-1px] active:translate-y-[2px] active:shadow-none transition-all text-sm"
                      >
                        ✨ Snap Again!
                      </button>
                    </motion.div>

                    {Array.from({ length: 6 }).map((_, i) => (
                      <motion.span
                        key={i}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1, 0.8], opacity: [0, 1, 0.6] }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                        className="absolute text-xl text-[#F4C2D7] pointer-events-none"
                        style={{
                          top: `${Math.random() * 90}%`,
                          left: `${Math.random() * 90}%`,
                        }}
                      >
                        ✦
                      </motion.span>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )}
        </>
      )}
    </div>
  );
}