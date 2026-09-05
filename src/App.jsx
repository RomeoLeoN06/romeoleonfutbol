import React, { useState } from 'react';
import MainMenu from './components/MainMenu';
import GameContainer from './components/GameContainer';
import SettingsMenu from './components/SettingsMenu';
import OrientationGuard from './components/OrientationGuard';
import { Trophy } from 'lucide-react';
import './index.css';

function App() {
  const [gameState, setGameState] = useState('menu'); // 'menu' | 'playing' | 'gameover' | 'customizer'
  const [gameMode, setGameMode] = useState(1); // 1 or 2 players
  const [difficulty, setDifficulty] = useState('medium'); // 'easy' | 'medium' | 'hard'
  const [finalScore, setFinalScore] = useState({ p1: 0, p2: 0 });
  const [eventMode, setEventMode] = useState('classic');

  const gameTitle = 'ROMEOLEON FUTBOL';

  // Customization state with localStorage persistence
  const [p1Custom, setP1Custom] = useState(() => {
    try {
      const saved = localStorage.getItem('romeoleon_p1_custom');
      return saved ? JSON.parse(saved) : { name: 'Oyuncu 1', jersey: { league: 'Süper Lig', teamIndex: 0 }, skin: 'light', hair: 0 };
    } catch (e) {
      return { name: 'Oyuncu 1', jersey: { league: 'Süper Lig', teamIndex: 0 }, skin: 'light', hair: 0 };
    }
  });

  const [p2Custom, setP2Custom] = useState(() => {
    try {
      const saved = localStorage.getItem('romeoleon_p2_custom');
      return saved ? JSON.parse(saved) : { name: 'Oyuncu 2', jersey: { league: 'Süper Lig', teamIndex: 1 }, skin: 'medium', hair: 1 };
    } catch (e) {
      return { name: 'Oyuncu 2', jersey: { league: 'Süper Lig', teamIndex: 1 }, skin: 'medium', hair: 1 };
    }
  });

  const [envCustom, setEnvCustom] = useState({ stadium: 0, grass: 'green', ball: 'classic', goal: 'white_net', map: 'none', time: 90 });

  // Persist nick & customization
  React.useEffect(() => {
    try {
      localStorage.setItem('romeoleon_p1_custom', JSON.stringify(p1Custom));
    } catch (e) {}
  }, [p1Custom]);

  React.useEffect(() => {
    try {
      localStorage.setItem('romeoleon_p2_custom', JSON.stringify(p2Custom));
    } catch (e) {}
  }, [p2Custom]);

  const startGame = (mode, diff) => {
    setGameMode(mode);
    setDifficulty(diff);
    setGameState('playing');
  };

  const handleGameOver = (score) => {
    setFinalScore(score);
    setGameState('gameover');
  };

  const returnToMenu = () => {
    setGameState('menu');
  };

  return (
    <div className="app-container">
      <OrientationGuard />
      {gameState === 'menu' && (
        <MainMenu 
          mode={gameMode} 
          setMode={setGameMode}
          difficulty={difficulty} 
          setDifficulty={setDifficulty}
          eventMode={eventMode}
          setEventMode={setEventMode}
          matchTime={envCustom.time || 90}
          setMatchTime={(t) => setEnvCustom(prev => ({ ...prev, time: t }))}
          gameTitle={gameTitle}
          onStart={() => setGameState('playing')} 
          onSettings={() => setGameState('settings')}
        />
      )}
      
      {gameState === 'settings' && (
        <SettingsMenu 
          gameMode={gameMode}
          p1Custom={p1Custom}
          setP1Custom={setP1Custom}
          p2Custom={p2Custom}
          setP2Custom={setP2Custom}
          envCustom={envCustom}
          setEnvCustom={setEnvCustom}
          onBack={() => setGameState('menu')} 
        />
      )}

      {gameState === 'playing' && (
        <GameContainer 
          mode={gameMode} 
          difficulty={difficulty} 
          onGameOver={handleGameOver}
          onMenu={returnToMenu}
          p1Custom={p1Custom}
          p2Custom={p2Custom}
          envCustom={envCustom}
          eventMode={eventMode}
          gameTitle={gameTitle}
        />
      )}

      {gameState === 'gameover' && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, animation: 'fadeIn 0.5s ease-out'
        }}>
          <div className="game-over-box">
            <Trophy size={80} color="var(--primary)" style={{ filter: 'drop-shadow(0 10px 15px rgba(212,175,55,0.4))', marginBottom: '1.5rem', animation: 'float 3s ease-in-out infinite' }} />
            
            <h2 className="game-over-title">
              MAÇ BİTTİ!
            </h2>
            
            <div className="game-over-winnerText">
              {finalScore.p1 > finalScore.p2 
                ? `${(p1Custom?.name || 'OYUNCU 1').toUpperCase()} \u00A0 KAZANDI!` 
                : finalScore.p2 > finalScore.p1 
                  ? `${(p2Custom?.name || (gameMode === 1 ? 'YAPAY ZEKA' : 'OYUNCU 2')).toUpperCase()} \u00A0 KAZANDI!` 
                  : 'BERABERE!'}
            </div>

            <div className="game-over-scorebox">
               <div className="game-over-score" style={{ color: finalScore.p1 >= finalScore.p2 ? 'var(--primary)' : 'var(--text-muted)' }}>{finalScore.p1}</div>
               <div style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>-</div>
               <div className="game-over-score" style={{ color: finalScore.p2 >= finalScore.p1 ? 'var(--secondary)' : 'var(--text-muted)' }}>{finalScore.p2}</div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
              <button className="btn btn-primary" style={{ fontSize: '1.2rem', padding: '1rem 2rem' }} onClick={() => setGameState('playing')}>
                TEKRAR OYNA
              </button>
              <button className="btn btn-outline" style={{ fontSize: '1.2rem', padding: '1rem 2rem' }} onClick={returnToMenu}>
                ANA MENÜ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
