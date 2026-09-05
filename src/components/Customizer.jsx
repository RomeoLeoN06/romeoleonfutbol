import React, { useState } from 'react';
import { generatePlayerSVG, generateShoeSVG } from '../utils/svgGenerator';
import { LEAGUES } from '../utils/teams';
import { HAIRSTYLES } from '../utils/hairstyles';
import { User, Bot, Users, Edit3, Sparkles, Check, CheckCheck } from 'lucide-react';

const LEAGUE_NAMES = Object.keys(LEAGUES);
const SKIN_COLORS = ['light', 'medium', 'dark'];
const SKIN_LABELS = {
  light: '🏻 Açık Ten',
  medium: '🏽 Buğday Ten',
  dark: '🏿 Koyu Ten'
};
const HAIR_INDICES = HAIRSTYLES.map((_, i) => i);

const Customizer = ({ 
  gameMode, 
  p1Custom, 
  setP1Custom, 
  p2Custom, 
  setP2Custom, 
  onBack, 
  hideWrapper 
}) => {
  // Aktif düzenlenen oyuncu sekmesi: 1 (Sol / Sen) veya 2 (Sağ / Rakip)
  const [activePlayer, setActivePlayer] = useState(1);
  const [isNickSaved, setIsNickSaved] = useState(false);

  const updateP1 = (key, value) => setP1Custom(prev => ({ ...prev, [key]: value }));
  const updateP2 = (key, value) => setP2Custom(prev => ({ ...prev, [key]: value }));

  const cycle = (arr, current, setFn, key) => {
    const idx = arr.indexOf(current);
    const nextIdx = (idx + 1) % arr.length;
    setFn(key, arr[nextIdx]);
  };

  const cycleBack = (arr, current, setFn, key) => {
    const idx = arr.indexOf(current);
    const nextIdx = (idx - 1 + arr.length) % arr.length;
    setFn(key, arr[nextIdx]);
  };

  const cycleLeague = (currentLeague, setFn) => {
    const idx = LEAGUE_NAMES.indexOf(currentLeague);
    const nextIdx = (idx + 1) % LEAGUE_NAMES.length;
    setFn('jersey', { league: LEAGUE_NAMES[nextIdx], teamIndex: 0 });
  };
  const cycleBackLeague = (currentLeague, setFn) => {
    const idx = LEAGUE_NAMES.indexOf(currentLeague);
    const nextIdx = (idx - 1 + LEAGUE_NAMES.length) % LEAGUE_NAMES.length;
    setFn('jersey', { league: LEAGUE_NAMES[nextIdx], teamIndex: 0 });
  };

  const cycleTeam = (league, currentTeamIndex, setFn) => {
    const teams = LEAGUES[league] || LEAGUES['Süper Lig'];
    const nextIdx = (currentTeamIndex + 1) % teams.length;
    setFn('jersey', { league, teamIndex: nextIdx });
  };
  const cycleBackTeam = (league, currentTeamIndex, setFn) => {
    const teams = LEAGUES[league] || LEAGUES['Süper Lig'];
    const nextIdx = (currentTeamIndex - 1 + teams.length) % teams.length;
    setFn('jersey', { league, teamIndex: nextIdx });
  };

  const currentCustom = activePlayer === 1 ? p1Custom : p2Custom;
  const currentUpdateFn = activePlayer === 1 ? updateP1 : updateP2;
  const isLeftPlayer = activePlayer === 1;

  const leagueName = currentCustom?.jersey?.league || 'Süper Lig';
  const teamIndex = currentCustom?.jersey?.teamIndex || 0;
  const teamName = LEAGUES[leagueName]?.[teamIndex]?.name || 'Takım';
  const currentHair = HAIRSTYLES[currentCustom?.hair || 0] || HAIRSTYLES[0];

  const playerRoleTitle = activePlayer === 1 
    ? '1. OYUNCU (SOL - SEN)' 
    : (gameMode === 1 ? '2. OYUNCU (YAPAY ZEKA)' : '2. OYUNCU (SAĞ)');

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Oyuncu Seçici Sekmeleri */}
      <div style={{ display: 'flex', gap: '0.6rem', width: '100%' }}>
        <button 
          className={`btn ${activePlayer === 1 ? 'btn-primary' : 'btn-outline'}`}
          style={{ 
            flex: 1, 
            padding: '0.45rem 0.85rem', 
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            borderRadius: '10px'
          }}
          onClick={() => setActivePlayer(1)}
        >
          <User size={18} /> 1. OYUNCU (SOL)
        </button>

        <button 
          className={`btn ${activePlayer === 2 ? 'btn-secondary' : 'btn-outline'}`}
          style={{ 
            flex: 1, 
            padding: '0.45rem 0.85rem', 
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            borderRadius: '10px'
          }}
          onClick={() => setActivePlayer(2)}
        >
          {gameMode === 1 ? <Bot size={18} /> : <Users size={18} />} 
          {gameMode === 1 ? '2. OYUNCU (YAPAY ZEKA)' : '2. OYUNCU (SAĞ)'}
        </button>
      </div>

      {/* Ana Özelleştirme Alanı: Sol Kolon (3D Podyum Önizleme) + Sağ Kolon (Derli Toplu Ayar Paneli) */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'stretch',
        gap: '0.85rem',
        width: '100%'
      }}>
        
        {/* Sol Kolon: Canlı Karakter 3D Podyum Önizlemesi */}
        <div style={{
          flex: '1 1 310px',
          maxWidth: '440px',
          minWidth: '270px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.45rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.2rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: isLeftPlayer ? 'var(--primary)' : 'var(--secondary)', letterSpacing: '0.5px' }}>
              ⭐ {playerRoleTitle}
            </span>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#fbbf24', background: 'rgba(251,191,36,0.15)', padding: '0.15rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(251,191,36,0.3)' }}>
              {teamName}
            </span>
          </div>

          <div style={{
            width: '100%',
            height: '215px',
            borderRadius: '14px',
            position: 'relative',
            overflow: 'hidden',
            border: '1.5px solid rgba(255,255,255,0.14)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.55)',
            background: 'radial-gradient(circle at 50% 35%, #1e293b 0%, #0f172a 70%, #020617 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Sahne Arka Spot Işığı */}
            <div style={{
              position: 'absolute',
              top: '10px',
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: isLeftPlayer ? 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, rgba(0,0,0,0) 70%)' : 'radial-gradient(circle, rgba(236,72,153,0.25) 0%, rgba(0,0,0,0) 70%)',
              pointerEvents: 'none'
            }}></div>

            {/* Podyum Zemin Halkası */}
            <div style={{
              position: 'absolute',
              bottom: '15px',
              width: '170px',
              height: '32px',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.6) 80%)',
              border: '1.2px solid rgba(255,255,255,0.12)',
              boxShadow: '0 0 16px rgba(0,0,0,0.8)'
            }}></div>

            {/* 3D Karakter Önizlemesi */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, transform: 'translateY(-4px)' }}>
              <img 
                src={generatePlayerSVG(isLeftPlayer, currentCustom?.jersey, currentCustom?.skin, currentCustom?.hair)} 
                alt="Player" 
                width="132" 
                height="132" 
                style={{ filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.7))' }} 
              />
              <img 
                src={generateShoeSVG(isLeftPlayer, currentCustom?.jersey)} 
                alt="Shoe" 
                width="68" 
                height="45" 
                style={{ marginTop: '-15px', filter: 'drop-shadow(0 5px 5px rgba(0,0,0,0.6))' }} 
              />
            </div>
          </div>

          {/* Canlı Seçim Özeti Rozetleri */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'rgba(0,0,0,0.3)',
            padding: '0.35rem 0.65rem',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.06)',
            fontSize: '0.78rem'
          }}>
            <span style={{ color: '#94a3b8' }}>Seçili:</span>
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>{teamName}</span>
            <span style={{ color: '#64748b' }}>•</span>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>{SKIN_LABELS[currentCustom?.skin] || 'Açık Ten'}</span>
            <span style={{ color: '#64748b' }}>•</span>
            <span style={{ color: '#a855f7', fontWeight: 600 }}>{currentHair?.name || 'Saç'}</span>
          </div>
        </div>

        {/* Sağ Kolon: Derli Toplu & Orantılı Ayarlama Paneli */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '0.65rem 0.95rem',
          borderRadius: '14px',
          flex: '1 1 350px',
          maxWidth: '480px',
          minWidth: '270px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '0.42rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
        }}>
          
          {/* Oyuncu İsmi Girişi + Onaylama/Kaydetme Butonu */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.35)',
            padding: '0.32rem 0.65rem',
            borderRadius: '10px',
            border: isNickSaved ? '1px solid rgba(34, 197, 94, 0.5)' : '1px solid rgba(255,255,255,0.06)',
            boxShadow: isNickSaved ? '0 0 10px rgba(34, 197, 94, 0.2)' : 'none',
            transition: 'all 0.3s ease'
          }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', minWidth: '85px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Edit3 size={14} color="var(--primary)" /> İsim / Nick:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input 
                type="text"
                value={currentCustom?.name || ''}
                onChange={(e) => {
                  currentUpdateFn('name', e.target.value);
                  setIsNickSaved(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsNickSaved(true);
                    setTimeout(() => setIsNickSaved(false), 2000);
                  }
                }}
                placeholder="Oyuncu İsmi"
                maxLength={14}
                style={{
                  width: '125px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: isNickSaved ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '7px',
                  padding: '0.22rem 0.5rem',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  outline: 'none',
                  textAlign: 'center',
                  transition: 'border-color 0.2s ease'
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setIsNickSaved(true);
                  setTimeout(() => setIsNickSaved(false), 2000);
                }}
                title={isNickSaved ? "İsim Başarıyla Kaydedildi!" : "İsmi Onayla ve Kaydet"}
                style={{
                  background: isNickSaved 
                    ? 'linear-gradient(135deg, #15803d, #22c55e)' 
                    : 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(59, 130, 246, 0.4))',
                  border: isNickSaved ? '1px solid #4ade80' : '1px solid rgba(56, 189, 248, 0.5)',
                  borderRadius: '7px',
                  padding: '0.22rem 0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  height: '26px',
                  boxShadow: isNickSaved ? '0 0 10px rgba(34, 197, 94, 0.6)' : '0 2px 4px rgba(0,0,0,0.3)',
                  transition: 'all 0.25s ease'
                }}
              >
                {isNickSaved ? <CheckCheck size={14} color="#ffffff" /> : <Check size={14} color="#38bdf8" />}
                <span>{isNickSaved ? 'KAYDEDİLDİ' : 'KAYDET'}</span>
              </button>
            </div>
          </div>

          {/* Lig Seçimi */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.35)',
            padding: '0.32rem 0.65rem',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', minWidth: '85px' }}>
              🏆 Lig
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.88rem', minWidth: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                onClick={() => cycleBackLeague(leagueName, currentUpdateFn)}
              >
                &lt;
              </button>
              <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#ffd700', textAlign: 'center', width: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {leagueName}
              </span>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.88rem', minWidth: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                onClick={() => cycleLeague(leagueName, currentUpdateFn)}
              >
                &gt;
              </button>
            </div>
          </div>

          {/* Takım / Forma Seçimi */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.35)',
            padding: '0.32rem 0.65rem',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', minWidth: '85px' }}>
              🛡️ Takım
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.88rem', minWidth: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                onClick={() => cycleBackTeam(leagueName, teamIndex, currentUpdateFn)}
              >
                &lt;
              </button>
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', textAlign: 'center', width: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {teamName}
              </span>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.88rem', minWidth: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                onClick={() => cycleTeam(leagueName, teamIndex, currentUpdateFn)}
              >
                &gt;
              </button>
            </div>
          </div>

          {/* Ten Rengi Seçimi */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.35)',
            padding: '0.32rem 0.65rem',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', minWidth: '85px' }}>
              👤 Ten Rengi
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.88rem', minWidth: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                onClick={() => cycleBack(SKIN_COLORS, currentCustom?.skin, currentUpdateFn, 'skin')}
              >
                &lt;
              </button>
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#38bdf8', textAlign: 'center', width: '140px' }}>
                {SKIN_LABELS[currentCustom?.skin] || 'Açık Ten'}
              </span>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.88rem', minWidth: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                onClick={() => cycle(SKIN_COLORS, currentCustom?.skin, currentUpdateFn, 'skin')}
              >
                &gt;
              </button>
            </div>
          </div>

          {/* 3D Saç Modeli Seçimi */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.35)',
            padding: '0.32rem 0.65rem',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', minWidth: '85px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Sparkles size={14} color="#a855f7" /> 3D Saç
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.88rem', minWidth: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                onClick={() => cycleBack(HAIR_INDICES, currentCustom?.hair || 0, currentUpdateFn, 'hair')}
              >
                &lt;
              </button>
              <span 
                style={{ 
                  fontSize: '0.86rem', 
                  fontWeight: 800, 
                  color: '#c084fc', 
                  textAlign: 'center', 
                  width: '140px', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis' 
                }} 
                title={currentHair?.name}
              >
                {currentHair?.name || 'Saç'}
              </span>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.88rem', minWidth: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                onClick={() => cycle(HAIR_INDICES, currentCustom?.hair || 0, currentUpdateFn, 'hair')}
              >
                &gt;
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );

  if (hideWrapper) return content;

  return (
    <div className="menu-panel" style={{ maxWidth: '850px', width: '92%' }}>
      <h1>KARAKTER ÖZELLEŞTİR</h1>
      
      {content}

      <div style={{ marginTop: '1.5rem' }}>
        <button className="btn btn-primary" style={{ width: '100%', fontSize: '1.1rem', padding: '0.6rem' }} onClick={onBack}>
          KAYDET VE DÖN
        </button>
      </div>
    </div>
  );
};

export default Customizer;
