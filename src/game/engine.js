import Matter from 'matter-js';
import { generatePlayerSVG, generateShoeSVG, generateBallSVG, generateGoalSVG, normalizeMapType } from '../utils/svgGenerator';

const { Engine, Render, Runner, Composite, Bodies, Body, Events, Vector, Constraint } = Matter;

export const GAME_WIDTH = 1200;
export const GAME_HEIGHT = 750;
// Proportional Ground Line: 77.9% of height (584px) so players, goals, and ball dominate the screen
export const GROUND_Y = Math.round(GAME_HEIGHT * 0.779); 

export class GameEngine {
  setPaused(isPaused) {
    this.isPaused = isPaused;
    if (this.runner) {
      this.runner.enabled = !isPaused;
    }
  }

  constructor(canvas, onScore, p1Custom, p2Custom, envCustom, eventMode = 'classic', isSinglePlayer = false, onSkillUsed = null) {
    this.eventMode = eventMode;
    this.isSinglePlayer = isSinglePlayer;
    this.engine = Engine.create();
    this.onScore = onScore;
    this.onSkillUsed = onSkillUsed;
    this.p1Custom = p1Custom;
    this.p2Custom = p2Custom;

    // Alevli Roket Şut Mekaniği (Maç başı maksimum 2 kullanım, 5 saniye vurma hakkı)
    this.p1FireShots = 2;
    this.p2FireShots = 2;
    this.p1FireBuffTimer = 0; // 5 saniyelik alevli vurma hakkı sayacı
    this.p2FireBuffTimer = 0;
    this.isFireShotActive = false;
    this.fireShotTimer = 0;
    this.fireShotShooter = null;
    this.screenShake = 0;
    this.fireParticles = [];

    // Buz Tuzağı Mekaniği (E / Ğ tuşu, 5 saniye dondurma, 5 şut ile kırma, maç başı 2 kullanım)
    this.p1FreezeCharges = 2;
    this.p2FreezeCharges = 2;
    this.p1FreezeTimer = 0; // 300 frame = 5 saniye
    this.p2FreezeTimer = 0;
    this.p1BreakCount = 0; // 0..5 kırma vuruşu
    this.p2BreakCount = 0;
    this.MAX_ICE_BREAKS = 5;
    this.iceParticles = [];

    // 🧱 Kale Kalkanı Mekaniği (Z / Ö tuşları, 5 saniye veya 1 şutta parçalanma, 2 hak)
    this.p1ShieldCharges = 2;
    this.p2ShieldCharges = 2;
    this.p1ShieldTimer = 0;
    this.p2ShieldTimer = 0;
    this.p1ShieldBody = null;
    this.p2ShieldBody = null;

    // 🍄 Dev Kafa / Dev Karakter Mekaniği (X / Ç tuşları, 5 saniye devleşme, 2 hak)
    this.p1GiantCharges = 2;
    this.p2GiantCharges = 2;
    this.p1GiantTimer = 0;
    this.p2GiantTimer = 0;
    this.p1IsGiant = false;
    this.p2IsGiant = false;
    
    // Tok ve ağır top için gerçekçi yüksek yerçekimi
    this.engine.world.gravity.y = this.eventMode === 'moon' ? 1.2 : 3.8;
    
    // High DPI Retina Crisp Render
    const pixelRatio = Math.max(2, window.devicePixelRatio || 1);

    this.render = Render.create({
      canvas: canvas,
      engine: this.engine,
      options: {
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        pixelRatio: pixelRatio,
        wireframes: false,
        background: 'transparent'
      }
    });

    this.keys = {};
    this.aiKeys = { left: false, right: false, jump: false, kick: false };
    
    this.setupWorld(p1Custom, p2Custom, envCustom);
    this.setupControls();
    
    this.runner = Runner.create();
    Runner.run(this.runner, this.engine);
    Render.run(this.render);
    
    Events.on(this.engine, 'beforeUpdate', () => this.update());

    // Dynamic 3D Ground Drop Shadows & Ball Spin Render
    Events.on(this.render, 'afterRender', () => this.render3DEffects());
    
    // Gerçekçi Tok Kafa & Direk Çarpmaları
    Events.on(this.engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        const isBallA = bodyA === this.ball;
        const isBallB = bodyB === this.ball;
        
        if (isBallA || isBallB) {
          const ballBody = isBallA ? bodyA : bodyB;
          const otherBody = isBallA ? bodyB : bodyA;

          // 🧱 Kale Kalkanına Top Çarpması (1. Şutta Kalkan Topu Sektirip Parçalanır!)
          if (otherBody === this.p1ShieldBody) {
            this.shatterShield(1);
            return;
          }
          if (otherBody === this.p2ShieldBody) {
            this.shatterShield(2);
            return;
          }

          // Kafa veya Ayak Teması Kontrolü (Alevli Güç Vurma Hakkı)
          const hitPlayerNum = (otherBody === this.p1.head || otherBody === this.p1.shoe) ? 1 : 
                               (otherBody === this.p2.head || otherBody === this.p2.shoe) ? 2 : 0;
          if (hitPlayerNum === 1 && this.p1FireBuffTimer > 0) {
            this.executeRocketShot(1);
            return;
          }
          if (hitPlayerNum === 2 && this.p2FireBuffTimer > 0) {
            this.executeRocketShot(2);
            return;
          }

          // Alevli Roket Şut Havada Uçarken Çarpışma Kontrolleri
          if (this.isFireShotActive) {
            const isOpponent = (this.fireShotShooter === 1 && (otherBody === this.p2.head || otherBody === this.p2.shoe)) ||
                               (this.fireShotShooter === 2 && (otherBody === this.p1.head || otherBody === this.p1.shoe));
            if (isOpponent) {
              const knockDir = this.fireShotShooter === 1 ? 1 : -1;
              Body.setVelocity(otherBody, { x: knockDir * 28, y: -14 });
              this.screenShake = 25;
              for (let i = 0; i < 22; i++) {
                this.fireParticles.push({
                  x: ballBody.position.x,
                  y: ballBody.position.y,
                  vx: (Math.random() - 0.5) * 20 + knockDir * 10,
                  vy: (Math.random() - 0.5) * 20 - 7,
                  size: Math.random() * 12 + 6,
                  life: 1.0,
                  decay: 0.04,
                  color: ['#ffffff', '#ffeb3b', '#ff5722', '#f44336'][Math.floor(Math.random() * 4)]
                });
              }
            }
            // Roket şutun aşırı yüksek hızını asla normal kafa vuruşu ile kesme!
            if (otherBody === this.p1.head || otherBody === this.p2.head || otherBody === this.p1.shoe || otherBody === this.p2.shoe) {
              return;
            }
          }

          // Normal Tok Kafa Vuruşu Mechanic
          if (otherBody === this.p1.head || otherBody === this.p2.head) {
            const playerVel = otherBody.velocity;
            const dx = ballBody.position.x - otherBody.position.x;
            const dy = ballBody.position.y - otherBody.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            const kickVx = (dx / dist) * 14 + playerVel.x * 0.65;
            const kickVy = (dy / dist) * 12 + playerVel.y * 0.5 - 4;

            Body.setVelocity(ballBody, {
              x: Math.max(-26, Math.min(26, kickVx)),
              y: Math.max(-24, Math.min(20, kickVy))
            });

            Body.setAngularVelocity(ballBody, (dx > 0 ? 0.35 : -0.35));
          } else if (
            otherBody === this.leftTop || 
            otherBody === this.leftFrontPost
          ) {
            if (this.isFireShotActive && this.fireShotShooter === 2) {
              // P2 sola attığında direğe çarparsa içeri doğru kavis alıp gol olsun
              Body.setVelocity(ballBody, { x: -Math.abs(ballBody.velocity.x) * 0.75 - 12, y: 14 });
            } else {
              Body.setVelocity(ballBody, { x: Math.abs(ballBody.velocity.x) * 0.85 + 5, y: -Math.abs(ballBody.velocity.y) * 0.65 - 5 });
            }
            Body.setAngularVelocity(ballBody, 0.45);
          } else if (
            otherBody === this.rightTop || 
            otherBody === this.rightFrontPost
          ) {
            if (this.isFireShotActive && this.fireShotShooter === 1) {
              // P1 sağa attığında direğe çarparsa içeri doğru kavis alıp gol olsun
              Body.setVelocity(ballBody, { x: Math.abs(ballBody.velocity.x) * 0.75 + 12, y: 14 });
            } else {
              Body.setVelocity(ballBody, { x: -Math.abs(ballBody.velocity.x) * 0.85 - 5, y: -Math.abs(ballBody.velocity.y) * 0.65 - 5 });
            }
            Body.setAngularVelocity(ballBody, -0.45);
          } else if (otherBody.label === 'bouncyObstacle') {
            const dx = ballBody.position.x - otherBody.position.x;
            const dy = ballBody.position.y - otherBody.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const bounceSpeed = 28;
            
            const normX = dx / dist;
            let normY = dy / dist;
            if (Math.abs(normY) < 0.25) normY = normY < 0 ? -0.35 : 0.35;

            Body.setVelocity(ballBody, { 
              x: normX * bounceSpeed, 
              y: normY * bounceSpeed 
            });

            this.screenShake = Math.max(this.screenShake, 7);

            // Bumper vurulduğunda neon kıvılcım patlaması
            const sparkColor = otherBody.customVisual?.glow || '#06b6d4';
            for (let i = 0; i < 12; i++) {
              this.fireParticles.push({
                x: ballBody.position.x,
                y: ballBody.position.y,
                vx: normX * 12 + (Math.random() - 0.5) * 12,
                vy: normY * 12 + (Math.random() - 0.5) * 12,
                size: Math.random() * 8 + 4,
                life: 0.8,
                decay: 0.05,
                color: [sparkColor, '#ffffff', '#38bdf8'][Math.floor(Math.random() * 3)]
              });
            }
          }
        }
      });
    });

    Events.on(this.engine, 'beforeUpdate', () => {
      // Anti-Stuck Guardian System (Top Asla Havada/Engelde Sıkışamaz)
      if (this.ball && this.obstacles && this.obstacles.length > 0) {
        const ballPos = this.ball.position;
        const ballVel = this.ball.velocity;
        const ballSpeed = Math.hypot(ballVel.x, ballVel.y);

        // Eğer top zeminden yukarıda (havada) ve neredeyse hareketsizse (engeller üzerinde veya arasında takılmışsa)
        if (ballPos.y < GROUND_Y - 90 && ballSpeed < 0.8) {
          this.ballStuckFrames = (this.ballStuckFrames || 0) + 1;
          if (this.ballStuckFrames > 16) { // ~0.27 saniyede hemen serbest bırak!
            const nudgeX = ballPos.x < GAME_WIDTH / 2 ? 8.5 : -8.5;
            Body.setVelocity(this.ball, { x: nudgeX, y: 7.0 });
            Body.setAngularVelocity(this.ball, nudgeX > 0 ? 0.3 : -0.3);
            this.ballStuckFrames = 0;
          }
        } else {
          this.ballStuckFrames = 0;
        }
      }

      // Alevli roket şut aktifken hiçbir sürtünme veya yavaşlatma uygulanmaz
      if (this.isFireShotActive) return;

      // Dribbling Damping Logic:
      // When the ball is on the ground, dampen its horizontal velocity artificially.
      // This ensures that when the player runs into it, it doesn't fly away, but rather rolls slowly!
      if (this.ball && this.ball.position.y > GROUND_Y - this.ballRadius - 10) {
        if (Math.abs(this.ball.velocity.x) > 1.5) {
          Body.setVelocity(this.ball, {
            x: this.ball.velocity.x * 0.93, // Strong ground damping
            y: this.ball.velocity.y
          });
          Body.setAngularVelocity(this.ball, this.ball.angularVelocity * 0.93);
        }
      }
    });
  }

  render3DEffects() {
    const ctx = this.render.context;
    if (!ctx) return;

    ctx.save();

    // Screen Shake Effect
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
      this.screenShake *= 0.84;
      if (this.screenShake < 0.4) this.screenShake = 0;
    }

    // --- Stadyum Engellerinin Yüksek Kalitede Çizimi (Neon & Stadyum Aparatları) ---
    if (this.obstacles && this.obstacles.length > 0) {
      const now = Date.now();
      const pulse = Math.sin(now * 0.005) * 2;

      this.obstacles.forEach((obs) => {
        if (!obs.customVisual) return;
        const { type, color, glow, icon, width, height, size } = obs.customVisual;
        const pos = obs.position;

        ctx.save();

        // 1. Tavandan İnen Çelik Taşıyıcı Halatlar
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        if (type === 'circle') {
          ctx.moveTo(pos.x, 0);
          ctx.lineTo(pos.x, pos.y);
        } else {
          const halfW = (width || 100) * 0.38;
          ctx.moveTo(pos.x - halfW, 0);
          ctx.lineTo(pos.x - halfW, pos.y);
          ctx.moveTo(pos.x + halfW, 0);
          ctx.lineTo(pos.x + halfW, pos.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // 2. Obstacle Gövdesi
        if (type === 'circle') {
          const r = obs.circleRadius || 40;
          ctx.shadowBlur = 18;
          ctx.shadowColor = glow || color;

          ctx.beginPath();
          ctx.arc(pos.x, pos.y, r + pulse, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 3.5;
          ctx.stroke();

          const grad = ctx.createRadialGradient(pos.x, pos.y, 2, pos.x, pos.y, r);
          grad.addColorStop(0, '#1e293b');
          grad.addColorStop(0.7, '#0f172a');
          grad.addColorStop(1, '#020617');
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(pos.x, pos.y, r * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = glow || color;
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(icon || '⚡', pos.x, pos.y + 1);

        } else if (type === 'diamond') {
          const s = (size || 85) * 0.5;
          ctx.translate(pos.x, pos.y);
          ctx.rotate(obs.angle || 0);

          ctx.shadowBlur = 18;
          ctx.shadowColor = glow || color;

          ctx.beginPath();
          ctx.rect(-s, -s, s * 2, s * 2);
          ctx.fillStyle = '#0f172a';
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 3.5;
          ctx.stroke();

          ctx.beginPath();
          ctx.rect(-s * 0.45, -s * 0.45, s * 0.9, s * 0.9);
          ctx.fillStyle = glow || color;
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('💎', 0, 1);

        } else {
          // Platform
          const w = width || 200;
          const h = height || 22;
          ctx.translate(pos.x, pos.y);
          ctx.rotate(obs.angle || 0);

          ctx.shadowBlur = 16;
          ctx.shadowColor = glow || color;

          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(-w / 2, -h / 2, w, h, 8);
          } else {
            ctx.rect(-w / 2, -h / 2, w, h);
          }
          const platGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
          platGrad.addColorStop(0, '#1e293b');
          platGrad.addColorStop(1, '#0f172a');
          ctx.fillStyle = platGrad;
          ctx.fill();

          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.strokeStyle = glow || color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-w / 2 + 14, 0);
          ctx.lineTo(w / 2 - 14, 0);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-w / 2 + 10, 0, 3, 0, Math.PI * 2);
          ctx.arc(w / 2 - 10, 0, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });
    }

    const drawShadow = (body, baseRadiusX, baseRadiusY) => {
      if (!body) return;
      const posY = body.position.y;
      const posX = body.position.x;
      
      const heightAboveGround = Math.max(0, GROUND_Y - posY);
      const scale = Math.max(0.25, 1 - heightAboveGround / 400);
      const opacity = Math.max(0.05, 0.48 - heightAboveGround / 500);

      ctx.beginPath();
      ctx.ellipse(posX, GROUND_Y - 2, baseRadiusX * scale, baseRadiusY * scale, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(15, 23, 42, ${opacity})`;
      ctx.fill();
    };

    drawShadow(this.ball, (this.ballRadius || 28) * 1.1, 12);
    drawShadow(this.p1?.head, 52, 16);
    drawShadow(this.p1?.shoe, 36, 10);
    drawShadow(this.p2?.head, 52, 16);
    drawShadow(this.p2?.shoe, 36, 10);

    // --- Ball Cloud Trail Effect ("Top İzi Bulutları") ---
    if (!this.ballTrail) this.ballTrail = [];
    
    // Add particle if ball is moving fast enough
    if (this.ball && this.ball.speed > 3) {
      if (this.engine.timing.frame % 2 === 0) { // Every other frame
        this.ballTrail.push({
          x: this.ball.position.x,
          y: this.ball.position.y + this.ballRadius * 0.7, // Bottom portion of the ball
          life: 1.0,
          size: Math.random() * 5 + 4, // 4 to 9px cloud puffs
          vx: -this.ball.velocity.x * 0.1, // Slight drift in opposite direction
          vy: -this.ball.velocity.y * 0.1
        });
      }
    }
    
    // Update and draw particles
    for (let i = this.ballTrail.length - 1; i >= 0; i--) {
      let p = this.ballTrail[i];
      p.life -= 0.05;
      p.x += p.vx;
      p.y += p.vy - 0.4; // Float up like dust/cloud
      p.size += 0.2; // Expand slightly
      
      if (p.life <= 0) {
        this.ballTrail.splice(i, 1);
        continue;
      }
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(226, 232, 240, ${p.life * 0.5})`; // Slate-200 color with fading opacity
      ctx.fill();
    }

    // --- Alevli Roket Şut Görsel Efektleri ---
    if (this.isFireShotActive && this.ball) {
      this.fireShotTimer--;
      if (this.fireShotTimer <= 0) {
        this.isFireShotActive = false;
      }

      // Her karede geriye doğru fırlayan alev partikülleri üret
      for (let i = 0; i < 5; i++) {
        this.fireParticles.push({
          x: this.ball.position.x + (Math.random() - 0.5) * (this.ballRadius * 0.9),
          y: this.ball.position.y + (Math.random() - 0.5) * (this.ballRadius * 0.9),
          vx: -this.ball.velocity.x * 0.22 + (Math.random() - 0.5) * 5,
          vy: -this.ball.velocity.y * 0.15 - Math.random() * 4,
          size: Math.random() * 12 + 6,
          life: 1.0,
          decay: Math.random() * 0.04 + 0.03,
          color: ['#ffffff', '#fef08a', '#fb923c', '#f87171', '#ef4444'][Math.floor(Math.random() * 5)]
        });
      }

      // Topun çevresinde akkor alev aurası
      const aura = ctx.createRadialGradient(
        this.ball.position.x, this.ball.position.y, this.ballRadius * 0.3,
        this.ball.position.x, this.ball.position.y, this.ballRadius * 1.9
      );
      aura.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      aura.addColorStop(0.25, 'rgba(254, 240, 138, 0.85)');
      aura.addColorStop(0.6, 'rgba(249, 115, 22, 0.6)');
      aura.addColorStop(0.85, 'rgba(239, 68, 68, 0.3)');
      aura.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      ctx.arc(this.ball.position.x, this.ball.position.y, this.ballRadius * 1.9, 0, Math.PI * 2);
      ctx.fillStyle = aura;
      ctx.fill();
      ctx.restore();
    }

    // Alev parçacıklarını çiz ve güncelle (Akkor parıltı)
    if (this.fireParticles && this.fireParticles.length > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = this.fireParticles.length - 1; i >= 0; i--) {
        const p = this.fireParticles[i];
        p.life -= p.decay;
        p.x += p.vx;
        p.y += p.vy;
        p.size *= 0.95;

        if (p.life <= 0 || p.size < 0.5) {
          this.fireParticles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fill();
      }
      ctx.restore();
    }

    // Buz Kırılma ve Kristal Parçacıklarının Çizimi
    if (this.iceParticles.length > 0) {
      ctx.save();
      for (let i = this.iceParticles.length - 1; i >= 0; i--) {
        const p = this.iceParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // Yerçekimi
        p.rot = (p.rot || 0) + (p.vRot || 0.05);
        p.life -= p.decay;

        if (p.life <= 0) {
          this.iceParticles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;

        ctx.beginPath();
        if (p.shape === 'diamond') {
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size * 0.65, 0);
          ctx.lineTo(0, p.size);
          ctx.lineTo(-p.size * 0.65, 0);
        } else {
          // Keskin cam/buz parçası üçgeni
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size * 0.5, p.size * 0.85);
          ctx.lineTo(-p.size * 0.35, p.size * 0.5);
        }
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
      }
      ctx.restore();
    }

    // Oyuncu Alevli Güç Modu Görseli (5 saniye boyunca oyuncunun üstünde parlayan alevler)
    const drawPlayerFlames = (player) => {
      if (!player || !player.head || !player.shoe) return;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // Baş aurası
      const headAura = ctx.createRadialGradient(
        player.head.position.x, player.head.position.y, 10,
        player.head.position.x, player.head.position.y, 65
      );
      headAura.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      headAura.addColorStop(0.3, 'rgba(254, 240, 138, 0.7)');
      headAura.addColorStop(0.7, 'rgba(249, 115, 22, 0.4)');
      headAura.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.beginPath();
      ctx.arc(player.head.position.x, player.head.position.y, 65, 0, Math.PI * 2);
      ctx.fillStyle = headAura;
      ctx.fill();

      // Krampon aurası
      const shoeAura = ctx.createRadialGradient(
        player.shoe.position.x, player.shoe.position.y, 5,
        player.shoe.position.x, player.shoe.position.y, 45
      );
      shoeAura.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      shoeAura.addColorStop(0.4, 'rgba(249, 115, 22, 0.6)');
      shoeAura.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.beginPath();
      ctx.arc(player.shoe.position.x, player.shoe.position.y, 45, 0, Math.PI * 2);
      ctx.fillStyle = shoeAura;
      ctx.fill();

      ctx.restore();
    };

    if (this.p1FireBuffTimer > 0) drawPlayerFlames(this.p1);
    if (this.p2FireBuffTimer > 0) drawPlayerFlames(this.p2);

    // Buz Kütlesi, Giderek Büyüyen Çatlaklar ve Üst Bilgi Rozeti Çizimi
    const drawIceBlock = (player, breakCount, isP1) => {
      if (!player || !player.head || !player.shoe) return;
      const hx = player.head.position.x;
      const hy = player.head.position.y;
      const sx = player.shoe.position.x;
      const sy = player.shoe.position.y;

      const centerX = (hx + sx) / 2;
      const centerY = (hy + sy) / 2 - 4;
      const blockW = 125;
      const blockH = 175;

      ctx.save();

      // 1. Buz Işıltısı ve Dış Aura (Glow)
      const glowGrad = ctx.createRadialGradient(centerX, centerY, 30, centerX, centerY, 110);
      glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      glowGrad.addColorStop(0.7, 'rgba(14, 165, 233, 0.2)');
      glowGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 110, 0, Math.PI * 2);
      ctx.fill();

      // 2. Yarı Saydam Buz Kristal Bloğu
      ctx.beginPath();
      const radius = 24;
      const x = centerX - blockW / 2;
      const y = centerY - blockH / 2;
      ctx.roundRect(x, y, blockW, blockH, radius);

      // Kristal Buz Gradyanı
      const iceGrad = ctx.createLinearGradient(x, y, x + blockW, y + blockH);
      iceGrad.addColorStop(0, 'rgba(240, 249, 255, 0.72)');
      iceGrad.addColorStop(0.3, 'rgba(186, 230, 253, 0.52)');
      iceGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.58)');
      iceGrad.addColorStop(1, 'rgba(14, 165, 233, 0.72)');
      ctx.fillStyle = iceGrad;
      ctx.fill();

      // Buz Kenar Işıltı Konturu
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // İç Buz Işık Kırılmaları (Frosted glass refraction stripes)
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x + 20, y);
      ctx.lineTo(x + blockW, y + blockH - 20);
      ctx.moveTo(x, y + 45);
      ctx.lineTo(x + blockW - 45, y + blockH);
      ctx.stroke();
      ctx.restore();

      // 3. Şut Tuşuna Bastıkça Beliren Dinamik Çatlaklar (Cracks 1..4)
      if (breakCount > 0) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowBlur = 8;

        ctx.beginPath();
        // 1. Vuruş Çatlağı
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX - 24, centerY - 32);
        ctx.lineTo(centerX - 16, centerY - 55);
        ctx.lineTo(centerX - 35, centerY - 72);

        // 2. Vuruş Çatlağı
        if (breakCount >= 2) {
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(centerX + 28, centerY - 20);
          ctx.lineTo(centerX + 42, centerY - 45);
          ctx.lineTo(centerX + 30, centerY - 68);
          ctx.moveTo(centerX + 28, centerY - 20);
          ctx.lineTo(centerX + 48, centerY - 15);
        }

        // 3. Vuruş Çatlağı
        if (breakCount >= 3) {
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(centerX - 20, centerY + 30);
          ctx.lineTo(centerX - 42, centerY + 50);
          ctx.lineTo(centerX - 32, centerY + 75);
          ctx.moveTo(centerX - 20, centerY + 30);
          ctx.lineTo(centerX - 8, centerY + 65);
        }

        // 4. Vuruş Çatlağı (Buz paramparça olmak üzere!)
        if (breakCount >= 4) {
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(centerX + 22, centerY + 28);
          ctx.lineTo(centerX + 38, centerY + 58);
          ctx.lineTo(centerX + 50, centerY + 78);
          ctx.moveTo(centerX - 24, centerY - 32);
          ctx.lineTo(centerX - 48, centerY - 25);
          ctx.lineTo(centerX - 52, centerY - 5);
        }
        ctx.stroke();
      }

      // 4. Kafanın Üzerindeki Kırma Rehber Rozeti
      const badgeY = y - 28;
      let badgeText;
      if (this.isSinglePlayer && !isP1) {
        const elapsed = 300 - this.p2FreezeTimer;
        if (elapsed < 120) {
          const remSecs = Math.max(0.1, ((120 - elapsed) / 60)).toFixed(1);
          badgeText = `❄️ 0/5 [BOT ${remSecs}s SONRA KIRIYOR]`;
        } else {
          badgeText = `❄️ ${breakCount}/5 [BOT KIRIYOR!]`;
        }
      } else {
        const shootKey = isP1 ? 'SPACE' : 'P';
        badgeText = `❄️ ${breakCount}/5 [${shootKey} İLE KIR]`;
      }

      ctx.font = 'bold 13px Outfit, Inter, sans-serif';
      const textMetrics = ctx.measureText(badgeText);
      const textW = textMetrics.width + 22;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(centerX - textW / 2, badgeY - 14, textW, 26, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f0f9ff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, centerX, badgeY);

      ctx.restore();
    };

    if (this.p1FreezeTimer > 0) drawIceBlock(this.p1, this.p1BreakCount, true);
    if (this.p2FreezeTimer > 0) drawIceBlock(this.p2, this.p2BreakCount, false);

    // 🧱 Kale Kalkanı (Buz/Siber Duvar) Çizimi
    const drawGoalShield = (isP1, timer) => {
      const shieldW = 26;
      const shieldH = (this.goalHeight || 260) + 14;
      const shieldX = isP1 ? (118 - shieldW / 2) : (GAME_WIDTH - 118 - shieldW / 2);
      const shieldY = GROUND_Y - shieldH;

      ctx.save();
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 18;

      const sGrad = ctx.createLinearGradient(shieldX, shieldY, shieldX + shieldW, shieldY + shieldH);
      sGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      sGrad.addColorStop(0.2, 'rgba(186, 230, 253, 0.7)');
      sGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.65)');
      sGrad.addColorStop(1, 'rgba(2, 132, 199, 0.85)');

      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.roundRect(shieldX, shieldY, shieldW, shieldH, 12);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      for (let y = shieldY + 20; y < shieldY + shieldH - 10; y += 28) {
        ctx.beginPath();
        ctx.moveTo(shieldX + 4, y);
        ctx.lineTo(shieldX + shieldW - 4, y + 10);
        ctx.stroke();
      }

      const secs = Math.ceil(timer / 60);
      const badgeText = `🧱 KALKAN (${secs}s)`;
      ctx.font = 'bold 12px Outfit, Inter, sans-serif';
      const textW = ctx.measureText(badgeText).width + 16;
      const badgeX = isP1 ? 118 : GAME_WIDTH - 118;
      const badgeY = shieldY - 14;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(badgeX - textW / 2, badgeY - 10, textW, 20, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, badgeX, badgeY);

      ctx.restore();
    };

    if (this.p1ShieldTimer > 0) drawGoalShield(true, this.p1ShieldTimer);
    if (this.p2ShieldTimer > 0) drawGoalShield(false, this.p2ShieldTimer);

    // 🍄 Dev Karakter Aurası Çizimi
    const drawGiantAura = (player, isP1, timer) => {
      if (!player || !player.head) return;
      const hx = player.head.position.x;
      const hy = player.head.position.y;
      const sx = player.shoe.position.x;
      const sy = player.shoe.position.y;
      const centerX = (hx + sx) / 2;
      const centerY = (hy + sy) / 2;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      const auraColor1 = isP1 ? 'rgba(251, 191, 36, 0.35)' : 'rgba(168, 85, 247, 0.35)';
      const auraColor2 = isP1 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(147, 51, 234, 0.15)';

      const auraGrad = ctx.createRadialGradient(centerX, centerY, 30, centerX, centerY, 130);
      auraGrad.addColorStop(0, auraColor1);
      auraGrad.addColorStop(0.7, auraColor2);
      auraGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 130, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = 'source-over';
      const secs = Math.ceil(timer / 60);
      const badgeText = `🍄 DEV (${secs}s)`;
      ctx.font = 'bold 12px Outfit, Inter, sans-serif';
      const textW = ctx.measureText(badgeText).width + 16;
      const badgeY = hy - 65;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = isP1 ? '#fbbf24' : '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(hx - textW / 2, badgeY - 10, textW, 20, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, hx, badgeY);

      ctx.restore();
    };

    if (this.p1GiantTimer > 0) drawGiantAura(this.p1, true, this.p1GiantTimer);
    if (this.p2GiantTimer > 0) drawGiantAura(this.p2, false, this.p2GiantTimer);

    // 👤 Oyuncu İsim Etiketleri (Karakterlerin üstünde şık isim göstergeleri)
    const drawPlayerNameTag = (player, name, isP1) => {
      if (!player || !player.head) return;
      const hx = player.head.position.x;
      const hy = player.head.position.y;
      const isGiant = (isP1 ? this.p1GiantTimer : this.p2GiantTimer) > 0;
      const tagY = hy - (isGiant ? 85 : 56);

      ctx.save();
      ctx.font = 'bold 12px Outfit, Inter, sans-serif';
      const text = (name || (isP1 ? 'Oyuncu 1' : (this.isSinglePlayer ? 'Yapay Zeka' : 'Oyuncu 2'))).toUpperCase();
      const textMetrics = ctx.measureText(text);
      const tagW = Math.max(65, textMetrics.width + 22);
      const tagH = 20;

      // Yarı saydam koyu zemin ve renkli ışıma
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.strokeStyle = isP1 ? 'rgba(56, 189, 248, 0.85)' : 'rgba(244, 114, 182, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = isP1 ? 'rgba(56, 189, 248, 0.6)' : 'rgba(244, 114, 182, 0.6)';
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.roundRect(hx - tagW / 2, tagY - tagH / 2, tagW, tagH, 10);
      ctx.fill();
      ctx.stroke();

      // Yıldız simgesi
      ctx.shadowBlur = 0;
      ctx.fillStyle = isP1 ? '#38bdf8' : '#f472b6';
      ctx.font = '900 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', hx - tagW / 2 + 6, tagY);

      // Oyuncu İsmi
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px Outfit, Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(text, hx + 4, tagY);

      ctx.restore();
    };

    drawPlayerNameTag(this.p1, this.p1Custom?.name, true);
    drawPlayerNameTag(this.p2, this.p2Custom?.name, false);

    ctx.restore();
  }


  buildMap(mapType) {
    const norm = normalizeMapType(mapType);
    const obstacles = [];
    if (!norm || norm === 'none') return obstacles;

    const baseOpt = { 
      isStatic: true, 
      restitution: 1.3, 
      friction: 0.02, 
      frictionStatic: 0,
      label: 'bouncyObstacle', 
      render: { visible: false } 
    };

    if (norm === 'pinball') {
      obstacles.push(
        Bodies.circle(350, 190, 44, { ...baseOpt, restitution: 1.35, customVisual: { type: 'circle', color: '#06b6d4', glow: '#22d3ee', icon: '⚡' } }),
        Bodies.circle(600, 130, 52, { ...baseOpt, restitution: 1.4, customVisual: { type: 'circle', color: '#f43f5e', glow: '#fb7185', icon: '⚡' } }),
        Bodies.circle(850, 190, 44, { ...baseOpt, restitution: 1.35, customVisual: { type: 'circle', color: '#06b6d4', glow: '#22d3ee', icon: '⚡' } })
      );
    } else if (norm === 'floating_islands') {
      obstacles.push(
        Bodies.rectangle(320, 230, 210, 24, { ...baseOpt, customVisual: { type: 'platform', color: '#38bdf8', glow: '#60a5fa', width: 210, height: 24 } }),
        Bodies.rectangle(880, 230, 210, 24, { ...baseOpt, customVisual: { type: 'platform', color: '#f472b6', glow: '#fb7185', width: 210, height: 24 } })
      );
    } else if (norm === 'stadium_arch') {
      // Siber Çatı Kemeri (Ters Kubbe - Eğimler dışa akar, asla ortada sıkışma yapmaz!)
      obstacles.push(
        Bodies.rectangle(430, 160, 220, 22, { ...baseOpt, angle: -Math.PI / 8, customVisual: { type: 'platform', color: '#34d399', glow: '#10b981', width: 220, height: 22 } }),
        Bodies.rectangle(770, 160, 220, 22, { ...baseOpt, angle: Math.PI / 8, customVisual: { type: 'platform', color: '#34d399', glow: '#10b981', width: 220, height: 22 } })
      );
    } else if (norm === 'twin_jumpers') {
      obstacles.push(
        Bodies.circle(230, 210, 42, { ...baseOpt, restitution: 1.38, customVisual: { type: 'circle', color: '#a855f7', glow: '#c084fc', icon: '🚀' } }),
        Bodies.circle(970, 210, 42, { ...baseOpt, restitution: 1.38, customVisual: { type: 'circle', color: '#f59e0b', glow: '#fbbf24', icon: '🚀' } })
      );
    } else if (norm === 'sky_ring') {
      obstacles.push(
        Bodies.circle(600, 180, 56, { ...baseOpt, restitution: 1.38, customVisual: { type: 'circle', color: '#06b6d4', glow: '#22d3ee', icon: '✦' } })
      );
    } else if (norm === 'cross_bumpers') {
      obstacles.push(
        Bodies.circle(420, 140, 34, { ...baseOpt, customVisual: { type: 'circle', color: '#f43f5e', glow: '#fb7185', icon: '⚡' } }),
        Bodies.circle(780, 140, 34, { ...baseOpt, customVisual: { type: 'circle', color: '#f43f5e', glow: '#fb7185', icon: '⚡' } }),
        Bodies.circle(420, 270, 34, { ...baseOpt, customVisual: { type: 'circle', color: '#38bdf8', glow: '#60a5fa', icon: '⚡' } }),
        Bodies.circle(780, 270, 34, { ...baseOpt, customVisual: { type: 'circle', color: '#38bdf8', glow: '#60a5fa', icon: '⚡' } })
      );
    } else if (norm === 'laser_gate') {
      obstacles.push(
        Bodies.rectangle(600, 130, 440, 24, { ...baseOpt, customVisual: { type: 'platform', color: '#fbbf24', glow: '#f59e0b', width: 440, height: 24 } })
      );
    } else if (norm === 'diamond_core') {
      obstacles.push(
        Bodies.rectangle(600, 190, 85, 85, { ...baseOpt, angle: Math.PI / 4, restitution: 1.38, customVisual: { type: 'diamond', color: '#c084fc', glow: '#a855f7', size: 85 } })
      );
    } else if (norm === 'cyber_plinko') {
      obstacles.push(
        Bodies.circle(360, 130, 30, { ...baseOpt, customVisual: { type: 'circle', color: '#f59e0b', glow: '#fbbf24', icon: '•' } }),
        Bodies.circle(840, 130, 30, { ...baseOpt, customVisual: { type: 'circle', color: '#f59e0b', glow: '#fbbf24', icon: '•' } }),
        Bodies.circle(600, 200, 36, { ...baseOpt, restitution: 1.38, customVisual: { type: 'circle', color: '#ec4899', glow: '#f43f5e', icon: '•' } }),
        Bodies.circle(360, 270, 30, { ...baseOpt, customVisual: { type: 'circle', color: '#f59e0b', glow: '#fbbf24', icon: '•' } }),
        Bodies.circle(840, 270, 30, { ...baseOpt, customVisual: { type: 'circle', color: '#f59e0b', glow: '#fbbf24', icon: '•' } })
      );
    }

    return obstacles;
  }

  setupWorld(p1Custom, p2Custom, envCustom) {
    // Pitch ground body aligned exactly with 77.9% GROUND_Y (526px)
    const ground = Bodies.rectangle(GAME_WIDTH / 2, GROUND_Y + 10, GAME_WIDTH, 20, { 
      isStatic: true, friction: 1.0, render: { visible: false } // High friction for realistic turf grip
    });
    
    const thickGround = Bodies.rectangle(GAME_WIDTH / 2, GROUND_Y + 260, GAME_WIDTH + 1000, 500, { isStatic: true, render: { visible: false } });
    const thickCeiling = Bodies.rectangle(GAME_WIDTH / 2, -250, GAME_WIDTH + 1000, 500, { isStatic: true, render: { visible: false } });
    const thickLeftWall = Bodies.rectangle(-250, GAME_HEIGHT / 2, 500, GAME_HEIGHT + 1000, { isStatic: true, render: { visible: false } });
    const thickRightWall = Bodies.rectangle(GAME_WIDTH + 250, GAME_HEIGHT / 2, 500, GAME_HEIGHT + 1000, { isStatic: true, render: { visible: false } });

    // Invisible ceiling and side borders
    const ceilingBorder = Bodies.rectangle(GAME_WIDTH / 2, 10, GAME_WIDTH, 20, { 
      isStatic: true, restitution: 0.6, render: { visible: false }
    });
    const leftBorder = Bodies.rectangle(10, 200, 20, 360, {
      isStatic: true, restitution: 0.6, render: { visible: false }
    });
    const rightBorder = Bodies.rectangle(GAME_WIDTH - 10, 200, 20, 360, {
      isStatic: true, restitution: 0.6, render: { visible: false }
    });

    // Tall, Proportional Goals Hugging Far Edges (Height = 260px for higher difficulty, Depth = 100px)
    let goalHeight = 260;
    if (this.eventMode === 'giant_goals') goalHeight = 450;
    else if (this.eventMode === 'giant_ball') goalHeight = 250;
    
    this.goalHeight = goalHeight;
    const goalDepth = 100;

    // Physical collision bodies for Left Goal (0px to 100px)
    this.leftTop = Bodies.rectangle(goalDepth / 2, GROUND_Y - goalHeight, goalDepth, 16, { 
      isStatic: true, restitution: 0.5, render: { visible: false }
    });
    const leftBack = Bodies.rectangle(0, GROUND_Y - goalHeight / 2, 10, goalHeight, { 
      isStatic: true, render: { visible: false }
    });
    this.leftFrontPost = Bodies.rectangle(goalDepth - 8, GROUND_Y - goalHeight, 16, 42, {
      isStatic: true, restitution: 0.6, render: { visible: false }
    });

    const leftGoalVisual = Bodies.rectangle(goalDepth / 2, GROUND_Y - goalHeight / 2, goalDepth, goalHeight, {
      isStatic: true, isSensor: true,
      render: {
        sprite: {
          texture: generateGoalSVG(envCustom?.goal, true),
          xScale: 1.0,
          yScale: goalHeight / 250
        }
      }
    });

    // Physical collision bodies for Right Goal (1100px to 1200px)
    this.rightTop = Bodies.rectangle(GAME_WIDTH - goalDepth / 2, GROUND_Y - goalHeight, goalDepth, 16, { 
      isStatic: true, restitution: 0.5, render: { visible: false }
    });
    const rightBack = Bodies.rectangle(GAME_WIDTH, GROUND_Y - goalHeight / 2, 10, goalHeight, { 
      isStatic: true, render: { visible: false }
    });
    this.rightFrontPost = Bodies.rectangle(GAME_WIDTH - goalDepth + 8, GROUND_Y - goalHeight, 16, 42, {
      isStatic: true, restitution: 0.6, render: { visible: false }
    });

    const rightGoalVisual = Bodies.rectangle(GAME_WIDTH - goalDepth / 2, GROUND_Y - goalHeight / 2, goalDepth, goalHeight, {
      isStatic: true, isSensor: true,
      render: {
        sprite: {
          texture: generateGoalSVG(envCustom?.goal, false),
          xScale: 1.0,
          yScale: goalHeight / 250
        }
      }
    });

    // Players Setup (Grounded ON TOP of pitch line at GROUND_Y - 62)
    const defP1 = p1Custom || { jersey: { league: 'Süper Lig', teamIndex: 0 }, skin: 'light', hair: 0 };
    const defP2 = p2Custom || { jersey: { league: 'Süper Lig', teamIndex: 1 }, skin: 'medium', hair: 11 };

    this.p1 = this.createPlayer(240, GROUND_Y - 62, true, defP1);
    this.p2 = this.createPlayer(GAME_WIDTH - 240, GROUND_Y - 62, false, defP2);

    // Ball Setup - Heavy, Realistic Match Ball Physics
    let ballRadius = 28;
    let ballScale = 0.62;
    let ballRestitution = 0.45; // Even less bouncy for realistic control
    let ballDensity = 0.18; // Restored to 0.18. Heavy head will handle pushing!
    let ballFrictionAir = 0.009; // More air drag so it slows down naturally

    if (this.eventMode === 'giant_ball') {
      ballRadius = 40;
      ballScale = 0.88;
      ballDensity = 0.20;
    } else if (this.eventMode === 'basketball') {
      ballRestitution = 0.65;
      ballDensity = 0.22;
    } else if (this.eventMode === 'moon') {
      ballRestitution = 0.85;
      ballDensity = 0.15;
    }

    this.ballRadius = ballRadius;

    this.ball = Bodies.circle(GAME_WIDTH / 2, 200, ballRadius, {
      restitution: ballRestitution,
      friction: 0.8, // High ground friction so it doesn't slide endlessly when dribbled
      frictionAir: 0.015, // Higher air friction to settle it naturally
      density: ballDensity,
      render: { 
        sprite: {
          texture: generateBallSVG(envCustom?.ball),
          xScale: ballScale,
          yScale: ballScale
        }
      }
    });

    const obstacles = this.buildMap(envCustom?.map);
    this.obstacles = obstacles;

    Composite.add(this.engine.world, [
      ground, thickGround, thickCeiling, thickLeftWall, thickRightWall,
      ceilingBorder, leftBorder, rightBorder,
      leftGoalVisual, this.leftTop, leftBack, this.leftFrontPost, 
      rightGoalVisual, this.rightTop, rightBack, this.rightFrontPost,
      this.ball,
      ...obstacles
    ]);
  }

  setupControls() {
    this.handleKeyDown = (e) => {
      const rawKey = e.key || '';
      const key = rawKey.toLowerCase();
      const code = e.code || '';
      const keyCode = e.keyCode || e.which || 0;

      if (
        ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'w', 'a', 's', 'd', 'p', 'e', 'q', 'o', 'l', 'i', 'ğ', 'g', 'z', 'x', 'ö', 'ç'].includes(key) ||
        code === 'BracketLeft' || code === 'BracketRight' || keyCode === 219 || keyCode === 221 || code === 'Semicolon' || keyCode === 186 || code === 'Quote' || keyCode === 222
      ) {
        if (document.activeElement === document.body || document.activeElement.tagName === 'CANVAS') {
          e.preventDefault();
        }
      }

      // Tuş basılı tutmayı engelle (Buzu kırmak için tek tek seri basması gerekir!)
      if (e.repeat) {
        this.keys[key] = true;
        return;
      }

      // 🔥 Alevli Güç / Buff Tetikleyicileri (Q tuşu: P1, O tuşu: P2)
      if (key === 'q') {
        this.activateFireBuff(1);
      } else if (key === 'o' || key === 'l') {
        this.activateFireBuff(2);
      }

      // ❄️ Buz Tuzağı (E tuşu: P1, Ğ tuşu: P2)
      if (key === 'e') {
        this.activateFreezeTrap(1);
      } else if (
        key === 'ğ' || key === 'Ğ' || rawKey === 'ğ' || rawKey === 'Ğ' ||
        key === 'g' || key === 'G' ||
        code === 'BracketLeft' || code === 'BracketRight' ||
        keyCode === 219 || keyCode === 221 ||
        key === 'i' || key === 'ı'
      ) {
        this.activateFreezeTrap(2);
      }

      // 🧱 Kale Kalkanı (Z tuşu: P1, Ö tuşu: P2)
      if (key === 'z') {
        this.activateGoalShield(1);
      } else if (
        key === 'ö' || key === 'Ö' || rawKey === 'ö' || rawKey === 'Ö' ||
        code === 'Semicolon' || keyCode === 186 || keyCode === 59
      ) {
        this.activateGoalShield(2);
      }

      // 🍄 Dev Karakter / Dev Kafa (X tuşu: P1, Ç tuşu: P2)
      if (key === 'x') {
        this.activateGiantMode(1);
      } else if (
        key === 'ç' || key === 'Ç' || rawKey === 'ç' || rawKey === 'Ç' ||
        code === 'Quote' || keyCode === 222
      ) {
        this.activateGiantMode(2);
      }

      // ❄️ Donmuşken ŞUT Tuşuna Basarak Buzu Kırma Mekaniği (5 Vuruş)
      if (key === ' ' && this.p1FreezeTimer > 0) {
        this.breakIce(1);
        return;
      }
      if ((key === 'p' || keyCode === 80) && this.p2FreezeTimer > 0) {
        this.breakIce(2);
        return;
      }

      this.keys[key] = true;
    };

    this.handleKeyUp = (e) => {
      this.keys[e.key.toLowerCase()] = false;
    };

    this.handleBlur = () => {
      this.keys = {};
    };

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  playChargeSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.35);

      gain.gain.setValueAtTime(0.6, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }

  playFireShotSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;

      // Ağır roket patlaması ve sonik bas vuruşu
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.7);

      gain.gain.setValueAtTime(1.0, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.7);

      // Alev kükremesi
      const bufferSize = audioCtx.sampleRate * 0.6;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.18));
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.frequency.linearRampToValueAtTime(200, now + 0.5);

      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(1.4, now);
      noiseGain.gain.linearRampToValueAtTime(0.01, now + 0.55);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(audioCtx.destination);
      noise.start(now);
    } catch (e) {
      // Audio fallback
    }
  }

  playFreezeSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;

      // Kristal buz dondurma tınısı
      [900, 1200, 1600, 2100].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.4, now + idx * 0.04 + 0.25);

        gain.gain.setValueAtTime(0.25, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.3);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.35);
      });

      // Rüzgarlı buz fırtınası hışırtısı
      const bufferSize = audioCtx.sampleRate * 0.35;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.12));
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(3.5, now);
      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.35, now);
      noiseGain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(audioCtx.destination);
      noise.start(now);
    } catch (e) {}
  }

  playIceHitSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1300, now);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.08);

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  }

  playIceShatterSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;

      // Buz patlama gürültüsü
      const bufferSize = audioCtx.sampleRate * 0.45;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.1));
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1600, now);
      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.85, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(audioCtx.destination);
      noise.start(now);

      // Kristal cam kırılma patlamaları
      [1300, 1800, 2400, 3200].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.02);
        osc.frequency.exponentialRampToValueAtTime(250, now + idx * 0.02 + 0.2);

        gain.gain.setValueAtTime(0.35, now + idx * 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.02 + 0.24);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.02);
        osc.stop(now + idx * 0.02 + 0.25);
      });
    } catch (e) {}
  }

  notifySkillState(eventType, actorNum = null) {
    if (this.onSkillUsed) {
      this.onSkillUsed(
        actorNum,
        this.p1FireShots,
        this.p2FireShots,
        Math.ceil(this.p1FireBuffTimer / 60),
        Math.ceil(this.p2FireBuffTimer / 60),
        eventType,
        {
          p1FireShots: this.p1FireShots,
          p2FireShots: this.p2FireShots,
          p1BuffSecs: Math.ceil(this.p1FireBuffTimer / 60),
          p2BuffSecs: Math.ceil(this.p2FireBuffTimer / 60),
          p1FreezeCharges: this.p1FreezeCharges,
          p2FreezeCharges: this.p2FreezeCharges,
          p1Frozen: this.p1FreezeTimer > 0,
          p2Frozen: this.p2FreezeTimer > 0,
          p1BreakCount: this.p1BreakCount,
          p2BreakCount: this.p2BreakCount,
          maxBreaks: this.MAX_ICE_BREAKS,
          p1ShieldCharges: this.p1ShieldCharges,
          p2ShieldCharges: this.p2ShieldCharges,
          p1ShieldActive: this.p1ShieldTimer > 0,
          p2ShieldActive: this.p2ShieldTimer > 0,
          p1ShieldSecs: Math.ceil(this.p1ShieldTimer / 60),
          p2ShieldSecs: Math.ceil(this.p2ShieldTimer / 60),
          p1GiantCharges: this.p1GiantCharges,
          p2GiantCharges: this.p2GiantCharges,
          p1GiantActive: this.p1GiantTimer > 0,
          p2GiantActive: this.p2GiantTimer > 0,
          p1GiantSecs: Math.ceil(this.p1GiantTimer / 60),
          p2GiantSecs: Math.ceil(this.p2GiantTimer / 60),
          actorNum,
          eventType
        }
      );
    }
  }

  activateFreezeTrap(casterNum) {
    if (this.isPaused || this.isGoalScored) return false;

    const targetNum = casterNum === 1 ? 2 : 1;
    const targetPlayer = targetNum === 1 ? this.p1 : this.p2;
    if (!targetPlayer) return false;

    // Hak ve aktif donma kontrolü
    if (casterNum === 1) {
      if (this.p1FreezeCharges <= 0 || this.p2FreezeTimer > 0) return false;
      this.p1FreezeCharges--;
      this.p2FreezeTimer = 300; // 5 saniye (60 fps * 5 = 300 frame)
      this.p2BreakCount = 0;
    } else {
      if (this.p2FreezeCharges <= 0 || this.p1FreezeTimer > 0) return false;
      this.p2FreezeCharges--;
      this.p1FreezeTimer = 300;
      this.p1BreakCount = 0;
    }

    // Hedef oyuncunun etrafında dondurma halka partikülleri
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 / 30) * i;
      const speed = Math.random() * 7 + 2;
      this.iceParticles.push({
        x: targetPlayer.head.position.x,
        y: targetPlayer.head.position.y + 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5,
        size: Math.random() * 8 + 4,
        rot: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.25,
        life: 1.0,
        decay: 0.025,
        color: ['#e0f2fe', '#bae6fd', '#38bdf8', '#0284c7', '#ffffff'][Math.floor(Math.random() * 5)],
        shape: Math.random() > 0.5 ? 'diamond' : 'shard'
      });
    }

    this.playFreezeSound();
    this.screenShake = 12;
    this.notifySkillState('freeze_activated', casterNum);
    return true;
  }

  breakIce(playerNum) {
    const isP1 = playerNum === 1;
    const currentTimer = isP1 ? this.p1FreezeTimer : this.p2FreezeTimer;
    if (currentTimer <= 0) return;

    const player = isP1 ? this.p1 : this.p2;
    if (isP1) {
      this.p1BreakCount++;
    } else {
      this.p2BreakCount++;
    }

    this.playIceHitSound();
    this.screenShake = 7;

    // Buz çatlama kıymıkları
    for (let i = 0; i < 8; i++) {
      this.iceParticles.push({
        x: player.head.position.x + (Math.random() - 0.5) * 60,
        y: player.head.position.y + (Math.random() - 0.5) * 80,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 7 - 2,
        size: Math.random() * 6 + 3,
        rot: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.3,
        life: 0.7,
        decay: 0.04,
        color: '#ffffff',
        shape: 'shard'
      });
    }

    const currentCount = isP1 ? this.p1BreakCount : this.p2BreakCount;
    if (currentCount >= this.MAX_ICE_BREAKS) {
      this.shatterIce(playerNum);
    } else {
      this.notifySkillState('ice_crack', playerNum);
    }
  }

  shatterIce(playerNum) {
    const isP1 = playerNum === 1;
    const player = isP1 ? this.p1 : this.p2;

    if (isP1) {
      this.p1FreezeTimer = 0;
      this.p1BreakCount = 0;
    } else {
      this.p2FreezeTimer = 0;
      this.p2BreakCount = 0;
    }

    this.playIceShatterSound();
    this.screenShake = 18;

    if (player) {
      // 36 adet patlayan parlak buz kristalleri
      for (let i = 0; i < 36; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 16 + 5;
        this.iceParticles.push({
          x: player.head.position.x + (Math.random() - 0.5) * 40,
          y: player.head.position.y + 20 + (Math.random() - 0.5) * 60,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 6,
          size: Math.random() * 14 + 6,
          rot: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 0.45,
          life: 1.0,
          decay: 0.025,
          color: ['#ffffff', '#bae6fd', '#7dd3fc', '#38bdf8', '#0284c7'][Math.floor(Math.random() * 5)],
          shape: Math.random() > 0.4 ? 'shard' : 'diamond'
        });
      }
    }

    this.notifySkillState('ice_shattered', playerNum);
  }

  playShieldActivateSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      [440, 660, 880].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + idx * 0.05 + 0.3);
        gain.gain.setValueAtTime(0.3, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.05 + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.38);
      });
    } catch (e) {}
  }

  playShieldShatterSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      // Deep metallic bass impact + glass crystal shatter
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.42);

      [1500, 2200, 3100].forEach((freq, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + idx * 0.02);
        o.frequency.exponentialRampToValueAtTime(200, now + idx * 0.02 + 0.2);
        g.gain.setValueAtTime(0.4, now + idx * 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.02 + 0.25);
        o.connect(g);
        g.connect(audioCtx.destination);
        o.start(now + idx * 0.02);
        o.stop(now + idx * 0.02 + 0.26);
      });
    } catch (e) {}
  }

  playGiantSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.4);
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.48);
    } catch (e) {}
  }

  activateGoalShield(playerNum) {
    if (this.isPaused || this.isGoalScored) return false;
    const isP1 = playerNum === 1;

    if (isP1) {
      if (this.p1ShieldCharges <= 0 || this.p1ShieldTimer > 0) return false;
      this.p1ShieldCharges--;
      this.p1ShieldTimer = 300; // 5 saniye
      const shieldW = 28;
      const shieldH = (this.goalHeight || 260) + 16;
      const shieldX = 118;
      const shieldY = GROUND_Y - shieldH / 2;
      if (this.p1ShieldBody) Composite.remove(this.engine.world, this.p1ShieldBody);
      this.p1ShieldBody = Bodies.rectangle(shieldX, shieldY, shieldW, shieldH, {
        isStatic: true,
        restitution: 1.35,
        friction: 0.0,
        label: 'p1GoalShield',
        render: { visible: false }
      });
      Composite.add(this.engine.world, this.p1ShieldBody);
    } else {
      if (this.p2ShieldCharges <= 0 || this.p2ShieldTimer > 0) return false;
      this.p2ShieldCharges--;
      this.p2ShieldTimer = 300;
      const shieldW = 28;
      const shieldH = (this.goalHeight || 260) + 16;
      const shieldX = GAME_WIDTH - 118;
      const shieldY = GROUND_Y - shieldH / 2;
      if (this.p2ShieldBody) Composite.remove(this.engine.world, this.p2ShieldBody);
      this.p2ShieldBody = Bodies.rectangle(shieldX, shieldY, shieldW, shieldH, {
        isStatic: true,
        restitution: 1.35,
        friction: 0.0,
        label: 'p2GoalShield',
        render: { visible: false }
      });
      Composite.add(this.engine.world, this.p2ShieldBody);
    }

    this.playShieldActivateSound();
    this.screenShake = 10;
    this.notifySkillState('shield_activated', playerNum);
    return true;
  }

  shatterShield(playerNum) {
    const isP1 = playerNum === 1;
    const shieldBody = isP1 ? this.p1ShieldBody : this.p2ShieldBody;
    if (!shieldBody && (isP1 ? this.p1ShieldTimer : this.p2ShieldTimer) <= 0) return;

    if (shieldBody) {
      Composite.remove(this.engine.world, shieldBody);
    }
    if (isP1) {
      this.p1ShieldBody = null;
      this.p1ShieldTimer = 0;
    } else {
      this.p2ShieldBody = null;
      this.p2ShieldTimer = 0;
    }

    this.playShieldShatterSound();
    this.screenShake = 16;

    // Kalkan parçalanırken gelen topu kalenin dışına doğru fırlat ve alevli roketi durdur
    if (this.ball) {
      const shieldX = isP1 ? 118 : GAME_WIDTH - 118;
      if (Math.abs(this.ball.position.x - shieldX) < 80) {
        const bounceDir = isP1 ? 1 : -1;
        const currentSpeed = Math.abs(this.ball.velocity.x);
        const bounceVx = bounceDir * Math.max(currentSpeed * 1.1, 16);
        Body.setVelocity(this.ball, {
          x: bounceVx,
          y: (Math.random() - 0.5) * 6 - 5
        });
        this.isFireShotActive = false; // Kalkan alevli roketi sönümleyerek kurtarır!
      }
    }

    const spawnX = isP1 ? 118 : GAME_WIDTH - 118;
    const spawnY = GROUND_Y - (this.goalHeight || 260) / 2;
    for (let i = 0; i < 32; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 15 + 4;
      this.iceParticles.push({
        x: spawnX + (Math.random() - 0.5) * 20,
        y: spawnY + (Math.random() - 0.5) * (this.goalHeight || 260),
        vx: (isP1 ? 1 : -1) * (Math.random() * 8 + 4) + Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: Math.random() * 14 + 6,
        rot: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.4,
        life: 1.0,
        decay: 0.025,
        color: ['#38bdf8', '#0284c7', '#bae6fd', '#ffffff', '#06b6d4'][Math.floor(Math.random() * 5)],
        shape: Math.random() > 0.4 ? 'shard' : 'diamond'
      });
    }

    this.notifySkillState('shield_shattered', playerNum);
  }

  activateGiantMode(playerNum) {
    if (this.isPaused || this.isGoalScored) return false;
    const isP1 = playerNum === 1;
    const player = isP1 ? this.p1 : this.p2;
    if (!player) return false;

    if (isP1) {
      if (this.p1GiantCharges <= 0 || this.p1IsGiant) return false;
      this.p1GiantCharges--;
      this.p1GiantTimer = 300; // 5 saniye
      this.p1IsGiant = true;
    } else {
      if (this.p2GiantCharges <= 0 || this.p2IsGiant) return false;
      this.p2GiantCharges--;
      this.p2GiantTimer = 300;
      this.p2IsGiant = true;
    }

    const scale = 1.36; // Kaleyi kusursuz ve dengeli koruyan estetik dev boyut

    // 1. Zemin penetrasyonunu ve sıkışmayı önlemek için kafayı hafifçe yukarı kaldır
    Body.setPosition(player.head, {
      x: player.head.position.x,
      y: player.head.position.y - 18
    });
    Body.setVelocity(player.head, {
      x: player.head.velocity.x,
      y: Math.min(player.head.velocity.y, 0)
    });

    // 2. Kafa ve kramponu orantılı büyüt
    Body.scale(player.head, scale, scale);
    Body.scale(player.shoe, scale, scale);
    Body.setDensity(player.head, player.head.density * 2.0);

    // 3. KRİTİK: Matter.js Body.scale çağrısında inertia'yı sıfırlar! Kafanın dik durmasını KİLİTLE!
    Body.setInertia(player.head, Infinity);
    player.head.inverseInertia = 0;
    Body.setAngle(player.head, 0);
    Body.setAngularVelocity(player.head, 0);

    // 4. Kramponun eklem bağlantısını (joint) büyüyen kafaya göre hizala
    if (player.joint) {
      player.joint.pointA = { x: (player.isLeft ? 18 : -18) * scale, y: 42 * scale };
      player.joint.pointB = { x: 0, y: -6 * scale };
    }

    // 5. Görsel spriteları ölçekle
    if (player.head.render.sprite) {
      player.head.render.sprite.xScale *= scale;
      player.head.render.sprite.yScale *= scale;
    }
    if (player.shoe.render.sprite) {
      player.shoe.render.sprite.xScale *= scale;
      player.shoe.render.sprite.yScale *= scale;
    }

    this.playGiantSound();
    this.screenShake = 14;
    this.notifySkillState('giant_activated', playerNum);
    return true;
  }

  endGiantMode(playerNum) {
    const isP1 = playerNum === 1;
    const player = isP1 ? this.p1 : this.p2;
    const isGiant = isP1 ? this.p1IsGiant : this.p2IsGiant;
    if (!player || !isGiant) return;

    if (isP1) {
      this.p1IsGiant = false;
      this.p1GiantTimer = 0;
    } else {
      this.p2IsGiant = false;
      this.p2GiantTimer = 0;
    }

    const scale = 1.36;
    Body.scale(player.head, 1 / scale, 1 / scale);
    Body.scale(player.shoe, 1 / scale, 1 / scale);
    Body.setDensity(player.head, player.head.density / 2.0);

    // Dik duruşu tekrar garantiye al
    Body.setInertia(player.head, Infinity);
    player.head.inverseInertia = 0;
    Body.setAngle(player.head, 0);
    Body.setAngularVelocity(player.head, 0);

    // Eklemi orijinal koordinatlarına döndür
    if (player.joint) {
      player.joint.pointA = { x: (player.isLeft ? 18 : -18), y: 42 };
      player.joint.pointB = { x: 0, y: -6 };
    }

    if (player.head.render.sprite) {
      player.head.render.sprite.xScale /= scale;
      player.head.render.sprite.yScale /= scale;
    }
    if (player.shoe.render.sprite) {
      player.shoe.render.sprite.xScale /= scale;
      player.shoe.render.sprite.yScale /= scale;
    }

    this.notifySkillState('giant_ended', playerNum);
  }

  activateFireBuff(playerNum) {
    if (this.isPaused || this.isGoalScored) return false;

    if (playerNum === 1) {
      if (this.p1FireShots <= 0 || this.p1FireBuffTimer > 0) return false;
      this.p1FireShots--;
      this.p1FireBuffTimer = 300; // 5 saniye (60 fps * 5 = 300 frame)
    } else {
      if (this.p2FireShots <= 0 || this.p2FireBuffTimer > 0) return false;
      this.p2FireShots--;
      this.p2FireBuffTimer = 300;
    }

    this.playChargeSound();
    this.notifySkillState('buff_activated', playerNum);
    return true;
  }

  executeRocketShot(playerNum) {
    const player = playerNum === 1 ? this.p1 : this.p2;
    if (!player || !this.ball) return;

    // Buff'ı anında sıfırla
    this.p1FireBuffTimer = 0;
    this.p2FireBuffTimer = 0;
    player.kickTimer = 16;
    player.hasHitBall = true;

    const isLeft = player.isLeft;

    // HEDEF: Kalenin üst direğine en yakın, gol olabilecek en harika nokta (Üst 90 / Çatal)
    // Üst direk: GROUND_Y - this.goalHeight, ön direk alt ucu: 287px
    // Top yarıçapı: this.ballRadius (28px). 
    // Üst direğin hemen altından (üst 90 çatalından) ağlara girmesi için en ideal nokta:
    const targetGoalX = isLeft ? (GAME_WIDTH - 60) : 60;
    const targetGoalY = (GROUND_Y - (this.goalHeight || 260)) + (this.ballRadius || 28) + 26;

    const currentBallX = this.ball.position.x;
    const currentBallY = this.ball.position.y;

    let dx = targetGoalX - currentBallX;
    let dy = targetGoalY - currentBallY;

    // Yön zorlaması: P1 daima sağ kaleye, P2 sol kaleye doğru fırlatır
    if (isLeft && dx <= 50) dx = 450;
    if (!isLeft && dx >= -50) dx = -450;

    const dist = Math.hypot(dx, dy) || 1;

    // AŞIRI HIZLI: Normal şut 38-42 iken Alevli Roket Şut 88 hızında mermi gibi gider!
    const superSpeed = 88;
    const flightTime = Math.max(3, dist / superSpeed);

    // Matter.js yerçekimi telafisi (Top hedefe tam üst 90'a nokta atışı gider)
    const gravityY = this.engine.world.gravity.y || 3.8;
    const effectiveGravityPerFrame = gravityY * 0.001 * 16.67;
    const dropCompensation = 0.5 * effectiveGravityPerFrame * flightTime;

    const rocketSpeedX = (dx / dist) * superSpeed;
    const rocketSpeedY = ((dy / dist) * superSpeed) - dropCompensation;

    // Topun hava sürtünmesini roket modundayken sıfıra yakın yap ki hız kesilmesin
    this.ball.frictionAir = 0.0005;

    Body.setVelocity(this.ball, { 
      x: Math.max(-95, Math.min(95, rocketSpeedX)), 
      y: Math.max(-75, Math.min(15, rocketSpeedY)) 
    });
    Body.setAngularVelocity(this.ball, isLeft ? 1.2 : -1.2);

    this.isFireShotActive = true;
    this.fireShotTimer = 110; // Roket etki süresi
    this.fireShotShooter = playerNum;
    this.screenShake = 24; // Güçlü, tok ekran sarsıntısı

    this.playFireShotSound();

    // Yoğun kıvılcım ve alev patlaması
    for (let i = 0; i < 35; i++) {
      this.fireParticles.push({
        x: this.ball.position.x,
        y: this.ball.position.y,
        vx: (Math.random() - 0.5) * 24 + (isLeft ? 18 : -18),
        vy: (Math.random() - 0.5) * 24 - 8,
        size: Math.random() * 14 + 8,
        life: 1.0,
        decay: Math.random() * 0.035 + 0.02,
        color: ['#ffffff', '#fef08a', '#ff9800', '#f44336', '#fbbf24'][Math.floor(Math.random() * 5)]
      });
    }

    this.notifySkillState('shot_fired', playerNum);
  }

  resetPositions(p1Score = 0, p2Score = 0) {
    this.isGoalScored = false;
    this.p1FireBuffTimer = 0;
    this.p2FireBuffTimer = 0;
    this.p1FreezeTimer = 0;
    this.p2FreezeTimer = 0;
    this.p1BreakCount = 0;
    this.p2BreakCount = 0;
    this.shatterShield(1);
    this.shatterShield(2);
    this.endGiantMode(1);
    this.endGiantMode(2);
    this.isFireShotActive = false;
    this.fireShotTimer = 0;
    this.screenShake = 0;
    this.fireParticles = [];
    if (this.ball) this.ball.frictionAir = 0.015;
    this.notifySkillState('reset', null);
    
    // Joint logic matching createPlayer exactly:
    // shoe.x = head.x + (isLeft ? 18 : -18)
    // shoe.y = head.y + jointY - 2 - (-6) = head.y + jointY + 4
    const jointY = 44;
    const p1HeadX = 240;
    const p2HeadX = GAME_WIDTH - 240;
    const headY = GROUND_Y - 62;

    if (this.p1) {
      this.p1.kickTimer = 0;
      this.p1.hasHitBall = false;
      Body.setPosition(this.p1.head, { x: p1HeadX, y: headY });
      Body.setVelocity(this.p1.head, { x: 0, y: 0 });
      Body.setAngle(this.p1.head, 0);
      Body.setAngularVelocity(this.p1.head, 0);
      Body.setInertia(this.p1.head, Infinity);
      this.p1.head.inverseInertia = 0;
      Body.setPosition(this.p1.shoe, { x: p1HeadX + 18, y: headY + jointY + 4 });
      Body.setVelocity(this.p1.shoe, { x: 0, y: 0 });
      Body.setAngle(this.p1.shoe, 0);
      Body.setAngularVelocity(this.p1.shoe, 0);
    }
    
    if (this.p2) {
      this.p2.kickTimer = 0;
      this.p2.hasHitBall = false;
      Body.setPosition(this.p2.head, { x: p2HeadX, y: headY });
      Body.setVelocity(this.p2.head, { x: 0, y: 0 });
      Body.setAngle(this.p2.head, 0);
      Body.setAngularVelocity(this.p2.head, 0);
      Body.setInertia(this.p2.head, Infinity);
      this.p2.head.inverseInertia = 0;
      Body.setPosition(this.p2.shoe, { x: p2HeadX - 18, y: headY + jointY + 4 });
      Body.setVelocity(this.p2.shoe, { x: 0, y: 0 });
      Body.setAngle(this.p2.shoe, 0);
      Body.setAngularVelocity(this.p2.shoe, 0);
    }
    
    let startX = GAME_WIDTH / 2;
    let startY = 200;
    let startVx = 0;
    let startVy = 0;
    let spin = 0;

    // Top her zaman sadece ortadan başlar (önceki skor avantajı mekaniği kaldırıldı)

    Body.setPosition(this.ball, { x: startX, y: startY });
    Body.setVelocity(this.ball, { x: startVx, y: startVy });
    Body.setAngularVelocity(this.ball, spin);
    Body.setAngle(this.ball, 0);
  }

  createPlayer(x, y, isLeft, customData) {
    const group = Body.nextGroup(true);

    let headRadius = 48;
    let headScale = 0.76;
    let shoeW = 60;
    let shoeH = 38;
    let jointY = 44; // Sleek separation between shirt body & boot

    const frictionVal = this.eventMode === 'ice' ? 0.001 : 0.2;

    const head = Bodies.circle(x, y, headRadius, {
      restitution: 0.0, // Dead bounce (0) so dribbling is controlled
      friction: frictionVal,
      density: 0.4, // Heavy head to firmly push the ball
      inertia: Infinity,
      collisionFilter: { group: group },
      render: {
        sprite: {
          texture: generatePlayerSVG(isLeft, customData.jersey, customData.skin, customData.hair),
          xScale: headScale,
          yScale: headScale
        }
      }
    });
    
    const shoe = Bodies.rectangle(x + (isLeft ? 20 : -20), y + jointY, shoeW, shoeH, {
      restitution: 0.4,
      friction: frictionVal,
      density: 0.2, // Increased shoe density to prevent constraint explosions when hitting the ball!
      collisionFilter: { group: group },
      render: {
        sprite: {
          texture: generateShoeSVG(isLeft, customData.jersey),
          xScale: 0.88,
          yScale: 0.88
        }
      }
    });

    const joint = Constraint.create({
      bodyA: head,
      pointA: { x: (isLeft ? 18 : -18), y: jointY - 2 },
      bodyB: shoe,
      pointB: { x: 0, y: -6 },
      stiffness: 0.95,
      length: 0
    });

    Composite.add(this.engine.world, [head, shoe, joint]);
    return { head, shoe, joint, isLeft, kickTimer: 0, hasHitBall: false };
  }

  kick(player) {
    if (player.kickTimer > 0) return;
    player.kickTimer = 12; // 12-frame kick (200ms) for a smooth, stable, yet fast swing!
    player.hasHitBall = false;
  }

  updateShoeRotation(player) {
    if (player.kickTimer > 0) {
      player.kickTimer--;

      // Continuous contact check (135px reach for solid connection)
      if (!player.hasHitBall) {
        const dx = this.ball.position.x - player.shoe.position.x;
        const dy = this.ball.position.y - player.shoe.position.y;
        const distToBall = Math.sqrt(dx * dx + dy * dy) || 1;

        if (distToBall < 135) {
          // Alevli Güç aktifse NORMAL ŞUT ÇEKME! Anında Alevli Roket Şutu ateşle!
          const playerNum = (player === this.p1) ? 1 : 2;
          const isBuffActive = (playerNum === 1 && this.p1FireBuffTimer > 0) || (playerNum === 2 && this.p2FireBuffTimer > 0);
          if (isBuffActive) {
            this.executeRocketShot(playerNum);
            return;
          }

          // Alevli roket şut havada uçuyorsa hızını asla normal vuruşla ezme!
          if (this.isFireShotActive) return;

          player.hasHitBall = true;
          const dirX = dx / distToBall;
          const dirY = dy / distToBall;

          // Power tuned for a solid "Tok" shot that always flies high!
          const kickPower = 42; 
          const playerVx = player.head.velocity.x * 0.5;
          
          // Focus power horizontally
          const shotVx = dirX * kickPower + playerVx + (player.isLeft ? 8 : -8);
          // GUARANTEED UPWARD LIFT: At least -16 (upward) so it ALWAYS flies up to the crossbar!
          const shotVy = Math.min(-16, dirY * 42 - 12);

          Body.setVelocity(this.ball, {
            x: Math.max(-38, Math.min(38, shotVx)),
            // Allow much higher upward velocity (up to crossbar height limit)
            y: Math.max(-35, Math.min(5, shotVy))
          });

          // Satisfying solid spin on impact
          Body.setAngularVelocity(this.ball, player.isLeft ? 0.35 : -0.35);
        }
      }

      // Stable fast kick arc swing (-1.4 rad for P1 Left, +1.4 rad for P2 Right)
      const targetAngle = player.isLeft ? -1.4 : 1.4;
      const diff = targetAngle - player.shoe.angle;
      // Use 0.5 for stable interpolation so physics engine doesn't rip the shoe off the body!
      Body.setAngularVelocity(player.shoe, diff * 0.5);
    } else {
      player.hasHitBall = false;
      // Spring back smoothly
      Body.setAngularVelocity(player.shoe, -player.shoe.angle * 0.4);
    }

    // Gentle Clamping (no harsh setAngle) to avoid constraint bugs
    if (player.isLeft) {
      if (player.shoe.angle < -1.5) Body.setAngularVelocity(player.shoe, 0);
      if (player.shoe.angle > 0.1) Body.setAngularVelocity(player.shoe, -0.1);
    } else {
      if (player.shoe.angle > 1.5) Body.setAngularVelocity(player.shoe, 0);
      if (player.shoe.angle < -0.1) Body.setAngularVelocity(player.shoe, 0.1);
    }

    // Krampon vurmadığı anlarda zemine kusursuz paralel kalsın
    if (player.kickTimer <= 0 && Math.abs(player.shoe.angle) < 0.08) {
      Body.setAngle(player.shoe, 0);
      Body.setAngularVelocity(player.shoe, 0);
    }
  }

  updateAIPlayerPhysics(player) {
    // ❄️ Donmuş Yapay Zeka Hareketsiz Kalır
    if (this.p2FreezeTimer > 0) {
      Body.setVelocity(player.head, { x: 0, y: Math.max(0, player.head.velocity.y) });
      Body.setAngularVelocity(player.head, 0);
      Body.setVelocity(player.shoe, { x: 0, y: Math.max(0, player.shoe.velocity.y) });
      Body.setAngularVelocity(player.shoe, 0);
      return;
    }

    let runSpeed = 14;
    if (this.eventMode === 'flash') runSpeed = 24;

    const ai = this.aiKeys || {};
    let vx = 0;
    let isMoving = false;

    if (ai.left) {
      vx = -runSpeed;
      isMoving = true;
    } else if (ai.right) {
      vx = runSpeed;
      isMoving = true;
    }

    if (isMoving) {
      Body.setVelocity(player.head, { x: vx, y: player.head.velocity.y });
    } else {
      Body.setVelocity(player.head, { x: 0, y: player.head.velocity.y });
    }

    let jumpForce = -34;
    if (this.eventMode === 'moon') jumpForce = -18;
    if (this.eventMode === 'flash') jumpForce = -35;
    if (this.eventMode === 'ice') jumpForce = 0;

    if (this.eventMode !== 'ice' && ai.jump && Math.abs(player.head.velocity.y) < 1.8 && player.head.position.y > GROUND_Y - 95) {
      Body.setVelocity(player.head, { x: player.head.velocity.x, y: jumpForce });
    }

    if (ai.kick) {
      this.kick(player);
    }

    this.updateShoeRotation(player);
  }

  updatePlayerPhysics(player, leftKey, rightKey, jumpKey, kickKey, altLeftKey, altRightKey, altJumpKey, altKickKey) {
    // ❄️ Donmuş Oyuncu Hareketsiz Kalır
    const isPlayerFrozen = (player === this.p1 && this.p1FreezeTimer > 0) || (player === this.p2 && this.p2FreezeTimer > 0);
    if (isPlayerFrozen) {
      Body.setVelocity(player.head, { x: 0, y: Math.max(0, player.head.velocity.y) });
      Body.setAngularVelocity(player.head, 0);
      Body.setVelocity(player.shoe, { x: 0, y: Math.max(0, player.shoe.velocity.y) });
      Body.setAngularVelocity(player.shoe, 0);
      return;
    }

    let runSpeed = 14;
    if (this.eventMode === 'flash') runSpeed = 24;

    let vx = 0;
    let isMovingHorizontally = false;

    if (this.keys[leftKey] || (altLeftKey && this.keys[altLeftKey])) {
      vx = -runSpeed;
      isMovingHorizontally = true;
    } else if (this.keys[rightKey] || (altRightKey && this.keys[altRightKey])) {
      vx = runSpeed;
      isMovingHorizontally = true;
    }

    if (isMovingHorizontally) {
      Body.setVelocity(player.head, { x: vx, y: player.head.velocity.y });
    } else {
      Body.setVelocity(player.head, { x: 0, y: player.head.velocity.y });
    }

    let jumpForce = -34;
    if (this.eventMode === 'moon') jumpForce = -18;
    if (this.eventMode === 'flash') jumpForce = -35;
    if (this.eventMode === 'ice') jumpForce = 0;

    if (this.eventMode !== 'ice' && (this.keys[jumpKey] || (altJumpKey && this.keys[altJumpKey])) && Math.abs(player.head.velocity.y) < 1.8 && player.head.position.y > GROUND_Y - 95) { 
      Body.setVelocity(player.head, { x: player.head.velocity.x, y: jumpForce });
    }

    if (this.keys[kickKey] || (altKickKey && this.keys[altKickKey])) {
      this.kick(player);
      this.keys[kickKey] = false;
      if (altKickKey) this.keys[altKickKey] = false;
    }

    this.updateShoeRotation(player);
  }

  update() {
    if (this.isPaused) return;

    if (this.eventMode === 'flash') {
      this.engine.timing.timeScale = 1.4;
    } else {
      this.engine.timing.timeScale = 1;
    }

    // Update Player 1
    this.updatePlayerPhysics(this.p1, 'a', 'd', 'w', ' ', 
      this.isSinglePlayer ? 'arrowleft' : null, 
      this.isSinglePlayer ? 'arrowright' : null, 
      this.isSinglePlayer ? 'arrowup' : null, 
      null
    );

    // Update Player 2 / AI (1-Player vs 2-Player completely separated)
    if (this.isSinglePlayer) {
      this.updateAIPlayerPhysics(this.p2);
    } else {
      this.updatePlayerPhysics(this.p2, 'arrowleft', 'arrowright', 'arrowup', 'p');
    }

    // Dik Duruş ve Denge Kilidi (Dev kafa ve normal modda karakter asla yan yatamaz!)
    if (this.p1 && this.p1.head) {
      Body.setAngle(this.p1.head, 0);
      Body.setAngularVelocity(this.p1.head, 0);
      if (this.p1.head.inertia !== Infinity) {
        Body.setInertia(this.p1.head, Infinity);
        this.p1.head.inverseInertia = 0;
      }
    }
    if (this.p2 && this.p2.head) {
      Body.setAngle(this.p2.head, 0);
      Body.setAngularVelocity(this.p2.head, 0);
      if (this.p2.head.inertia !== Infinity) {
        Body.setInertia(this.p2.head, Infinity);
        this.p2.head.inverseInertia = 0;
      }
    }

    // --- 5 Saniyelik Alevli Güç Süresi ve Kafa/Ayak Temas Kontrolü ---
    let notifyBuffUpdate = false;

    if (this.p1FireBuffTimer > 0) {
      this.p1FireBuffTimer--;
      if (this.p1FireBuffTimer % 15 === 0 || this.p1FireBuffTimer === 0) {
        notifyBuffUpdate = true;
      }

      // Kafa veya ayak ile temas kontrolü (Alevli şut vurma hakkı)
      if (this.ball && this.p1) {
        const dHead = Math.hypot(this.ball.position.x - this.p1.head.position.x, this.ball.position.y - this.p1.head.position.y);
        const dShoe = Math.hypot(this.ball.position.x - this.p1.shoe.position.x, this.ball.position.y - this.p1.shoe.position.y);
        if (dHead < this.ballRadius + 58 || dShoe < this.ballRadius + 58) {
          this.executeRocketShot(1);
          notifyBuffUpdate = false;
        }
      }
    }

    if (this.p2FireBuffTimer > 0) {
      this.p2FireBuffTimer--;
      if (this.p2FireBuffTimer % 15 === 0 || this.p2FireBuffTimer === 0) {
        notifyBuffUpdate = true;
      }

      if (this.ball && this.p2) {
        const dHead = Math.hypot(this.ball.position.x - this.p2.head.position.x, this.ball.position.y - this.p2.head.position.y);
        const dShoe = Math.hypot(this.ball.position.x - this.p2.shoe.position.x, this.ball.position.y - this.p2.shoe.position.y);
        if (dHead < this.ballRadius + 58 || dShoe < this.ballRadius + 58) {
          this.executeRocketShot(2);
          notifyBuffUpdate = false;
        }
      }
    }

    // --- 5 Saniyelik Buz Dondurma Süresi Kontrolleri ---
    if (this.p1FreezeTimer > 0) {
      this.p1FreezeTimer--;
      if (this.p1FreezeTimer === 0) {
        this.shatterIce(1); // 5 saniye dolunca otomatik kırılır
      } else if (this.p1FreezeTimer % 15 === 0) {
        notifyBuffUpdate = true;
      }
    }

    if (this.p2FreezeTimer > 0) {
      this.p2FreezeTimer--;
      if (this.p2FreezeTimer === 0) {
        this.shatterIce(2);
      } else {
        // ❄️ Tek oyunculu bot maçı: Bot donduktan 2 saniye (120 frame) sonra kırmaya başlar.
        // Her 0.4 saniyede bir (24 frame) vuruş atarak tam 5 vuruşta buzu kırar ve kurtulur!
        if (this.isSinglePlayer) {
          const elapsed = 300 - this.p2FreezeTimer;
          if (elapsed >= 120) {
            const breakTime = elapsed - 120;
            if (breakTime % 24 === 0 && this.p2BreakCount < this.MAX_ICE_BREAKS) {
              this.breakIce(2);
            }
          }
        }

        if (this.p2FreezeTimer > 0 && this.p2FreezeTimer % 15 === 0) {
          notifyBuffUpdate = true;
        }
      }
    }

    // --- 5 Saniyelik Kale Kalkanı Süresi Kontrolleri ---
    if (this.p1ShieldTimer > 0) {
      this.p1ShieldTimer--;
      if (this.p1ShieldTimer === 0) {
        this.shatterShield(1);
      } else if (this.p1ShieldTimer % 15 === 0) {
        notifyBuffUpdate = true;
      }
    }
    if (this.p2ShieldTimer > 0) {
      this.p2ShieldTimer--;
      if (this.p2ShieldTimer === 0) {
        this.shatterShield(2);
      } else if (this.p2ShieldTimer % 15 === 0) {
        notifyBuffUpdate = true;
      }
    }

    // --- 5 Saniyelik Dev Karakter Süresi Kontrolleri ---
    if (this.p1GiantTimer > 0) {
      this.p1GiantTimer--;
      if (this.p1GiantTimer === 0) {
        this.endGiantMode(1);
      } else if (this.p1GiantTimer % 15 === 0) {
        notifyBuffUpdate = true;
      }
    }
    if (this.p2GiantTimer > 0) {
      this.p2GiantTimer--;
      if (this.p2GiantTimer === 0) {
        this.endGiantMode(2);
      } else if (this.p2GiantTimer % 15 === 0) {
        notifyBuffUpdate = true;
      }
    }

    // Kesintisiz Top - Kalkan Temas Kontrolü (Aşırı Hızlı Şutlarda Asla Delinmesin)
    if (this.ball) {
      if (this.p1ShieldBody && Math.abs(this.ball.position.x - 118) < this.ballRadius + 22 && this.ball.position.y > GROUND_Y - (this.goalHeight || 260)) {
        this.shatterShield(1);
      }
      if (this.p2ShieldBody && Math.abs(this.ball.position.x - (GAME_WIDTH - 118)) < this.ballRadius + 22 && this.ball.position.y > GROUND_Y - (this.goalHeight || 260)) {
        this.shatterShield(2);
      }
    }

    if (notifyBuffUpdate) {
      this.notifySkillState('timer_tick', null);
    }

    // Prevent ball from falling below ground line
    if (this.ball.position.y > GROUND_Y - this.ballRadius) {
      Body.setPosition(this.ball, { x: this.ball.position.x, y: GROUND_Y - this.ballRadius });
      if (this.ball.velocity.y > 0) {
        if (!this.isFireShotActive) {
          Body.setVelocity(this.ball, { x: this.ball.velocity.x * 0.92, y: -this.ball.velocity.y * 0.45 });
        }
      }
    }

    // Goal Check
    const ballX = this.ball.position.x;
    const ballY = this.ball.position.y;

    const goalCheckHeight = this.goalHeight || 260;
    let points = this.eventMode === 'basketball' ? 3 : 1;

    if (!this.isGoalScored && ballY > GROUND_Y - goalCheckHeight && ballY < GROUND_Y + 20) {
      // Topun TAMAMI çizgiyi geçmeli (Gerçek futbol kuralı)
      const leftGoalLine = 100;
      const rightGoalLine = GAME_WIDTH - 100;

      if ((ballX + this.ballRadius < leftGoalLine && ballX > -150) ||
          (ballX - this.ballRadius > rightGoalLine && ballX < GAME_WIDTH + 150)) {
        const scoringPlayer = (ballX + this.ballRadius < leftGoalLine) ? 2 : 1;
        this.isGoalScored = true;
        // Gol olduğunda anında alevli buff, kalkan, dev ve donma durumlarını sıfırla
        this.p1FireBuffTimer = 0;
        this.p2FireBuffTimer = 0;
        this.p1FreezeTimer = 0;
        this.p2FreezeTimer = 0;
        this.p1BreakCount = 0;
        this.p2BreakCount = 0;
        this.shatterShield(1);
        this.shatterShield(2);
        this.endGiantMode(1);
        this.endGiantMode(2);
        this.isFireShotActive = false;
        this.fireShotTimer = 0;
        if (this.ball) this.ball.frictionAir = 0.015;
        this.notifySkillState('goal_scored', null);
        this.onScore(scoringPlayer, points);
      }
    }
  }

  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    Render.stop(this.render);
    if (this.runner) {
      Runner.stop(this.runner);
    }
    Composite.clear(this.engine.world);
    Engine.clear(this.engine);
    this.render.canvas = null;
    this.render.context = null;
    this.render.textures = {};
  }
}



