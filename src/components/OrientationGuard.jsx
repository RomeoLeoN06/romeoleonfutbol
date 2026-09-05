import React, { useState, useEffect } from 'react';
import { Smartphone, RotateCw, Maximize2 } from 'lucide-react';

export const OrientationGuard = () => {
  const [shouldWarn, setShouldWarn] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Attempt automatic landscape orientation lock & fullscreen
  const requestLandscape = async () => {
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape').catch(() => {});
      } else if (screen.lockOrientation) {
        screen.lockOrientation('landscape');
      }
    } catch (e) {}
    setDismissed(true);
  };

  useEffect(() => {
    const checkOrientation = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const ratio = w / (h || 1);

      // "bilgisayar boyutlarına gelene kadar yatay ekran uyarısı ver zaten"
      // Tam bilgisayar / geniş ekran boyutu: w >= 1024px ve 16:9 geniş oran (ratio >= 1.45)
      const isComputerDimensions = w >= 1024 && ratio >= 1.45;
      const needsWarning = !isComputerDimensions;

      setShouldWarn(needsWarning);

      // Pencere tam bilgisayar boyutuna büyütüldüğünde dismissed sıfırlanır
      // Böylece tekrar daraltılırsa veya küçültülürse uyarı tekrar verilir
      if (isComputerDimensions) {
        setDismissed(false);
      }
    };

    checkOrientation();

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!shouldWarn || dismissed) {
    return null;
  }

  return (
    <div className="orientation-guard-overlay">
      <div className="orientation-guard-card">
        {/* Animated Device / Screen SVG Icon */}
        <div className="orientation-phone-anim">
          <div className="phone-device-icon">
            <Smartphone size={72} className="phone-svg" />
          </div>
          <div className="phone-arrow-arc">
            <RotateCw size={44} className="rotate-arrow-svg" />
          </div>
        </div>

        <h2 className="orientation-title">LÜTFEN EKRANI YATAY KONUMA ALIN</h2>
        <p className="orientation-desc">
          <b>RomeoLeoN Futbol</b> en iyi bilgisayar ve geniş 16:9 yatay ekran boyutlarında oynanır. Oyuncu isimleri, tüm beceriler ve tam saha hakimiyeti için lütfen pencerenizi büyütün veya tam ekrana geçin.
        </p>

        <div className="orientation-actions">
          <button 
            className="btn btn-primary orientation-btn" 
            onClick={requestLandscape}
          >
            <Maximize2 size={20} />
            TAM EKRANA GEÇ (YATAY MOD)
          </button>
          <button 
            className="orientation-dismiss-btn" 
            onClick={() => setDismissed(true)}
          >
            Mevcut Boyutta Devam Et
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrientationGuard;
