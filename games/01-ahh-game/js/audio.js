let audioCtx = null;
let muted = false;

function getAudioCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function isMuted() {
  return muted;
}

function setMuted(value) {
  muted = value;
}

function tone(freq, start, duration, type, gainPeak, freqEnd) {
  if (muted) return;
  const ac = getAudioCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type || "sine";
  const t0 = ac.currentTime + start;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd) osc.frequency.linearRampToValueAtTime(freqEnd, t0 + duration);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function playClick() {
  tone(880, 0, 0.06, "sine", 0.25);
}

function playJump() {
  tone(320, 0, 0.14, "square", 0.18, 640);
}

function playCoin() {
  tone(1200, 0, 0.08, "sine", 0.26);
  tone(1600, 0.05, 0.12, "sine", 0.26);
}

function playHurt() {
  tone(220, 0, 0.22, "sawtooth", 0.22, 90);
}

function playStart() {
  tone(440, 0, 0.09, "triangle", 0.22);
  tone(554, 0.09, 0.09, "triangle", 0.22);
  tone(659, 0.18, 0.16, "triangle", 0.26);
}

function playGameOver() {
  tone(392, 0, 0.18, "square", 0.22);
  tone(349, 0.16, 0.18, "square", 0.22);
  tone(294, 0.32, 0.18, "square", 0.22);
  tone(220, 0.48, 0.35, "square", 0.26);
}
