/**
 * Agomoni - Sacred Incense (Dhoop/Agarbatti) Smoke Engine
 * Simulates gentle, curling, translucent smoke rising from the vintage
 * brass incense burner on the studio table. Soft, peaceful, meditative.
 */

class SmokeEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.isRunning = false;
    this.lastTime = performance.now();
    this.spawnTimer = 0;
    this.spawnInterval = 0.08; // smooth continuous emission

    if (this.canvas) {
      this.init();
    }
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
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

  getEmberPosition() {
    // Exact relative coordinate of the incense stick tips:
    // x = 8.6% of width, y = 63.9% of height in 1024x576 base artwork
    return {
      x: this.width * 0.086,
      y: this.height * 0.639
    };
  }

  createParticle() {
    const origin = this.getEmberPosition();
    return {
      x: origin.x + (Math.random() - 0.5) * 4,
      y: origin.y + (Math.random() - 0.5) * 3,
      baseX: origin.x,
      age: 0,
      lifespan: 5.5 + Math.random() * 2.5, // 5.5 - 8.0 seconds
      speedY: -(18 + Math.random() * 12), // slow upward drift
      curlFreq: 1.2 + Math.random() * 0.8,
      curlAmp: 8 + Math.random() * 14,
      curlPhase: Math.random() * Math.PI * 2,
      driftRight: 3 + Math.random() * 4, // slight ambient room draft rightward
      initialRadius: 2.2,
      maxRadius: 14 + Math.random() * 8
    };
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
    // Particle spawner
    this.spawnTimer += dt;
    while (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer -= this.spawnInterval;
      this.particles.push(this.createParticle());
    }

    // Update active particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += dt;

      if (p.age >= p.lifespan) {
        this.particles.splice(i, 1);
        continue;
      }

      // Vertical ascent
      p.y += p.speedY * dt;

      // Natural atmospheric curling physics:
      // Compound sine waves for curling incense ribbons
      p.curlPhase += p.curlFreq * dt;
      const curlOffset = Math.sin(p.curlPhase) * p.curlAmp * (0.3 + p.age * 0.4);
      const roomDraft = p.driftRight * p.age; // slow rightward bias
      p.x = p.baseX + curlOffset + roomDraft;
    }
  }

  render() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw glowing amber ember at the tip of the incense stick
    const origin = this.getEmberPosition();
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(origin.x, origin.y, 1.8, 0, Math.PI * 2);
    const emberGrad = this.ctx.createRadialGradient(origin.x, origin.y, 0, origin.x, origin.y, 4);
    emberGrad.addColorStop(0, 'rgba(255, 120, 30, 0.9)');
    emberGrad.addColorStop(0.5, 'rgba(255, 60, 0, 0.5)');
    emberGrad.addColorStop(1, 'rgba(255, 60, 0, 0)');
    this.ctx.fillStyle = emberGrad;
    this.ctx.shadowColor = '#ff6000';
    this.ctx.shadowBlur = 6;
    this.ctx.fill();
    this.ctx.restore();

    // Render smoke wisps
    if (this.particles.length < 2) return;

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'screen';

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const progress = p.age / p.lifespan;

      // Smooth bell curve opacity: rises quickly, fades out gradually
      let alpha = 0;
      if (progress < 0.18) {
        alpha = (progress / 0.18) * 0.32;
      } else {
        alpha = Math.max(0, (1 - (progress - 0.18) / 0.82) * 0.32);
      }

      // Expanding radius as smoke ascends and diffuses
      const currentRadius = p.initialRadius + (p.maxRadius - p.initialRadius) * progress;

      const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentRadius);
      grad.addColorStop(0, `rgba(246, 238, 225, ${alpha * 0.9})`);
      grad.addColorStop(0.4, `rgba(235, 222, 204, ${alpha * 0.5})`);
      grad.addColorStop(1, 'rgba(220, 205, 185, 0)');

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = grad;
      this.ctx.fill();
    }

    this.ctx.restore();
  }
}

window.SmokeEngine = SmokeEngine;
