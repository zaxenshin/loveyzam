import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type AmbienceType = 'off' | 'rain' | 'cafe' | 'static' | 'night' | 'forest' | 'ocean' | 'fire' | 'wind';

const STATIONS: { id: AmbienceType; label: string; icon: string; desc: string }[] = [
  { id: 'off', label: 'OFF', icon: '🔇', desc: 'Silence' },
  { id: 'rain', label: 'RAIN', icon: '🌧️', desc: 'Rainfall + droplets' },
  { id: 'cafe', label: 'CAFÉ', icon: '☕', desc: 'Coffee shop chatter' },
  { id: 'static', label: 'STATIC', icon: '📺', desc: 'TV white noise' },
  { id: 'night', label: 'NIGHT', icon: '🌙', desc: 'Crickets & stillness' },
  { id: 'forest', label: 'FOREST', icon: '🌲', desc: 'Birds & leaves' },
  { id: 'ocean', label: 'OCEAN', icon: '🌊', desc: 'Waves crashing' },
  { id: 'fire', label: 'FIRE', icon: '🔥', desc: 'Crackling fireplace' },
  { id: 'wind', label: 'WIND', icon: '💨', desc: 'Gentle breeze' },
];

// Helper: schedule random one-shot sounds (for drops, chirps, crackles)
interface Scheduled {
  timer: number | null;
}

export default function LoFiRadio() {
  const [isOpen, setIsOpen] = useState(false);
  const [current, setCurrent] = useState<AmbienceType>('off');
  const [volume, setVolume] = useState(0.3);

  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);
  const masterGainRef = useRef<GainNode | null>(null);
  const scheduledRef = useRef<Scheduled>({ timer: null });

  // ─────── NOISE BUFFER GENERATORS ───────
  const makeWhiteNoise = (ctx: AudioContext, sec = 4) => {
    const len = ctx.sampleRate * sec;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return buf;
  };

  const makePinkNoise = (ctx: AudioContext, sec = 4) => {
    const len = ctx.sampleRate * sec;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.0168980;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    }
    return buf;
  };

  const makeBrownNoise = (ctx: AudioContext, sec = 4) => {
    const len = ctx.sampleRate * sec;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        d[i] = (last + 0.02 * w) / 1.02;
        last = d[i];
        d[i] *= 3.5;
      }
    }
    return buf;
  };

  // ─────── STOP EVERYTHING ───────
  const stopAll = useCallback(() => {
    // Stop all nodes
    nodesRef.current.forEach((n) => {
      try {
        if ('stop' in n) (n as any).stop();
        n.disconnect();
      } catch {}
    });
    nodesRef.current = [];
    masterGainRef.current = null;

    // Clear scheduled one-shots
    if (scheduledRef.current.timer !== null) {
      clearTimeout(scheduledRef.current.timer);
      scheduledRef.current.timer = null;
    }
  }, []);

  // ─────── ONE-SHOT HELPERS ───────
  const playRaindrop = (ctx: AudioContext, master: GainNode) => {
    const now = ctx.currentTime;
    const buf = makeWhiteNoise(ctx, 0.15);
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2500 + Math.random() * 1500;
    bp.Q.value = 15;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.4 + Math.random() * 0.3, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    src.connect(bp).connect(g).connect(master);
    src.start(now);
    src.stop(now + 0.15);
  };

  const playBirdChirp = (ctx: AudioContext, master: GainNode) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    const baseFreq = 2000 + Math.random() * 2000;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, now + 0.16);

    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.08, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(g).connect(master);
    osc.start(now);
    osc.stop(now + 0.2);
  };

  const playCricket = (ctx: AudioContext, master: GainNode) => {
    const now = ctx.currentTime;
    // Cricket = fast rhythmic chirps
    for (let i = 0; i < 4; i++) {
      const t = now + i * 0.08;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 4500 + Math.random() * 500;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.03, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      osc.connect(g).connect(master);
      osc.start(t);
      osc.stop(t + 0.04);
    }
  };

  const playCrackle = (ctx: AudioContext, master: GainNode) => {
    const now = ctx.currentTime;
    const buf = makeWhiteNoise(ctx, 0.08);
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1500;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.15 + Math.random() * 0.2, now + 0.003);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    src.connect(hp).connect(g).connect(master);
    src.start(now);
    src.stop(now + 0.08);
  };

  const playCafeMurmur = (ctx: AudioContext, master: GainNode) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    // Random muted vocal-ish tone
    osc.type = 'sawtooth';
    osc.frequency.value = 100 + Math.random() * 150;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 400;

    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.015 + Math.random() * 0.01, now + 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.9 + Math.random() * 0.5);

    osc.connect(lp).connect(g).connect(master);
    osc.start(now);
    osc.stop(now + 1.5);
  };

  const playCupClink = (ctx: AudioContext, master: GainNode) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800 + Math.random() * 400, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(g).connect(master);
    osc.start(now);
    osc.stop(now + 0.2);
  };

  // ─────── MAIN PLAY FUNCTION ───────
  const play = useCallback(
    (type: AmbienceType) => {
      stopAll();
      if (type === 'off') return;

      if (!ctxRef.current) {
        ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = ctxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
      masterGainRef.current = master;

      // Build each ambience distinctly
      switch (type) {
        case 'rain': {
          // Base: filtered pink noise = steady rain
          const src = ctx.createBufferSource();
          src.buffer = makePinkNoise(ctx);
          src.loop = true;
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = 1500;
          bp.Q.value = 0.5;
          const g = ctx.createGain();
          g.gain.value = 0.5;
          src.connect(bp).connect(g).connect(master);
          src.start();
          nodesRef.current.push(src, bp, g);

          // One-shot raindrops
          const scheduleDrop = () => {
            if (!masterGainRef.current) return;
            playRaindrop(ctx, master);
            scheduledRef.current.timer = window.setTimeout(scheduleDrop, 80 + Math.random() * 250);
          };
          scheduleDrop();
          break;
        }

        case 'cafe': {
          // Base: low rumble (crowd ambience)
          const src = ctx.createBufferSource();
          src.buffer = makeBrownNoise(ctx);
          src.loop = true;
          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.value = 350;
          const g = ctx.createGain();
          g.gain.value = 0.35;
          src.connect(lp).connect(g).connect(master);
          src.start();
          nodesRef.current.push(src, lp, g);

          // Random murmurs + occasional cup clinks
          const scheduleCafe = () => {
            if (!masterGainRef.current) return;
            playCafeMurmur(ctx, master);
            // Occasional clink
            if (Math.random() < 0.15) {
              setTimeout(() => {
                if (masterGainRef.current) playCupClink(ctx, master);
              }, 200 + Math.random() * 800);
            }
            scheduledRef.current.timer = window.setTimeout(scheduleCafe, 600 + Math.random() * 900);
          };
          scheduleCafe();
          break;
        }

        case 'static': {
          // Pure crunchy TV static
          const src = ctx.createBufferSource();
          src.buffer = makeWhiteNoise(ctx);
          src.loop = true;
          const hp = ctx.createBiquadFilter();
          hp.type = 'highpass';
          hp.frequency.value = 2000;
          const g = ctx.createGain();
          g.gain.value = 0.5;
          src.connect(hp).connect(g).connect(master);
          src.start();
          nodesRef.current.push(src, hp, g);
          break;
        }

        case 'night': {
          // Base: very deep hum
          const src = ctx.createBufferSource();
          src.buffer = makeBrownNoise(ctx);
          src.loop = true;
          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.value = 180;
          const g = ctx.createGain();
          g.gain.value = 0.25;
          src.connect(lp).connect(g).connect(master);
          src.start();
          nodesRef.current.push(src, lp, g);

          // Random crickets
          const scheduleCricket = () => {
            if (!masterGainRef.current) return;
            playCricket(ctx, master);
            scheduledRef.current.timer = window.setTimeout(scheduleCricket, 400 + Math.random() * 1200);
          };
          scheduleCricket();
          break;
        }

        case 'forest': {
          // Base: wind through leaves (filtered pink noise with LFO)
          const src = ctx.createBufferSource();
          src.buffer = makePinkNoise(ctx);
          src.loop = true;
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = 800;
          bp.Q.value = 0.3;
          const g = ctx.createGain();
          g.gain.value = 0.3;

          // LFO on filter freq for wind movement
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.value = 0.1;
          lfoGain.gain.value = 300;
          lfo.connect(lfoGain).connect(bp.frequency);
          lfo.start();

          src.connect(bp).connect(g).connect(master);
          src.start();
          nodesRef.current.push(src, bp, g, lfo, lfoGain);

          // Random bird chirps
          const scheduleBird = () => {
            if (!masterGainRef.current) return;
            playBirdChirp(ctx, master);
            // Chance of 2nd chirp quickly
            if (Math.random() < 0.4) {
              setTimeout(() => {
                if (masterGainRef.current) playBirdChirp(ctx, master);
              }, 150 + Math.random() * 200);
            }
            scheduledRef.current.timer = window.setTimeout(scheduleBird, 1200 + Math.random() * 2500);
          };
          scheduleBird();
          break;
        }

        case 'ocean': {
          // Base: pink noise with slow LFO on amplitude = waves
          const src = ctx.createBufferSource();
          src.buffer = makePinkNoise(ctx);
          src.loop = true;
          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.value = 900;
          const g = ctx.createGain();
          g.gain.value = 0.3;

          // LFO on gain = wave swells
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.type = 'sine';
          lfo.frequency.value = 0.12; // slow wave
          lfoGain.gain.value = 0.25;
          lfo.connect(lfoGain).connect(g.gain);
          lfo.start();

          // LFO on filter = wave brightness changes
          const lfo2 = ctx.createOscillator();
          const lfo2Gain = ctx.createGain();
          lfo2.frequency.value = 0.08;
          lfo2Gain.gain.value = 400;
          lfo2.connect(lfo2Gain).connect(lp.frequency);
          lfo2.start();

          src.connect(lp).connect(g).connect(master);
          src.start();
          nodesRef.current.push(src, lp, g, lfo, lfoGain, lfo2, lfo2Gain);
          break;
        }

        case 'fire': {
          // Base: low brown noise rumble
          const src = ctx.createBufferSource();
          src.buffer = makeBrownNoise(ctx);
          src.loop = true;
          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.value = 500;
          const g = ctx.createGain();
          g.gain.value = 0.35;
          src.connect(lp).connect(g).connect(master);
          src.start();
          nodesRef.current.push(src, lp, g);

          // Constant crackling (fast random pops)
          const scheduleCrackle = () => {
            if (!masterGainRef.current) return;
            playCrackle(ctx, master);
            // Burst of crackles sometimes
            if (Math.random() < 0.3) {
              setTimeout(() => masterGainRef.current && playCrackle(ctx, master), 40);
              setTimeout(() => masterGainRef.current && playCrackle(ctx, master), 90);
            }
            scheduledRef.current.timer = window.setTimeout(scheduleCrackle, 60 + Math.random() * 300);
          };
          scheduleCrackle();
          break;
        }

        case 'wind': {
          // Base: slowly modulated bandpass noise = howling wind
          const src = ctx.createBufferSource();
          src.buffer = makePinkNoise(ctx);
          src.loop = true;
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = 600;
          bp.Q.value = 2;
          const g = ctx.createGain();
          g.gain.value = 0.4;

          // Big LFO on filter = howling
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.type = 'sine';
          lfo.frequency.value = 0.08;
          lfoGain.gain.value = 500;
          lfo.connect(lfoGain).connect(bp.frequency);
          lfo.start();

          // Amplitude swell
          const lfo2 = ctx.createOscillator();
          const lfo2Gain = ctx.createGain();
          lfo2.frequency.value = 0.05;
          lfo2Gain.gain.value = 0.2;
          lfo2.connect(lfo2Gain).connect(g.gain);
          lfo2.start();

          src.connect(bp).connect(g).connect(master);
          src.start();
          nodesRef.current.push(src, bp, g, lfo, lfoGain, lfo2, lfo2Gain);
          break;
        }
      }
    },
    [volume, stopAll]
  );

  useEffect(() => {
    play(current);
    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  useEffect(() => {
    if (masterGainRef.current && ctxRef.current) {
      masterGainRef.current.gain.setValueAtTime(volume, ctxRef.current.currentTime);
    }
  }, [volume]);

  const select = (type: AmbienceType) => {
    setCurrent(type);
    try {
      const c = new AudioContext();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sine';
      o.frequency.value = type === 'off' ? 400 : 800;
      g.gain.value = 0.06;
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
      o.connect(g).connect(c.destination);
      o.start();
      o.stop(c.currentTime + 0.15);
    } catch {}
  };

  const activeStation = STATIONS.find((s) => s.id === current)!;

  return (
    <>
      {/* FLOATING TOGGLE BUTTON */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-16 left-6 z-[90] w-14 h-14 rounded-full
          bg-[#272426] border-2 border-[#D6A16C]
          flex items-center justify-center text-xl
          shadow-retro hover:bg-[#1a1a1a] transition-colors cursor-pointer"
        whileHover={{ scale: 1.1, rotate: -8 }}
        whileTap={{ scale: 0.9 }}
        title="Lo-Fi Ambience Radio"
      >
        <span className="text-2xl">{current !== 'off' ? '📻' : '🔇'}</span>
      </motion.button>

      {/* NOW PLAYING PILL */}
      {current !== 'off' && !isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-[7.5rem] left-6 z-[90]
            bg-[#272426] text-[#D6A16C] px-2 py-1 rounded
            font-mono text-[10px] border border-[#D6A16C]/40
            flex items-center gap-1 shadow-retro-sm"
        >
          <span className="animate-pulse">♪</span>
          <span className="font-bold">{activeStation.icon} {current.toUpperCase()}</span>
        </motion.div>
      )}

      {/* RADIO PANEL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed bottom-32 left-6 z-[95] w-72
              bg-[#FFF5F8] border-2 border-[#272426]
              shadow-retro rounded-xl overflow-hidden"
          >
            <div className="bg-[#272426] px-3 py-2 flex items-center justify-between">
              <span className="font-mono text-[9px] font-black text-[#F4C2D7] uppercase tracking-widest">
                📻 Lo-Fi Radio
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#F4C2D7] hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 space-y-3">
              {/* 3-column grid for 9 stations */}
              <div className="grid grid-cols-3 gap-1.5">
                {STATIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => select(s.id)}
                    className={`flex flex-col items-center gap-0.5 p-2 rounded
                      border-2 transition-all cursor-pointer
                      ${
                        current === s.id
                          ? 'bg-[#F4C2D7] border-[#812D45] shadow-retro-sm scale-105'
                          : 'bg-white border-[#272426]/15 hover:border-[#F4C2D7]'
                      }`}
                  >
                    <span className="text-lg">{s.icon}</span>
                    <span className="font-mono text-[8px] font-bold text-[#272426]">
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>

              {current !== 'off' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-[#272426]">VOL</span>
                    <span className="font-mono text-[10px] font-bold text-[#812D45]">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer
                      bg-[#272426]/15 accent-[#812D45]"
                  />
                </div>
              )}

              <div className="bg-[#272426] rounded px-2 py-2 text-center">
                {current === 'off' ? (
                  <span className="font-mono text-[10px] text-gray-500">
                    -- NO SIGNAL --
                  </span>
                ) : (
                  <div className="space-y-0.5">
                    <span className="font-mono text-[9px] text-[#CAF0F8] animate-pulse font-bold">
                      ♪ NOW PLAYING ♪
                    </span>
                    <div className="font-mono text-[11px] text-[#F4C2D7] font-bold">
                      {activeStation.icon} {activeStation.desc}
                    </div>
                  </div>
                )}
              </div>

              <p className="font-mono text-[9px] text-[#272426]/40 text-center italic">
                perfect for studying 📚💕
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}