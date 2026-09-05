import { GAME_WIDTH } from './engine';

export class GameAI {
  constructor(engine, difficulty) {
    this.engine = engine;
    this.difficulty = difficulty;
    
    switch (difficulty) {
      case 'easy':
        this.reactionDelay = 35;
        this.jumpChance = 0.01;
        this.predictionFrames = 0;
        break;
      case 'medium':
        this.reactionDelay = 10;
        this.jumpChance = 0.05;
        this.predictionFrames = 12;
        break;
      case 'hard':
        this.reactionDelay = 1;
        this.jumpChance = 0.22;
        this.predictionFrames = 32;
        break;
      default:
        this.reactionDelay = 10;
        this.jumpChance = 0.05;
        this.predictionFrames = 12;
    }
    
    this.frameCount = 0;
  }

  update() {
    // ❄️ Donmuş Yapay Zeka: Hareket edemez, buzu kırma zamanlaması engine tarafından 2s sonra her 0.4s bir vuruşla 5 vuruşta sabit yönetilir.
    if (this.engine.p2FreezeTimer > 0) {
      this.engine.aiKeys = { left: false, right: false, jump: false, kick: false };
      return;
    }

    this.frameCount++;
    if (this.frameCount % this.reactionDelay !== 0) return;

    const ballPos = this.engine.ball.position;
    const ballVel = this.engine.ball.velocity;
    const ai = this.engine.p2.head.position;
    const p1 = this.engine.p1.head.position;

    // Reset AI keys specifically (Isolates AI completely from Human P1 keys)
    this.engine.aiKeys = {
      left: false,
      right: false,
      jump: false,
      kick: false
    };

    let predictedBallX = ballPos.x + (ballVel.x * this.predictionFrames);
    predictedBallX = Math.max(40, Math.min(predictedBallX, GAME_WIDTH - 40));

    let targetX = predictedBallX + 35;

    const isBallStuckOnP1 = Math.abs(ballVel.x) < 2 && Math.hypot(ballPos.x - p1.x, ballPos.y - p1.y) < 140;
    const isOutOfPosition = ai.x < ballPos.x;
    const isDefending = ballPos.x > GAME_WIDTH - 500;
    const isAttacking = ballPos.x < 500;
    const distanceToBall = Math.hypot(ballPos.x - ai.x, ballPos.y - ai.y);

    if (isOutOfPosition) {
      targetX = ballPos.x + 60; 
      if (Math.abs(ai.x - ballPos.x) < 110 && ballPos.y > ai.y - 10) {
         this.engine.aiKeys.jump = true;
      }
    } else {
      if (isDefending) {
         targetX = ballPos.x + 25;
      } else if (isAttacking) {
         targetX = ballPos.x + 15;
      }
    }

    if (isBallStuckOnP1 && this.difficulty !== 'easy') {
      targetX = ballPos.x + 15; 
      if (distanceToBall < 140) {
        this.engine.aiKeys.jump = true;
        this.engine.aiKeys.kick = true;
      }
    }

    // Hareket Uygulama
    if (ai.x > targetX + 18) {
      this.engine.aiKeys.left = true;
    } else if (ai.x < targetX - 18 && ai.x < GAME_WIDTH - 60) { 
      this.engine.aiKeys.right = true;
    }

    // Gelişmiş Zıplama
    if (ballPos.y < ai.y - 30 && distanceToBall < 160) {
      if (this.difficulty === 'hard') {
         this.engine.aiKeys.jump = true;
         if (ballVel.y > 0) this.engine.aiKeys.kick = true;
      } else if (Math.random() < this.jumpChance * 10) {
         this.engine.aiKeys.jump = true;
      }
    } else if (Math.random() < this.jumpChance) {
      this.engine.aiKeys.jump = true; 
    }



    // Şut Mantığı
    if (distanceToBall < 150) {
      if (isOutOfPosition) {
         if (isDefending) this.engine.aiKeys.kick = true;
      } else {
         if (ballPos.y > ai.y || isBallStuckOnP1 || (this.difficulty === 'hard' && Math.random() > 0.1)) {
            this.engine.aiKeys.kick = true;
         } else if (Math.random() > 0.4) {
            this.engine.aiKeys.kick = true;
         }
      }
    }

    // 🔥 Alevli Roket Şut Kullanım Mantığı (Yapay Zeka)
    if (this.engine.p2FireShots > 0 && this.engine.p2FireBuffTimer <= 0 && distanceToBall < 260 && !isOutOfPosition) {
      const shouldFire = (this.difficulty === 'hard' && ballPos.x < 750 && Math.random() < 0.08) ||
                         (this.difficulty === 'medium' && ballPos.x < 600 && Math.random() < 0.04) ||
                         (ballPos.x < 480 && Math.random() < 0.06);
      if (shouldFire) {
        this.engine.activateFireBuff(2);
      }
    }

    // ❄️ Buz Tuzağı Kullanım Mantığı (Yapay Zeka)
    if (this.engine.p2FreezeCharges > 0 && this.engine.p1FreezeTimer <= 0) {
      // 1. Karşı oyuncu Alevli Güç açtıysa onu anında dondur (Mükemmel Karşı Hamle!)
      if (this.engine.p1FireBuffTimer > 0) {
        this.engine.activateFreezeTrap(2);
      } 
      // 2. Karşı oyuncu kalemize çok yaklaştıysa ve tehlikeliyse dondur
      else if (ballPos.x > GAME_WIDTH - 420 && p1.x > GAME_WIDTH - 500) {
        const freezeChance = this.difficulty === 'hard' ? 0.15 : (this.difficulty === 'medium' ? 0.06 : 0.02);
        if (Math.random() < freezeChance) {
          this.engine.activateFreezeTrap(2);
        }
      }
    }

    // 🧱 Kale Kalkanı Kullanım Mantığı (Yapay Zeka)
    if (this.engine.p2ShieldCharges > 0 && this.engine.p2ShieldTimer <= 0) {
      // Top hızlıca kaleye geliyorsa veya P1 Alevli Roket Şut fırlattıysa kalkan aç!
      const isDangerousShot = (this.engine.isFireShotActive && this.engine.fireShotShooter === 1) ||
                              (ballVel.x > 18 && ballPos.x > GAME_WIDTH - 450);
      if (isDangerousShot) {
        this.engine.activateGoalShield(2);
      }
    }

    // 🍄 Dev Karakter Kullanım Mantığı (Yapay Zeka)
    if (this.engine.p2GiantCharges > 0 && this.engine.p2GiantTimer <= 0) {
      // Ceza sahamızda kritik hava topu veya kalabalık savunma anında devleş!
      if (ballPos.x > GAME_WIDTH - 380 && distanceToBall < 180) {
        const giantChance = this.difficulty === 'hard' ? 0.12 : (this.difficulty === 'medium' ? 0.05 : 0.02);
        if (Math.random() < giantChance) {
          this.engine.activateGiantMode(2);
        }
      }
    }
  }
}


