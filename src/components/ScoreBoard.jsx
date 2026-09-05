import React from 'react';

const ScoreBoard = ({ 
  score1, 
  score2, 
  timeRemaining, 
  p1Name = 'Oyuncu 1',
  p2Name = 'Oyuncu 2',
  p1FireShots = 2, 
  p2FireShots = 2, 
  p1BuffSeconds = 0,
  p2BuffSeconds = 0,
  p1FreezeCharges = 2,
  p2FreezeCharges = 2,
  p1Frozen = false,
  p2Frozen = false,
  p1ShieldCharges = 2,
  p2ShieldCharges = 2,
  p1ShieldActive = false,
  p2ShieldActive = false,
  p1GiantCharges = 2,
  p2GiantCharges = 2,
  p1GiantActive = false,
  p2GiantActive = false,
  isSinglePlayer = false 
}) => {
  // Format time (e.g., 90 -> 1:30)
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="scoreboard single-row-scoreboard">
      {/* SOL: 1. Oyuncu Becerileri & İsmi */}
      <div className="player-hud left">
        <div className="scoreboard-player-name left" title={p1Name}>
          <span className="player-badge-star">★</span>
          <span className="player-badge-text">{p1Name}</span>
        </div>

        <div className="player-skills-cluster left">
          {/* Q: Alevli Şut */}
          <div className={`skill-meter fire ${p1BuffSeconds > 0 ? 'buff-active' : ''}`} title="Alevli Roket Şut (Q)">
            <span className="skill-key-badge fire">Q</span>
            <div className="skill-flames">
              <span className={`flame-dot ${p1FireShots >= 1 ? 'active' : 'spent'}`}>🔥</span>
              <span className={`flame-dot ${p1FireShots >= 2 ? 'active' : 'spent'}`}>🔥</span>
            </div>
          </div>

          {/* E: Buz Tuzağı */}
          <div className={`skill-meter ice ${p1Frozen ? 'frozen-active' : ''}`} title="Buz Tuzağı (E)">
            <span className="skill-key-badge ice">E</span>
            <div className="skill-flames">
              <span className={`ice-dot ${p1FreezeCharges >= 1 ? 'active' : 'spent'}`}>❄️</span>
              <span className={`ice-dot ${p1FreezeCharges >= 2 ? 'active' : 'spent'}`}>❄️</span>
            </div>
          </div>

          {/* Z: Kale Kalkanı */}
          <div className={`skill-meter shield ${p1ShieldActive ? 'buff-active' : ''}`} title="Kale Kalkanı (Z)">
            <span className="skill-key-badge shield">Z</span>
            <div className="skill-flames">
              <span className={`shield-dot ${p1ShieldCharges >= 1 ? 'active' : 'spent'}`}>🧱</span>
              <span className={`shield-dot ${p1ShieldCharges >= 2 ? 'active' : 'spent'}`}>🧱</span>
            </div>
          </div>

          {/* X: Dev Karakter */}
          <div className={`skill-meter giant ${p1GiantActive ? 'buff-active' : ''}`} title="Dev Karakter (X)">
            <span className="skill-key-badge giant">X</span>
            <div className="skill-flames">
              <span className={`giant-dot ${p1GiantCharges >= 1 ? 'active' : 'spent'}`}>🍄</span>
              <span className={`giant-dot ${p1GiantCharges >= 2 ? 'active' : 'spent'}`}>🍄</span>
            </div>
          </div>
        </div>

        {p1Frozen && (
          <div className="player-frozen-pill" title="Şut tuşuna (SPACE) 5 kez basarak buzu kır!">
            <span>❄️ DONDU!</span>
          </div>
        )}

        {/* 1. Oyuncu Skoru */}
        <div className="score p1-score" style={{ color: 'var(--primary)' }}>{score1}</div>
      </div>

      {/* ORTA: Süre Sayacı (Tam Merkezde) */}
      <div className="timer-center-wrapper">
        <div className="timer">{formatTime(timeRemaining)}</div>
      </div>

      {/* SAĞ: 2. Oyuncu Skoru ve Becerileri (Tek Satır Yan Yana) */}
      <div className="player-hud right">
        {/* 2. Oyuncu Skoru */}
        <div className="score p2-score" style={{ color: 'var(--secondary)' }}>{score2}</div>

        {p2Frozen && (
          <div className="player-frozen-pill" title={isSinglePlayer ? "Bot buzu kırmaya çalışıyor!" : "Şut tuşuna (P) 5 kez basarak buzu kır!"}>
            <span>❄️ DONDU!</span>
          </div>
        )}

        <div className="player-skills-cluster right">
          {/* O: Alevli Roket Şut */}
          <div className={`skill-meter fire ${p2BuffSeconds > 0 ? 'buff-active' : ''}`} title="Alevli Roket Şut (O)">
            <div className="skill-flames">
              <span className={`flame-dot ${p2FireShots >= 2 ? 'active' : 'spent'}`}>🔥</span>
              <span className={`flame-dot ${p2FireShots >= 1 ? 'active' : 'spent'}`}>🔥</span>
            </div>
            <span className="skill-key-badge fire">O</span>
          </div>

          {/* Ğ: Buz Tuzağı */}
          <div className={`skill-meter ice ${p2Frozen ? 'frozen-active' : ''}`} title="Buz Tuzağı (Ğ)">
            <div className="skill-flames">
              <span className={`ice-dot ${p2FreezeCharges >= 2 ? 'active' : 'spent'}`}>❄️</span>
              <span className={`ice-dot ${p2FreezeCharges >= 1 ? 'active' : 'spent'}`}>❄️</span>
            </div>
            <span className="skill-key-badge ice">Ğ</span>
          </div>

          {/* Ö: Kale Kalkanı */}
          <div className={`skill-meter shield ${p2ShieldActive ? 'buff-active' : ''}`} title="Kale Kalkanı (Ö)">
            <div className="skill-flames">
              <span className={`shield-dot ${p2ShieldCharges >= 2 ? 'active' : 'spent'}`}>🧱</span>
              <span className={`shield-dot ${p2ShieldCharges >= 1 ? 'active' : 'spent'}`}>🧱</span>
            </div>
            <span className="skill-key-badge shield">Ö</span>
          </div>

          {/* Ç: Dev Karakter */}
          <div className={`skill-meter giant ${p2GiantActive ? 'buff-active' : ''}`} title="Dev Karakter (Ç)">
            <div className="skill-flames">
              <span className={`giant-dot ${p2GiantCharges >= 2 ? 'active' : 'spent'}`}>🍄</span>
              <span className={`giant-dot ${p2GiantCharges >= 1 ? 'active' : 'spent'}`}>🍄</span>
            </div>
            <span className="skill-key-badge giant">Ç</span>
          </div>
        </div>

        <div className="scoreboard-player-name right" title={p2Name}>
          <span className="player-badge-text">{p2Name}</span>
          <span className="player-badge-star">★</span>
        </div>
      </div>
    </div>
  );
};

export default ScoreBoard;
