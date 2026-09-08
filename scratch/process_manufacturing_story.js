const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processManufacturingStoryImage() {
  const inputPath = 'manufactering img.jpeg';
  const meta = await sharp(inputPath).metadata();
  console.log('Source:', meta.width, 'x', meta.height);
  
  // Story image dimensions (portrait frame)
  const W = 1000;
  const H = 1250;
  
  // Resize source to cover height and width
  const resized = await sharp(inputPath)
    .resize(W, H, { fit: 'cover', position: 'center' })
    .toBuffer();
    
  // Black gradient overlay:
  // - Top subtle fade (softens bright ceiling lights)
  // - Bottom deep black fade (creates dramatic grounding)
  // - Radial vignette for cinematic spotlight on the craftsmanship
  const svgGradient = `
  <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Bottom-to-top black gradient -->
      <linearGradient id="bottomFade" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.35" />
        <stop offset="18%" stop-color="#000000" stop-opacity="0.05" />
        <stop offset="60%" stop-color="#000000" stop-opacity="0" />
        <stop offset="80%" stop-color="#000000" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.95" />
      </linearGradient>

      <!-- Radial vignette -->
      <radialGradient id="vignette" cx="50%" cy="52%" r="65%">
        <stop offset="45%" stop-color="#000000" stop-opacity="0" />
        <stop offset="80%" stop-color="#000000" stop-opacity="0.4" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.8" />
      </radialGradient>
      
      <!-- Side feathering -->
      <linearGradient id="sideFade" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.55" />
        <stop offset="10%" stop-color="#000000" stop-opacity="0" />
        <stop offset="90%" stop-color="#000000" stop-opacity="0" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.55" />
      </linearGradient>
    </defs>

    <rect width="${W}" height="${H}" fill="url(#vignette)" />
    <rect width="${W}" height="${H}" fill="url(#bottomFade)" />
    <rect width="${W}" height="${H}" fill="url(#sideFade)" />
  </svg>`;
  
  // Composite photo + black gradient
  const composited = await sharp(resized)
    .composite([{ input: Buffer.from(svgGradient), top: 0, left: 0 }])
    .png()
    .toBuffer();
    
  // Export high-res WebP and JPEG
  const outWebP = await sharp(composited)
    .modulate({ brightness: 0.95 })
    .webp({ quality: 90, effort: 6 })
    .toFile('assets/images/roots-story-craftsmanship.webp');
    
  const outJpg = await sharp(composited)
    .jpeg({ quality: 90, progressive: true })
    .toFile('assets/images/roots-story-craftsmanship.jpg');
    
  console.log('Generated assets/images/roots-story-craftsmanship.webp:', outWebP);
}

processManufacturingStoryImage().catch(console.error);
