/**
 * Agomoni - Main Application Orchestrator
 * Coordinates engines, countdown calculations, modal dialogs, and responsive UI interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Visual Simulation Engines (Silent Autoplay on load)
  const sheuli = new window.SheuliEngine('sheuliCanvas');
  const smoke = new window.SmokeEngine('smokeCanvas');

  // 2. Initialize Mahalaya Radio Player
  const player = new window.MahalayaPlayer();

  // 3. Countdown Status Pill (Dynamic live countdown)
  initCountdownPill();

  // 4. Header Actions & Modals
  initModals();

  // 5. Hero Quick Buttons
  initHeroButtons();

  // 6. Settings Controls
  initSettings(sheuli);
});

// --- Dynamic Countdown Calculation ---
function initCountdownPill() {
  const mahalayaCountdownEl = document.getElementById('mahalayaCountdown');
  const durgaPujoCountdownEl = document.getElementById('durgaPujoCountdown');

  // Ticking countdown calculation
  function updateTimers() {
    const now = new Date();
    // Default reference targets
    const mahalayaTarget = new Date(now.getFullYear(), 9, 10, 4, 0, 0); // Oct 10 4:00 AM
    const durgaPujoTarget = new Date(now.getFullYear(), 9, 15, 6, 0, 0); // Maha Shasthi

    let diffMahalaya = mahalayaTarget - now;
    if (diffMahalaya < 0) diffMahalaya = 4 * 86400000 + 5 * 3600000 + 43 * 60000; // Demo fallback

    let diffPujo = durgaPujoTarget - now;
    if (diffPujo < 0) diffPujo = 10 * 86400000 + 1 * 3600000;

    const mDays = Math.floor(diffMahalaya / (1000 * 60 * 60 * 24));
    const mHours = Math.floor((diffMahalaya / (1000 * 60 * 60)) % 24);
    const mMins = Math.floor((diffMahalaya / (1000 * 60)) % 60);

    const pDays = Math.floor(diffPujo / (1000 * 60 * 60 * 24));
    const pHours = Math.floor((diffPujo / (1000 * 60 * 60)) % 24);

    if (mahalayaCountdownEl) {
      mahalayaCountdownEl.textContent = `Mahalaya ${mDays}d ${mHours}h ${mMins}m`;
    }
    if (durgaPujoCountdownEl) {
      durgaPujoCountdownEl.textContent = `Durga Pujo ${pDays}d ${pHours}h`;
    }
  }

  updateTimers();
  setInterval(updateTimers, 60000);
}

// --- Modals (Playlists, Schedule, Settings, Notifications, Share) ---
function initModals() {
  const modalOverlay = document.getElementById('modalOverlay');
  const playlistsModal = document.getElementById('playlistsModal');
  const scheduleModal = document.getElementById('scheduleModal');
  const settingsModal = document.getElementById('settingsModal');
  const notifDropdown = document.getElementById('notifDropdown');

  const btnPlaylists = document.getElementById('btnPlaylists');
  const btnSchedule = document.getElementById('btnSchedule');
  const btnSettings = document.getElementById('btnSettings');
  const btnNotif = document.getElementById('btnNotif');
  const btnShare = document.getElementById('btnShare');
  const btnMute = document.getElementById('btnMute');

  const closeBtns = document.querySelectorAll('.modal-close, .btn-modal-close');

  function openModal(modal) {
    if (!modalOverlay || !modal) return;
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    modal.classList.add('active');
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modalOverlay) return;
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  closeBtns.forEach(btn => btn.addEventListener('click', closeModal));

  if (btnPlaylists) btnPlaylists.addEventListener('click', () => openModal(playlistsModal));
  if (btnSchedule) btnSchedule.addEventListener('click', () => openModal(scheduleModal));
  if (btnSettings) btnSettings.addEventListener('click', () => openModal(settingsModal));

  // Notifications Toggle
  if (btnNotif && notifDropdown) {
    btnNotif.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('active');
    });
    document.addEventListener('click', () => notifDropdown.classList.remove('active'));
  }

  // Fullscreen Button
  const btnFullscreen = document.getElementById('btnFullscreen');
  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.log(err));
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(err => console.log(err));
        }
      }
    });
    document.addEventListener('fullscreenchange', () => {
      btnFullscreen.classList.toggle('active', !!document.fullscreenElement);
      showToast(document.fullscreenElement ? 'পূর্ণপর্দা চালু (Full Screen Active)' : 'পূর্ণপর্দা বন্ধ (Full Screen Exited)');
    });
  }

  // Quick Mute / Sound Header Button
  if (btnMute) {
    let isMuted = false;
    btnMute.addEventListener('click', () => {
      isMuted = !isMuted;
      if (window.dhakEngine) {
        window.dhakEngine.setVolume(isMuted ? 0 : 0.38);
      }
      btnMute.classList.toggle('muted', isMuted);
      showToast(isMuted ? 'নিঃশব্দ (Muted)' : 'শব্দ চালু (Unmuted)');
    });
  }

  // Share action with toast feedback
  if (btnShare) {
    btnShare.addEventListener('click', async () => {
      const shareData = {
        title: 'মহিষাসুরমর্দিনী - মহালয়ার পুণ্য প্রভাত',
        text: 'মহালয়ার পুণ্য প্রভাতে মহিষাসুরমর্দিনী ও ঢাকের আবহ শুনুন।',
        url: window.location.href
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
          return;
        } catch (e) {
          // fallback to clipboard
        }
      }

      navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('✨ লিঙ্ক কপি করা হয়েছে! শুভ মহালয়া।');
      }).catch(() => {
        showToast('✨ আগমনী - মহালয়া অভিজ্ঞতা');
      });
    });
  }
}

// --- Hero Action Buttons ---
function initHeroButtons() {
  const btnDhakHero = document.getElementById('btnDhakHero');
  if (btnDhakHero) {
    btnDhakHero.addEventListener('click', () => {
      if (window.dhakEngine) {
        const isPlaying = window.dhakEngine.toggle();
        btnDhakHero.classList.toggle('active', isPlaying);
      }
    });
  }
}

// --- Settings Controls ---
function initSettings(sheuli) {
  // Sheuli Density
  const densityBtns = document.querySelectorAll('.density-btn');
  densityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      densityBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = btn.getAttribute('data-density');
      if (sheuli) sheuli.setDensity(val);
      showToast(`শিউলি ফুলের ঘনত্ব: ${btn.textContent.trim()}`);
    });
  });

  // Dhak Volume Slider
  const dhakVolSlider = document.getElementById('dhakVolumeSlider');
  if (dhakVolSlider && window.dhakEngine) {
    dhakVolSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      window.dhakEngine.setVolume(val);
    });
  }

  // God-rays Toggle
  const toggleGodRays = document.getElementById('toggleGodRays');
  const godRaysEl = document.querySelector('.god-rays-overlay');
  if (toggleGodRays && godRaysEl) {
    toggleGodRays.addEventListener('change', (e) => {
      godRaysEl.style.display = e.target.checked ? 'block' : 'none';
    });
  }
}

// --- Toast System ---
function showToast(message) {
  let toast = document.getElementById('appToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appToast';
    toast.className = 'app-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast.hideTimeout);
  toast.hideTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

window.showToast = showToast;
