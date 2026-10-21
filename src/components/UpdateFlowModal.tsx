import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

interface UpdateFlowModalProps {
  onComplete: () => void;
}

const LOGO_SRC = `${import.meta.env.BASE_URL}yzam-logo.svg`;

const playSound = (type: 'click' | 'beep' | 'chime' | 'pop') => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'beep') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'chime') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
        g.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.06);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.3);
        o.connect(g); g.connect(ctx.destination);
        o.start(ctx.currentTime + idx * 0.06);
        o.stop(ctx.currentTime + idx * 0.06 + 0.3);
      });
    } else if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.1);
    }
  } catch {
    // ignore
  }
};

export const UpdateFlowModal: React.FC<UpdateFlowModalProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'boot' | 'patch' | 'check' | 'terms' | 'letter' | 'question' | 'success'>('boot');
  const [progress, setProgress] = useState(0);
  const [declineAttempts, setDeclineAttempts] = useState(0);
  const [checkIndex, setCheckIndex] = useState(0);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [noPos, setNoPos] = useState({ x: 0, y: 0 });
  const [showNoErr, setShowNoErr] = useState(false);
  const [audioObj, setAudioObj] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (step === 'boot') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + Math.floor(Math.random() * 18) + 8;
        });
      }, 90);
      return () => clearInterval(interval);
    }
  }, [step]);

  useEffect(() => {
    if (step === 'check' && checkIndex < 6) {
      const timer = setTimeout(() => {
        playSound('beep');
        setCheckIndex((p) => p + 1);
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [step, checkIndex]);

  const startSong = () => {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const audio = new Audio(`${baseUrl}aphrodite.mp3`.replace(/\/+/g, '/'));
    audio.loop = true;
    audio.volume = 0.5;
    audio.play().catch(() => {});
    setAudioObj(audio);
  };

  const moveNoButton = () => {
    playSound('beep');
    setNoPos({
      x: (Math.random() - 0.5) * 220,
      y: (Math.random() - 0.5) * 220,
    });
  };

  const handleFinish = () => {
    if (audioObj) {
      audioObj.pause();
      audioObj.currentTime = 0;
    }
    localStorage.setItem('yzam_v2_accepted', 'true');
    onComplete();
  };

  const photos = [
    { id: 1, src: `${import.meta.env.BASE_URL}photo1.PNG`, caption: 'Cutie Photobooth 📸' },
    { id: 2, src: `${import.meta.env.BASE_URL}photo2.PNG`, caption: 'Best Cook!' },
    { id: 3, src: `${import.meta.env.BASE_URL}photo3.jpeg`, caption: 'Tambay moments ✨' },
    { id: 4, src: `${import.meta.env.BASE_URL}photo4.PNG`, caption: 'Always my prettiest baby!!' },
  ];

  return (
    <div className="fixed inset-0 z-[999999] bg-[#272426] text-[#272426] flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none font-sans">
      <div className="pointer-events-none absolute inset-0 opacity-30 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(202,240,248,0.05),rgba(0,255,0,0.02),rgba(255,0,200,0.05))] bg-[length:100%_4px,3px_100%]" />

      {/* BOOT */}
      {step === 'boot' && (
        <div className="relative z-10 w-full max-w-md flex flex-col items-center">
          <motion.img
            src={LOGO_SRC}
            alt="YZAM"
            className="w-24 h-24 rounded-2xl border-2 border-[#272426] bg-[#FFF8F1] shadow-[4px_4px_0_#1a1819] mb-4 object-contain"
            initial={{ rotate: -8, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          />
          <h1 className="font-pixel text-lg tracking-[0.18em] text-[#CAF0F8] drop-shadow-md mb-1">YZAM OS</h1>
          <p className="font-mono text-[10px] text-[#F4C2D7] tracking-widest uppercase mb-6">System Bootloader • Confidential</p>

          {progress < 100 ? (
            <div className="w-full space-y-2 px-4">
              <div className="w-full bg-black/40 border-2 border-[#812D45] p-1 rounded-md">
                <div
                  className="h-3.5 rounded-sm bg-gradient-to-r from-[#CAF0F8] via-[#F4C2D7] to-[#812D45] transition-all duration-150"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="flex justify-between font-mono text-[10px] text-gray-400">
                <span>Checking modules...</span>
                <span>{Math.min(progress, 100)}%</span>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="w-full bg-[#FFF8F1] border-2 border-[#272426] rounded-2xl p-5 shadow-[6px_6px_0_#1a1819] space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#CAF0F8] border-2 border-[#272426] flex items-center justify-center text-xl shrink-0 shadow-[2px_2px_0_#272426]">
                  🔔
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-pixel text-[9px] text-[#0F4C5C]">SYSTEM ALERT</span>
                    <span className="bg-[#812D45] text-white text-[9px] px-2 py-0.5 rounded font-mono font-bold border border-[#272426]">
                      MANDATORY
                    </span>
                  </div>
                  <h2 className="font-bold text-[#272426] text-base leading-tight">YZAM OS v2.0 Available</h2>
                  <p className="text-[#5C233B] text-xs mt-1 leading-relaxed">
                    A critical system update is ready for <strong className="text-[#0F4C5C]">Yza</strong>. Do not ignore.
                  </p>
                </div>
              </div>

              {declineAttempts > 0 && (
                <div className="bg-[#F4C2D7]/40 border-2 border-[#812D45]/40 rounded-xl p-2.5 text-xs text-[#5C233B] text-center font-semibold">
                  {declineAttempts === 1 && 'Nice try, Lovey! Mandatory update ito! 💅'}
                  {declineAttempts >= 2 && 'Loh wag naman pls, Pindutin mo na! 😤💕'}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    playSound('pop');
                    startSong();
                    setStep('patch');
                  }}
                  className="flex-1 bg-[#CAF0F8] hover:bg-[#b5e6f0] text-[#0F4C5C] font-bold py-2.5 rounded-xl text-xs border-2 border-[#272426] shadow-[3px_3px_0_#272426] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#272426] transition-all"
                >
                  View Update Notes ✨
                </button>
                <button
                  onClick={() => {
                    playSound('beep');
                    setDeclineAttempts((p) => p + 1);
                  }}
                  className="px-3 py-2.5 text-[#812D45] hover:bg-[#F4C2D7]/30 text-xs font-mono font-bold rounded-xl border-2 border-transparent hover:border-[#272426]/20"
                >
                  Later
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* PATCH NOTES */}
      {step === 'patch' && (
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10 w-full max-w-xl bg-[#FFF8F1] border-2 border-[#272426] rounded-2xl shadow-[6px_6px_0_#1a1819] overflow-hidden"
        >
          <div className="bg-[#CAF0F8] px-4 py-2.5 border-b-2 border-[#272426] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <img src={LOGO_SRC} alt="" className="w-6 h-6 rounded-md border border-[#272426] bg-white object-contain" />
              <span className="font-mono text-[11px] font-bold text-[#0F4C5C]">yzam_os_changelog.v2.0.txt</span>
            </div>
            <span className="font-pixel text-[8px] text-[#812D45] bg-white/70 px-2 py-0.5 rounded border border-[#272426]/30">
              Y TO Z
            </span>
          </div>

          <div className="p-4 sm:p-5 font-mono text-xs sm:text-sm space-y-4 max-h-[65vh] overflow-y-auto">
            <div className="border-2 border-[#272426] bg-white p-3 rounded-xl text-center shadow-[2px_2px_0_#272426]">
              <h2 className="font-pixel text-[10px] sm:text-xs text-[#812D45]">📋 YZAM OS — RELEASE NOTES</h2>
              <p className="text-[#5C233B] text-[11px] mt-1">Core Memory Sync</p>
            </div>

            <div className="space-y-3 text-[#272426] leading-relaxed">
              <p>
                <strong className="text-[#0F4C5C]">v1.0 (Umingle Era):</strong> Met two strangers trading banters. First voice call deployed during the same week.
              </p>
              <p>
                <strong className="text-[#812D45]">v1.1 (iMessage & Amats Night):</strong> Alcohol in Yza's system led to late night daldalan. Mutual feelings confessed. Zam became super shy.
              </p>
              <p>
                <strong className="text-[#0F4C5C]">v1.2 (First Date & Dorm Tambay):</strong> Photobooth strips saved. Quiet tambay outside Yza's dorm. Deployed first "I love you" website.
              </p>
              <p>
                <strong className="text-[#812D45]">v1.3 (Terminal Rides & Gifts):</strong> Zam intentionally rides to Yza's Bus terminal just to see her face. Random gifts deployed. Zam's heart fully captured.
              </p>
              <div className="bg-[#F4C2D7]/50 border-2 border-[#812D45] p-3 rounded-xl text-[#5C233B] font-bold shadow-[2px_2px_0_#812D45]">
                v2.0 (Core Engine Upgrade): Preparing to launch the next chapter of Yza & Zam's universe.
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-[#FFF5F8] border-t-2 border-[#272426] flex justify-end">
            <button
              onClick={() => {
                playSound('click');
                setStep('check');
              }}
              className="bg-[#812D45] hover:bg-[#6a2438] text-white font-bold py-2.5 px-5 rounded-xl text-xs border-2 border-[#272426] shadow-[3px_3px_0_#272426] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#272426]"
            >
              Proceed to System Scan →
            </button>
          </div>
        </motion.div>
      )}

      {/* SYSTEM CHECK */}
      {step === 'check' && (
        <div className="relative z-10 w-full max-w-lg bg-[#FFF8F1] border-2 border-[#272426] rounded-2xl p-5 sm:p-6 shadow-[6px_6px_0_#1a1819] space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#272426]/15 pb-3">
            <h2 className="font-pixel text-[10px] text-[#0F4C5C]">SYSTEM DIAGNOSTIC SCAN</h2>
            <span className="w-2.5 h-2.5 rounded-full bg-[#CAF0F8] border border-[#272426] animate-pulse" />
          </div>

          <div className="space-y-2 font-mono text-[11px] sm:text-xs">
            {[
              'Yza Verified (Prettiest Girl Detected) ✅',
              "∞ GB Free in Zam's Heart ✅",
              '16TB Romantic Attention Memory ✅',
              '100% Signal Strength to Zam 💗 ✅',
              'Emotional Firewall Disabled 🔓 ✅',
              'Syncing final memory fragments... ⏳',
            ].map((text, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border-2 transition-all ${
                  idx < checkIndex
                    ? idx === 5
                      ? 'bg-[#FFF3CD] border-[#D6A16C] text-[#5C233B]'
                      : 'bg-[#CAF0F8]/50 border-[#272426] text-[#0F4C5C]'
                    : 'bg-white/50 border-[#272426]/15 text-gray-400'
                }`}
              >
                {idx < checkIndex ? (idx === 5 ? 'Ready for decryption 🔐' : text) : 'Scanning...'}
              </div>
            ))}
          </div>

          {checkIndex >= 6 && (
            <button
              onClick={() => {
                playSound('click');
                setStep('terms');
              }}
              className="w-full bg-[#CAF0F8] hover:bg-[#b5e6f0] text-[#0F4C5C] font-bold py-3 rounded-xl text-xs border-2 border-[#272426] shadow-[3px_3px_0_#272426]"
            >
              Review System Requirements 📜
            </button>
          )}
        </div>
      )}

      {/* TERMS */}
      {step === 'terms' && (
        <div className="relative z-10 w-full max-w-xl bg-[#FFF8F1] border-2 border-[#272426] rounded-2xl p-5 sm:p-6 shadow-[6px_6px_0_#1a1819] space-y-4">
          <div className="border-b-2 border-[#272426]/15 pb-2 flex justify-between items-center">
            <span className="font-pixel text-[9px] text-[#812D45]">EULA AGREEMENT</span>
            <span className="text-xl">📜</span>
          </div>

          <div className="bg-white border-2 border-[#272426] p-4 rounded-xl font-mono text-[11px] sm:text-xs text-[#272426] space-y-3 max-h-[45vh] overflow-y-auto shadow-inner">
            <p className="font-bold text-[#812D45] text-center">TERMS OF YZAM OS v2.0</p>
            <p>
              <strong>ARTICLE I:</strong> Unlimited forehead kisses and hand holding. Good night texts mandatory.
            </p>
            <p>
              <strong>ARTICLE II:</strong> Late night calls have no curfew. Random "I miss you" pings allowed.
            </p>
            <p>
              <strong>ARTICLE III:</strong> You are permitted to be soft with Zam. Yza is always right (legally binding).
            </p>
            <p>
              <strong>ARTICLE IV:</strong> Auto-renews daily at midnight with no expiration date.
            </p>
          </div>

          <label className="flex items-center gap-3 p-3 bg-[#CAF0F8]/40 border-2 border-[#272426] rounded-xl cursor-pointer hover:bg-[#CAF0F8]/60 transition-colors">
            <input
              type="checkbox"
              checked={hasAgreed}
              onChange={(e) => {
                playSound('click');
                setHasAgreed(e.target.checked);
              }}
              className="w-4 h-4 accent-[#812D45]"
            />
            <span className="text-xs text-[#272426] font-semibold">I agree to all terms and system requirements.</span>
          </label>

          <button
            disabled={!hasAgreed}
            onClick={() => {
              playSound('chime');
              setStep('letter');
            }}
            className={`w-full py-3 rounded-xl font-bold text-xs border-2 border-[#272426] transition-all ${
              hasAgreed
                ? 'bg-[#812D45] text-white shadow-[3px_3px_0_#272426] cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            Accept & Decrypt Final Message 💌
          </button>
        </div>
      )}

      {/* FULL LOVE LETTER — FIXED HEADER (no overlap while scrolling) */}
      {step === 'letter' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-2xl bg-[#FFF8F1] border-2 border-[#272426] rounded-3xl p-4 sm:p-6 shadow-[6px_6px_0_#1a1819] space-y-4 my-2"
        >
          <div className="bg-white border-2 border-[#272426] rounded-2xl overflow-hidden shadow-inner flex flex-col">
            {/* FIXED header — outside scroll area */}
            <div className="border-b-2 border-[#272426]/15 px-4 py-3 sm:px-6 bg-[#FAF4ED] flex justify-between items-center shrink-0">
              <span className="font-pixel text-[9px] sm:text-[10px] text-[#0F4C5C]">A LETTER FOR LOVEY</span>
              <span className="text-xs text-[#812D45] font-mono font-bold">From Zam 💌</span>
            </div>

            {/* ONLY this part scrolls */}
            <div className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-[#272426] leading-relaxed max-h-[55vh] overflow-y-auto">
              <p className="font-bold text-[#272426] text-sm sm:text-base">Dear Lovey,</p>

              <p>
                I've been trying to figure out how to say this for a while now. I've built websites, written code, and stayed up nights searching for the right words. But the truth is, no amount of planning could ever fully capture what I feel when I think about you.
              </p>

              <p>So I'm going to try anyway.</p>

              <p>
                I love you in ways I didn't know were possible. I love the way you carry yourself, how you show up for the people around you without being asked, how you give so much of yourself even when you're tired. Being the eldest shaped you into someone quietly strong, someone who holds everything together for everyone else. But I also see the softness underneath. I see the moments when you say "okay lang" even when I know it's not. And I hope you know that I will always be the person you can tell the truth to, the one you can talk to when the weight gets heavy. The fact that you choose to open up to me, that you let me be the one you share the things you don't tell anyone else, is something I cherish more than you know.
              </p>

              <p>
                I love your honesty. That night on iMessage, when your guard was down and the world was a little blurry, you still chose to be real. You said what you felt. And in that moment I realized you were braver than I had ever been, because I was the one who had been hiding behind banters and jokes since the day we met on Umingle, too scared to admit that you were already the best part of my day.
              </p>

              <p>
                I love the way you make me feel safe. Not in grand gestures, but in the small, consistent things. The random gifts, the food you remember I like, the way you check in without making it feel heavy. I never question your love, and I think that says everything about how deeply you make me feel it.
              </p>

              <p>
                I love your laugh. I love how you can go from being makulit and maldita to saying something so gentle it catches me completely off guard. I love how you make me want to be better without ever asking me to change. I love that you are both the strongest person I know and the most tender, and you don't see those as contradictions.
              </p>

              <p>
                I love the way you look when you're comfortable. When your guard is down and you're just being yourself, soft and unfiltered. I love your face, your hair, your height, your neck, ah basta mahal ko lahat. The way you carry yourself when you forget that someone is watching. Ang ganda mo, Lovey. Ang ganda ganda. And I don't think you even realize it.
              </p>

              <p>
                Before you, I didn't know that someone could become the center of my gravity so quickly. I didn't know that a voice on a call could make everything else go quiet. I didn't know I could look at someone and feel both completely at peace and completely terrified at the same time. The thought of a world without you in it feels empty in a way I don't want to imagine.
              </p>

              <p>
                From two strangers trading banters on Umingle on August 6th, to our first call that same week, to the night everything changed, to the first time I saw you in person and my heart forgot how to work, to the photobooth, to the quiet moments outside your dorm, to every terminal ride I took just to see your face. Every moment with you is a moment I want to keep forever.
              </p>

              <p>
                I build you websites not because I need a project, but because it's the only language I know that feels big enough for what I feel.
              </p>

              <p className="font-semibold text-[#272426] pt-1">
                I am yours, completely, and for as long as you'll have me.
              </p>

              <div className="pt-3 text-right font-bold text-[#812D45]">
                With all my love,
                <br />
                Zam 💖
              </div>

              <div className="pt-6 pb-2 space-y-2 border-t border-[#272426]/15 mt-4">
                <h3 className="font-pixel text-[9px] text-[#0F4C5C] text-center mb-3">📸 LOVEY MOMENTS</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="bg-[#FFF8F1] p-1.5 sm:p-2 rounded-xl border-2 border-[#272426] shadow-[2px_2px_0_#272426] text-center space-y-1"
                    >
                      <div className="w-full h-20 sm:h-24 bg-[#CAF0F8]/40 rounded-lg overflow-hidden flex items-center justify-center">
                        <img
                          src={photo.src}
                          alt={photo.caption}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23812D45"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
                          }}
                        />
                      </div>
                      <p className="font-mono text-[9px] sm:text-[10px] font-bold text-[#5C233B] truncate">{photo.caption}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              playSound('chime');
              setStep('question');
            }}
            className="w-full bg-[#CAF0F8] hover:bg-[#b5e6f0] text-[#0F4C5C] font-extrabold py-3.5 rounded-2xl text-xs sm:text-sm border-2 border-[#272426] shadow-[4px_4px_0_#1a1819] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#1a1819] cursor-pointer"
          >
            Acknowledge & Proceed →
          </button>
        </motion.div>
      )}

      {/* THE QUESTION */}
      {step === 'question' && (
        <div className="relative z-10 text-center space-y-6 max-w-md w-full px-2">
          <img src={LOGO_SRC} alt="" className="w-16 h-16 mx-auto rounded-2xl border-2 border-[#272426] bg-[#FFF8F1] shadow-[3px_3px_0_#1a1819] object-contain" />
          <span className="font-pixel text-[10px] text-[#CAF0F8] tracking-widest block">FINAL DECISION REQUIRED</span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight drop-shadow-md">
            Lovey, will you be my girlfriend?
          </h1>
          <p className="text-[#F4C2D7] text-xs font-medium">Official. Mine. Ako sayo, ikaw sa'kin.</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 relative min-h-[110px]">
            <button
              onClick={() => {
                playSound('chime');
                playSound('pop');
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#CAF0F8', '#F4C2D7', '#812D45', '#FFF8F1'] });
                setStep('success');
              }}
              className="w-full sm:w-auto min-w-[160px] bg-[#CAF0F8] hover:bg-[#b5e6f0] text-[#0F4C5C] font-extrabold py-3.5 px-8 rounded-2xl text-base border-2 border-[#272426] shadow-[4px_4px_0_#1a1819] animate-pulse cursor-pointer"
            >
              YES! 💖
            </button>

            <motion.button
              animate={{ x: noPos.x, y: noPos.y }}
              onMouseEnter={moveNoButton}
              onTouchStart={moveNoButton}
              onClick={() => {
                playSound('beep');
                setShowNoErr(true);
                moveNoButton();
              }}
              className="w-full sm:w-auto bg-[#FFF8F1]/90 text-[#812D45] font-semibold py-2.5 px-6 rounded-xl text-xs border-2 border-[#272426]/40"
            >
              No
            </motion.button>
          </div>

          {showNoErr && (
            <div className="bg-[#F4C2D7] border-2 border-[#812D45] p-3 rounded-xl text-xs text-[#5C233B] font-semibold shadow-[3px_3px_0_#812D45]">
              ❌ Error 404: Rejection Not Found. Select YES to proceed! 😤💕
            </div>
          )}
        </div>
      )}

      {/* SUCCESS SCREEN */}
      {step === 'success' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-sm bg-[#FFF8F1] border-2 border-[#272426] rounded-3xl p-6 sm:p-8 shadow-[6px_6px_0_#1a1819] text-center space-y-6"
        >
          <div className="bg-gradient-to-r from-[#CAF0F8]/80 via-white to-[#F4C2D7]/80 p-4 rounded-2xl border-2 border-[#272426] shadow-[2px_2px_0_#272426]">
            <span className="font-pixel text-[9px] text-[#812D45]">UPDATE COMPLETE</span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#272426] mt-1">She Said Yes! 🎉</h2>
            <p className="text-xs text-[#5C233B] mt-0.5 font-mono">Girlfriend.exe installed </p>
          </div>

          <img src={LOGO_SRC} alt="YZAM" className="w-20 h-20 mx-auto rounded-2xl border-2 border-[#272426] shadow-[3px_3px_0_#1a1819]" />

          <p className="text-sm font-bold text-[#272426]">Welcome to the next chapter, Lovey. 💖</p>

          <button
            onClick={handleFinish}
            className="w-full bg-[#812D45] hover:bg-[#6a2438] text-white font-extrabold py-3.5 rounded-2xl text-xs sm:text-sm border-2 border-[#272426] shadow-[4px_4px_0_#1a1819] cursor-pointer"
          >
            Launch YZAM OS Desktop 🚀
          </button>
        </motion.div>
      )}
    </div>
  );
};