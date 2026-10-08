/**
 * ============================================================================
 * AGOMONI - AUTHENTIC BENGALI DHAK AMBIENCE ENGINE
 * ============================================================================
 * Plays the authentic, real recorded Durga Puja / Mahalaya Dhak audio
 * ('audio/dhak.mp3') with seamless continuous looping and independent volume control.
 *
 * Fully separated from Akashvani broadcast stream.
 * ============================================================================
 */

class DhakEngine {
  constructor() {
    this.audio = new Audio('audio/dhak.mp3');
    this.audio.preload = 'auto';
    this.audio.loop = true;
    this.volume = 0.45;
    this.audio.volume = this.volume;

    this.isPlaying = false;
    this.subscribers = [];

    this._bindEvents();
  }

  _bindEvents() {
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.notifySubscribers();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.notifySubscribers();
    });

    this.audio.addEventListener('ended', () => {
      // Loop backup
      if (this.isPlaying) {
        this.audio.currentTime = 0;
        this.audio.play().catch(e => console.warn('Dhak loop play error:', e));
      }
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('[DhakEngine] Dhak audio error:', e);
      this.isPlaying = false;
      this.notifySubscribers();
    });
  }

  // --- Public Controls ---
  async start() {
    if (this.isPlaying && !this.audio.paused) return;

    try {
      this.audio.volume = this.volume;
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      this.isPlaying = true;
    } catch (err) {
      console.warn('[DhakEngine] Dhak playback failed:', err);
      this.isPlaying = false;
    }

    this.notifySubscribers();
    return this.isPlaying;
  }

  stop() {
    this.isPlaying = false;
    try {
      this.audio.pause();
    } catch (e) {}
    this.notifySubscribers();
  }

  toggle() {
    if (this.isPlaying && !this.audio.paused) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, parseFloat(val) || 0));
    this.audio.volume = this.volume;
  }

  getVolume() {
    return this.volume;
  }

  onStateChange(callback) {
    if (typeof callback === 'function') {
      this.subscribers.push(callback);
    }
  }

  notifySubscribers() {
    this.subscribers.forEach(cb => {
      try { cb(this.isPlaying); } catch (e) { console.error(e); }
    });
  }
}

// Global Singleton Instance
window.dhakEngine = new DhakEngine();
