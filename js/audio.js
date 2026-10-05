/**
 * Agomoni - Mahalaya Live Radio Broadcast Audio Player
 *
 * Uses:
 *   audio/mahalaya.mp3  -> Real Mahalaya / Mahishasuramardini audio
 *   audio/dhak.mp3      -> Real Dhak audio
 *
 * No external audio stream.
 * No procedural Dhak audio.
 */

class MahalayaPlayer {
  constructor() {
    // ------------------------------------------------------------
    // REAL MAHALAYA AUDIO
    // ------------------------------------------------------------
    this.audio = new Audio('audio/mahalaya.mp3');
    this.audio.preload = 'metadata';

    // ------------------------------------------------------------
    // REAL DHAK AUDIO
    // ------------------------------------------------------------
    this.dhakAudio = new Audio('audio/dhak.mp3');
    this.dhakAudio.preload = 'auto';
    this.dhakAudio.loop = true;
    this.dhakAudio.volume = 0.38;

    // State
    this.isPlaying = false;
    this.isLooping = false;
    this.hasAudioFile = true;
    this.dhakPlaying = false;

    // ------------------------------------------------------------
    // Web Audio visualizer
    // ------------------------------------------------------------
    this.audioContext = null;
    this.analyser = null;
    this.sourceNode = null;
    this.dataArray = null;

    // ------------------------------------------------------------
    // Elements
    // ------------------------------------------------------------
    this.btnPlay = document.getElementById('btnPlay');
    this.btnRestart = document.getElementById('btnRestart');
    this.btnRewind = document.getElementById('btnRewind');
    this.btnForward = document.getElementById('btnForward');
    this.btnLoop = document.getElementById('btnLoop');
    this.btnDhakToggle = document.getElementById('btnDhakToggle');

    this.dhakStatusBadge =
      document.getElementById('dhakStatusBadge');

    this.audioMissingNotice =
      document.getElementById('audioMissingNotice');

    this.localAudioInput =
      document.getElementById('localAudioInput');

    this.radioGlow =
      document.querySelector('.radio-valve-glow');

    this.radioIndicator =
      document.querySelector('.radio-indicator-light');

    this.visualizerCanvas =
      document.getElementById('radioVisualizer');

    // ------------------------------------------------------------
    // Initialize
    // ------------------------------------------------------------
    this.init();

    // ------------------------------------------------------------
    // Compatibility layer
    //
    // Your existing app.js uses window.dhakEngine.
    // Instead of changing app.js immediately, we make those
    // existing calls control the REAL dhak.mp3.
    // ------------------------------------------------------------
    this.createDhakCompatibilityLayer();
  }

  // ==============================================================
  // INITIALIZATION
  // ==============================================================

  init() {
    this.bindEvents();
    this.checkAudioAvailability();
    this.initVisualizer();
  }

  // ==============================================================
  // AUDIO AVAILABILITY
  // ==============================================================

  checkAudioAvailability() {
    // Local Mahalaya file is now the PRIMARY audio source.
    this.audio.src = 'audio/mahalaya.mp3';

    this.hasAudioFile = true;

    this.hideAudioMissingNotice();

    // Preload the real Dhak file as well.
    this.dhakAudio.load();
  }

  showAudioMissingNotice() {
    this.hasAudioFile = false;

    if (this.audioMissingNotice) {
      this.audioMissingNotice.classList.remove('hidden');
    }
  }

  hideAudioMissingNotice() {
    this.hasAudioFile = true;

    if (this.audioMissingNotice) {
      this.audioMissingNotice.classList.add('hidden');
    }
  }

  // ==============================================================
  // EVENT BINDINGS
  // ==============================================================

  bindEvents() {

    // ------------------------------------------------------------
    // Main Play / Pause
    // ------------------------------------------------------------

    if (this.btnPlay) {
      this.btnPlay.addEventListener('click', () => {
        this.togglePlay();
      });
    }

    // ------------------------------------------------------------
    // Restart
    // ------------------------------------------------------------

    if (this.btnRestart) {
      this.btnRestart.addEventListener('click', () => {
        this.restart();
      });
    }

    // ------------------------------------------------------------
    // Rewind 15 seconds
    // ------------------------------------------------------------

    if (this.btnRewind) {
      this.btnRewind.addEventListener('click', () => {
        this.seekBy(-15);
      });
    }

    // ------------------------------------------------------------
    // Forward 15 seconds
    // ------------------------------------------------------------

    if (this.btnForward) {
      this.btnForward.addEventListener('click', () => {
        this.seekBy(15);
      });
    }

    // ------------------------------------------------------------
    // Loop
    // ------------------------------------------------------------

    if (this.btnLoop) {
      this.btnLoop.addEventListener('click', () => {
        this.toggleLoop();
      });
    }

    // ------------------------------------------------------------
    // Dhak Toggle
    // ------------------------------------------------------------

    if (this.btnDhakToggle) {
      this.btnDhakToggle.addEventListener('click', () => {
        this.toggleDhak();
      });
    }

    // ------------------------------------------------------------
    // Optional local audio picker
    // ------------------------------------------------------------

    if (this.localAudioInput) {
      this.localAudioInput.addEventListener('change', (e) => {
        this.handleLocalFile(e);
      });
    }

    // ------------------------------------------------------------
    // Mahalaya Audio Events
    // ------------------------------------------------------------

    this.audio.addEventListener('play', () => {
      this.onAudioPlay();
    });

    this.audio.addEventListener('pause', () => {
      this.onAudioPause();
    });

    this.audio.addEventListener('ended', () => {
      this.onAudioEnded();
    });

    this.audio.addEventListener('error', (e) => {
      this.onAudioError(e);
    });

    // ------------------------------------------------------------
    // Real Dhak Audio Events
    // ------------------------------------------------------------

    this.dhakAudio.addEventListener('play', () => {
      this.dhakPlaying = true;
      this.updateDhakUI(true);
    });

    this.dhakAudio.addEventListener('pause', () => {
      this.dhakPlaying = false;
      this.updateDhakUI(false);
    });

    this.dhakAudio.addEventListener('ended', () => {
      this.dhakPlaying = false;
      this.updateDhakUI(false);
    });

    this.dhakAudio.addEventListener('error', (e) => {
      console.warn('Real Dhak audio error:', e);
    });
  }

  // ==============================================================
  // WEB AUDIO VISUALIZER
  // ==============================================================

  setupWebAudioNodes() {
    if (this.audioContext) return;

    try {
      const AudioCtx =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioCtx) {
        return;
      }

      this.audioContext = new AudioCtx();

      this.analyser =
        this.audioContext.createAnalyser();

      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.85;

      this.sourceNode =
        this.audioContext.createMediaElementSource(
          this.audio
        );

      this.sourceNode.connect(this.analyser);

      this.analyser.connect(
        this.audioContext.destination
      );

      this.dataArray =
        new Uint8Array(
          this.analyser.frequencyBinCount
        );

    } catch (e) {
      console.warn(
        'Web Audio setup deferred:',
        e
      );
    }
  }

  // ==============================================================
  // MAIN PLAY / PAUSE
  // ==============================================================

  async togglePlay() {
    this.setupWebAudioNodes();

    if (
      this.audioContext &&
      this.audioContext.state === 'suspended'
    ) {
      try {
        await this.audioContext.resume();
      } catch (e) {
        console.warn(
          'Could not resume AudioContext:',
          e
        );
      }
    }

    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  // ==============================================================
  // PLAY BOTH REAL AUDIO FILES
  // ==============================================================

  async play() {

    // ------------------------------------------------------------
    // 1. Start REAL DHAK
    // ------------------------------------------------------------

    try {
      if (this.dhakAudio.paused) {
        await this.dhakAudio.play();
      }
    } catch (err) {
      console.warn(
        'Real Dhak playback error:',
        err
      );
    }

    // ------------------------------------------------------------
    // 2. Start REAL MAHALAYA AUDIO
    // ------------------------------------------------------------

    if (this.hasAudioFile) {

      try {
        await this.audio.play();

        this.isPlaying = true;

      } catch (err) {

        console.warn(
          'Mahalaya audio playback error:',
          err
        );

        this.isPlaying = true;
        this.showAudioMissingNotice();
      }

    } else {

      this.isPlaying = true;
      this.showAudioMissingNotice();
    }

    // ------------------------------------------------------------
    // Update UI
    // ------------------------------------------------------------

    this.updatePlayStateUI(true);
  }

  // ==============================================================
  // PAUSE
  // ==============================================================

  pause() {

    this.isPlaying = false;

    // Stop Mahalaya
    this.audio.pause();

    // Stop REAL Dhak
    this.dhakAudio.pause();

    this.updatePlayStateUI(false);
  }

  // ==============================================================
  // RESTART
  // ==============================================================

  restart() {

    try {
      this.audio.currentTime = 0;
    } catch (e) {
      console.warn(e);
    }

    try {
      this.dhakAudio.currentTime = 0;
    } catch (e) {
      console.warn(e);
    }

    this.play();
  }

  // ==============================================================
  // SEEK
  // ==============================================================

  seekBy(deltaSeconds) {

    if (!this.hasAudioFile) {
      return;
    }

    try {

      this.audio.currentTime =
        Math.max(
          0,
          this.audio.currentTime + deltaSeconds
        );

    } catch (e) {
      console.warn(e);
    }
  }

  // ==============================================================
  // LOOP MAHALAYA
  // ==============================================================

  toggleLoop() {

    this.isLooping = !this.isLooping;

    this.audio.loop = this.isLooping;

    if (this.btnLoop) {
      this.btnLoop.classList.toggle(
        'active',
        this.isLooping
      );
    }
  }

  // ==============================================================
  // DHAK CONTROLS
  // ==============================================================

  async toggleDhak() {

    if (this.dhakAudio.paused) {

      try {

        await this.dhakAudio.play();

      } catch (err) {

        console.warn(
          'Could not play Dhak:',
          err
        );

      }

    } else {

      this.dhakAudio.pause();
    }
  }

  async startDhak() {

    try {

      if (this.dhakAudio.paused) {
        await this.dhakAudio.play();
      }

    } catch (err) {

      console.warn(
        'Could not start Dhak:',
        err
      );
    }
  }

  stopDhak() {

    this.dhakAudio.pause();
  }

  setDhakVolume(volume) {

    const value =
      Math.max(
        0,
        Math.min(1, parseFloat(volume))
      );

    this.dhakAudio.volume = value;
  }

  // ==============================================================
  // COMPATIBILITY LAYER FOR EXISTING app.js
  // ==============================================================
  //
  // Your existing app.js contains calls such as:
  //
  // window.dhakEngine.start()
  // window.dhakEngine.stop()
  // window.dhakEngine.toggle()
  // window.dhakEngine.setVolume()
  // window.dhakEngine.onStateChange()
  //
  // We redirect those calls to the REAL dhak.mp3.
  // ==============================================================

  createDhakCompatibilityLayer() {

    const player = this;

    const listeners = [];

    const compatibilityEngine = {

      start: async function () {

        await player.startDhak();

        listeners.forEach(
          callback => callback(
            !player.dhakAudio.paused
          )
        );

        return !player.dhakAudio.paused;
      },

      stop: function () {

        player.stopDhak();

        listeners.forEach(
          callback => callback(false)
        );
      },

      toggle: async function () {

        await player.toggleDhak();

        const playing =
          !player.dhakAudio.paused;

        listeners.forEach(
          callback => callback(playing)
        );

        return playing;
      },

      setVolume: function (volume) {

        player.setDhakVolume(volume);
      },

      onStateChange: function (callback) {

        if (typeof callback === 'function') {
          listeners.push(callback);
        }
      },

      get isPlaying() {

        return !player.dhakAudio.paused;
      }
    };

    // Replace the old procedural engine with
    // this real-audio compatibility controller.
    window.dhakEngine = compatibilityEngine;
  }

  // ==============================================================
  // LOCAL FILE PICKER
  // ==============================================================

  handleLocalFile(e) {

    const file = e.target.files[0];

    if (!file) {
      return;
    }

    const fileUrl =
      URL.createObjectURL(file);

    this.audio.src = fileUrl;

    this.hasAudioFile = true;

    this.hideAudioMissingNotice();

    this.play();
  }

  // ==============================================================
  // MAHALAYA AUDIO EVENTS
  // ==============================================================

  onAudioPlay() {

    this.isPlaying = true;

    this.updatePlayStateUI(true);
  }

  onAudioPause() {

    this.isPlaying = false;

    this.updatePlayStateUI(false);
  }

  onAudioEnded() {

    if (!this.isLooping) {

      // Stop real Dhak when Mahalaya finishes
      this.dhakAudio.pause();

      this.isPlaying = false;

      this.updatePlayStateUI(false);
    }
  }

  onAudioError(e) {

    console.error(
      'Mahalaya audio could not be loaded:',
      e
    );

    this.showAudioMissingNotice();
  }

  // ==============================================================
  // PLAY / PAUSE UI
  // ==============================================================

  updatePlayStateUI(isPlaying) {

    // ------------------------------------------------------------
    // Main Play Button
    // ------------------------------------------------------------

    if (this.btnPlay) {

      this.btnPlay.innerHTML =
        isPlaying

          ? `<svg viewBox="0 0 24 24"
               width="26"
               height="26"
               fill="currentColor">
               <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
             </svg>`

          : `<svg viewBox="0 0 24 24"
               width="26"
               height="26"
               fill="currentColor">
               <path d="M8 5v14l11-7z"/>
             </svg>`;

      this.btnPlay.setAttribute(
        'aria-label',
        isPlaying
          ? 'Pause Broadcast'
          : 'Play Broadcast'
      );

      this.btnPlay.classList.toggle(
        'playing',
        isPlaying
      );
    }

    // ------------------------------------------------------------
    // Vintage Radio Glow
    // ------------------------------------------------------------

    if (this.radioGlow) {

      this.radioGlow.classList.toggle(
        'broadcast-active',
        isPlaying
      );
    }

    // ------------------------------------------------------------
    // Radio Indicator
    // ------------------------------------------------------------

    if (this.radioIndicator) {

      this.radioIndicator.classList.toggle(
        'broadcast-active',
        isPlaying
      );
    }

    // ------------------------------------------------------------
    // Document Title
    // ------------------------------------------------------------

    document.title =
      isPlaying

        ? '● সম্প্রচার চলছে | মহিষাসুরমর্দিনী'

        : 'মহিষাসুরমর্দিনী | মহালয়া';
  }

  // ==============================================================
  // DHAK UI
  // ==============================================================

  updateDhakUI(isDhakPlaying) {

    // ------------------------------------------------------------
    // Status Badge
    // ------------------------------------------------------------

    if (this.dhakStatusBadge) {

      this.dhakStatusBadge.classList.toggle(
        'active',
        isDhakPlaying
      );

      this.dhakStatusBadge.innerHTML =
        isDhakPlaying

          ? `<span class="pulse-ring"></span>🥁 ঢাক চলছে`

          : `🥁 ঢাক বন্ধ`;
    }

    // ------------------------------------------------------------
    // Dhak Toggle Button
    // ------------------------------------------------------------

    if (this.btnDhakToggle) {

      this.btnDhakToggle.classList.toggle(
        'active',
        isDhakPlaying
      );
    }

    // ------------------------------------------------------------
    // Hero Dhak Button
    // ------------------------------------------------------------

    const btnDhakHero =
      document.getElementById('btnDhakHero');

    const heroDhakLabel =
      document.getElementById('heroDhakLabel');

    if (btnDhakHero) {

      btnDhakHero.classList.toggle(
        'active',
        isDhakPlaying
      );
    }

    if (heroDhakLabel) {

      heroDhakLabel.textContent =
        isDhakPlaying
          ? 'DHAK OFF'
          : 'DHAK ON';
    }
  }

  // ==============================================================
  // ANALOG RADIO VISUALIZER
  // ==============================================================

  initVisualizer() {

    if (!this.visualizerCanvas) {
      return;
    }

    const canvas =
      this.visualizerCanvas;

    const ctx =
      canvas.getContext('2d');

    const dpr =
      window.devicePixelRatio || 1;

    const rect =
      canvas.getBoundingClientRect();

    canvas.width =
      (rect.width || 120) * dpr;

    canvas.height =
      (rect.height || 28) * dpr;

    ctx.scale(dpr, dpr);

    const barCount = 18;
    const barWidth = 3;
    const gap = 3;

    const render = () => {

      ctx.clearRect(
        0,
        0,
        rect.width,
        rect.height
      );

      let freqs = null;

      // ----------------------------------------------------------
      // Mahalaya frequency data
      // ----------------------------------------------------------

      if (
        this.analyser &&
        this.isPlaying &&
        this.hasAudioFile
      ) {

        this.analyser.getByteFrequencyData(
          this.dataArray
        );

        freqs = this.dataArray;
      }

      // ----------------------------------------------------------
      // Real Dhak state
      // ----------------------------------------------------------

      const isDhakActive =
        !this.dhakAudio.paused;

      const time =
        performance.now() * 0.003;

      // ----------------------------------------------------------
      // Draw bars
      // ----------------------------------------------------------

      for (
        let i = 0;
        i < barCount;
        i++
      ) {

        let heightPercent = 0.12;

        // Mahalaya audio visualizer
        if (
          freqs &&
          this.isPlaying
        ) {

          const bin =
            Math.floor(
              (i / barCount) *
              (freqs.length * 0.7)
            );

          heightPercent =
            Math.max(
              0.12,
              (freqs[bin] || 0) / 255
            );

        }

        // Real Dhak active:
        // visual rhythm animation
        else if (isDhakActive) {

          const beat =
            Math.sin(
              time * 3 +
              i * 0.4
            );

          heightPercent =
            0.2 +
            0.55 *
            Math.abs(beat);
        }

        // Idle
        else {

          heightPercent =
            0.1 +
            0.1 *
            Math.sin(
              time +
              i * 0.5
            );
        }

        const barH =
          heightPercent *
          (rect.height - 4);

        const x =
          i *
          (barWidth + gap);

        const y =
          rect.height -
          barH;

        // --------------------------------------------------------
        // Vintage radio gradient
        // --------------------------------------------------------

        const grad =
          ctx.createLinearGradient(
            0,
            y,
            0,
            rect.height
          );

        grad.addColorStop(
          0,
          '#ffd27d'
        );

        grad.addColorStop(
          0.6,
          '#ff9900'
        );

        grad.addColorStop(
          1,
          '#b86200'
        );

        ctx.fillStyle = grad;

        ctx.fillRect(
          x,
          y,
          barWidth,
          barH
        );
      }

      requestAnimationFrame(render);
    };

    render();
  }
}

// ================================================================
// EXPORT
// ================================================================

window.MahalayaPlayer = MahalayaPlayer;