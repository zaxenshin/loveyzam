// ============================================================================
// 🎵 SOFT & CUTE RETRO SFX ENGINE (YZA & ZAM Y2K SPACE)
// Simple, gentle, and soft pure sine wave sounds — zero noise, zero delay!
// ============================================================================

let ctx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      ctx = new AudioContextClass();
    }
  }
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

// Auto unlock audio context on initial user tap
if (typeof window !== 'undefined') {
  const unlock = () => {
    if (ctx && ctx.state === 'suspended') ctx.resume();
    window.removeEventListener('pointerdown', unlock);
  };
  window.addEventListener('pointerdown', unlock, { passive: true });
}

// ----------------------------------------------------------------------------
// 1. SOFT CLICK / TAP (Cute micro button pop)
// ----------------------------------------------------------------------------
export function playClick() {
  try {
    const ac = getAudioCtx();
    if (!ac) return;
    const now = ac.currentTime;

    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.025);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start(now);
    osc.stop(now + 0.025);
  } catch {}
}
export const playTap = playClick;

// ----------------------------------------------------------------------------
// 2. SOFT PLINK / TOGGLE (Cute soft blip)
// ----------------------------------------------------------------------------
export function playPlink() {
  try {
    const ac = getAudioCtx();
    if (!ac) return;
    const now = ac.currentTime;

    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(784, now); // G5
    osc.frequency.exponentialRampToValueAtTime(1046, now + 0.04); // C6

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch {}
}

// ----------------------------------------------------------------------------
// 3. BUBBLE POP (Cute squishy bubble sound)
// ----------------------------------------------------------------------------
export function playPop() {
  try {
    const ac = getAudioCtx();
    if (!ac) return;
    const now = ac.currentTime;

    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(250, now);
    osc.frequency.exponentialRampToValueAtTime(650, now + 0.035);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start(now);
    osc.stop(now + 0.035);
  } catch {}
}
export const playBubble = playPop;

// ----------------------------------------------------------------------------
// 4. COZY CHIME (Dreamy romantic 3-note arpeggio)
// ----------------------------------------------------------------------------
export function playChime() {
  try {
    const ac = getAudioCtx();
    if (!ac) return;
    const now = ac.currentTime;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const t = now + i * 0.05;
      const osc = ac.createOscillator();
      const gain = ac.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(ac.destination);

      osc.start(t);
      osc.stop(t + 0.25);
    });
  } catch {}
}

// ----------------------------------------------------------------------------
// 5. CUTE SPARKLE (Soft high twinkles)
// ----------------------------------------------------------------------------
export function playSparkle() {
  try {
    const ac = getAudioCtx();
    if (!ac) return;
    const now = ac.currentTime;

    const freqs = [1046.5, 1318.5, 1567.98, 2093.0];
    freqs.forEach((freq, i) => {
      const t = now + i * 0.035;
      const osc = ac.createOscillator();
      const gain = ac.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(ac.destination);

      osc.start(t);
      osc.stop(t + 0.2);
    });
  } catch {}
}

// ----------------------------------------------------------------------------
// 6. WARM HEARTBEAT (Soft cozy dual thud)
// ----------------------------------------------------------------------------
export function playHeartbeat() {
  try {
    const ac = getAudioCtx();
    if (!ac) return;
    const now = ac.currentTime;

    [0, 0.12].forEach(delay => {
      const t = now + delay;
      const osc = ac.createOscillator();
      const gain = ac.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.08);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(ac.destination);

      osc.start(t);
      osc.stop(t + 0.09);
    });
  } catch {}
}

// ----------------------------------------------------------------------------
// 7. PAPER UNFOLD (Subtle gentle paper slide)
// ----------------------------------------------------------------------------
export function playPaper() {
  try {
    const ac = getAudioCtx();
    if (!ac) return;
    const now = ac.currentTime;

    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.05);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch {}
}
export const playUnfold = playPaper;
export const playRustle = playPaper;

// ----------------------------------------------------------------------------
// 8. CAMERA SNAP (Clean double-click shutter)
// ----------------------------------------------------------------------------
export function playCameraSnap() {
  try {
    const ac = getAudioCtx();
    if (!ac) return;
    const now = ac.currentTime;

    // First click
    const osc1 = ac.createOscillator();
    const gain1 = ac.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(350, now);
    osc1.frequency.exponentialRampToValueAtTime(100, now + 0.025);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    osc1.connect(gain1);
    gain1.connect(ac.destination);
    osc1.start(now);
    osc1.stop(now + 0.025);

    // Second soft click
    const osc2 = ac.createOscillator();
    const gain2 = ac.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(550, now + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(180, now + 0.06);
    gain2.gain.setValueAtTime(0.1, now + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc2.connect(gain2);
    gain2.connect(ac.destination);
    osc2.start(now + 0.04);
    osc2.stop(now + 0.06);
  } catch {}
}
export const playShutter = playCameraSnap;
export const playSnap = playCameraSnap;

// ----------------------------------------------------------------------------
// 9. CUTE WIN / SUCCESS (Short ascending victory melody)
// ----------------------------------------------------------------------------
export function playWin() {
  try {
    const ac = getAudioCtx();
    if (!ac) return;
    const now = ac.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const t = now + i * 0.06;
      const osc = ac.createOscillator();
      const gain = ac.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(ac.destination);

      osc.start(t);
      osc.stop(t + 0.15);
    });
  } catch {}
}
export const playSuccess = playWin;
export const playFanfare = playWin;

// ----------------------------------------------------------------------------
// 10. GENTLE ERROR (Soft low plink)
// ----------------------------------------------------------------------------
export function playError() {
  try {
    const ac = getAudioCtx();
    if (!ac) return;
    const now = ac.currentTime;

    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.08);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch {}
}
export const playBuzz = playError;

// ----------------------------------------------------------------------------
// 11. SUBTLE KEYPRESS (Very quiet typing click)
// ----------------------------------------------------------------------------
export function playKeypress() {
  try {
    const ac = getAudioCtx();
    if (!ac) return;
    const now = ac.currentTime;

    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(750 + Math.random() * 150, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.015);

    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start(now);
    osc.stop(now + 0.015);
  } catch {}
}
export const playTypewriter = playKeypress;

// ----------------------------------------------------------------------------
// 12. SOFT COIN / REWARD (Cute pastel double ding)
// ----------------------------------------------------------------------------
export function playCoin() {
  try {
    const ac = getAudioCtx();
    if (!ac) return;
    const now = ac.currentTime;

    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now);
    osc.frequency.setValueAtTime(1318.51, now + 0.05);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  } catch {}
}
export const playReward = playCoin;

// ----------------------------------------------------------------------------
// 13. SOFT SLIDE (Minimal soft zoom)
// ----------------------------------------------------------------------------
export function playWhoosh() {
  try {
    const ac = getAudioCtx();
    if (!ac) return;
    const now = ac.currentTime;

    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.04);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch {}
}
export const playSlide = playWhoosh;