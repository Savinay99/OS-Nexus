/**
 * OS Nexus : Synthesized Workstation Audio Engine
 * Pure Web Audio API synthesized micro-sounds for gamified feedback.
 * No external audio files needed; completely offline and lightweight.
 */

let audioCtx = null;
let isMuted = localStorage.getItem('osnexus_muted') === 'true';
let masterVolume = Math.min(1, Math.max(0, parseFloat(localStorage.getItem('osnexus_volume') || '0.6')));

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function isAudioMuted() {
  return isMuted;
}

export function setAudioMuted(muted) {
  isMuted = muted;
  try {
    localStorage.setItem('osnexus_muted', String(muted));
  } catch (_) {}
}

export function getAudioVolume() {
  return masterVolume;
}

export function setAudioVolume(volume) {
  masterVolume = Math.min(1, Math.max(0, volume));
  try {
    localStorage.setItem('osnexus_volume', String(masterVolume));
  } catch (_) {}
}

export function toggleAudio() {
  setAudioMuted(!isMuted);
  return isMuted;
}

let lastTickTime = 0;
let lastRunSoundTime = 0;
let lastSuccessTime = 0;
let lastWarningTime = 0;

/**
 * Play a short subtle tech click/tick
 */
export function playTick() {
  if (isMuted || masterVolume <= 0) return;
  const nowMs = Date.now();
  if (nowMs - lastTickTime < 35) return;
  lastTickTime = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.03);

  const peak = 0.04 * masterVolume;
  gain.gain.setValueAtTime(peak, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.03);
}

/**
 * Play process dispatch / simulation run chime
 */
export function playRunSound() {
  if (isMuted || masterVolume <= 0) return;
  const nowMs = Date.now();
  if (nowMs - lastRunSoundTime < 80) return;
  lastRunSoundTime = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(340, now);
  osc.frequency.exponentialRampToValueAtTime(580, now + 0.12);

  const peak = 0.04 * masterVolume;
  gain.gain.setValueAtTime(peak, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.15);
}

/**
 * Play success / safe state chord
 */
export function playSuccessSound() {
  if (isMuted || masterVolume <= 0) return;
  const nowMs = Date.now();
  if (nowMs - lastSuccessTime < 120) return;
  lastSuccessTime = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  const now = ctx.currentTime;

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.05);

    const peak = 0.03 * masterVolume;
    gain.gain.setValueAtTime(peak, now + idx * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.05);
    osc.stop(now + idx * 0.05 + 0.25);
  });
}

/**
 * Play warning / deadlock / page fault sound
 */
export function playWarningSound() {
  if (isMuted || masterVolume <= 0) return;
  const nowMs = Date.now();
  if (nowMs - lastWarningTime < 120) return;
  lastWarningTime = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.setValueAtTime(180, now + 0.08);

  const peak = 0.025 * masterVolume;
  gain.gain.setValueAtTime(peak, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.2);
}

export const playFaultAlert = playWarningSound;
