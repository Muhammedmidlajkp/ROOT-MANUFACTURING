const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processStoryImage() {
  const inputPath = 'manufactering img.jpeg';
  const meta = await sharp(inputPath).metadata();
  console.log('Source:', meta.width, 'x', meta.height);
  
  // High-res target: 1200 x 1400 (or 1000 x 1300 portrait)
  const W = 1000;
  const H = 1300;
  
  // Resize source to cover
  const resized = await sharp(inputPath)
    .resize(W, H, { fit: 'cover', position: 'center' })
    .toBuffer();
    
  // Create black gradient overlay:
  // - Dark bottom fade (gives grounding weight)
  // - Dark top fade
  // - Left & Right edge vignette
  // - Deep dramatic contrast
  const svgGradient = `
  <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Perimeter vignette & bottom gradient -->
      <linearGradient id="bottomFade" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#080808" stop-opacity="0.3" />
        <stop offset="15%" stop-color="#080808" stop-opacity="0" />
        <stop offset="65%" stop-color="#080808" stop-opacity="0" />
        <stop offset="85%" stop-color="#080808" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#080808" stop-opacity="0.95" />
      </linearGradient>

      <!-- Radial corner vignette for cinematic depth -->
      <radialGradient id="cornerVignette" cx="50%" cy="45%" r="60%">
        <stop offset="50%" stop-color="#000000" stop-opacity="0" />
        <stop offset="85%" stop-color="#000000" stop-opacity="0.45" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.85" />
      </radialGradient>
      
      <!-- Side edge feathering -->
      <linearGradient id="sideFade" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#080808" stop-opacity="0.5" />
        <stop offset="12%" stop-color="#080808" stop-opacity="0" />
        <stop offset="88%" stop-color="#080808" stop-opacity="0" />
        <stop offset="100%" stop-color="#080808" stop-opacity="0.5" />
      </linearGradient>
    </defs>

    <rect width="${W}" height="${H}" fill="url(#cornerVignette)" />
    <rect width="${W}" height="${H}" fill="url(#bottomFade)" />
    <rect width="${W}" height="${H}" fill="url(#sideFade)" />
  </svg>`;
  
  // Composite photo + black gradient
  const composited = await sharp(resized)
    .composite([{ input: Buffer.from(svgGradient), top: 0, left: 0 }])
    .png()
    .toBuffer();
    
  // High quality WebP & JPEG exports
  const outWebP = await sharp(composited)
    .modulate({ brightness: 0.95 })
    .webp({ quality: 90, effort: 6 })
    .toFile('assets/images/roots-story-craftsmanship.webp');
    
  const outJpg = await sharp(composited)
    .jpeg({ quality: 90, progressive: true })
    .toFile('assets/images/roots-story-craftsmanship.jpg');
    
  console.log('Story image generated with black gradient:', outWebP);

  // Also restore Hero image from HERO IMG.png if HERO IMG.png exists
  if (fs.existsSync('HERO IMG.png')) {
    console.log('Restoring hero craftsman image from HERO IMG.png...');
    await sharp('HERO IMG.png')
      .webp({ quality: 90, effort: 6 })
      .toFile('assets/images/roots-hero-craftsmanship.webp');
      
    await sharp('HERO IMG.png')
      .resize({ width: 1080, withoutEnlargement: true })
      .webp({ quality: 88, effort: 6 })
      .toFile('assets/images/roots-hero-craftsmanship-mobile.webp');
      
    await sharp('HERO IMG.png')
      .jpeg({ quality: 90, progressive: true })
      .toFile('assets/images/roots-hero-craftsmanship.jpg');
    console.log('Hero image restored.');
  }
}

processStoryImage().catch(console.error);
