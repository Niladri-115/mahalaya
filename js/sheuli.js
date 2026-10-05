/**
 * Agomoni - Sheuli (Shiuli) Flower & Autumn Petal Shower Engine
 * Simulates a serene, continuous autumn shower of Bengali Sheuli flowers
 * (Nyctanthes arbor-tristis: pure white star petals with vivid saffron-orange tube centers)
 * with 3D tumbling, gentle autumn wind drift, table landing, and seamless looping.
 */

class SheuliEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.flowers = [];
    this.maxFlowers = 34; // Peaceful low-to-medium density
    this.isRunning = false;
    this.lastTime = performance.now();
    this.wind = 0;
    this.windTarget = 0;
    this.windTimer = 0;
    this.densityMultiplier = 1.0;

    // Cache pre-rendered flower sprites for pristine rendering and 60fps performance
    this.spriteFlower = null;
    this.spritePetal = null;

    if (this.canvas) {
      this.init();
    }
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.createSprites();
    this.populateFlowers();
    this.start();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    if (this.ctx) {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  createSprites() {
    // 1. Offscreen Sprite for Full Sheuli Flower
    const fCanvas = document.createElement('canvas');
    fCanvas.width = 64;
    fCanvas.height = 64;
    const fCtx = fCanvas.getContext('2d');
    const cx = 32, cy = 32;

    // Draw 5-6 delicate white rounded petals
    const petalCount = 6;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i * 2 * Math.PI) / petalCount;
      fCtx.save();
      fCtx.translate(cx, cy);
      fCtx.rotate(angle);

      // Petal shape
      fCtx.beginPath();
      fCtx.moveTo(0, 0);
      fCtx.bezierCurveTo(-5, -10, -9, -18, 0, -24);
      fCtx.bezierCurveTo(9, -18, 5, -10, 0, 0);

      const grad = fCtx.createLinearGradient(0, 0, 0, -24);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.7, '#faf8f5');
      grad.addColorStop(1, '#f2ede4');
      fCtx.fillStyle = grad;
      fCtx.shadowColor = 'rgba(0,0,0,0.15)';
      fCtx.shadowBlur = 3;
      fCtx.fill();
      fCtx.restore();
    }

    // Sheuli signature bright saffron / orange-coral center
    fCtx.save();
    fCtx.translate(cx, cy);
    fCtx.beginPath();
    fCtx.arc(0, 0, 4.2, 0, Math.PI * 2);
    const centerGrad = fCtx.createRadialGradient(0, 0, 0.5, 0, 0, 4.5);
    centerGrad.addColorStop(0, '#ff4b00'); // vivid vermillion core
    centerGrad.addColorStop(0.7, '#ff6a00');
    centerGrad.addColorStop(1, '#ff8c00');
    fCtx.fillStyle = centerGrad;
    fCtx.shadowColor = 'rgba(255, 106, 0, 0.5)';
    fCtx.shadowBlur = 4;
    fCtx.fill();
    fCtx.restore();

    this.spriteFlower = fCanvas;

    // 2. Offscreen Sprite for Single Delicate Sheuli Petal
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 36;
    pCanvas.height = 36;
    const pCtx = pCanvas.getContext('2d');
    pCtx.save();
    pCtx.translate(18, 18);
    pCtx.beginPath();
    pCtx.moveTo(0, 10);
    pCtx.bezierCurveTo(-5, 4, -8, -6, 0, -12);
    pCtx.bezierCurveTo(8, -6, 5, 4, 0, 10);
    const pGrad = pCtx.createLinearGradient(0, 10, 0, -12);
    pGrad.addColorStop(0, '#ff7011'); // orange base
    pGrad.addColorStop(0.25, '#fff6ed');
    pGrad.addColorStop(1, '#ffffff');
    pCtx.fillStyle = pGrad;
    pCtx.shadowColor = 'rgba(0,0,0,0.12)';
    pCtx.shadowBlur = 2;
    pCtx.fill();
    pCtx.restore();

    this.spritePetal = pCanvas;
  }

  populateFlowers() {
    this.flowers = [];
    const count = Math.floor(this.maxFlowers * this.densityMultiplier);
    for (let i = 0; i < count; i++) {
      const flower = this.createFlower(true);
      this.flowers.push(flower);
    }
  }

  createFlower(randomInitialY = false) {
    const isPetal = Math.random() < 0.35; // 35% single petals, 65% whole flowers
    const scale = isPetal ? (0.45 + Math.random() * 0.35) : (0.35 + Math.random() * 0.38);

    return {
      isPetal: isPetal,
      x: Math.random() * (this.width || 800),
      y: randomInitialY ? Math.random() * (this.height || 500) : -40 - Math.random() * 60,
      scale: scale,
      baseSpeedY: 22 + Math.random() * 24, // 22-46 px/s gentle drift
      speedY: 22 + Math.random() * 24,
      driftFreq: 0.8 + Math.random() * 1.4,
      driftAmp: 18 + Math.random() * 28,
      phase: Math.random() * Math.PI * 2,
      // 3D rotation angles & velocities
      rotZ: Math.random() * Math.PI * 2,
      vRotZ: (Math.random() - 0.5) * 1.2,
      rotX: Math.random() * Math.PI * 2,
      vRotX: (Math.random() - 0.5) * 1.5,
      rotY: Math.random() * Math.PI * 2,
      vRotY: (Math.random() - 0.5) * 1.3,
      // Opacity
      opacity: 0.75 + Math.random() * 0.25,
      // Landing state
      canLand: Math.random() < 0.18, // subset that can land on table
      isLanded: false,
      landedTimer: 0,
      landedDuration: 7 + Math.random() * 5, // rest for 7-12s
      landY: 0
    };
  }

  setDensity(level) {
    // level: 'subtle' (0.6), 'normal' (1.0), 'lush' (1.5)
    if (level === 'subtle') this.densityMultiplier = 0.6;
    else if (level === 'lush') this.densityMultiplier = 1.5;
    else this.densityMultiplier = 1.0;
    this.populateFlowers();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop() {
    this.isRunning = false;
  }

  loop() {
    if (!this.isRunning) return;
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.update(dt);
    this.render();

    requestAnimationFrame(() => this.loop());
  }

  update(dt) {
    // Dynamic soft autumn breeze modulation
    this.windTimer += dt;
    if (this.windTimer > 4.5) {
      this.windTimer = 0;
      this.windTarget = (Math.random() - 0.3) * 15; // slight rightward bias
    }
    this.wind += (this.windTarget - this.wind) * dt * 0.8;

    const tableTop = this.height * 0.83; // approx table level
    const tableBottom = this.height * 0.96;

    for (let i = 0; i < this.flowers.length; i++) {
      const f = this.flowers[i];

      if (f.isLanded) {
        // Resting peacefully on table
        f.landedTimer += dt;
        if (f.landedTimer > f.landedDuration - 2.0) {
          // Fade out smoothly over last 2 seconds
          const fadeProgress = (f.landedTimer - (f.landedDuration - 2.0)) / 2.0;
          f.opacity = Math.max(0, (1 - fadeProgress) * 0.85);
        }
        if (f.landedTimer >= f.landedDuration) {
          // Recycle flower back to top
          Object.assign(f, this.createFlower(false));
        }
        continue;
      }

      // Check if it should land on table
      if (f.canLand && f.y >= tableTop && f.y <= tableBottom && !f.isLanded) {
        // Softly settle
        f.isLanded = true;
        f.landY = f.y;
        f.landedTimer = 0;
        f.opacity = 0.85;
        continue;
      }

      // Descending movement
      f.phase += f.driftFreq * dt;
      const sway = Math.sin(f.phase) * f.driftAmp;
      f.x += (sway * 0.4 + this.wind) * dt;
      f.y += f.speedY * dt;

      // 3D rotation update
      f.rotZ += f.vRotZ * dt;
      f.rotX += f.vRotX * dt;
      f.rotY += f.vRotY * dt;

      // Wrap horizontal bounds smoothly
      if (f.x < -40) f.x = this.width + 30;
      if (f.x > this.width + 40) f.x = -30;

      // Reset when falling beyond frame bottom
      if (f.y > this.height + 40) {
        Object.assign(f, this.createFlower(false));
      }
    }
  }

  render() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.flowers.length; i++) {
      const f = this.flowers[i];
      if (f.opacity <= 0.01) continue;

      this.ctx.save();
      this.ctx.translate(f.x, f.isLanded ? f.landY : f.y);

      // 3D perspective simulated via non-uniform scale + rotation
      const cosX = Math.cos(f.rotX);
      const cosY = Math.cos(f.rotY);
      const scaleX = f.scale * (0.4 + 0.6 * Math.abs(cosY));
      const scaleY = f.scale * (0.4 + 0.6 * Math.abs(cosX));

      this.ctx.scale(scaleX, scaleY);
      this.ctx.rotate(f.rotZ);
      this.ctx.globalAlpha = f.opacity;

      const sprite = f.isPetal ? this.spritePetal : this.spriteFlower;
      if (sprite) {
        const offset = sprite.width / 2;
        this.ctx.drawImage(sprite, -offset, -offset);
      }

      this.ctx.restore();
    }
  }
}

window.SheuliEngine = SheuliEngine;
