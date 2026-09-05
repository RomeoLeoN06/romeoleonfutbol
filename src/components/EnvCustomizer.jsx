import React from 'react';
import { 
  generateBallSVG, 
  generateGoalSVG, 
  generateMapPreviewSVG, 
  generateStadiumBackgroundSVG,
  MAP_CONFIGS,
  MAP_TYPES,
  normalizeMapType
} from '../utils/svgGenerator';
import { STADIUMS } from '../utils/stadiums';

const STADIUM_INDICES = STADIUMS.map((_, i) => i);
const GRASS_COLORS = ['green', 'autumn', 'dark'];
const BALL_TYPES = ['classic', 'striped', 'fire', 'ice', 'neon', 'golden', 'retro', 'cyber', 'lava', 'disco'];
const GOAL_TYPES = ['white_net', 'black_net', 'red_stripe', 'neon_glow', 'golden_post', 'camo', 'cyberpunk', 'retro_arcade', 'icy_net', 'lava_net'];

const GRASS_LABELS = {
  green: '🌿 Standart Yeşil',
  autumn: '🍂 Sonbahar Sarısı',
  dark: '🌑 Gece Çimi'
};

const BALL_LABELS = {
  classic: '⚽ Klasik Yıldız',
  striped: '⚪ Çizgili Modern',
  fire: '🔥 Alevli Roket',
  ice: '❄️ Buz Kristali',
  neon: '⚡ Neon Enerji',
  golden: '🏆 Altın Şampiyon',
  retro: '📼 Retro Piksel',
  cyber: '🌐 Siber Matris',
  lava: '🌋 Lav Patlaması',
  disco: '🪩 Disko Işıltısı'
};

const GOAL_LABELS = {
  white_net: '🥅 Beyaz File',
  black_net: '🖤 Siyah File',
  red_stripe: '🔴 Kırmızı Şerit',
  neon_glow: '⚡ Neon Işıltılı',
  golden_post: '👑 Altın Direkler',
  camo: '🪖 Askeri Kamuflaj',
  cyberpunk: '🌆 Siberpunk',
  retro_arcade: '🕹️ Retro Arcade',
  icy_net: '🧊 Buzul File',
  lava_net: '🔥 Lav Çerçevesi'
};

const EnvCustomizer = ({ envCustom, setEnvCustom, onBack, hideWrapper }) => {
  const updateEnv = (key, value) => setEnvCustom(prev => ({ ...prev, [key]: value }));

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

  const getGrassStyle = () => {
    switch(envCustom?.grass) {
      case 'autumn': return { background: 'linear-gradient(to bottom, #d97706, #92400e)' };
      case 'dark': return { background: 'linear-gradient(to bottom, #064e3b, #022c22)' };
      default: return { background: 'linear-gradient(to bottom, #22c55e, #166534)' }; 
    }
  };

  const currentStadium = STADIUMS[envCustom?.stadium || 0];
  const currentMapKey = normalizeMapType(envCustom?.map || 'none');
  const currentMapConfig = MAP_CONFIGS.find(m => m.id === currentMapKey) || MAP_CONFIGS[0];
  const currentMapIndex = MAP_CONFIGS.findIndex(m => m.id === currentMapKey);

  const content = (
    <div style={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      justifyContent: 'center', 
      alignItems: 'stretch', 
      gap: '0.85rem', 
      width: '100%',
      maxWidth: '1000px',
      margin: '0 auto'
    }}>
      
      {/* Sol Kolon: Canlı Saha Önizlemesi (Saha Görüntüsü ile Orantılı) */}
      <div style={{ 
        flex: '1 1 310px', 
        maxWidth: '440px', 
        minWidth: '270px',
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.45rem' 
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '0 0.2rem' 
        }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.5px' }}>
            🏟️ CANLI SAHA GÖRÜNÜMÜ
          </span>
          <span style={{ 
            fontSize: '0.76rem', 
            fontWeight: 700, 
            color: '#fbbf24', 
            background: 'rgba(251,191,36,0.15)', 
            padding: '0.15rem 0.5rem', 
            borderRadius: '6px', 
            border: '1px solid rgba(251,191,36,0.3)' 
          }}>
            {currentStadium.name}
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
          backgroundImage: generateStadiumBackgroundSVG(envCustom?.stadium || 0), 
          backgroundSize: 'cover', 
          backgroundPosition: 'center bottom' 
        }}>
          {/* Çim Zemin */}
          <div className="stadium-grass" style={{ 
            ...getGrassStyle(), 
            height: '38px', 
            borderTop: '2px solid rgba(255,255,255,0.4)', 
            position: 'absolute', 
            bottom: 0, 
            width: '100%' 
          }}></div>
          
          {/* Sol & Sağ Kaleler */}
          <div style={{ position: 'absolute', bottom: '38px', left: '0', transform: 'scale(0.38)', transformOrigin: 'bottom left' }}>
            <img src={generateGoalSVG(envCustom?.goal, true)} alt="Left Goal" />
          </div>
          <div style={{ position: 'absolute', bottom: '38px', right: '0', transform: 'scale(0.38)', transformOrigin: 'bottom right' }}>
            <img src={generateGoalSVG(envCustom?.goal, false)} alt="Right Goal" />
          </div>
          
          {/* Saha Engeli Önizlemesi */}
          {envCustom?.map && envCustom.map !== 'none' && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              <img src={generateMapPreviewSVG(envCustom.map)} alt="Map" style={{ width: '100%', height: '100%' }} />
            </div>
          )}

          {/* Maç Topu */}
          <div style={{ position: 'absolute', bottom: '46px', left: '50%', transform: 'translateX(-50%)' }}>
            <img 
              src={generateBallSVG(envCustom?.ball)} 
              alt="Ball" 
              width="42" 
              height="42" 
              style={{ filter: 'drop-shadow(0 5px 5px rgba(0,0,0,0.6))' }} 
            />
          </div>
        </div>

        {/* Canlı Seçimler Özeti */}
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
          <span style={{ color: '#22c55e', fontWeight: 600 }}>{GRASS_LABELS[envCustom?.grass] || 'Yeşil'}</span>
          <span style={{ color: '#64748b' }}>•</span>
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>{BALL_LABELS[envCustom?.ball] || 'Klasik'}</span>
          <span style={{ color: '#64748b' }}>•</span>
          <span style={{ color: '#fbbf24', fontWeight: 600 }}>{GOAL_LABELS[envCustom?.goal] || 'Beyaz File'}</span>
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
        
        {/* 4 Temel Öğe: Stadyum, Zemin, Top, Kale */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.42rem' }}>
          
          {/* Stadyum */}
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
              🏟️ Stadyum
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.88rem', minWidth: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                onClick={() => cycleBack(STADIUM_INDICES, envCustom.stadium || 0, updateEnv, 'stadium')}
              >
                &lt;
              </button>
              <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#fbbf24', textAlign: 'center', width: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentStadium.name}
              </span>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.88rem', minWidth: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                onClick={() => cycle(STADIUM_INDICES, envCustom.stadium || 0, updateEnv, 'stadium')}
              >
                &gt;
              </button>
            </div>
          </div>

          {/* Zemin Çimi */}
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
              🌿 Zemin
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.88rem', minWidth: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                onClick={() => cycleBack(GRASS_COLORS, envCustom.grass, updateEnv, 'grass')}
              >
                &lt;
              </button>
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#22c55e', textAlign: 'center', width: '140px' }}>
                {GRASS_LABELS[envCustom?.grass] || 'Standart Yeşil'}
              </span>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.88rem', minWidth: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                onClick={() => cycle(GRASS_COLORS, envCustom.grass, updateEnv, 'grass')}
              >
                &gt;
              </button>
            </div>
          </div>

          {/* Top */}
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
              ⚽ Maç Topu
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.88rem', minWidth: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                onClick={() => cycleBack(BALL_TYPES, envCustom.ball, updateEnv, 'ball')}>
                &lt;
              </button>
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#38bdf8', textAlign: 'center', width: '140px' }}>
                {BALL_LABELS[envCustom?.ball] || 'Klasik Yıldız'}
              </span>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.88rem', minWidth: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                onClick={() => cycle(BALL_TYPES, envCustom.ball, updateEnv, 'ball')}
              >
                &gt;
              </button>
            </div>
          </div>

          {/* Kale Direkleri */}
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
              🥅 Kale Tipi
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.88rem', minWidth: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                onClick={() => cycleBack(GOAL_TYPES, envCustom.goal, updateEnv, 'goal')}
              >
                &lt;
              </button>
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#e2e8f0', textAlign: 'center', width: '140px' }}>
                {GOAL_LABELS[envCustom?.goal] || 'Beyaz File'}
              </span>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.88rem', minWidth: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                onClick={() => cycle(GOAL_TYPES, envCustom.goal, updateEnv, 'goal')}
              >
                &gt;
              </button>
            </div>
          </div>

        </div>

        {/* Saha Engeli & Harita (Pro Kart) */}
        <div style={{ 
          background: 'rgba(0, 0, 0, 0.45)', 
          padding: '0.45rem 0.75rem', 
          borderRadius: '12px', 
          border: '1px solid rgba(255,255,255,0.08)', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.3rem' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', fontWeight: 800 }}>
              🏟️ SAHA ENGELİ & DÜZEN
            </span>
            <span style={{ 
              fontSize: '0.68rem', 
              fontWeight: 800, 
              color: '#ffffff', 
              background: currentMapConfig.badgeColor || '#06b6d4', 
              padding: '0.1rem 0.45rem', 
              borderRadius: '5px', 
              letterSpacing: '0.4px', 
              boxShadow: `0 0 6px ${currentMapConfig.badgeColor}66` 
            }}>
              {currentMapConfig.badge}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
            <button 
              className="btn btn-outline" 
              style={{ padding: '0.2rem 0.55rem', fontSize: '0.88rem', minWidth: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
              onClick={() => cycleBack(MAP_TYPES, currentMapKey, updateEnv, 'map')}
              title="Önceki Engel"
            >
              &lt;
            </button>

            <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentMapConfig.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.2 }}>
                {currentMapConfig.desc}
              </div>
            </div>

            <button 
              className="btn btn-outline" 
              style={{ padding: '0.2rem 0.55rem', fontSize: '0.88rem', minWidth: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
              onClick={() => cycle(MAP_TYPES, currentMapKey, updateEnv, 'map')}
              title="Sonraki Engel"
            >
              &gt;
            </button>
          </div>

          {/* Hızlı Harita Noktaları (Indicators) */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginTop: '0.05rem' }}>
            {MAP_CONFIGS.map((m, idx) => (
              <button
                key={m.id}
                onClick={() => updateEnv('map', m.id)}
                title={m.name}
                style={{
                  width: idx === currentMapIndex ? '14px' : '5px',
                  height: '5px',
                  borderRadius: '3px',
                  border: 'none',
                  background: idx === currentMapIndex ? (currentMapConfig.badgeColor || '#38bdf8') : 'rgba(255,255,255,0.25)',
                  boxShadow: idx === currentMapIndex ? `0 0 6px ${currentMapConfig.badgeColor || '#38bdf8'}` : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  padding: 0
                }}
              />
            ))}
          </div>
        </div>
        
      </div>

    </div>
  );

  if (hideWrapper) return content;

  return (
    <div className="menu-panel" style={{ maxWidth: '750px', width: '92%' }}>
      <h1>SAHA ÖZELLEŞTİR</h1>
      
      {content}

      <div style={{ marginTop: '1.5rem' }}>
        <button className="btn btn-primary" style={{ width: '100%', fontSize: '1.1rem', padding: '0.6rem' }} onClick={onBack}>
          KAYDET VE DÖN
        </button>
      </div>
    </div>
  );
};

export default EnvCustomizer;
