import React, { useEffect, useRef, useState } from 'react';
import ScoreBoard from './ScoreBoard';
import { GameEngine } from '../game/engine';
import { GameAI } from '../game/ai';
import { Info, Home, X, Maximize2, Minimize2 } from 'lucide-react';
import { generateStadiumBackgroundSVG } from '../utils/svgGenerator';

const GameContainer = ({ mode, difficulty, onGameOver, onMenu, p1Custom, p2Custom, envCustom, eventMode, gameTitle }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const aiRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [score, setScore] = useState({ p1: 0, p2: 0 });
  const [timeLeft, setTimeLeft] = useState(envCustom?.time || 90);
  const [countdownText, setCountdownText] = useState("3");
  const [lastScorer, setLastScorer] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [fireShots, setFireShots] = useState({ p1: 2, p2: 2 });
  const [buffTimers, setBuffTimers] = useState({ p1: 0, p2: 0 });
  const [freezeCharges, setFreezeCharges] = useState({ p1: 2, p2: 2 });
  const [frozenState, setFrozenState] = useState({ p1: false, p2: false });
  const [shieldCharges, setShieldCharges] = useState({ p1: 2, p2: 2 });
  const [shieldActive, setShieldActive] = useState({ p1: false, p2: false });
  const [giantCharges, setGiantCharges] = useState({ p1: 2, p2: 2 });
  const [giantActive, setGiantActive] = useState({ p1: false, p2: false });
  const [skillBanner, setSkillBanner] = useState(null);
  const skillBannerTimerRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen().catch(() => {});
        }
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock('landscape').catch(() => {});
        } else if (screen.lockOrientation) {
          screen.lockOrientation('landscape');
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    } catch (e) {}
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Initialize Game
  useEffect(() => {
    if (!canvasRef.current) return;

    const handleScore = (playerNum, points = 1) => {
      setScore(prev => {
        const newScore = { ...prev };
        if (playerNum === 1) newScore.p1 += points;
        else newScore.p2 += points;
        return newScore;
      });
      setLastScorer(playerNum);
      setCountdownText("GOL!");
      setBuffTimers({ p1: 0, p2: 0 }); // Gol olunca aktif buff anında sonlanır
      setFrozenState({ p1: false, p2: false });
      setShieldActive({ p1: false, p2: false });
      setGiantActive({ p1: false, p2: false });

      // Play Stadium 'GOL' Sound
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const bufferSize = audioCtx.sampleRate * 2; // 2 seconds
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(1.5, audioCtx.currentTime + 0.3);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2.0);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        noise.start();

      } catch (e) {
        console.error("Stadium audio failed", e);
      }
    };

    const handleSkillUsed = (
      shooterNum,
      p1Remaining,
      p2Remaining,
      p1BuffSecs = 0,
      p2BuffSecs = 0,
      eventType = 'tick',
      extraData = null
    ) => {
      setFireShots({ p1: p1Remaining, p2: p2Remaining });
      setBuffTimers({ p1: p1BuffSecs, p2: p2BuffSecs });

      if (extraData) {
        setFreezeCharges({
          p1: extraData.p1FreezeCharges,
          p2: extraData.p2FreezeCharges
        });
        setFrozenState({
          p1: extraData.p1Frozen,
          p2: extraData.p2Frozen
        });
        setShieldCharges({
          p1: extraData.p1ShieldCharges,
          p2: extraData.p2ShieldCharges
        });
        setShieldActive({
          p1: extraData.p1ShieldActive,
          p2: extraData.p2ShieldActive
        });
        setGiantCharges({
          p1: extraData.p1GiantCharges,
          p2: extraData.p2GiantCharges
        });
        setGiantActive({
          p1: extraData.p1GiantActive,
          p2: extraData.p2GiantActive
        });
      }

      const getActorName = (num) => {
        return num === 1 ? (p1Custom?.name || 'OYUNCU 1') : (p2Custom?.name || (mode === 1 ? 'YAPAY ZEKA' : 'OYUNCU 2'));
      };

      if (eventType === 'buff_activated' && shooterNum) {
        setSkillBanner(`🔥 ${getActorName(shooterNum)}: ALEVLİ GÜÇ AKTİF!`);
        if (skillBannerTimerRef.current) clearTimeout(skillBannerTimerRef.current);
        skillBannerTimerRef.current = setTimeout(() => setSkillBanner(null), 1200);
      } else if (eventType === 'shot_fired' && shooterNum) {
        setSkillBanner(`🚀 ${getActorName(shooterNum)}: ROKET VURUŞU!`);
        if (skillBannerTimerRef.current) clearTimeout(skillBannerTimerRef.current);
        skillBannerTimerRef.current = setTimeout(() => setSkillBanner(null), 1200);
      } else if (eventType === 'freeze_activated' && shooterNum) {
        const victimName = shooterNum === 1 ? (mode === 1 ? 'YAPAY ZEKA' : 'OYUNCU 2') : 'OYUNCU 1';
        setSkillBanner(`❄️ ${getActorName(shooterNum)}: BUZ TUZAĞI! [${victimName} 5s DONDU]`);
        if (skillBannerTimerRef.current) clearTimeout(skillBannerTimerRef.current);
        skillBannerTimerRef.current = setTimeout(() => setSkillBanner(null), 1600);
      } else if (eventType === 'ice_shattered' && shooterNum) {
        setSkillBanner(`💥 ${getActorName(shooterNum)}: BUZU KIRIP KURTULDU!`);
        if (skillBannerTimerRef.current) clearTimeout(skillBannerTimerRef.current);
        skillBannerTimerRef.current = setTimeout(() => setSkillBanner(null), 1200);
      } else if (eventType === 'shield_activated' && shooterNum) {
        setSkillBanner(`🧱 ${getActorName(shooterNum)}: KALE KALKANI KURULDU!`);
        if (skillBannerTimerRef.current) clearTimeout(skillBannerTimerRef.current);
        skillBannerTimerRef.current = setTimeout(() => setSkillBanner(null), 1400);
      } else if (eventType === 'shield_shattered') {
        setSkillBanner(`💥 KALE KALKANI ŞUTU ENGELLEYİP PARÇALANDI!`);
        if (skillBannerTimerRef.current) clearTimeout(skillBannerTimerRef.current);
        skillBannerTimerRef.current = setTimeout(() => setSkillBanner(null), 1400);
      } else if (eventType === 'giant_activated' && shooterNum) {
        setSkillBanner(`🍄 ${getActorName(shooterNum)}: DEV MODU AKTİF!`);
        if (skillBannerTimerRef.current) clearTimeout(skillBannerTimerRef.current);
        skillBannerTimerRef.current = setTimeout(() => setSkillBanner(null), 1400);
      }
    };

    const engine = new GameEngine(
      canvasRef.current, 
      handleScore, 
      p1Custom, 
      p2Custom, 
      envCustom, 
      eventMode, 
      mode === 1,
      handleSkillUsed
    );
    engineRef.current = engine;

    if (mode === 1) {
      aiRef.current = new GameAI(engine, difficulty);
    }

    // AI Loop
    const gameLoop = () => {
      if (mode === 1 && aiRef.current) {
        aiRef.current.update();
      }
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };
    gameLoop();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      engine.destroy();
    };
  }, [mode, difficulty]);

  // Timer logic - Time continues even during goal celebrations!
  useEffect(() => {
    if (timeLeft <= 0) {
      onGameOver(score);
      return;
    }

    // Only pause the actual match timer if the info modal is open
    if (showInfo) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, score, onGameOver, showInfo]);

  // Pause/Resume Physics Engine logic
  useEffect(() => {
    if (engineRef.current) {
      if (countdownText !== "" || showInfo) {
        engineRef.current.setPaused(true);
      } else {
        engineRef.current.setPaused(false);
      }
    }
  }, [countdownText, showInfo]);

  // Countdown sequence logic
  useEffect(() => {
    if (countdownText === "") return;

    let timer;
    if (countdownText === "GOL!") {
      timer = setTimeout(() => {
        // Reset positions WITH current scores for kickoff advantage after showing the goal for 1.5s
        if (engineRef.current) {
          engineRef.current.resetPositions(score.p1, score.p2);
        }
        setCountdownText("3");
      }, 1500);
    } else if (countdownText === "3") {
      timer = setTimeout(() => setCountdownText("2"), 1000);
    } else if (countdownText === "2") {
      timer = setTimeout(() => setCountdownText("1"), 1000);
    } else if (countdownText === "1") {
      timer = setTimeout(() => setCountdownText(""), 1000);
    }

    return () => clearTimeout(timer);
  }, [countdownText, score]);

  // Environment styling
  const getStadiumStyle = () => {
    const isGoal = countdownText === "GOL!"; // "GOL!" means a goal was just scored (fans cheer)
    return { 
      backgroundImage: generateStadiumBackgroundSVG(envCustom?.stadium || 0, isGoal, gameTitle),
      backgroundSize: 'cover',
      backgroundPosition: 'center bottom'
    };
  };

  const getGrassStyle = () => {
    if (eventMode === 'ice') {
      return { background: 'linear-gradient(to bottom, #a5f3fc, #0891b2)', borderTop: '2px solid rgba(255,255,255,0.8)' };
    }
    switch (envCustom?.grass) {
      case 'autumn': return { background: 'linear-gradient(to bottom, #d97706, #92400e)' };
      case 'dark': return { background: 'linear-gradient(to bottom, #064e3b, #022c22)' };
      default: return {};
    }
  };

  return (
    <div className="game-area" ref={containerRef}>

      {/* Center Modal for Info/Controls */}
      {showInfo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(2, 6, 23, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'var(--panel-bg)',
            border: '2px solid var(--panel-border)',
            borderRadius: '20px',
            padding: '2rem 3rem',
            maxWidth: '650px',
            width: '90%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowInfo(false)}
              className="btn btn-outline"
              style={{
                position: 'absolute', top: '15px', right: '15px',
                padding: '0.4rem', border: 'none', background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X size={26} color="#94a3b8" />
            </button>
            
            <h2 style={{ color: 'white', textAlign: 'center', margin: '0 0 2rem 0', letterSpacing: '2px' }}>OYUN KONTROLLERİ</h2>
            
            <div style={{ display: 'flex', gap: '3rem', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <h4 style={{ color: 'var(--primary)', margin: '0 0 1rem 0', fontSize: '1.1rem', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>OYUNCU 1 (SOL)</h4>
                <p style={{ margin: '0.6rem 0', color: '#e2e8f0', fontSize: '0.95rem' }}><b style={{ color: '#fbbf24', display: 'inline-block', width: mode === 1 ? '85px' : '60px' }}>{mode === 1 ? 'W / ↑' : 'W'}</b> : Zıpla</p>
                <p style={{ margin: '0.6rem 0', color: '#e2e8f0', fontSize: '0.95rem' }}><b style={{ color: '#fbbf24', display: 'inline-block', width: mode === 1 ? '85px' : '60px' }}>{mode === 1 ? 'A / ←' : 'A'}</b> : Sola</p>
                <p style={{ margin: '0.6rem 0', color: '#e2e8f0', fontSize: '0.95rem' }}><b style={{ color: '#fbbf24', display: 'inline-block', width: mode === 1 ? '85px' : '60px' }}>{mode === 1 ? 'D / →' : 'D'}</b> : Sağa</p>
                <p style={{ margin: '0.6rem 0', color: '#e2e8f0', fontSize: '0.95rem' }}><b style={{ color: '#fbbf24', display: 'inline-block', width: mode === 1 ? '85px' : '60px' }}>SPACE</b> : Şut / Vuruş (Donunca 5x bas!)</p>
                <p style={{ margin: '0.6rem 0', color: '#e2e8f0', fontSize: '0.95rem' }}><b style={{ color: '#f97316', display: 'inline-block', width: mode === 1 ? '85px' : '60px' }}>Q</b> : 🔥 Alevli Şut (Maks 2)</p>
                <p style={{ margin: '0.6rem 0', color: '#e2e8f0', fontSize: '0.95rem' }}><b style={{ color: '#38bdf8', display: 'inline-block', width: mode === 1 ? '85px' : '60px' }}>E</b> : ❄️ Buz Tuzağı (5s dondurur, Maks 2)</p>
                <p style={{ margin: '0.6rem 0', color: '#e2e8f0', fontSize: '0.95rem' }}><b style={{ color: '#38bdf8', display: 'inline-block', width: mode === 1 ? '85px' : '60px' }}>Z</b> : 🧱 Kale Kalkanı (5s / 1 şut sektirir, Maks 2)</p>
                <p style={{ margin: '0.6rem 0', color: '#e2e8f0', fontSize: '0.95rem' }}><b style={{ color: '#fbbf24', display: 'inline-block', width: mode === 1 ? '85px' : '60px' }}>X</b> : 🍄 Dev Karakter (5s devleşme, Maks 2)</p>
              </div>

              <div style={{ flex: 1, minWidth: '220px' }}>
                <h4 style={{ color: 'var(--secondary)', margin: '0 0 1rem 0', fontSize: '1.1rem', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                  {mode === 2 ? 'OYUNCU 2 (SAĞ)' : 'YAPAY ZEKA'}
                </h4>
                {mode === 2 ? (
                  <>
                    <p style={{ margin: '0.6rem 0', color: '#e2e8f0', fontSize: '0.95rem' }}><b style={{ color: '#38bdf8', display: 'inline-block', width: '85px' }}>YUKARI</b> : Zıpla</p>
                    <p style={{ margin: '0.6rem 0', color: '#e2e8f0', fontSize: '0.95rem' }}><b style={{ color: '#38bdf8', display: 'inline-block', width: '85px' }}>SOL</b> : Sola</p>
                    <p style={{ margin: '0.6rem 0', color: '#e2e8f0', fontSize: '0.95rem' }}><b style={{ color: '#38bdf8', display: 'inline-block', width: '85px' }}>SAĞ</b> : Sağa</p>
                    <p style={{ margin: '0.6rem 0', color: '#e2e8f0', fontSize: '0.95rem' }}><b style={{ color: '#38bdf8', display: 'inline-block', width: '85px' }}>P</b> : Şut / Vuruş (Donunca 5x bas!)</p>
                    <p style={{ margin: '0.6rem 0', color: '#e2e8f0', fontSize: '0.95rem' }}><b style={{ color: '#f97316', display: 'inline-block', width: '85px' }}>O</b> : 🔥 Alevli Şut (Maks 2)</p>
                    <p style={{ margin: '0.6rem 0', color: '#e2e8f0', fontSize: '0.95rem' }}><b style={{ color: '#38bdf8', display: 'inline-block', width: '85px' }}>Ğ</b> : ❄️ Buz Tuzağı (5s dondurur, Maks 2)</p>
                    <p style={{ margin: '0.6rem 0', color: '#e2e8f0', fontSize: '0.95rem' }}><b style={{ color: '#38bdf8', display: 'inline-block', width: '85px' }}>Ö</b> : 🧱 Kale Kalkanı (5s / 1 şut sektirir, Maks 2)</p>
                    <p style={{ margin: '0.6rem 0', color: '#e2e8f0', fontSize: '0.95rem' }}><b style={{ color: '#fbbf24', display: 'inline-block', width: '85px' }}>Ç</b> : 🍄 Dev Karakter (5s devleşme, Maks 2)</p>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', paddingBottom: '1rem' }}>
                    <span style={{ color: 'var(--accent)', fontSize: '1.1rem', fontWeight: 'bold' }}>{difficulty.toUpperCase()} MODU AKTİF</span>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.5rem' }}>Bot, stratejik olarak 🔥 Alevli Şut, ❄️ Buz Tuzağı, 🧱 Kale Kalkanı ve 🍄 Dev Modu kullanabilir.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
               <button className="btn btn-primary" onClick={() => setShowInfo(false)} style={{ padding: '0.6rem 3rem', fontSize: '1.1rem' }}>OYUNA DÖN</button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Unified Top Bar: Left Buttons + Centered ScoreBoard + Fullscreen / Landscape */}
      <div className="game-top-bar">
        <div className="game-nav-cluster left">
          <button
            className="game-nav-btn"
            onClick={onMenu}
            title="Menüye Dön"
          >
            <Home size={18} />
          </button>
          <button
            className={`game-nav-btn ${showInfo ? 'active' : ''}`}
            onClick={() => setShowInfo(true)}
            title="Kontroller Bilgisi"
          >
            <Info size={18} />
          </button>
        </div>

        <ScoreBoard 
          score1={score.p1} 
          score2={score.p2} 
          timeRemaining={timeLeft} 
          p1Name={p1Custom?.name || 'Oyuncu 1'}
          p2Name={p2Custom?.name || (mode === 1 ? 'Yapay Zeka' : 'Oyuncu 2')}
          p1FireShots={fireShots.p1}
          p2FireShots={fireShots.p2}
          p1BuffSeconds={buffTimers.p1}
          p2BuffSeconds={buffTimers.p2}
          p1FreezeCharges={freezeCharges.p1}
          p2FreezeCharges={freezeCharges.p2}
          p1Frozen={frozenState.p1}
          p2Frozen={frozenState.p2}
          p1ShieldCharges={shieldCharges.p1}
          p2ShieldCharges={shieldCharges.p2}
          p1ShieldActive={shieldActive.p1}
          p2ShieldActive={shieldActive.p2}
          p1GiantCharges={giantCharges.p1}
          p2GiantCharges={giantCharges.p2}
          p1GiantActive={giantActive.p1}
          p2GiantActive={giantActive.p2}
          isSinglePlayer={mode === 1}
        />

        <div className="game-nav-cluster right">
          <button
            className="game-nav-btn"
            onClick={toggleFullscreen}
            title="Tam Ekran / Yatay Mod"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      <div className="game-layout-wrapper">
        <div className="game-canvas-container" style={getStadiumStyle()}>
          <div className="stadium-bg"></div>
          <div className="stadium-grass" style={getGrassStyle()}></div>
          <canvas ref={canvasRef}></canvas>

          {skillBanner && (
            <div className="skill-banner-overlay">
              <div className="skill-banner-text">{skillBanner}</div>
            </div>
          )}

          {countdownText && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              zIndex: 50, pointerEvents: 'none'
            }}>
              {countdownText === "GOL!" ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem',
                  animation: 'scaleInGoal 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                  <div style={{
                    fontSize: '6.5rem', fontWeight: 900,
                    background: 'linear-gradient(to bottom, #fff7d6 0%, #d4af37 40%, #fef08a 60%, #855f16 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 35px rgba(251, 191, 36, 0.95))',
                    letterSpacing: '4px',
                    lineHeight: 1
                  }}>
                    GOL!
                  </div>
                  <div style={{
                    fontSize: '1.75rem', fontWeight: 900,
                    color: '#ffffff',
                    background: lastScorer === 1 
                      ? 'linear-gradient(135deg, rgba(30, 58, 138, 0.94), rgba(15, 23, 42, 0.96))' 
                      : 'linear-gradient(135deg, rgba(131, 24, 67, 0.94), rgba(15, 23, 42, 0.96))',
                    border: lastScorer === 1 ? '2px solid rgba(56, 189, 248, 0.85)' : '2px solid rgba(244, 114, 182, 0.85)',
                    boxShadow: lastScorer === 1 ? '0 0 35px rgba(56, 189, 248, 0.65)' : '0 0 35px rgba(244, 114, 182, 0.65)',
                    padding: '0.55rem 2rem',
                    borderRadius: '24px',
                    letterSpacing: '1px',
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    textTransform: 'uppercase'
                  }}>
                    <span style={{ fontSize: '1.6rem' }}>⚽</span>
                    <span style={{ color: lastScorer === 1 ? '#38bdf8' : '#f472b6', fontWeight: 900 }}>
                      {lastScorer === 1 ? (p1Custom?.name || 'OYUNCU 1') : (p2Custom?.name || (mode === 1 ? 'YAPAY ZEKA' : 'OYUNCU 2'))}
                    </span>
                    <span style={{ color: '#f8fafc' }}>GOLÜ ATTI!</span>
                    <span style={{ fontSize: '1.6rem' }}>🔥</span>
                  </div>
                </div>
              ) : (
                <div style={{
                  fontSize: '8rem', fontWeight: 'bold', color: 'white',
                  textShadow: '0 0 25px rgba(0,0,0,0.9)', animation: 'pulse 1s infinite'
                }}>
                  {countdownText}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameContainer;

