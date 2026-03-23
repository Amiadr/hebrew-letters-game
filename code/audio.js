// Web Audio API sound effects
let audioCtx = null;

function getAudioCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

function playTone(freq, startTime, duration, type = 'sine', volume = 0.35) {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
}

function playSuccess() {
    const ctx = getAudioCtx();
    const t = ctx.currentTime;
    // Happy ascending arpeggio C-E-G
    playTone(523.25, t, 0.18);
    playTone(659.25, t + 0.14, 0.18);
    playTone(783.99, t + 0.28, 0.25);
}

function playError() {
    const ctx = getAudioCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(110, t + 0.35);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.35);
    osc.start(t);
    osc.stop(t + 0.4);
}

function playCelebration() {
    const ctx = getAudioCtx();
    const t = ctx.currentTime;
    const melody = [523.25, 523.25, 659.25, 523.25, 783.99, 739.99, 523.25, 659.25, 523.25, 440, 523.25];
    const times  = [0, 0.18, 0.36, 0.54, 0.72, 1.00, 1.28, 1.46, 1.64, 1.82, 2.0];
    melody.forEach((freq, i) => playTone(freq, t + times[i], 0.22, 'sine', 0.4));
}
