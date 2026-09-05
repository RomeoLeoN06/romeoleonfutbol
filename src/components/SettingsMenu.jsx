import React, { useState } from 'react';
import Customizer from './Customizer';
import EnvCustomizer from './EnvCustomizer';
import { Info, Palette, Image as ImageIcon, ArrowLeft, Settings } from 'lucide-react';

const SettingsMenu = ({ 
  gameMode, 
  p1Custom, 
  setP1Custom, 
  p2Custom, 
  setP2Custom, 
  envCustom, 
  setEnvCustom, 
  onBack 
}) => {
  const [activeTab, setActiveTab] = useState('character'); // Open Karakterler tab by default

  return (
    <div className="menu-panel settings-panel" style={{ maxWidth: '1060px', width: '95%', padding: '1.25rem 2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexShrink: 0 }}>
        <button className="btn btn-outline" style={{ padding: '0.4rem 1.1rem', fontSize: '0.92rem' }} onClick={onBack}>
          <ArrowLeft size={18} /> GERİ
        </button>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', letterSpacing: '1px' }}>
          <Settings size={24} /> AYARLAR
        </h2>
        <div style={{ width: '85px' }}></div> {/* Spacer to keep title centered */}
      </div>

      {/* 3 Ana Sekme: BİLGİ, KARAKTERLER, SAHA / ZEMİN */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'center', 
        gap: '0.75rem', 
        marginBottom: '0.85rem', 
        borderBottom: '1.5px solid var(--panel-border)', 
        paddingBottom: '0.75rem', 
        flexShrink: 0 
      }}>
        <button 
          className={`btn ${activeTab === 'info' ? 'btn-primary' : 'btn-outline'}`} 
          style={{ flex: '1 1 170px', fontSize: '0.92rem', padding: '0.45rem 0.85rem' }} 
          onClick={() => setActiveTab('info')}
        >
          <Info size={18} /> BİLGİ & KONTROLLER
        </button>
        <button 
          className={`btn ${activeTab === 'character' ? 'btn-primary' : 'btn-outline'}`} 
          style={{ flex: '1 1 170px', fontSize: '0.92rem', padding: '0.45rem 0.85rem' }} 
          onClick={() => setActiveTab('character')}
        >
          <Palette size={18} /> KARAKTERLER
        </button>
        <button 
          className={`btn ${activeTab === 'environment' ? 'btn-primary' : 'btn-outline'}`} 
          style={{ flex: '1 1 170px', fontSize: '0.92rem', padding: '0.45rem 0.85rem' }} 
          onClick={() => setActiveTab('environment')}
        >
          <ImageIcon size={18} /> SAHA / ZEMİN
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', flexShrink: 0, width: '100%' }}>
        {activeTab === 'info' && (
           <div style={{ textAlign: 'center', padding: '0.5rem', width: '100%' }}>
             <h3 style={{ color: 'var(--accent)', marginBottom: '1.25rem', fontSize: '1.3rem' }}>KONTROLLER VE BİLGİ</h3>
             <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
               <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem 1.75rem', borderRadius: '14px', minWidth: '240px' }}>
                 <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.4rem' }}>OYUNCU 1</h4>
                 <p style={{ margin: '0.4rem 0', fontSize: '0.95rem' }}><b style={{ color: 'white', display: 'inline-block', width: '60px' }}>W</b> : Zıpla</p>
                 <p style={{ margin: '0.4rem 0', fontSize: '0.95rem' }}><b style={{ color: 'white', display: 'inline-block', width: '60px' }}>A</b> : Sola Git</p>
                 <p style={{ margin: '0.4rem 0', fontSize: '0.95rem' }}><b style={{ color: 'white', display: 'inline-block', width: '60px' }}>D</b> : Sağa Git</p>
                 <p style={{ margin: '0.4rem 0', fontSize: '0.95rem' }}><b style={{ color: 'white', display: 'inline-block', width: '60px' }}>SPACE</b> : Şut Çek</p>
                 <p style={{ margin: '0.4rem 0', fontSize: '0.95rem' }}><b style={{ color: '#38bdf8', display: 'inline-block', width: '60px' }}>E</b> : Buz Tuzağı</p>
                 <p style={{ margin: '0.4rem 0', fontSize: '0.95rem' }}><b style={{ color: '#22c55e', display: 'inline-block', width: '60px' }}>Z</b> : Kale Kalkanı</p>
                 <p style={{ margin: '0.4rem 0', fontSize: '0.95rem' }}><b style={{ color: '#ec4899', display: 'inline-block', width: '60px' }}>X</b> : Dev Kafa</p>
               </div>
               <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem 1.75rem', borderRadius: '14px', minWidth: '240px' }}>
                 <h4 style={{ color: 'var(--secondary)', marginBottom: '1rem', fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.4rem' }}>OYUNCU 2</h4>
                 <p style={{ margin: '0.4rem 0', fontSize: '0.95rem' }}><b style={{ color: 'white', display: 'inline-block', width: '85px' }}>Yukarı Ok</b> : Zıpla</p>
                 <p style={{ margin: '0.4rem 0', fontSize: '0.95rem' }}><b style={{ color: 'white', display: 'inline-block', width: '85px' }}>Sol Ok</b> : Sola Git</p>
                 <p style={{ margin: '0.4rem 0', fontSize: '0.95rem' }}><b style={{ color: 'white', display: 'inline-block', width: '85px' }}>Sağ Ok</b> : Sağa Git</p>
                 <p style={{ margin: '0.4rem 0', fontSize: '0.95rem' }}><b style={{ color: 'white', display: 'inline-block', width: '85px' }}>P Tuşu</b> : Şut Çek</p>
                 <p style={{ margin: '0.4rem 0', fontSize: '0.95rem' }}><b style={{ color: '#38bdf8', display: 'inline-block', width: '85px' }}>Ğ Tuşu</b> : Buz Tuzağı</p>
                 <p style={{ margin: '0.4rem 0', fontSize: '0.95rem' }}><b style={{ color: '#22c55e', display: 'inline-block', width: '85px' }}>Ö Tuşu</b> : Kale Kalkanı</p>
                 <p style={{ margin: '0.4rem 0', fontSize: '0.95rem' }}><b style={{ color: '#ec4899', display: 'inline-block', width: '85px' }}>Ç Tuşu</b> : Dev Kafa</p>
               </div>
             </div>
           </div>
        )}
        
        {activeTab === 'character' && (
           <Customizer 
              gameMode={gameMode} 
              p1Custom={p1Custom} 
              setP1Custom={setP1Custom} 
              p2Custom={p2Custom} 
              setP2Custom={setP2Custom} 
              hideWrapper={true} 
           />
        )}
        
        {activeTab === 'environment' && (
           <EnvCustomizer 
              envCustom={envCustom} setEnvCustom={setEnvCustom} hideWrapper={true}
           />
        )}
      </div>
    </div>
  );
};

export default SettingsMenu;
