// 3D Volumetric Hairstyles for Kafa Topu
// Carefully contoured to fit the 3D spherical head (center cx=60, cy=50, r=43)

const colors = [
  { id: 'black', name: 'Siyah', base: '#090d16', mid: '#1e293b', light: '#334155', shine: '#64748b' },
  { id: 'brown', name: 'Kahve', base: '#381602', mid: '#682e07', light: '#92400e', shine: '#d97706' },
  { id: 'blonde', name: 'Sarı', base: '#713f12', mid: '#ca8a04', light: '#eab308', shine: '#fef08a' },
  { id: 'red', name: 'Kızıl', base: '#6b1111', mid: '#b91c1c', light: '#ef4444', shine: '#fca5a5' },
  { id: 'silver', name: 'Gümüş', base: '#1e293b', mid: '#475569', light: '#94a3b8', shine: '#f8fafc' }
];

const shapes = [
  {
    name: 'CR7 Modern Fade',
    render: (c, uid) => `
      <defs>
        <linearGradient id="hairGrad_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c.shine}"/>
          <stop offset="35%" stop-color="${c.light}"/>
          <stop offset="75%" stop-color="${c.mid}"/>
          <stop offset="100%" stop-color="${c.base}"/>
        </linearGradient>
        <linearGradient id="fadeGrad_${uid}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${c.mid}" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="${c.base}" stop-opacity="0.2"/>
        </linearGradient>
      </defs>
      <!-- Yan Fade Bölgesi -->
      <path d="M 17 52 C 17 38, 26 28, 38 22 L 36 48 Z" fill="url(#fadeGrad_${uid})"/>
      <path d="M 103 52 C 103 38, 94 28, 82 22 L 84 48 Z" fill="url(#fadeGrad_${uid})"/>
      <!-- Ana Hacimli Üst Saç (Kafayı Saran 3D Kubbe) -->
      <path d="M 17 48 C 17 24, 34 8, 60 8 C 86 8, 103 24, 103 48 C 96 38, 84 32, 60 30 C 36 32, 24 38, 17 48 Z" fill="url(#hairGrad_${uid})"/>
      <!-- Yan Çizgi / Razor Part -->
      <path d="M 28 32 Q 40 24 55 22" fill="none" stroke="${c.shine}" stroke-width="2" stroke-linecap="round"/>
      <!-- Ön Şık Tutamlar -->
      <path d="M 38 26 Q 52 14 68 18 Q 54 26 42 30 Z" fill="${c.shine}" opacity="0.65"/>
      <path d="M 55 18 Q 72 12 85 22 Q 70 26 58 24 Z" fill="${c.light}" opacity="0.8"/>
    `
  },
  {
    name: 'Haaland Pompadour',
    render: (c, uid) => `
      <defs>
        <linearGradient id="pompGrad_${uid}" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stop-color="${c.shine}"/>
          <stop offset="30%" stop-color="${c.light}"/>
          <stop offset="70%" stop-color="${c.mid}"/>
          <stop offset="100%" stop-color="${c.base}"/>
        </linearGradient>
      </defs>
      <!-- Hacimli Geriye Taranmış Tepe Dalgası -->
      <path d="M 16 48 C 14 20, 32 -2, 60 -4 C 88 -2, 106 20, 104 48 C 98 36, 84 28, 60 26 C 36 28, 22 36, 16 48 Z" fill="url(#pompGrad_${uid})"/>
      <!-- Dalgalı Saç Katmanları ve Işık Yansımaları -->
      <path d="M 28 36 C 32 16, 50 6, 75 6 C 65 18, 45 24, 28 36 Z" fill="${c.shine}" opacity="0.5"/>
      <path d="M 40 28 C 48 10, 68 4, 88 12 C 76 22, 58 24, 40 28 Z" fill="${c.light}" opacity="0.75"/>
      <path d="M 52 18 C 60 2, 78 2, 95 16 C 82 22, 66 20, 52 18 Z" fill="${c.shine}" opacity="0.6"/>
    `
  },
  {
    name: 'Neymar Dikenli',
    render: (c, uid) => `
      <defs>
        <linearGradient id="spikeGrad_${uid}" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="${c.base}"/>
          <stop offset="40%" stop-color="${c.mid}"/>
          <stop offset="75%" stop-color="${c.light}"/>
          <stop offset="100%" stop-color="${c.shine}"/>
        </linearGradient>
      </defs>
      <!-- Taban Kafa Oturumu -->
      <path d="M 16 48 C 16 26, 32 12, 60 12 C 88 12, 104 26, 104 48 C 96 38, 80 32, 60 30 C 40 32, 24 38, 16 48 Z" fill="${c.mid}"/>
      <!-- 3 Boyutlu Katmanlı Dikenler -->
      <path d="M 22 34 L 28 2 L 40 18 L 48 -6 L 60 14 L 72 -8 L 82 18 L 92 2 L 98 34 Q 60 26 22 34 Z" fill="url(#spikeGrad_${uid})"/>
      <!-- Parlayan Sivri Uçlar -->
      <polygon points="48,-6 44,8 52,8" fill="${c.shine}"/>
      <polygon points="72,-8 68,6 76,6" fill="${c.shine}"/>
      <polygon points="28,2 25,12 33,12" fill="${c.shine}"/>
      <polygon points="92,2 87,12 95,12" fill="${c.shine}"/>
    `
  },
  {
    name: 'Salah Hacimli Bukle',
    render: (c, uid) => `
      <defs>
        <radialGradient id="curlGrad_${uid}" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stop-color="${c.shine}"/>
          <stop offset="40%" stop-color="${c.light}"/>
          <stop offset="75%" stop-color="${c.mid}"/>
          <stop offset="100%" stop-color="${c.base}"/>
        </radialGradient>
      </defs>
      <!-- Hacimli Bukle Küreleri (Kafayı Tam Saran 3D Bukleler) -->
      <circle cx="24" cy="38" r="16" fill="url(#curlGrad_${uid})"/>
      <circle cx="96" cy="38" r="16" fill="url(#curlGrad_${uid})"/>
      <circle cx="34" cy="22" r="18" fill="url(#curlGrad_${uid})"/>
      <circle cx="86" cy="22" r="18" fill="url(#curlGrad_${uid})"/>
      <circle cx="48" cy="12" r="18" fill="url(#curlGrad_${uid})"/>
      <circle cx="72" cy="12" r="18" fill="url(#curlGrad_${uid})"/>
      <circle cx="60" cy="8" r="19" fill="url(#curlGrad_${uid})"/>
      <!-- Ön Alın Bukle Düşüşleri -->
      <path d="M 28 42 C 35 34, 45 36, 50 44 C 55 35, 65 35, 70 44 C 75 35, 85 35, 92 42 Q 60 30 28 42 Z" fill="${c.base}"/>
      <circle cx="42" cy="36" r="7" fill="${c.light}"/>
      <circle cx="60" cy="34" r="8" fill="${c.shine}" opacity="0.8"/>
      <circle cx="78" cy="36" r="7" fill="${c.light}"/>
    `
  },
  {
    name: 'Messi Klasik Pro',
    render: (c, uid) => `
      <defs>
        <linearGradient id="messiGrad_${uid}" x1="0%" y1="0%" x2="100%" y2="80%">
          <stop offset="0%" stop-color="${c.shine}"/>
          <stop offset="25%" stop-color="${c.light}"/>
          <stop offset="65%" stop-color="${c.mid}"/>
          <stop offset="100%" stop-color="${c.base}"/>
        </linearGradient>
      </defs>
      <!-- Zarif Yan Ayrılmış İpeksi 3D Saç -->
      <path d="M 16 50 C 16 26, 30 10, 60 10 C 90 10, 104 26, 104 50 C 98 42, 85 36, 68 34 C 48 32, 32 38, 16 50 Z" fill="url(#messiGrad_${uid})"/>
      <!-- Sol Şakak İnişi -->
      <path d="M 16 50 C 14 58, 16 66, 20 70 C 22 62, 20 54, 18 50 Z" fill="${c.mid}"/>
      <path d="M 104 50 C 106 58, 104 66, 100 70 C 98 62, 100 54, 102 50 Z" fill="${c.mid}"/>
      <!-- Parlak İpeksi Saç Şeritleri -->
      <path d="M 26 38 Q 48 24 76 26 Q 52 32 32 44 Z" fill="${c.shine}" opacity="0.6"/>
      <path d="M 44 26 Q 66 18 88 24 Q 70 28 50 32 Z" fill="${c.light}" opacity="0.75"/>
    `
  },
  {
    name: 'Valderrama Afro Taç',
    render: (c, uid) => `
      <defs>
        <radialGradient id="afroGrad_${uid}" cx="45%" cy="30%" r="65%">
          <stop offset="0%" stop-color="${c.shine}"/>
          <stop offset="45%" stop-color="${c.light}"/>
          <stop offset="80%" stop-color="${c.mid}"/>
          <stop offset="100%" stop-color="${c.base}"/>
        </radialGradient>
      </defs>
      <!-- Dev Hacimli 3D Afro Küresi -->
      <ellipse cx="60" cy="24" rx="48" ry="38" fill="url(#afroGrad_${uid})" filter="drop-shadow(0 6px 8px rgba(0,0,0,0.5))"/>
      <circle cx="20" cy="38" r="18" fill="url(#afroGrad_${uid})"/>
      <circle cx="100" cy="38" r="18" fill="url(#afroGrad_${uid})"/>
      <!-- Üst Kıvırcık Parlama Vurgusu -->
      <ellipse cx="52" cy="10" rx="26" ry="12" fill="${c.shine}" opacity="0.45"/>
    `
  },
  {
    name: 'Gullit Örgülü Rasta',
    render: (c, uid) => `
      <defs>
        <linearGradient id="dreadGrad_${uid}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${c.light}"/>
          <stop offset="60%" stop-color="${c.mid}"/>
          <stop offset="100%" stop-color="${c.base}"/>
        </linearGradient>
      </defs>
      <!-- Tepe Tabanı -->
      <path d="M 16 48 C 16 22, 34 10, 60 10 C 86 10, 104 22, 104 48 Q 60 32 16 48 Z" fill="${c.mid}"/>
      <!-- Sarkan 3D Örgü Boruları -->
      <path d="M 18 45 Q 8 72 16 98 Q 24 72 26 46 Z" fill="url(#dreadGrad_${uid})"/>
      <path d="M 28 42 Q 22 76 28 104 Q 36 76 34 44 Z" fill="url(#dreadGrad_${uid})"/>
      <path d="M 102 45 Q 112 72 104 98 Q 96 72 94 46 Z" fill="url(#dreadGrad_${uid})"/>
      <path d="M 92 42 Q 98 76 92 104 Q 84 76 86 44 Z" fill="url(#dreadGrad_${uid})"/>
      <!-- Altın Rasta Tokaları -->
      <rect x="11" y="70" width="10" height="4" rx="2" fill="#fbbf24"/>
      <rect x="99" y="70" width="10" height="4" rx="2" fill="#fbbf24"/>
      <rect x="25" y="85" width="8" height="4" rx="2" fill="#38bdf8"/>
      <rect x="87" y="85" width="8" height="4" rx="2" fill="#38bdf8"/>
    `
  },
  {
    name: 'Zlatan Samuray Topuzu',
    render: (c, uid) => `
      <defs>
        <linearGradient id="bunGrad_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c.shine}"/>
          <stop offset="50%" stop-color="${c.mid}"/>
          <stop offset="100%" stop-color="${c.base}"/>
        </linearGradient>
        <radialGradient id="topKnot_${uid}" cx="40%" cy="30%" r="60%">
          <stop offset="0%" stop-color="${c.shine}"/>
          <stop offset="60%" stop-color="${c.mid}"/>
          <stop offset="100%" stop-color="${c.base}"/>
        </radialGradient>
      </defs>
      <!-- Arkaya Sımsıkı Çekilmiş Saç Gövdesi -->
      <path d="M 17 50 C 17 26, 32 14, 60 14 C 88 14, 103 26, 103 50 C 96 40, 80 34, 60 32 C 40 34, 24 40, 17 50 Z" fill="url(#bunGrad_${uid})"/>
      <!-- Tepedeki 3D Samuray Düğümü / Topuzu -->
      <circle cx="60" cy="-2" r="16" fill="url(#topKnot_${uid})" stroke="${c.base}" stroke-width="1.5"/>
      <!-- Kırmızı/Altın Saç Bağı -->
      <ellipse cx="60" cy="11" rx="12" ry="4" fill="#ef4444" stroke="#ffffff" stroke-width="1"/>
      <path d="M 52 11 L 68 11" stroke="#fbbf24" stroke-width="1.5"/>
    `
  },
  {
    name: 'Pro Atletik Kısa',
    render: (c, uid) => `
      <defs>
        <linearGradient id="shortGrad_${uid}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${c.shine}"/>
          <stop offset="35%" stop-color="${c.light}"/>
          <stop offset="70%" stop-color="${c.mid}"/>
          <stop offset="100%" stop-color="${c.base}"/>
        </linearGradient>
      </defs>
      <!-- Kafayı Kusursuz Örten 3D Atletik Kesim -->
      <path d="M 16 50 C 16 24, 32 10, 60 10 C 88 10, 104 24, 104 50 C 96 40, 82 34, 60 33 C 38 34, 24 40, 16 50 Z" fill="url(#shortGrad_${uid})"/>
      <!-- Şakak Favorileri -->
      <polygon points="17,50 17,62 23,54" fill="${c.mid}"/>
      <polygon points="103,50 103,62 97,54" fill="${c.mid}"/>
      <!-- 3D Küresel Parlama Halesi -->
      <ellipse cx="60" cy="22" rx="24" ry="7" fill="${c.shine}" opacity="0.45"/>
    `
  },
  {
    name: 'Modric Saç Bandı',
    render: (c, uid) => `
      <defs>
        <linearGradient id="modricGrad_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c.shine}"/>
          <stop offset="40%" stop-color="${c.light}"/>
          <stop offset="80%" stop-color="${c.mid}"/>
          <stop offset="100%" stop-color="${c.base}"/>
        </linearGradient>
      </defs>
      <!-- Arka ve Tepe Saçları -->
      <path d="M 15 50 C 14 20, 32 4, 60 4 C 88 4, 106 20, 105 50 C 98 42, 85 36, 60 36 C 35 36, 22 42, 15 50 Z" fill="url(#modricGrad_${uid})"/>
      <!-- Beyaz/Neon Spor Saç Bandı -->
      <path d="M 15 42 Q 60 32 105 42 Q 60 36 15 42 Z" fill="#ffffff" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"/>
      <path d="M 15 42 Q 60 32 105 42" stroke="#0284c7" stroke-width="2" fill="none"/>
      <!-- Bant Üzerine Dökülen Ön Tutamlar -->
      <path d="M 38 34 Q 48 42 56 36" stroke="${c.shine}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M 64 36 Q 74 42 82 34" stroke="${c.light}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    `
  }
];

export const HAIRSTYLES = [];

shapes.forEach((shape, sIdx) => {
  colors.forEach((color, cIdx) => {
    const uid = `h_${sIdx}_${cIdx}`;
    HAIRSTYLES.push({
      name: `${shape.name} - ${color.name}`,
      shapeName: shape.name,
      colorName: color.name,
      path: shape.render(color, uid)
    });
  });
});
