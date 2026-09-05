import { HAIRSTYLES } from './hairstyles';
import { STADIUMS } from './stadiums';
import { LEAGUES } from './teams';

export const getHairPath = (hairIndex, isLeft) => {
  const style = HAIRSTYLES[hairIndex] || HAIRSTYLES[0];
  return style.path;
};

export const generatePlayerSVG = (isLeft, jerseyData, skinColor, hairIndex) => {
  const league = jerseyData?.league || 'Süper Lig';
  const teamIndex = jerseyData?.teamIndex || 0;
  const team = LEAGUES[league]?.[teamIndex] || LEAGUES['Süper Lig'][0];
  const flipTransform = isLeft ? '' : 'transform="scale(-1, 1) translate(-140, 0)"';
  const gradId = isLeft ? 'Left' : 'Right';

  // Skin tone gradients
  let skinBase = '#ffdbac';
  let skinMid = '#e0ac69';
  let skinShadow = '#a66e38';
  let skinHighlight = '#ffeed6';

  if (skinColor === 'medium') {
    skinBase = '#d39f72';
    skinMid = '#b07746';
    skinShadow = '#784620';
    skinHighlight = '#eec29a';
  } else if (skinColor === 'dark') {
    skinBase = '#8d5524';
    skinMid = '#633711';
    skinShadow = '#3b1c03';
    skinHighlight = '#b87c46';
  }

  let jerseyPattern = '';
  if (team.type === 'striped') {
    jerseyPattern = `
      <linearGradient id="jerseyGrad_${gradId}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${team.color1}"/>
        <stop offset="25%" stop-color="${team.color1}"/>
        <stop offset="25%" stop-color="${team.color2}"/>
        <stop offset="50%" stop-color="${team.color2}"/>
        <stop offset="50%" stop-color="${team.color1}"/>
        <stop offset="75%" stop-color="${team.color1}"/>
        <stop offset="75%" stop-color="${team.color2}"/>
        <stop offset="100%" stop-color="${team.color2}"/>
      </linearGradient>
    `;
  } else if (team.type === 'halved') {
    jerseyPattern = `
      <linearGradient id="jerseyGrad_${gradId}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${team.color1}"/>
        <stop offset="50%" stop-color="${team.color1}"/>
        <stop offset="50%" stop-color="${team.color2}"/>
        <stop offset="100%" stop-color="${team.color2}"/>
      </linearGradient>
    `;
  } else {
    jerseyPattern = `
      <linearGradient id="jerseyGrad_${gradId}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${team.color1}"/>
        <stop offset="100%" stop-color="${team.color2}"/>
      </linearGradient>
    `;
  }

  const svg = `
<svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- 3D Sphere Head Gradient -->
    <radialGradient id="headSphereGrad_${gradId}" cx="35%" cy="32%" r="65%">
      <stop offset="0%" stop-color="${skinHighlight}"/>
      <stop offset="45%" stop-color="${skinBase}"/>
      <stop offset="85%" stop-color="${skinMid}"/>
      <stop offset="100%" stop-color="${skinShadow}"/>
    </radialGradient>

    <!-- 3D Ear Gradient -->
    <radialGradient id="earGrad_${gradId}" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="${skinBase}"/>
      <stop offset="100%" stop-color="${skinShadow}"/>
    </radialGradient>

    <!-- 3D Torso Volumetric Overlay -->
    <radialGradient id="torso3D_${gradId}" cx="40%" cy="25%" r="75%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.3"/>
      <stop offset="70%" stop-color="#000000" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.55"/>
    </radialGradient>

    <!-- 3D Eye Spherical Gradient -->
    <radialGradient id="eye3DGrad" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="70%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </radialGradient>

    <!-- Iris Gradient -->
    <radialGradient id="irisGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="60%" stop-color="#1d4ed8"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </radialGradient>

    <!-- Badge Metallic Shine -->
    <linearGradient id="badgeShine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>

    ${jerseyPattern}

    <!-- Drop Shadow Filter for Head/Collar -->
    <filter id="shadow3D_${gradId}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="#000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <g ${flipTransform}>
    <!-- 3D Torso / Jersey Body -->
    <g filter="url(#shadow3D_${gradId})">
      <!-- Curved 3D Torso Base -->
      <path d="M 22 92 C 22 76 40 68 70 68 C 100 68 118 76 118 92 L 110 138 C 110 138 70 142 30 138 Z" fill="url(#jerseyGrad_${gradId})"/>
      <!-- Torso 3D Shading Overlay -->
      <path d="M 22 92 C 22 76 40 68 70 68 C 100 68 118 76 118 92 L 110 138 C 110 138 70 142 30 138 Z" fill="url(#torso3D_${gradId})"/>
      
      <!-- 3D Collar -->
      <path d="M 54 68 Q 70 82 86 68 Q 70 76 54 68 Z" fill="#1e293b" opacity="0.7"/>
      <path d="M 52 68 Q 70 84 88 68" fill="none" stroke="#ffffff" stroke-width="2.5" opacity="0.8"/>

      <!-- 3D Team Badge/Emblem on Chest -->
      <circle cx="88" cy="92" r="7" fill="url(#badgeShine)" stroke="#ffffff" stroke-width="1.5"/>
      <polygon points="88,87 90,91 94,92 91,95 92,99 88,96 84,99 85,95 82,92 86,91" fill="#ffffff" transform="scale(0.5) translate(88, 92)"/>
    </g>

    <!-- 3D Neck -->
    <rect x="58" y="60" width="24" height="16" rx="6" fill="${skinMid}"/>

    <!-- 3D Ears -->
    <circle cx="28" cy="54" r="9" fill="url(#earGrad_${gradId})" stroke="${skinShadow}" stroke-width="1"/>
    <circle cx="29" cy="54" r="5" fill="${skinShadow}" opacity="0.4"/>
    <circle cx="112" cy="54" r="9" fill="url(#earGrad_${gradId})" stroke="${skinShadow}" stroke-width="1"/>
    <circle cx="111" cy="54" r="5" fill="${skinShadow}" opacity="0.4"/>

    <!-- Main 3D Sphere Head -->
    <g filter="url(#shadow3D_${gradId})">
      <circle cx="70" cy="52" r="44" fill="url(#headSphereGrad_${gradId})" stroke="${skinShadow}" stroke-width="1.5"/>
      
      <!-- 3D Head Highlight (Specular Gloss) -->
      <ellipse cx="54" cy="28" rx="16" ry="8" fill="#ffffff" opacity="0.35" transform="rotate(-20 54 28)"/>
      <ellipse cx="48" cy="24" rx="6" ry="3" fill="#ffffff" opacity="0.6" transform="rotate(-20 48 24)"/>
    </g>

    <!-- Hair Layer -->
    <g transform="translate(10, 2)">
      ${getHairPath(hairIndex, true)}
    </g>

    <!-- 3D Expressive Eyes -->
    <!-- Left Eye -->
    <g>
      <!-- Eye Socket Shadow -->
      <ellipse cx="54" cy="48" rx="9" ry="10" fill="${skinShadow}" opacity="0.25"/>
      <!-- 3D White Sphere -->
      <ellipse cx="54" cy="47" rx="8" ry="9" fill="url(#eye3DGrad)" stroke="#64748b" stroke-width="0.8"/>
      <!-- Iris -->
      <circle cx="55" cy="47" r="4.5" fill="url(#irisGrad)"/>
      <!-- Pupil -->
      <circle cx="55" cy="47" r="2.3" fill="#090d16"/>
      <!-- Dual Specular Glare Dots -->
      <circle cx="53" cy="45" r="1.5" fill="#ffffff"/>
      <circle cx="57" cy="49" r="0.8" fill="#ffffff"/>
      <!-- 3D Eyebrow -->
      <path d="M 44 37 Q 54 33 63 39" fill="none" stroke="#1e293b" stroke-width="3.5" stroke-linecap="round"/>
    </g>

    <!-- Right Eye -->
    <g>
      <!-- Eye Socket Shadow -->
      <ellipse cx="86" cy="48" rx="9" ry="10" fill="${skinShadow}" opacity="0.25"/>
      <!-- 3D White Sphere -->
      <ellipse cx="86" cy="47" rx="8" ry="9" fill="url(#eye3DGrad)" stroke="#64748b" stroke-width="0.8"/>
      <!-- Iris -->
      <circle cx="87" cy="47" r="4.5" fill="url(#irisGrad)"/>
      <!-- Pupil -->
      <circle cx="87" cy="47" r="2.3" fill="#090d16"/>
      <!-- Dual Specular Glare Dots -->
      <circle cx="85" cy="45" r="1.5" fill="#ffffff"/>
      <circle cx="89" cy="49" r="0.8" fill="#ffffff"/>
      <!-- 3D Eyebrow -->
      <path d="M 77 39 Q 86 33 96 37" fill="none" stroke="#1e293b" stroke-width="3.5" stroke-linecap="round"/>
    </g>

    <!-- 3D Nose -->
    <path d="M 68 50 C 67 56 65 60 70 61 C 72 61 74 58 72 56" fill="none" stroke="${skinShadow}" stroke-width="2.5" stroke-linecap="round"/>
    <ellipse cx="68" cy="56" rx="2" ry="1" fill="#ffffff" opacity="0.3"/>

    <!-- 3D Expressive Mouth / Smile -->
    <path d="M 58 68 Q 70 78 82 68" fill="none" stroke="${skinShadow}" stroke-width="4" stroke-linecap="round"/>
    <path d="M 60 68 Q 70 76 80 68" fill="#450a0a" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
    <!-- Teeth Highlight -->
    <path d="M 62 68 Q 70 72 78 68" fill="#ffffff" opacity="0.9"/>
  </g>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const generateShoeSVG = (isLeft, jerseyData) => {
  const league = jerseyData?.league || 'Süper Lig';
  const teamIndex = jerseyData?.teamIndex || 0;
  const team = LEAGUES[league]?.[teamIndex] || LEAGUES['Süper Lig'][0];

  // The shoe path naturally points LEFT (toe is at x=2, heel at x=64).
  // Player 1 (isLeft=true) needs to point RIGHT. So we flip P1, and don't flip P2.
  const flipTransform = isLeft ? 'transform="scale(-1, 1) translate(-70, 0)"' : '';
  const gradId = isLeft ? 'Left' : 'Right';

  const svg = `
<svg width="70" height="45" viewBox="0 0 70 45" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- 3D Boot Main Leather Gradient -->
    <linearGradient id="boot3DGrad_${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${team.color1}"/>
      <stop offset="50%" stop-color="${team.color2}"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>

    <!-- Boot Gloss Overlay -->
    <linearGradient id="bootGloss" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.5"/>
      <stop offset="35%" stop-color="#ffffff" stop-opacity="0.0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.7"/>
    </linearGradient>

    <filter id="bootShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="1" dy="3" stdDeviation="2" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <g ${flipTransform} filter="url(#bootShadow)">
    <!-- Pointier 3D Boot Body (Toe at x=2, y=36, Heel at x=64) -->
    <path d="M 2 36 Q 16 8 40 14 L 62 14 Q 68 24 64 36 Z" fill="url(#boot3DGrad_${gradId})" stroke="#090d16" stroke-width="2"/>
    
    <!-- 3D Gloss Layer -->
    <path d="M 2 36 Q 16 8 40 14 L 62 14 Q 68 24 64 36 Z" fill="url(#bootGloss)"/>

    <!-- Pointy Toe Cap Specular Highlight -->
    <path d="M 45 16 Q 62 18 61 30" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.6"/>

    <!-- Laces / Stripes -->
    <line x1="26" y1="14" x2="20" y2="24" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
    <line x1="32" y1="15" x2="26" y2="25" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
    <line x1="38" y1="16" x2="32" y2="26" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>

    <!-- 3D Sole Plate -->
    <path d="M 6 36 L 62 36 L 60 39 L 8 39 Z" fill="#1e293b" stroke="#0f172a" stroke-width="1"/>

    <!-- Professional Studs (Krampon Çivileri) -->
    <path d="M 12 39 L 14 44 L 18 44 L 20 39 Z" fill="#94a3b8" stroke="#1e293b" stroke-width="1"/>
    <path d="M 32 39 L 34 44 L 38 44 L 40 39 Z" fill="#94a3b8" stroke="#1e293b" stroke-width="1"/>
    <path d="M 52 39 L 54 44 L 58 44 L 60 39 Z" fill="#94a3b8" stroke="#1e293b" stroke-width="1"/>
  </g>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const generateBallSVG = (ballType = 'classic') => {
  let innerSVG = '';

  if (ballType === 'classic') {
    innerSVG = `
      <defs>
        <!-- 3D Ball Sphere Gradient -->
        <radialGradient id="ball3DSphere" cx="30%" cy="28%" r="72%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="50%" stop-color="#f1f5f9"/>
          <stop offset="85%" stop-color="#94a3b8"/>
          <stop offset="100%" stop-color="#334155"/>
        </radialGradient>
        <radialGradient id="pentagonShine" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#334155"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </radialGradient>
      </defs>

      <!-- Base 3D Sphere -->
      <circle cx="50" cy="50" r="47" fill="url(#ball3DSphere)" stroke="#1e293b" stroke-width="2.5"/>

      <!-- 3D Pentagon & Seam Pattern for Dynamic Roll Rotation -->
      <g stroke="#1e293b" stroke-width="2" stroke-linejoin="round">
        <!-- Center Pentagon -->
        <polygon points="50,26 68,39 61,61 39,61 32,39" fill="url(#pentagonShine)"/>
        
        <!-- Connecting Seams -->
        <line x1="50" y1="26" x2="50" y2="6"/>
        <line x1="68" y1="39" x2="88" y2="30"/>
        <line x1="61" y1="61" x2="78" y2="78"/>
        <line x1="39" y1="61" x2="22" y2="78"/>
        <line x1="32" y1="39" x2="12" y2="30"/>

        <!-- Outer Pentagons -->
        <polygon points="50,6 64,2 78,14 68,30" fill="url(#pentagonShine)"/>
        <polygon points="88,30 96,44 90,62 74,52" fill="url(#pentagonShine)"/>
        <polygon points="78,78 70,94 50,96 58,74" fill="url(#pentagonShine)"/>
        <polygon points="22,78 42,74 50,96 30,94" fill="url(#pentagonShine)"/>
        <polygon points="12,30 26,52 10,62 4,44" fill="url(#pentagonShine)"/>
      </g>

      <!-- 3D Specular Highlight Gloss -->
      <ellipse cx="34" cy="24" rx="14" ry="7" fill="#ffffff" opacity="0.4" transform="rotate(-25 34 24)"/>
      <ellipse cx="28" cy="20" rx="5" ry="2.5" fill="#ffffff" opacity="0.75" transform="rotate(-25 28 20)"/>
    `;
  } else if (ballType === 'striped') {
    innerSVG = `
      <defs>
        <radialGradient id="sphere3D" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.5"/>
          <stop offset="70%" stop-color="#000000" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.85"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="47" fill="#0f172a"/>
      <path d="M 50 3 L 50 97" stroke="#38bdf8" stroke-width="8"/>
      <path d="M 50 3 A 20 47 0 0 0 50 97" fill="none" stroke="#fbbf24" stroke-width="7"/>
      <path d="M 50 3 A 20 47 0 0 1 50 97" fill="none" stroke="#fbbf24" stroke-width="7"/>
      <path d="M 50 3 A 38 47 0 0 0 50 97" fill="none" stroke="#f43f5e" stroke-width="6"/>
      <path d="M 50 3 A 38 47 0 0 1 50 97" fill="none" stroke="#f43f5e" stroke-width="6"/>
      <circle cx="50" cy="50" r="47" fill="url(#sphere3D)" stroke="#090d16" stroke-width="2.5"/>
      <ellipse cx="32" cy="22" rx="12" ry="6" fill="#ffffff" opacity="0.5" transform="rotate(-25 32 22)"/>
    `;
  } else if (ballType === 'fire') {
    innerSVG = `
      <defs>
        <radialGradient id="fire3D" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="40%" stop-color="#f97316"/>
          <stop offset="85%" stop-color="#dc2626"/>
          <stop offset="100%" stop-color="#450a0a"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="47" fill="url(#fire3D)" stroke="#7f1d1d" stroke-width="2.5"/>
      <path d="M 50 3 Q 75 32 50 97 Q 25 32 50 3" fill="#facc15" opacity="0.8"/>
      <path d="M 50 20 Q 64 50 50 80 Q 36 50 50 20" fill="#ef4444"/>
      <ellipse cx="32" cy="22" rx="12" ry="6" fill="#ffffff" opacity="0.6" transform="rotate(-25 32 22)"/>
    `;
  } else if (ballType === 'ice') {
    innerSVG = `
      <defs>
        <radialGradient id="ice3D" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="50%" stop-color="#67e8f9"/>
          <stop offset="85%" stop-color="#0284c7"/>
          <stop offset="100%" stop-color="#0369a1"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="47" fill="url(#ice3D)" stroke="#0284c7" stroke-width="2.5"/>
      <path d="M 50 10 L 62 32 L 90 50 L 62 68 L 50 90 L 38 68 L 10 50 L 38 32 Z" fill="#e0f2fe" stroke="#38bdf8" stroke-width="2" opacity="0.8"/>
      <ellipse cx="32" cy="22" rx="12" ry="6" fill="#ffffff" opacity="0.7" transform="rotate(-25 32 22)"/>
    `;
  } else if (ballType === 'golden') {
    innerSVG = `
      <defs>
        <radialGradient id="gold3D" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="50%" stop-color="#eab308"/>
          <stop offset="85%" stop-color="#ca8a04"/>
          <stop offset="100%" stop-color="#713f12"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="47" fill="url(#gold3D)" stroke="#854d0e" stroke-width="2.5"/>
      <circle cx="50" cy="50" r="30" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.6"/>
      <path d="M 50 3 L 50 97 M 3 L 50 L 97 50" stroke="#ffffff" stroke-width="2" stroke-opacity="0.6"/>
      <ellipse cx="32" cy="22" rx="12" ry="6" fill="#ffffff" opacity="0.75" transform="rotate(-25 32 22)"/>
    `;
  } else if (ballType === 'neon') {
    innerSVG = `
      <circle cx="50" cy="50" r="47" fill="#0f172a" stroke="#d946ef" stroke-width="3"/>
      <path d="M 50 3 L 50 97 M 3 50 L 97 50 M 15 15 L 85 85 M 15 85 L 85 15" stroke="#22d3ee" stroke-width="2" opacity="0.8"/>
      <circle cx="50" cy="50" r="20" fill="none" stroke="#d946ef" stroke-width="4"/>
      <circle cx="50" cy="50" r="5" fill="#22d3ee" />
    `;
  } else if (ballType === 'retro') {
    innerSVG = `
      <circle cx="50" cy="50" r="47" fill="#d4a373" stroke="#78350f" stroke-width="2.5"/>
      <path d="M 50 3 Q 20 50 50 97 Q 80 50 50 3" fill="none" stroke="#78350f" stroke-width="3"/>
      <path d="M 3 50 Q 50 20 97 50 Q 50 80 3 50" fill="none" stroke="#78350f" stroke-width="3"/>
      <circle cx="50" cy="50" r="47" fill="url(#sphere3D)" opacity="0.4" />
    `;
  } else if (ballType === 'cyber') {
    innerSVG = `
      <circle cx="50" cy="50" r="47" fill="#1e293b" stroke="#4ade80" stroke-width="2"/>
      <rect x="25" y="25" width="50" height="50" fill="none" stroke="#4ade80" stroke-width="2" transform="rotate(45 50 50)"/>
      <circle cx="50" cy="50" r="15" fill="#4ade80" opacity="0.3"/>
      <line x1="50" y1="3" x2="50" y2="25" stroke="#4ade80" stroke-width="2"/>
      <line x1="50" y1="75" x2="50" y2="97" stroke="#4ade80" stroke-width="2"/>
      <line x1="3" y1="50" x2="25" y2="50" stroke="#4ade80" stroke-width="2"/>
      <line x1="75" y1="50" x2="97" y2="50" stroke="#4ade80" stroke-width="2"/>
    `;
  } else if (ballType === 'lava') {
    innerSVG = `
      <defs>
        <radialGradient id="lavaGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ea580c"/>
          <stop offset="70%" stop-color="#b91c1c"/>
          <stop offset="100%" stop-color="#450a0a"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="47" fill="url(#lavaGrad)" stroke="#fcd34d" stroke-width="1.5"/>
      <path d="M 15 25 Q 30 30 40 10 M 40 10 L 60 40 L 90 30 M 15 70 Q 40 60 50 90 M 50 90 L 70 60 L 95 65 M 40 40 L 60 60" fill="none" stroke="#fef08a" stroke-width="2.5" opacity="0.9"/>
    `;
  } else if (ballType === 'disco') {
    innerSVG = `
      <defs>
        <radialGradient id="discoGrad" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#fbcfe8"/>
          <stop offset="25%" stop-color="#f472b6"/>
          <stop offset="50%" stop-color="#a855f7"/>
          <stop offset="75%" stop-color="#3b82f6"/>
          <stop offset="100%" stop-color="#14b8a6"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="47" fill="url(#discoGrad)" stroke="#ffffff" stroke-width="2"/>
      <path d="M 50 3 L 50 97 M 3 50 L 97 50 M 20 10 L 20 90 M 80 10 L 80 90 M 10 20 L 90 20 M 10 80 L 90 80" stroke="#ffffff" stroke-width="1.5" opacity="0.6"/>
    `;
  } else {
    innerSVG = `
      <circle cx="50" cy="50" r="47" fill="#ffffff" stroke="#000000" stroke-width="3"/>
      <ellipse cx="32" cy="22" rx="12" ry="6" fill="#ffffff" opacity="0.5" transform="rotate(-25 32 22)"/>
    `;
  }

  const svg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    ${innerSVG}
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const generateGoalSVG = (goalType = 'white_net', isLeft = true) => {
  const flipTransform = isLeft ? '' : 'transform="translate(100, 0) scale(-1, 1)"';
  let innerSVG = '';

  const drawNet = (color) => {
    let lines = '';
    // Horizontal net lines (from back wall to front)
    for (let y = 0; y <= 250; y += 25) {
      lines += `<line x1="16" y1="${y}" x2="100" y2="${y}" stroke="${color}" stroke-width="2.5" stroke-opacity="0.75"/>`;
    }
    // Vertical net lines (from top crossbar to ground)
    for (let x = 16; x <= 100; x += 14) {
      lines += `<line x1="${x}" y1="0" x2="${x}" y2="250" stroke="${color}" stroke-width="2.5" stroke-opacity="0.75"/>`;
    }
    // Semi-transparent net fill covering the entire rectangular box
    lines += `<rect x="16" y="0" width="84" height="250" fill="${color}" fill-opacity="0.15"/>`;
    return lines;
  };

  const draw3DPost = (color1, color2, stroke) => {
    const gradId = isLeft ? 'L' : 'R';
    return `
      <defs>
        <linearGradient id="postGradVert_${gradId}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="45%" stop-color="${color1}"/>
          <stop offset="100%" stop-color="#334155"/>
        </linearGradient>
        <linearGradient id="postGradHoriz_${gradId}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="45%" stop-color="${color1}"/>
          <stop offset="100%" stop-color="#334155"/>
        </linearGradient>
      </defs>

      <!-- Main Back Vertical Goalpost (0 to 16) -->
      <rect x="0" y="0" width="16" height="250" fill="url(#postGradVert_${gradId})" stroke="${stroke}" stroke-width="1.5"/>
      <!-- Top Crossbar from back post (16) to front tip (100) -->
      <rect x="16" y="0" width="84" height="16" fill="url(#postGradHoriz_${gradId})" stroke="${stroke}" stroke-width="1.5"/>
      <!-- Corner Joint Sphere at front tip -->
      <circle cx="92" cy="8" r="9.5" fill="url(#postGradVert_${gradId})" stroke="${stroke}" stroke-width="1.5"/>
    `;
  };

  if (goalType === 'golden_post') {
    // Draw Net AFTER Post so it covers the post visually
    innerSVG = draw3DPost('#eab308', '#ca8a04', '#713f12') + drawNet('#ffd700');
  } else if (goalType === 'neon_glow') {
    innerSVG = `
      <defs>
        <filter id="glow3D">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect x="0" y="0" width="16" height="250" fill="#0f172a" stroke="#38bdf8" stroke-width="4" filter="url(#glow3D)"/>
      <rect x="16" y="0" width="84" height="16" fill="#0f172a" stroke="#38bdf8" stroke-width="4" filter="url(#glow3D)"/>
      <circle cx="92" cy="8" r="9.5" fill="#0f172a" stroke="#38bdf8" stroke-width="4" filter="url(#glow3D)"/>
      ` + drawNet('#38bdf8');
  } else if (goalType === 'black_net') {
    innerSVG = draw3DPost('#475569', '#1e293b', '#0f172a') + drawNet('#0f172a');
  } else if (goalType === 'red_stripe') {
    innerSVG = draw3DPost('#ef4444', '#b91c1c', '#7f1d1d') + drawNet('#ffffff');
  } else if (goalType === 'camo') {
    innerSVG = draw3DPost('#65a30d', '#4d7c0f', '#3f6212') + drawNet('#14532d');
  } else if (goalType === 'cyberpunk') {
    innerSVG = draw3DPost('#d946ef', '#9333ea', '#4c1d95') + drawNet('#22d3ee');
  } else if (goalType === 'retro_arcade') {
    innerSVG = draw3DPost('#facc15', '#ea580c', '#9a3412') + drawNet('#f43f5e');
  } else if (goalType === 'icy_net') {
    innerSVG = draw3DPost('#bae6fd', '#38bdf8', '#0284c7') + drawNet('#a5f3fc');
  } else if (goalType === 'lava_net') {
    innerSVG = draw3DPost('#f97316', '#dc2626', '#7f1d1d') + drawNet('#fef08a');
  } else {
    // Default white net fallback
    innerSVG = draw3DPost('#f8fafc', '#cbd5e1', '#475569') + drawNet('#ffffff');
  }

  const svg = `<svg width="100" height="250" viewBox="0 0 100 250" xmlns="http://www.w3.org/2000/svg">
    <g ${flipTransform}>
      ${innerSVG}
    </g>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const normalizeMapType = (mapType) => {
  if (!mapType) return 'none';
  const aliasMap = {
    v_shape: 'stadium_arch',
    crossbars: 'stadium_arch',
    triangles: 'diamond_core',
    tunnel: 'laser_gate',
    high_wall: 'laser_gate',
    plinko: 'cyber_plinko',
    zigzag: 'cross_bumpers',
    chaos: 'pinball'
  };
  return aliasMap[mapType] || mapType;
};

export const MAP_CONFIGS = [
  {
    id: 'none',
    name: 'Klasik Saha',
    badge: '⚽ Standart',
    badgeColor: '#22c55e',
    desc: 'Engelsiz, temiz ve saf futbol mücadelesi.Futbol sevginizi sonuna kadar karşılayacaktır.'
  },
  {
    id: 'pinball',
    name: 'Pinball Enerji Arenası',
    badge: '⚡ Yüksek Sekme',
    badgeColor: '#06b6d4',
    desc: 'Topa dokunduğu anda patlayıcı güç veren 3 adet neon elektro-tampon.Oyunda güç herzaman önemlidir.'
  },
  {
    id: 'floating_islands',
    name: 'Havadaki Neon Platformlar',
    badge: '🛡️ Çift Katlı Taktik',
    badgeColor: '#3b82f6',
    desc: 'Kanatlarda havada asılı iki zarif platform. Aşırtmalar ve üst kat pasları için ideal!'
  },
  {
    id: 'stadium_arch',
    name: 'Siber Çatı Kemeri',
    badge: '🎯 Kanatlara Yönlendirme',
    badgeColor: '#10b981',
    desc: 'Ters kubbe tavanı. Top tepeye çarpınca kanatlara akar, asla ortada sıkışmaz.'
  },
  {
    id: 'twin_jumpers',
    name: 'Kale Önü Trambolinleri',
    badge: '🚀 Havai Akrobasi',
    badgeColor: '#8b5cf6',
    desc: 'Kalelerin önünde havada asılı 2 elastik tampon. Aşırtma şutları sahaya geri püskürtür.'
  },
  {
    id: 'sky_ring',
    name: 'Hava Portalı (Sky Ring)',
    badge: '🌀 Falso & Çekim',
    badgeColor: '#0ea5e9',
    desc: 'Orta sahanın göbeğinde asılı dev neon enerji diski. Havadan gelen toplara kavis kazandırır.'
  },
  {
    id: 'cross_bumpers',
    name: 'Dörtlü Çapraz Tamponlar',
    badge: '✦ Akrobatik Çarpışma',
    badgeColor: '#f43f5e',
    desc: 'Simetrik yerleştirilmiş 4 adet neon enerji çanı. Hızlı paslaşma ve sekmeler sağlar.'
  },
  {
    id: 'laser_gate',
    name: 'Lazer Tabela Kirişi',
    badge: '⚡ Tavandan Sekme',
    badgeColor: '#eab308',
    desc: 'Tavana yakın aerodinamik stadyum tabela kirişi. Yüksek dikilen topları yere hızla çarptırır.'
  },
  {
    id: 'diamond_core',
    name: 'Neon Elmas Prizması',
    badge: '💎 Elmas Kavisler',
    badgeColor: '#c084fc',
    desc: 'Orta sahada 45° açılı elmas tampon. 4 farklı yöne akıcı ve tahmin edilemez sekmeler sunar.'
  },
  {
    id: 'cyber_plinko',
    name: 'Siber Plinko',
    badge: '🎲 Sürpriz Sekmeler',
    badgeColor: '#f97316',
    desc: 'Geniş aralıklarla yerleştirilmiş 5 adet neon enerji diski. Asla sıkışma yapmaz.'
  }
];

export const MAP_TYPES = MAP_CONFIGS.map(m => m.id);

export const generateMapPreviewSVG = (mapType) => {
  const norm = normalizeMapType(mapType);
  if (!norm || norm === 'none') return '';

  const defs = `
    <defs>
      <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#06b6d4"/>
        <stop offset="100%" stop-color="#3b82f6"/>
      </linearGradient>
      <linearGradient id="pinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f43f5e"/>
        <stop offset="100%" stop-color="#ec4899"/>
      </linearGradient>
      <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#10b981"/>
        <stop offset="100%" stop-color="#059669"/>
      </linearGradient>
      <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f59e0b"/>
        <stop offset="100%" stop-color="#d97706"/>
      </linearGradient>
      <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#a855f7"/>
        <stop offset="100%" stop-color="#7c3aed"/>
      </linearGradient>
      <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="5" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      </filter>
    </defs>
  `;

  let innerSVG = '';

  const renderBumper = (cx, cy, r, color, strokeColor, icon = '⚡') => `
    <line x1="${cx}" y1="0" x2="${cx}" y2="${cy}" stroke="rgba(255,255,255,0.3)" stroke-width="2" stroke-dasharray="4,4"/>
    <circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="none" stroke="${strokeColor}" stroke-width="2" opacity="0.6" filter="url(#neonGlow)"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#0f172a" stroke="${strokeColor}" stroke-width="3"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.45}" fill="${color}"/>
    <text x="${cx}" y="${cy + 5}" font-size="${r * 0.5}" text-anchor="middle" fill="#ffffff" font-weight="900">${icon}</text>
  `;

  const renderPlatform = (x, y, w, h, angle = 0, colorGrad = 'url(#cyanGrad)', strokeColor = '#38bdf8') => `
    <g transform="translate(${x}, ${y}) rotate(${angle})">
      <line x1="${-w * 0.38}" y1="${-y}" x2="${-w * 0.38}" y2="0" stroke="rgba(255,255,255,0.3)" stroke-width="2" stroke-dasharray="4,4"/>
      <line x1="${w * 0.38}" y1="${-y}" x2="${w * 0.38}" y2="0" stroke="rgba(255,255,255,0.3)" stroke-width="2" stroke-dasharray="4,4"/>
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="8" fill="#0f172a" stroke="${strokeColor}" stroke-width="3" filter="url(#neonGlow)"/>
      <rect x="${-w / 2 + 4}" y="${-h / 2 + 3}" width="${w - 8}" height="${h - 6}" rx="5" fill="${colorGrad}" opacity="0.75"/>
      <line x1="${-w / 2 + 14}" y1="0" x2="${w / 2 - 14}" y2="0" stroke="#ffffff" stroke-width="2" opacity="0.8"/>
    </g>
  `;

  if (norm === 'pinball') {
    innerSVG = `
      ${renderBumper(290, 190, 36, 'url(#cyanGrad)', '#06b6d4')}
      ${renderBumper(500, 130, 42, 'url(#pinkGrad)', '#f43f5e')}
      ${renderBumper(710, 190, 36, 'url(#cyanGrad)', '#06b6d4')}
    `;
  } else if (norm === 'floating_islands') {
    innerSVG = `
      ${renderPlatform(270, 230, 180, 22, 0, 'url(#cyanGrad)', '#38bdf8')}
      ${renderPlatform(730, 230, 180, 22, 0, 'url(#pinkGrad)', '#f472b6')}
    `;
  } else if (norm === 'stadium_arch') {
    innerSVG = `
      ${renderPlatform(360, 160, 180, 20, -22, 'url(#emeraldGrad)', '#34d399')}
      ${renderPlatform(640, 160, 180, 20, 22, 'url(#emeraldGrad)', '#34d399')}
    `;
  } else if (norm === 'twin_jumpers') {
    innerSVG = `
      ${renderBumper(190, 210, 36, 'url(#purpleGrad)', '#a855f7', '🚀')}
      ${renderBumper(810, 210, 36, 'url(#amberGrad)', '#f59e0b', '🚀')}
    `;
  } else if (norm === 'sky_ring') {
    innerSVG = `
      <line x1="500" y1="0" x2="500" y2="180" stroke="rgba(255,255,255,0.3)" stroke-width="2" stroke-dasharray="4,4"/>
      <circle cx="500" cy="180" r="58" fill="none" stroke="#06b6d4" stroke-width="6" opacity="0.5" filter="url(#neonGlow)"/>
      <circle cx="500" cy="180" r="48" fill="#0f172a" stroke="#22d3ee" stroke-width="4"/>
      <circle cx="500" cy="180" r="24" fill="url(#cyanGrad)"/>
      <text x="500" y="186" font-size="20" text-anchor="middle" fill="#ffffff" font-weight="900">✦</text>
    `;
  } else if (norm === 'cross_bumpers') {
    innerSVG = `
      ${renderBumper(350, 140, 28, 'url(#pinkGrad)', '#f43f5e')}
      ${renderBumper(650, 140, 28, 'url(#pinkGrad)', '#f43f5e')}
      ${renderBumper(350, 270, 28, 'url(#cyanGrad)', '#06b6d4')}
      ${renderBumper(650, 270, 28, 'url(#cyanGrad)', '#06b6d4')}
    `;
  } else if (norm === 'laser_gate') {
    innerSVG = `
      ${renderPlatform(500, 130, 360, 24, 0, 'url(#amberGrad)', '#fbbf24')}
    `;
  } else if (norm === 'diamond_core') {
    innerSVG = `
      <g transform="translate(500, 190)">
        <line x1="0" y1="-190" x2="0" y2="0" stroke="rgba(255,255,255,0.3)" stroke-width="2" stroke-dasharray="4,4"/>
        <rect x="-35" y="-35" width="70" height="70" rx="6" transform="rotate(45)" fill="#0f172a" stroke="#c084fc" stroke-width="4" filter="url(#neonGlow)"/>
        <rect x="-18" y="-18" width="36" height="36" rx="3" transform="rotate(45)" fill="url(#purpleGrad)"/>
        <text x="0" y="5" font-size="16" text-anchor="middle" fill="#ffffff" font-weight="900">💎</text>
      </g>
    `;
  } else if (norm === 'cyber_plinko') {
    innerSVG = `
      ${renderBumper(300, 130, 24, 'url(#amberGrad)', '#f59e0b', '•')}
      ${renderBumper(700, 130, 24, 'url(#amberGrad)', '#f59e0b', '•')}
      ${renderBumper(500, 200, 30, 'url(#pinkGrad)', '#ec4899', '•')}
      ${renderBumper(300, 270, 24, 'url(#amberGrad)', '#f59e0b', '•')}
      ${renderBumper(700, 270, 24, 'url(#amberGrad)', '#f59e0b', '•')}
    `;
  }

  const svg = `<svg width="100%" height="100%" viewBox="0 0 1000 600" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    ${defs}
    ${innerSVG}
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const generateStadiumBackgroundSVG = (stadiumIndex, isGoal = false, customTitle = null) => {
  const stadium = STADIUMS[stadiumIndex] || STADIUMS[0];

  let lightsSVG = '';
  if (stadium.hasLights) {
    lightsSVG = `
      <!-- Stadium Floodlights 3D Array -->
      <polygon points="150,-20 250,-20 280,140 120,140" fill="#ccffff" opacity="0.1" />
      <polygon points="170,0 230,0 240,120 160,120" fill="#ffffff" opacity="0.15" />
      <rect x="165" y="-10" width="70" height="35" rx="5" fill="#1e293b" />
      <circle cx="180" cy="8" r="8" fill="#fff" filter="url(#glow)"/>
      <circle cx="200" cy="8" r="8" fill="#fff" filter="url(#glow)"/>
      <circle cx="220" cy="8" r="8" fill="#fff" filter="url(#glow)"/>

      <polygon points="950,-20 1050,-20 1080,140 920,140" fill="#ccffff" opacity="0.1" />
      <polygon points="970,0 1030,0 1040,120 960,120" fill="#ffffff" opacity="0.15" />
      <rect x="965" y="-10" width="70" height="35" rx="5" fill="#1e293b" />
      <circle cx="980" cy="8" r="8" fill="#fff" filter="url(#glow)"/>
      <circle cx="1000" cy="8" r="8" fill="#fff" filter="url(#glow)"/>
      <circle cx="1020" cy="8" r="8" fill="#fff" filter="url(#glow)"/>
    `;
  }

  const svg = `
<svg width="1200" height="600" viewBox="0 0 1200 600" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${stadium.skyColorTop}"/>
      <stop offset="100%" stop-color="${stadium.skyColorBottom}"/>
    </linearGradient>
    <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="tierGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${stadium.standColor}"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <pattern id="seats3D" width="20" height="16" patternUnits="userSpaceOnUse">
      <!-- 3D Seat Shape -->
      <rect x="2" y="2" width="16" height="10" fill="${stadium.seatColor}" rx="3"/>
      <rect x="2" y="8" width="16" height="4" fill="#000000" opacity="0.4" rx="2"/>
      <rect x="0" y="0" width="20" height="16" fill="none" stroke="#000000" stroke-width="0.5" opacity="0.3"/>
    </pattern>
    <pattern id="crowd" width="100" height="60" patternUnits="userSpaceOnUse" patternTransform="translate(0, 120)">
      <!-- Seat 1 -->
      <rect x="12" y="35" width="26" height="25" fill="${stadium.seatColor}" rx="3"/>
      <rect x="12" y="35" width="26" height="25" fill="#000" opacity="0.25" rx="3"/>
      <rect x="14" y="37" width="22" height="8" fill="#000" opacity="0.4" rx="2"/>
      
      <!-- Seat 2 -->
      <rect x="62" y="35" width="26" height="25" fill="${stadium.seatColor}" rx="3"/>
      <rect x="62" y="35" width="26" height="25" fill="#000" opacity="0.25" rx="3"/>
      <rect x="64" y="37" width="22" height="8" fill="#000" opacity="0.4" rx="2"/>

      <!-- Fan 1 (Yellowish shirt) -->
      <g style="${isGoal ? 'animation: jump 0.4s infinite ease-in-out alternate;' : ''}">
        ${isGoal ? `
          <!-- Standing / Jumping -->
          <path d="M 14 60 L 17 32 C 17 22, 33 22, 33 32 L 36 60 Z" fill="#fcd34d" />
          <circle cx="25" cy="18" r="7" fill="#ffdbac" />
          <path d="M 18 18 C 18 8, 32 8, 32 18 C 32 14, 18 14, 18 18 Z" fill="#3b1c03" />
          <!-- Raised Arms -->
          <path d="M 17 35 Q 8 20 12 5" fill="none" stroke="#ffdbac" stroke-width="4" stroke-linecap="round" />
          <path d="M 33 35 Q 42 20 38 5" fill="none" stroke="#ffdbac" stroke-width="4" stroke-linecap="round" />
        ` : `
          <!-- Sitting -->
          <path d="M 14 60 L 16 42 C 16 32, 34 32, 34 42 L 36 60 Z" fill="#fcd34d" />
          <circle cx="25" cy="28" r="7" fill="#ffdbac" />
          <path d="M 18 28 C 18 18, 32 18, 32 28 C 32 24, 18 24, 18 28 Z" fill="#3b1c03" />
          <!-- Resting Arms -->
          <path d="M 16 45 Q 10 55 15 65" fill="none" stroke="#ffdbac" stroke-width="4" stroke-linecap="round" />
          <path d="M 34 45 Q 40 55 35 65" fill="none" stroke="#ffdbac" stroke-width="4" stroke-linecap="round" />
        `}
      </g>
      
      <!-- Fan 2 (Dark shirt) -->
      <g style="${isGoal ? 'animation: jump 0.5s infinite ease-in-out alternate-reverse;' : ''}">
        ${isGoal ? `
          <!-- Standing / Jumping -->
          <path d="M 64 60 L 67 32 C 67 22, 83 22, 83 32 L 86 60 Z" fill="#334155" />
          <circle cx="75" cy="18" r="7" fill="#fbcfe8" />
          <path d="M 68 18 C 68 8, 82 8, 82 18 C 82 14, 68 14, 68 18 Z" fill="#0f172a" />
          <!-- Raised Arms -->
          <path d="M 67 35 Q 58 20 62 5" fill="none" stroke="#fbcfe8" stroke-width="4" stroke-linecap="round" />
          <path d="M 83 35 Q 92 20 88 5" fill="none" stroke="#fbcfe8" stroke-width="4" stroke-linecap="round" />
        ` : `
          <!-- Sitting -->
          <path d="M 64 60 L 66 42 C 66 32, 84 32, 84 42 L 86 60 Z" fill="#334155" />
          <circle cx="75" cy="28" r="7" fill="#fbcfe8" />
          <path d="M 68 28 C 68 18, 82 18, 82 28 C 82 24, 68 24, 68 28 Z" fill="#0f172a" />
          <!-- Resting Arms -->
          <path d="M 66 45 Q 60 55 65 65" fill="none" stroke="#fbcfe8" stroke-width="4" stroke-linecap="round" />
          <path d="M 84 45 Q 90 55 85 65" fill="none" stroke="#fbcfe8" stroke-width="4" stroke-linecap="round" />
        `}
      </g>
    </pattern>
    <pattern id="windows" width="50" height="30" patternUnits="userSpaceOnUse">
      <rect x="2" y="2" width="46" height="26" fill="#38bdf8" opacity="0.25"/>
      <rect x="2" y="2" width="46" height="26" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.4"/>
      <line x1="2" y1="15" x2="48" y2="15" stroke="#ffffff" stroke-width="1" opacity="0.2"/>
    </pattern>
    <style>
      @keyframes jump {
        0% { transform: translateY(0px); }
        100% { transform: translateY(-8px); }
      }
      .stadium-ad {
        animation: scrollAd 15s linear infinite;
      }
      @keyframes scrollAd {
        0% { transform: translateX(100%); }
        100% { transform: translateX(-100%); }
      }
    </style>
  </defs>

  <rect width="1200" height="600" fill="url(#skyGrad)"/>

  ${lightsSVG}

  <!-- Grandstand Roof Curve -->
  <path d="M -50 120 Q 600 20 1250 120 L 1250 0 L -50 0 Z" fill="url(#roofGrad)"/>
  
  <!-- Upper Tier Roof Support & Team/Stadium Specific Flags (y=120 to 180) -->
  <rect x="0" y="120" width="1200" height="60" fill="#020617"/>
  
  <!-- LED Ribbon matching stadium colors -->
  <rect x="0" y="125" width="1200" height="10" fill="#000000"/>
  <rect x="0" y="127" width="1200" height="6" fill="${stadium.seatColor}" opacity="0.8"/>
  
  <!-- Stadyum Rengine Özel Bayraklar (Team/Stadium Flags) -->
  ${[100, 300, 500, 700, 900, 1100].map(x => `
    <g transform="translate(${x - 40}, 120)">
      <path d="M 0 0 L 0 50 L 40 60 L 80 50 L 80 0 Z" fill="${stadium.seatColor}" stroke="#0f172a" stroke-width="2"/>
      <path d="M 4 0 L 4 47 L 40 56 L 76 47 L 76 0 Z" fill="#ffffff" opacity="0.15"/>
      <circle cx="40" cy="25" r="12" fill="#ffffff" opacity="0.9" stroke="#0f172a" stroke-width="1.5"/>
    </g>
  `).join('')}

  <!-- Balcony Railing dividing Upper Structure and Crowd -->
  <rect x="0" y="174" width="1200" height="6" fill="#334155"/>
  <rect x="0" y="174" width="1200" height="2" fill="#94a3b8"/>

  <!-- Exactly 3 Rows of Dynamic Crowd (y=180 to y=360, height=180) -->
  <rect x="0" y="180" width="1200" height="180" fill="url(#tierGrad)"/>
  <rect x="0" y="180" width="1200" height="180" fill="url(#crowd)" opacity="0.95"/>

  <!-- VIP / Media Corporate Boxes (Below the crowd) -->
  <rect x="0" y="360" width="1200" height="30" fill="#020617"/>
  <rect x="0" y="360" width="1200" height="30" fill="url(#windows)"/>

  <!-- Concrete Barrier / Wall (Trübün Duvarı) -->
  <rect x="0" y="390" width="1200" height="30" fill="#334155" />
  <rect x="0" y="390" width="1200" height="5" fill="#94a3b8" />
  <rect x="0" y="415" width="1200" height="5" fill="#1e293b" />

  <!-- Giant Premium LED Advertising Boards (Profesyonel Reklam Panoları Saha Kenarında) -->
  <rect x="0" y="420" width="1200" height="90" fill="#0f172a" stroke="#020617" stroke-width="6"/>
  <rect x="0" y="425" width="1200" height="80" fill="#ffffff" opacity="0.98"/>
  
  <svg x="0" y="425" width="1200" height="80">
    <!-- Huge bold text to fill the giant LED board -->
    <text x="0" y="60" font-family="Impact, Arial, sans-serif" font-size="64" font-style="italic" font-weight="900" fill="#0f172a" letter-spacing="8" class="stadium-ad" text-anchor="start">ROMEOLEON FUTBOL İYİ OYUNLAR  ★  ROMEOLEON FUTBOL İYİ OYUNLAR  ★  ROMEOLEON FUTBOL İYİ OYUNLAR</text>
  </svg>
  
  <!-- LED Screen Gloss/Glass effect (Cam Parlaması) -->
  <rect x="0" y="425" width="1200" height="35" fill="#ffffff" opacity="0.25"/>

  <!-- Shadow cast over the lower section merging with the pitch (Zemin Gölgelendirmesi) -->
  <rect x="0" y="510" width="1200" height="90" fill="#020617" opacity="0.85"/>
</svg>`;
  return `url('data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}')`;
};
