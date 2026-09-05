import React from 'react';
import { Play, Users, Bot, Settings, Zap, Clock } from 'lucide-react';
import logoUrl from '../assets/romeoleonfutbol.png';

const EVENT_MODES = [
  { id: 'classic', name: 'Klasik', icon: '⚽' },
  { id: 'basketball', name: 'Basketbol (3 Puan)', icon: '🏀' },
  { id: 'moon', name: 'Ay Çekimi (Zıplayan)', icon: '🚀' },
  { id: 'giant_goals', name: 'Dev Kaleler', icon: '🎯' },
  { id: 'giant_ball', name: 'Dev Top', icon: '🐘' },
  { id: 'flash', name: 'Hızlı Çekim', icon: '⚡' },
  { id: 'ice', name: 'Buzlu Zemin', icon: '🧊' }
];

const MainMenu = ({ 
  mode, 
  setMode, 
  difficulty, 
  setDifficulty, 
  eventMode, 
  setEventMode, 
  matchTime = 90, 
  setMatchTime, 
  gameTitle = 'ROMEOLEON FUTBOL',
  onStart, 
  onSettings 
}) => {

  const cycleEventMode = (dir) => {
    const idx = EVENT_MODES.findIndex(e => e.id === eventMode);
    const nextIdx = (idx + dir + EVENT_MODES.length) % EVENT_MODES.length;
    setEventMode(EVENT_MODES[nextIdx].id);
  };

  const currentEvent = EVENT_MODES.find(e => e.id === eventMode) || EVENT_MODES[0];

  return (
    <div className="menu-panel">
      {/* Header section */}
      <div className="menu-header">
        <img 
          src={logoUrl} 
          alt="RomeoLeoN Futbol" 
          className="main-logo"
        />
        <h1 className="main-title">
          {gameTitle || 'ROMEOLEON FUTBOL'}
        </h1>
      </div>
      
      {/* Main Options Grid */}
      <div className="menu-grid">
        {/* Column 1: Game Mode & Difficulty */}
        <div className="menu-card">
          <h3 className="menu-card-title">OYUN MODU</h3>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <button 
              className={`btn ${mode === 1 ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, padding: '0.75rem 1rem', fontSize: '1.1rem' }}
              onClick={() => setMode(1)}
            >
              <Bot size={22} /> 1 Kişilik
            </button>
            <button 
              className={`btn ${mode === 2 ? 'btn-secondary' : 'btn-outline'}`}
              style={{ flex: 1, padding: '0.75rem 1rem', fontSize: '1.1rem' }}
              onClick={() => setMode(2)}
            >
              <Users size={22} /> 2 Kişilik
            </button>
          </div>

          {mode === 1 ? (
            <div>
              <h4 style={{ marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Zorluk Seviyesi</h4>
              <div className="difficulty-selector">
                <button 
                  className={`diff-btn ${difficulty === 'easy' ? 'active' : ''}`}
                  onClick={() => setDifficulty('easy')}
                >
                  Kolay
                </button>
                <button 
                  className={`diff-btn ${difficulty === 'medium' ? 'active' : ''}`}
                  onClick={() => setDifficulty('medium')}
                >
                  Orta
                </button>
                <button 
                  className={`diff-btn ${difficulty === 'hard' ? 'active' : ''}`}
                  onClick={() => setDifficulty('hard')}
                >
                  Zor
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h4 style={{ marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Kontroller</h4>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.5rem', borderRadius: '10px', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
                1. Oyuncu: <b style={{ color: '#fbbf24' }}>WASD</b> | 2. Oyuncu: <b style={{ color: '#38bdf8' }}>Ok Tuşları</b>
              </div>
            </div>
          )}
        </div>

        {/* Column 2: Event Mode & Match Duration (Both fit seamlessly inside the card) */}
        <div className="menu-card">
          <h3 className="menu-card-title" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Zap size={20} /> ETKİNLİK MODU
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0.65rem 0.85rem', borderRadius: '14px', marginBottom: '1rem' }}>
            <button className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '1.1rem' }} onClick={() => cycleEventMode(-1)}>&lt;</button>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: currentEvent.id === 'classic' ? '#fff' : '#fbbf24', textAlign: 'center' }}>
              {currentEvent.icon} {currentEvent.name}
            </span>
            <button className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '1.1rem' }} onClick={() => cycleEventMode(1)}>&gt;</button>
          </div>

          <div>
            <h4 style={{ marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} color="var(--primary)" /> Oyun Süresi
            </h4>
            <div className="difficulty-selector">
              <button 
                className={`diff-btn ${matchTime === 90 ? 'active' : ''}`}
                onClick={() => setMatchTime && setMatchTime(90)}
              >
                1.5 Dk
              </button>
              <button 
                className={`diff-btn ${matchTime === 180 ? 'active' : ''}`}
                onClick={() => setMatchTime && setMatchTime(180)}
              >
                3 Dk
              </button>
              <button 
                className={`diff-btn ${matchTime === 300 ? 'active' : ''}`}
                onClick={() => setMatchTime && setMatchTime(300)}
              >
                5 Dk
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="menu-actions">
        <button 
          className="btn btn-outline" 
          style={{ flex: 1, fontSize: '1.2rem', padding: '0.85rem' }}
          onClick={onSettings}
        >
          <Settings size={22} /> AYARLAR
        </button>

        <button 
          className="btn btn-primary" 
          style={{ flex: 2, fontSize: '1.35rem', padding: '0.85rem' }}
          onClick={onStart}
        >
          <Play size={24} fill="currentColor" /> OYUNA BAŞLA
        </button>
      </div>
    </div>
  );
};

export default MainMenu;
