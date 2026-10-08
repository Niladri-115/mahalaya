/**
 * ============================================================================
 * AGOMONI - AKASHVANI BANGLA LIVE RADIO CONTROLLER
 * ============================================================================
 *
 * Dedicated Radio interface connecting directly to official Akashvani / AIR Bangla.
 *
 * KEY ARCHITECTURAL PRINCIPLES:
 * 1. LIVE RADIO PARADIGM:
 *    - Strictly NO timeline, seek bar, duration, or elapsed time.
 *    - Stream audio is live broadcast; seeking is disabled.
 * 2. SEPARATE DHAK:
 *    - Dhak is NOT mixed into Akashvani by default.
 *    - User explicitly toggles "🥁 DHAK OFF" / "🥁 DHAK ON".
 *    - Ambient Dhak is generated locally via Web Audio API (dhak.js).
 * 3. ISOLATED ENDPOINTS:
 *    - Stream endpoints and connection logic live in `js/akashiVani.js`.
 * 4. AUTOPLAY COMPLIANCE:
 *    - Visual animation autoplays silently on page load.
 *    - Audio stream requires explicit user gesture (Play button).
 * ============================================================================
 */

class MahalayaRadioController {
  constructor() {
    this.service = window.akashvaniService;

    // DOM Elements
    this.btnPlay = document.getElementById('btnPlay');
    this.btnReconnect = document.getElementById('btnReconnect');
    this.btnPlayerMute = document.getElementById('btnPlayerMute');
    this.playerVolumeSlider = document.getElementById('playerVolumeSlider');
    this.liveBadge = document.getElementById('liveBadge');

    this.trackTitle = document.getElementById('trackTitle');
    this.trackArtist = document.getElementById('trackArtist');

    this.connectionLostBanner = document.getElementById('connectionLostBanner');
    this.btnBannerReconnect = document.getElementById('btnBannerReconnect');

    this.corsFallbackBanner = document.getElementById('corsFallbackBanner');
    this.btnOfficialPortal = document.getElementById('btnOfficialPortal');

    this.radioGlow = document.querySelector('.radio-valve-glow');
    this.radioIndicator = document.querySelector('.radio-indicator-light');
    this.visualizerCanvas = document.getElementById('radioVisualizer');

    // Spectrum Visualizer
    this.spectrumData = new Uint8Array(32);
    this.isVisualizerRunning = false;

    this.init();
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  init() {
    this.bindEvents();
    this.subscribeServiceEvents();
    this.initVisualizer();
    this.updateUIState(window.AkashvaniState ? window.AkashvaniState.IDLE : 'IDLE');
  }

  // ==========================================================================
  // EVENT BINDINGS
  // ==========================================================================
  bindEvents() {
    // 1. Play / Pause
    if (this.btnPlay) {
      this.btnPlay.addEventListener('click', () => {
        this.togglePlay();
      });
    }

    // 2. Reconnect Button in player dock
    if (this.btnReconnect) {
      this.btnReconnect.addEventListener('click', () => {
        this.reconnect();
      });
    }

    // 3. Reconnect Button in notification banner
    if (this.btnBannerReconnect) {
      this.btnBannerReconnect.addEventListener('click', () => {
        this.reconnect();
      });
    }

    // 4. Volume Slider
    if (this.playerVolumeSlider) {
      this.playerVolumeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (this.service) {
          this.service.setVolume(val);
        }
        this.updateMuteIcon(this.service ? this.service.getIsMuted() : false, val);
      });
    }

    // 5. Player Mute Toggle Button
    if (this.btnPlayerMute) {
      this.btnPlayerMute.addEventListener('click', () => {
        if (this.service) {
          const isMuted = this.service.toggleMute();
          this.updateMuteIcon(isMuted, this.service.getVolume());
        }
      });
    }
  }

  // ==========================================================================
  // SUBSCRIBE TO AKASHVANI SERVICE EVENTS
  // ==========================================================================
  subscribeServiceEvents() {
    if (!this.service) return;

    this.service.onStateChange((state, meta) => {
      this.updateUIState(state, meta);
    });
  }

  // ==========================================================================
  // PLAY / PAUSE / RECONNECT
  // ==========================================================================
  async togglePlay() {
    if (!this.service) return;

    const State = window.AkashvaniState;
    if (this.service.state === State.PLAYING) {
      this.service.pause();
    } else {
      try {
        await this.service.play();
      } catch (e) {
        console.warn('Play error handled in service:', e);
      }
    }
  }

  reconnect() {
    if (this.service) {
      this.hideBanners();
      this.service.reconnect().catch(err => {
        console.warn('Manual reconnect attempt error:', err);
      });
    }
  }

  // ==========================================================================
  // UI STATE MANAGEMENT
  // ==========================================================================
  updateUIState(state, meta = {}) {
    const State = window.AkashvaniState || {};
    const isPlaying = state === State.PLAYING;
    const isConnecting = state === State.CONNECTING || state === State.RECONNECTING;
    const isDisconnected = state === State.DISCONNECTED;
    const isFallback = state === State.FALLBACK_REQUIRED;

    // 1. Play Button icon and state
    if (this.btnPlay) {
      this.btnPlay.classList.toggle('playing', isPlaying);
      this.btnPlay.classList.toggle('connecting', isConnecting);

      if (isPlaying) {
        this.btnPlay.innerHTML = `
          <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        `;
        this.btnPlay.setAttribute('title', 'আকাশবাণী বিরতি (Pause Broadcast)');
        this.btnPlay.setAttribute('aria-label', 'Pause Akashvani Broadcast');
      } else if (isConnecting) {
        this.btnPlay.innerHTML = `
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" class="spin-icon">
            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
          </svg>
        `;
        this.btnPlay.setAttribute('title', 'সংযোগ হচ্ছে... (Connecting)');
        this.btnPlay.setAttribute('aria-label', 'Connecting to Akashvani');
      } else {
        this.btnPlay.innerHTML = `
          <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        `;
        this.btnPlay.setAttribute('title', 'আকাশবাণী লাইভ শুনুন (Play Akashvani Broadcast)');
        this.btnPlay.setAttribute('aria-label', 'Play Akashvani Broadcast');
      }
    }

    // 2. ON AIR Status Badge
    if (this.liveBadge) {
      if (isPlaying) {
        this.liveBadge.className = 'badge-live on-air';
        this.liveBadge.innerHTML = `<span class="dot live-pulse"></span> 🔴 ON AIR`;
      } else if (isConnecting) {
        this.liveBadge.className = 'badge-live connecting';
        this.liveBadge.innerHTML = `<span class="dot wait-pulse"></span> ⏳ CONNECTING`;
      } else if (state === State.RECONNECTING) {
        this.liveBadge.className = 'badge-live warning';
        this.liveBadge.innerHTML = `<span class="dot warn-pulse"></span> ⚠️ RETRYING (${meta.attempt || 1}/${meta.maxAttempts || 6})`;
      } else if (isDisconnected) {
        this.liveBadge.className = 'badge-live error';
        this.liveBadge.innerHTML = `<span class="dot error-dot"></span> ⭕ OFFLINE`;
      } else {
        this.liveBadge.className = 'badge-live standby';
        this.liveBadge.innerHTML = `<span class="dot"></span> ⚪ STANDBY`;
      }
    }

    // 3. Radio Aesthetics Glow & Indicator
    if (this.radioGlow) {
      this.radioGlow.classList.toggle('broadcast-active', isPlaying);
    }
    if (this.radioIndicator) {
      this.radioIndicator.classList.toggle('broadcast-active', isPlaying);
    }

    // 4. Document Title
    if (isPlaying) {
      document.title = '🔴 ON AIR | আকাশবাণী বাংলা - মহালয়ার পুণ্য প্রভাত';
    } else {
      document.title = 'আকাশবাণী বাংলা লাইভ | মহালয়া - আগমনী';
    }

    // 5. Connection Lost Banner
    if (this.connectionLostBanner) {
      if (isDisconnected || state === State.RECONNECTING) {
        this.connectionLostBanner.classList.remove('hidden');
      } else {
        this.connectionLostBanner.classList.add('hidden');
      }
    }

    // 6. CORS / Direct play restriction fallback banner
    if (this.corsFallbackBanner) {
      if (isFallback) {
        this.corsFallbackBanner.classList.remove('hidden');
      } else {
        this.corsFallbackBanner.classList.add('hidden');
      }
    }
  }

  hideBanners() {
    if (this.connectionLostBanner) {
      this.connectionLostBanner.classList.add('hidden');
    }
    if (this.corsFallbackBanner) {
      this.corsFallbackBanner.classList.add('hidden');
    }
  }

  // ==========================================================================
  // VOLUME / MUTE ICON SYNC
  // ==========================================================================
  updateMuteIcon(isMuted, volume) {
    if (!this.btnPlayerMute) return;

    if (isMuted || volume === 0) {
      this.btnPlayerMute.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
        </svg>
      `;
      this.btnPlayerMute.setAttribute('title', 'শব্দ চালু করুন (Unmute)');
    } else {
      this.btnPlayerMute.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
      `;
      this.btnPlayerMute.setAttribute('title', 'নিঃশব্দ করুন (Mute)');
    }
  }

  // ==========================================================================
  // ANALOG RADIO VISUALIZER
  // ==========================================================================
  initVisualizer() {
    if (!this.visualizerCanvas) return;

    const canvas = this.visualizerCanvas;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = (rect.width || 120) * dpr;
    canvas.height = (rect.height || 28) * dpr;
    ctx.scale(dpr, dpr);

    const barCount = 18;
    const barWidth = 3;
    const gap = 3;

    const render = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);

      const isPlaying = this.service && this.service.state === window.AkashvaniState.PLAYING;
      const isDhakActive = window.dhakEngine && window.dhakEngine.isPlaying;
      const time = performance.now() * 0.003;

      let hasRealFreqs = false;
      if (this.service && isPlaying) {
        hasRealFreqs = this.service.getFrequencyData(this.spectrumData);
      }

      for (let i = 0; i < barCount; i++) {
        let heightPercent = 0.12;

        if (hasRealFreqs && isPlaying) {
          const bin = Math.floor((i / barCount) * (this.spectrumData.length * 0.7));
          heightPercent = Math.max(0.12, (this.spectrumData[bin] || 0) / 255);
        } else if (isPlaying) {
          // Dynamic radio tuning wave
          const wave1 = Math.sin(time * 3.5 + i * 0.45);
          const wave2 = Math.cos(time * 2.2 + i * 0.3);
          heightPercent = 0.22 + 0.58 * Math.abs(wave1 * wave2);
        } else if (isDhakActive) {
          // Procedural Dhak active rhythmic pulse
          const beat = Math.sin(time * 3 + i * 0.4);
          heightPercent = 0.18 + 0.5 * Math.abs(beat);
        } else {
          // Idle breathing radio pulse
          heightPercent = 0.08 + 0.08 * Math.sin(time + i * 0.5);
        }

        const barH = heightPercent * (rect.height - 4);
        const x = i * (barWidth + gap);
        const y = rect.height - barH;

        // Vintage golden radio dial gradient
        const grad = ctx.createLinearGradient(0, y, 0, rect.height);
        if (isPlaying) {
          grad.addColorStop(0, '#ffe49e');
          grad.addColorStop(0.5, '#ff9900');
          grad.addColorStop(1, '#b85900');
        } else {
          grad.addColorStop(0, '#8c775a');
          grad.addColorStop(1, '#3d2e1f');
        }

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, barH);
      }

      requestAnimationFrame(render);
    };

    render();
  }
}

// Global Export
window.MahalayaPlayer = MahalayaRadioController;