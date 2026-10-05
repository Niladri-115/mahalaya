/**
 * Agomoni - Procedural Bengali Dhak Engine (Web Audio API)
 * Synthesizes an authentic traditional Bengali Durga Puja / Mahalaya Dhak rhythm
 * using low-level Web Audio API nodes: membrane oscillators, noise shaping,
 * resonance filters, and a rock-solid lookahead clock scheduler.
 */

class DhakEngine {
  constructor() {
    this.audioCtx = null;
    this.masterGain = null;
    this.reverbNode = null;
    this.isPlaying = false;
    this.bpm = 94; // Traditional Sharadiya Agomoni tempo
    this.volume = 0.38; // Default warm background level
    this.lookahead = 25.0; // milliseconds
    this.scheduleAheadTime = 0.12; // seconds
    this.currentStep = 0;
    this.nextNoteTime = 0.0;
    this.timerId = null;
    this.subscribers = [];

    // Traditional 16-step Bengali Dhak Agomoni Rhythm Bol:
    // "Dha... Tang... Dha-ka Tang... Dha-Dha Tang-ka Dha-tang... Tin Tin..."
    this.rhythmPattern = [
      { step: 0,  dha: 1.0, tang: 0.0, tin: 0.0, kathi: 0.0, kashor: 0.8 },
      { step: 1,  dha: 0.0, tang: 0.0, tin: 0.0, kathi: 0.0, kashor: 0.0 },
      { step: 2,  dha: 0.0, tang: 0.9, tin: 0.0, kathi: 0.0, kashor: 0.0 },
      { step: 3,  dha: 0.0, tang: 0.0, tin: 0.0, kathi: 0.0, kashor: 0.0 },
      { step: 4,  dha: 0.85, tang: 0.0, tin: 0.0, kathi: 0.0, kashor: 0.0 },
      { step: 5,  dha: 0.0, tang: 0.0, tin: 0.0, kathi: 0.6, kashor: 0.0 },
      { step: 6,  dha: 0.0, tang: 0.85, tin: 0.0, kathi: 0.0, kashor: 0.0 },
      { step: 7,  dha: 0.0, tang: 0.0, tin: 0.0, kathi: 0.0, kashor: 0.0 },
      { step: 8,  dha: 0.9, tang: 0.0, tin: 0.0, kathi: 0.0, kashor: 0.7 },
      { step: 9,  dha: 0.6, tang: 0.0, tin: 0.0, kathi: 0.0, kashor: 0.0 },
      { step: 10, dha: 0.0, tang: 0.9, tin: 0.0, kathi: 0.0, kashor: 0.0 },
      { step: 11, dha: 0.0, tang: 0.0, tin: 0.0, kathi: 0.65, kashor: 0.0 },
      { step: 12, dha: 1.0, tang: 0.95, tin: 0.0, kathi: 0.0, kashor: 0.0 },
      { step: 13, dha: 0.0, tang: 0.0, tin: 0.0, kathi: 0.0, kashor: 0.0 },
      { step: 14, dha: 0.0, tang: 0.0, tin: 0.9, kathi: 0.0, kashor: 0.0 },
      { step: 15, dha: 0.0, tang: 0.0, tin: 0.85, kathi: 0.0, kashor: 0.0 }
    ];
  }

  init() {
    if (this.audioCtx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContext();

    // Master Dhak Gain
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);

    // Warm Studio / Courtyard Reverb simulation
    this.reverbNode = this.createStudioReverb();
    this.masterGain.connect(this.reverbNode);
    this.reverbNode.connect(this.audioCtx.destination);
    // Direct dry signal
    this.masterGain.connect(this.audioCtx.destination);
  }

  createStudioReverb() {
    // Generate synthetic warm impulse response for vintage acoustic hall
    const rate = this.audioCtx.sampleRate;
    const length = Math.floor(rate * 1.5);
    const decay = 2.4;
    const impulse = this.audioCtx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const envelope = Math.exp(-n * decay);
      left[i] = (Math.random() * 2 - 1) * envelope;
      right[i] = (Math.random() * 2 - 1) * envelope;
    }

    const convolver = this.audioCtx.createConvolver();
    convolver.buffer = impulse;

    const reverbGain = this.audioCtx.createGain();
    reverbGain.gain.value = 0.22; // subtle warmth
    convolver.connect(reverbGain);
    return reverbGain;
  }

  // --- DHA: Deep resonant wooden bass drum strike ---
  playDha(time, intensity = 1.0) {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;

    // Pitch sweep: 155Hz drops rapidly to 60Hz
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(155, time);
    osc.frequency.exponentialRampToValueAtTime(62, time + 0.16);

    // Subtle second harmonic for thick animal skin timbre
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(124, time);
    subOsc.frequency.exponentialRampToValueAtTime(54, time + 0.18);

    // Lowpass filter for wooden barrel warmth
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, time);
    filter.Q.setValueAtTime(3.0, time);

    // Initial stick impact transient (click)
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(240, time);
    clickOsc.frequency.exponentialRampToValueAtTime(40, time + 0.015);
    clickGain.gain.setValueAtTime(0.3 * intensity, time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.015);

    // Master envelope for Dha
    const totalDuration = 0.42;
    oscGain.gain.setValueAtTime(0.001, time);
    oscGain.gain.linearRampToValueAtTime(0.85 * intensity, time + 0.003);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + totalDuration);

    subGain.gain.setValueAtTime(0.001, time);
    subGain.gain.linearRampToValueAtTime(0.35 * intensity, time + 0.004);
    subGain.gain.exponentialRampToValueAtTime(0.001, time + totalDuration * 0.8);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(oscGain);
    clickOsc.connect(clickGain);
    clickGain.connect(this.masterGain);
    oscGain.connect(this.masterGain);

    osc.start(time);
    subOsc.start(time);
    clickOsc.start(time);
    osc.stop(time + totalDuration + 0.05);
    subOsc.stop(time + totalDuration + 0.05);
    clickOsc.stop(time + 0.02);
  }

  // --- TANG / TA: Crisp cane stick strike on tight parchment head ---
  playTang(time, intensity = 1.0) {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;

    // Resonant bandpass filter + white noise stick snap
    const bufferSize = ctx.sampleRate * 0.08;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2800, time);
    noiseFilter.Q.setValueAtTime(4.2, time);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.9 * intensity, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);

    // Rim shell ring body
    const rimOsc = ctx.createOscillator();
    const rimGain = ctx.createGain();
    rimOsc.type = 'triangle';
    rimOsc.frequency.setValueAtTime(510, time);
    rimOsc.frequency.exponentialRampToValueAtTime(320, time + 0.06);

    rimGain.gain.setValueAtTime(0.55 * intensity, time);
    rimGain.gain.exponentialRampToValueAtTime(0.001, time + 0.065);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    rimOsc.connect(rimGain);
    rimGain.connect(this.masterGain);

    whiteNoise.start(time);
    rimOsc.start(time);
    whiteNoise.stop(time + 0.05);
    rimOsc.stop(time + 0.07);
  }

  // --- TIN: High resonant stick accent ---
  playTin(time, intensity = 1.0) {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(740, time);
    osc.frequency.exponentialRampToValueAtTime(480, time + 0.09);

    const highFilter = ctx.createBiquadFilter();
    highFilter.type = 'highpass';
    highFilter.frequency.value = 450;

    gain.gain.setValueAtTime(0.6 * intensity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.095);

    osc.connect(highFilter);
    highFilter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.1);
  }

  // --- KATHI: Subtle wooden rim tap ---
  playKathi(time, intensity = 0.6) {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(3200, time);
    osc.frequency.exponentialRampToValueAtTime(1400, time + 0.015);

    gain.gain.setValueAtTime(0.25 * intensity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.018);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.02);
  }

  // --- KASHOR: Sacred brass gong accompaniment ---
  playKashor(time, intensity = 0.5) {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;

    // Dual ringing sines for brass shimmer
    [860, 1720, 2580].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      const amp = (0.22 / (idx + 1)) * intensity;
      gain.gain.setValueAtTime(amp, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.9);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + 0.95);
    });
  }

  // --- Lookahead Scheduler ---
  scheduler() {
    while (this.nextNoteTime < this.audioCtx.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentStep, this.nextNoteTime);
      this.advanceStep();
    }
    if (this.isPlaying) {
      this.timerId = setTimeout(() => this.scheduler(), this.lookahead);
    }
  }

  scheduleNote(step, time) {
    const pattern = this.rhythmPattern[step];
    if (!pattern) return;

    if (pattern.dha > 0) this.playDha(time, pattern.dha);
    if (pattern.tang > 0) this.playTang(time, pattern.tang);
    if (pattern.tin > 0) this.playTin(time, pattern.tin);
    if (pattern.kathi > 0) this.playKathi(time, pattern.kathi);
    if (pattern.kashor > 0) this.playKashor(time, pattern.kashor);
  }

  advanceStep() {
    // 16th note interval = (60 / bpm) / 4 seconds
    const secondsPer16th = (60.0 / this.bpm) / 4.0;
    this.nextNoteTime += secondsPer16th;
    this.currentStep = (this.currentStep + 1) % 16;
  }

  // --- Public Controls ---
  async start() {
    this.init();
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = this.audioCtx.currentTime + 0.05;
    this.scheduler();
    this.notifySubscribers();
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.notifySubscribers();
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
    return this.isPlaying;
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
  }

  onStateChange(callback) {
    this.subscribers.push(callback);
  }

  notifySubscribers() {
    this.subscribers.forEach(cb => {
      try { cb(this.isPlaying); } catch (e) { console.error(e); }
    });
  }
}

// Global Singleton Instance
window.dhakEngine = new DhakEngine();
