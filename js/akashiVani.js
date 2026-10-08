/**
 * ============================================================================
 * AGOMONI - AKASHVANI (ALL INDIA RADIO) BANGLA STREAM CONFIGURATION & SERVICE
 * ============================================================================
 *
 * This file isolates the official Akashvani (Prasar Bharati) live streaming
 * endpoints, station metadata, and streaming connection lifecycle.
 *
 * CONCEPT:
 *   AGOMONI WEBSITE -> AKASHVANI LIVE -> AIR BANGLA -> WHATEVER IS ON AIR
 *   On Mahalaya morning, when Akashvani broadcasts Mahishasuramardini,
 *   this live connection automatically carries that broadcast.
 *
 * IF AKASHVANI CHANGES ITS STREAMING ENDPOINT:
 *   Simply update the `streamUrl` in `AKASHVANI_CONFIG` below.
 *   No other files in the project need to be modified.
 * ============================================================================
 */

(function (window) {
  'use strict';

  // ==========================================================================
  // 1. STREAM CONFIGURATION
  // ==========================================================================
  const AKASHVANI_CONFIG = {
    // Station branding
    stationName: 'আকাশবাণী বাংলা',
    stationSubtitle: 'LIVE BROADCAST',
    stationFrequency: 'AIR Kolkata · Prasar Bharati',

    // Official Akashvani / Prasar Bharati HLS streaming endpoints:
    // Primary: Akashvani Bangla (AIR Bangla official HLS stream)
    streamUrl: 'https://airhlspush.pc.cdn.bitgravity.com/httppush/hlspbaudio137/hlspbaudio137_Auto.m3u8',

    // Secondary / Alternative: Akashvani Kolkata Geetanjali
    // (Broadcasts Mahishasuramardini simultaneously on Mahalaya dawn)
    alternateStreamUrl: 'https://airhlspush.pc.cdn.bitgravity.com/httppush/hlspbaudio055/hlspbaudio055_Auto.m3u8',

    // Official Prasar Bharati / News On AIR portal for manual fallback
    officialPortalUrl: 'https://newsonair.gov.in/',

    // Automatic reconnection policy with exponential backoff
    reconnect: {
      initialDelayMs: 1500,     // 1.5 seconds initial wait
      maxDelayMs: 20000,        // Cap maximum backoff delay at 20 seconds
      backoffFactor: 2.0,       // Double interval each attempt: 1.5s, 3s, 6s, 12s, 20s
      maxAttempts: 6            // Avoid hammering the server indefinitely
    }
  };

  // Expose configuration globally
  window.AKASHVANI_CONFIG = AKASHVANI_CONFIG;

  // ==========================================================================
  // 2. CONNECTION STATE ENUM
  // ==========================================================================
  const StreamState = {
    IDLE: 'IDLE',
    CONNECTING: 'CONNECTING',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    RECONNECTING: 'RECONNECTING',
    DISCONNECTED: 'DISCONNECTED',
    FALLBACK_REQUIRED: 'FALLBACK_REQUIRED'
  };

  // ==========================================================================
  // 3. AKASHVANI STREAM SERVICE
  // ==========================================================================
  class AkashvaniService {
    constructor(config = AKASHVANI_CONFIG) {
      this.config = config;
      this.state = StreamState.IDLE;
      this.audio = new Audio();
      this.audio.preload = 'none';
      this.audio.crossOrigin = 'anonymous';

      // Hls.js instance
      this.hls = null;

      // Reconnection tracking
      this.reconnectAttempts = 0;
      this.reconnectTimer = null;
      this.intentionalPause = true;

      // Event listeners
      this.stateChangeListeners = [];
      this.errorListeners = [];

      // Audio volume
      this.volume = 0.85;
      this.isMuted = false;
      this.audio.volume = this.volume;

      // Web Audio API context for visualizer
      this.audioContext = null;
      this.analyser = null;
      this.sourceNode = null;
      this.hasAudioContext = false;

      this._initAudioEvents();
    }

    // ------------------------------------------------------------------------
    // Public state subscription
    // ------------------------------------------------------------------------
    onStateChange(callback) {
      if (typeof callback === 'function') {
        this.stateChangeListeners.push(callback);
      }
    }

    onError(callback) {
      if (typeof callback === 'function') {
        this.errorListeners.push(callback);
      }
    }

    _setState(newState, meta = {}) {
      this.state = newState;
      this.stateChangeListeners.forEach(cb => {
        try { cb(newState, meta); } catch (e) { console.error('State callback error:', e); }
      });
    }

    // ------------------------------------------------------------------------
    // Audio element event listeners
    // ------------------------------------------------------------------------
    _initAudioEvents() {
      this.audio.addEventListener('playing', () => {
        this.reconnectAttempts = 0;
        this._setState(StreamState.PLAYING);
      });

      this.audio.addEventListener('pause', () => {
        if (this.intentionalPause) {
          this._setState(StreamState.PAUSED);
        }
      });

      this.audio.addEventListener('waiting', () => {
        if (!this.intentionalPause && this.state !== StreamState.CONNECTING) {
          this._setState(StreamState.CONNECTING, { reason: 'buffering' });
        }
      });

      this.audio.addEventListener('error', (e) => {
        console.warn('[Akashvani] HTML5 Audio error:', e);
        if (!this.intentionalPause) {
          this._handleConnectionLoss('HTML5 Audio encountered an error');
        }
      });
    }

    // ------------------------------------------------------------------------
    // Connect & Play Live Stream
    // ------------------------------------------------------------------------
    async play() {
      this.intentionalPause = false;
      this._clearReconnectTimer();

      // Ensure AudioContext is initialized/resumed on user gesture
      this._ensureAudioContext();

      this._setState(StreamState.CONNECTING);

      try {
        if (!this._isHlsAttached()) {
          await this._attachStream(this.config.streamUrl);
        }

        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
      } catch (err) {
        console.warn('[Akashvani] Play rejected:', err);
        // If autoplay blocked or stream load failed
        if (!this.intentionalPause) {
          this._handleConnectionLoss(err.message || 'Play rejected');
        }
      }
    }

    // ------------------------------------------------------------------------
    // Pause Broadcast
    // ------------------------------------------------------------------------
    pause() {
      this.intentionalPause = true;
      this._clearReconnectTimer();

      try {
        this.audio.pause();
      } catch (e) {
        console.warn('[Akashvani] Pause error:', e);
      }

      this._setState(StreamState.PAUSED);
    }

    // ------------------------------------------------------------------------
    // Manual Reconnect
    // ------------------------------------------------------------------------
    reconnect() {
      console.log('[Akashvani] Manual reconnection triggered');
      this.intentionalPause = false;
      this.reconnectAttempts = 0;
      this._clearReconnectTimer();
      this._destroyHls();

      return this.play();
    }

    // ------------------------------------------------------------------------
    // Volume & Mute Controls
    // ------------------------------------------------------------------------
    setVolume(value) {
      this.volume = Math.max(0, Math.min(1, parseFloat(value) || 0));
      if (!this.isMuted) {
        this.audio.volume = this.volume;
      }
    }

    getVolume() {
      return this.volume;
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      this.audio.volume = this.isMuted ? 0 : this.volume;
      return this.isMuted;
    }

    getIsMuted() {
      return this.isMuted;
    }

    // ------------------------------------------------------------------------
    // Stream Attachment (Hls.js vs Native Audio)
    // ------------------------------------------------------------------------
    _isHlsAttached() {
      return (this.hls !== null) || (this.audio.src && this.audio.src.length > 0);
    }

    _attachStream(streamUrl) {
      return new Promise((resolve, reject) => {
        // Option A: Browser supports Hls.js (Chrome, Firefox, Edge, Android)
        if (window.Hls && window.Hls.isSupported()) {
          this._destroyHls();

          const hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 30,
            maxBufferLength: 20,
            liveSyncDurationCount: 3,
            liveMaxLatencyDurationCount: 8,
            manifestLoadingTimeOut: 12000,
            manifestLoadingMaxRetry: 3,
            levelLoadingTimeOut: 12000,
            fragLoadingTimeOut: 12000
          });

          this.hls = hls;

          hls.loadSource(streamUrl);
          hls.attachMedia(this.audio);

          hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
            console.log('[Akashvani] HLS manifest parsed successfully');
            resolve();
          });

          hls.on(window.Hls.Events.ERROR, (event, data) => {
            console.warn('[Akashvani] HLS Event Error:', data.type, data.details, data.fatal);

            if (data.fatal) {
              switch (data.type) {
                case window.Hls.ErrorTypes.NETWORK_ERROR:
                  console.warn('[Akashvani] Network error detected');
                  if (data.response && data.response.code === 0) {
                    // Possible CORS or strict origin block
                    this._onPossibleCorsError();
                  } else {
                    this._handleConnectionLoss('Network streaming error');
                  }
                  break;

                case window.Hls.ErrorTypes.MEDIA_ERROR:
                  console.warn('[Akashvani] Media decoding error, attempting recovery');
                  try {
                    hls.recoverMediaError();
                  } catch (e) {
                    this._handleConnectionLoss('Media decoding recovery failed');
                  }
                  break;

                default:
                  this._destroyHls();
                  this._handleConnectionLoss('Fatal HLS error');
                  break;
              }
            }
          });

          return;
        }

        // Option B: Native HLS support (Safari on macOS and iOS iPhone/iPad)
        if (this.audio.canPlayType('application/vnd.apple.mpegurl')) {
          this.audio.src = streamUrl;
          this.audio.load();
          resolve();
          return;
        }

        // Option C: Browser does not support HLS at all
        console.warn('[Akashvani] HLS is not supported in this browser');
        this._setState(StreamState.FALLBACK_REQUIRED, {
          reason: 'Browser does not support HLS streaming'
        });
        reject(new Error('HLS not supported'));
      });
    }

    _destroyHls() {
      if (this.hls) {
        try {
          this.hls.destroy();
        } catch (e) {
          console.warn('[Akashvani] Error destroying Hls:', e);
        }
        this.hls = null;
      }
      try {
        this.audio.removeAttribute('src');
        this.audio.load();
      } catch (e) {}
    }

    // ------------------------------------------------------------------------
    // Exponential Backoff Reconnection Logic
    // ------------------------------------------------------------------------
    _handleConnectionLoss(reason) {
      if (this.intentionalPause) return;

      this.reconnectAttempts++;
      const { initialDelayMs, maxDelayMs, backoffFactor, maxAttempts } = this.config.reconnect;

      if (this.reconnectAttempts > maxAttempts) {
        console.warn(`[Akashvani] Reached max reconnect attempts (${maxAttempts}). Awaiting user action.`);
        this._setState(StreamState.DISCONNECTED, {
          reason: 'Akashvani connection lost',
          canManualReconnect: true
        });
        return;
      }

      // Calculate exponential backoff delay: 1.5s, 3s, 6s, 12s, 20s
      const delay = Math.min(
        initialDelayMs * Math.pow(backoffFactor, this.reconnectAttempts - 1),
        maxDelayMs
      );

      console.log(`[Akashvani] Connection lost (${reason}). Reconnecting in ${(delay / 1000).toFixed(1)}s (Attempt ${this.reconnectAttempts}/${maxAttempts})`);

      this._setState(StreamState.RECONNECTING, {
        attempt: this.reconnectAttempts,
        maxAttempts: maxAttempts,
        delayMs: delay
      });

      this._clearReconnectTimer();
      this.reconnectTimer = setTimeout(() => {
        if (!this.intentionalPause) {
          this._destroyHls();
          this.play().catch(err => {
            console.warn('[Akashvani] Auto-reconnect failed:', err);
          });
        }
      }, delay);
    }

    _clearReconnectTimer() {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    }

    _onPossibleCorsError() {
      console.warn('[Akashvani] Stream cannot be played due to CORS or browser network restrictions.');
      this._destroyHls();
      this._setState(StreamState.FALLBACK_REQUIRED, {
        message: 'Akashvani live stream cannot be connected directly from this browser.',
        portalUrl: this.config.officialPortalUrl
      });
    }

    // ------------------------------------------------------------------------
    // Web Audio Visualizer tap (Safely isolated)
    // ------------------------------------------------------------------------
    _ensureAudioContext() {
      if (this.hasAudioContext) {
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(() => {});
        }
        return;
      }

      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        this.audioContext = new AudioCtx();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.smoothingTimeConstant = 0.85;

        // Try connecting media element
        try {
          this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
          this.sourceNode.connect(this.analyser);
          this.analyser.connect(this.audioContext.destination);
          this.hasAudioContext = true;
        } catch (corsErr) {
          // If cross-origin restrictions prevent MediaElementSource,
          // the audio still plays directly via HTML5 Audio destination!
          console.log('[Akashvani] MediaElementSource visualizer tap deferred (cross-origin direct playback mode).');
        }
      } catch (e) {
        console.warn('[Akashvani] Web Audio context setup deferred:', e);
      }
    }

    getFrequencyData(targetArray) {
      if (this.analyser && this.hasAudioContext && this.state === StreamState.PLAYING) {
        try {
          this.analyser.getByteFrequencyData(targetArray);
          return true;
        } catch (e) {
          return false;
        }
      }
      return false;
    }
  }

  // Expose singleton service and state enum
  window.AkashvaniStream = AkashvaniService;
  window.AkashvaniState = StreamState;
  window.akashvaniService = new AkashvaniService();

})(window);
