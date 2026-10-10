import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create clean, high-contrast SVG representing Pro Loco (Shield, Tower, Heart/Oak leaf, Italy green & gold)
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#064e3b" />
      <stop offset="50%" stop-color="#047857" />
      <stop offset="100%" stop-color="#065f46" />
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Background rounded rect -->
  <rect width="512" height="512" rx="104" fill="url(#bg)" />

  <!-- Outer gold subtle ring -->
  <rect x="20" y="20" width="472" height="472" rx="90" fill="none" stroke="url(#gold)" stroke-width="6" opacity="0.4" />

  <!-- Central Shield -->
  <g filter="url(#shadow)">
    <!-- Scudo della Pro Loco -->
    <path d="M 256 90 
             C 330 90, 390 105, 390 140 
             C 390 260, 340 370, 256 420 
             C 172 370, 122 260, 122 140 
             C 122 105, 182 90, 256 90 Z" 
          fill="#ffffff" />

    <!-- Bordo interno oro -->
    <path d="M 256 106 
             C 318 106, 372 119, 372 148 
             C 372 250, 328 350, 256 398 
             C 184 350, 140 250, 140 148 
             C 140 119, 194 106, 256 106 Z" 
          fill="#065f46" />
  </g>

  <!-- Simbolo Borgo Medievale / Torre Civica -->
  <!-- Mura con merli -->
  <path d="M 186 210 
           L 186 180 L 206 180 L 206 195 L 226 195 L 226 180 L 246 180 L 246 195 
           L 266 195 L 266 180 L 286 180 L 286 195 L 306 195 L 306 180 L 326 180 L 326 210 Z" 
        fill="url(#gold)" />
  
  <rect x="196" y="210" width="120" height="90" fill="url(#gold)" />
  
  <!-- Portone e finestre torre -->
  <path d="M 238 300 L 238 250 C 238 240, 274 240, 274 250 L 274 300 Z" fill="#064e3b" />
  <rect x="220" y="225" width="16" height="22" rx="4" fill="#064e3b" />
  <rect x="276" y="225" width="16" height="22" rx="4" fill="#064e3b" />

  <!-- Strisce tricolore italiano sotto la torre -->
  <g transform="translate(196, 310)">
    <rect x="0" y="0" width="40" height="8" rx="2" fill="#16a34a" />
    <rect x="40" y="0" width="40" height="8" rx="2" fill="#ffffff" />
    <rect x="80" y="0" width="40" height="8" rx="2" fill="#dc2626" />
  </g>

  <!-- Testo "PRO LOCO" dorato in stile araldico -->
  <text x="256" y="360" font-family="sans-serif" font-weight="900" font-size="28" fill="#fbbf24" text-anchor="middle" letter-spacing="4">
    PRO LOCO
  </text>
  <text x="256" y="380" font-family="sans-serif" font-weight="700" font-size="12" fill="#a7f3d0" text-anchor="middle" letter-spacing="2">
    GESTIONALE SOCI
  </text>
</svg>`;

// 2. Maskable version with extra 15% safe-zone margin
const svgMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#064e3b" />
      <stop offset="50%" stop-color="#047857" />
      <stop offset="100%" stop-color="#065f46" />
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
  </defs>

  <!-- Full-bleed background -->
  <rect width="512" height="512" fill="url(#bg)" />

  <!-- Inner safe group scaled down to 78% -->
  <g transform="translate(56, 56) scale(0.78)">
    <!-- Central Shield -->
    <path d="M 256 90 
             C 330 90, 390 105, 390 140 
             C 390 260, 340 370, 256 420 
             C 172 370, 122 260, 122 140 
             C 122 105, 182 90, 256 90 Z" 
          fill="#ffffff" />

    <path d="M 256 106 
             C 318 106, 372 119, 372 148 
             C 372 250, 328 350, 256 398 
             C 184 350, 140 250, 140 148 
             C 140 119, 194 106, 256 106 Z" 
          fill="#065f46" />

    <path d="M 186 210 
             L 186 180 L 206 180 L 206 195 L 226 195 L 226 180 L 246 180 L 246 195 
             L 266 195 L 266 180 L 286 180 L 286 195 L 306 195 L 306 180 L 326 180 L 326 210 Z" 
          fill="url(#gold)" />
    
    <rect x="196" y="210" width="120" height="90" fill="url(#gold)" />
    
    <path d="M 238 300 L 238 250 C 238 240, 274 240, 274 250 L 274 300 Z" fill="#064e3b" />
    <rect x="220" y="225" width="16" height="22" rx="4" fill="#064e3b" />
    <rect x="276" y="225" width="16" height="22" rx="4" fill="#064e3b" />

    <g transform="translate(196, 310)">
      <rect x="0" y="0" width="40" height="8" rx="2" fill="#16a34a" />
      <rect x="40" y="0" width="40" height="8" rx="2" fill="#ffffff" />
      <rect x="80" y="0" width="40" height="8" rx="2" fill="#dc2626" />
    </g>

    <text x="256" y="360" font-family="sans-serif" font-weight="900" font-size="30" fill="#fbbf24" text-anchor="middle" letter-spacing="4">
      PRO LOCO
    </text>
  </g>
</svg>`;

async function run() {
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon);
  console.log('Created icon.svg');

  // Generate 192x192 PNG
  await sharp(Buffer.from(svgIcon))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Created pwa-192x192.png');

  // Generate 512x512 PNG
  await sharp(Buffer.from(svgIcon))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Created pwa-512x512.png');

  // Generate 512x512 maskable PNG
  await sharp(Buffer.from(svgMaskable))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Created pwa-maskable-512x512.png');

  // Generate 180x180 apple-touch-icon
  await sharp(Buffer.from(svgIcon))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');
}

run().catch(console.error);
