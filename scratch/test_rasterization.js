const sharp = require('sharp');
const fs = require('fs');

function boostAlpha(alpha, gamma = 0.4, threshold = 15) {
  if (alpha < threshold) return 0;
  const normalized = (alpha - threshold) / (255 - threshold);
  // Power curve to boost mid-tones while keeping smooth anti-aliasing
  const boosted = Math.pow(normalized, gamma);
  return Math.min(255, Math.round(boosted * 255));
}

async function renderAsciiGrid(buf, size, label) {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  console.log(`\n=== ${label} (${size}x${size}) ===`);
  for (let y = 0; y < size; y++) {
    let line = '';
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * info.channels;
      const a = data[idx+3];
      if (a === 0) line += '  ';
      else if (a < 70) line += '· ';
      else if (a < 150) line += '░ ';
      else if (a < 220) line += '▒ ';
      else line += '██';
    }
    console.log(line);
  }
}

async function testOptimizedRasterization() {
  const masterBuf = fs.readFileSync('scratch/cropped-master.png');
  const masterMeta = await sharp(masterBuf).metadata();
  
  // Test different canvas fills: e.g. 94% fill vs 96% fill
  const canvasSize = 1024;
  const logoWidth = Math.round(canvasSize * 0.94); // 963px
  const logoHeight = Math.round(logoWidth * (masterMeta.height / masterMeta.width)); // 781px
  
  // Optical vertical centering:
  // Mathematical center is (1024 - 781) / 2 = 121.5
  // Visual weight of ROOTS: ascenders at top, underline/descender at bottom
  const top = Math.round((canvasSize - logoHeight) / 2);
  const left = Math.round((canvasSize - logoWidth) / 2);
  
  const resizedMaster = await sharp(masterBuf)
    .resize(logoWidth, logoHeight, { kernel: 'lanczos3' })
    .toBuffer();
    
  const squareMaster = await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  }).composite([{ input: resizedMaster, top, left }]).png().toBuffer();
  
  fs.writeFileSync('scratch/master-square-1024.png', squareMaster);
  
  // Test generation for 16, 20, 24, 32, 48, 180
  const sizes = [16, 20, 24, 32, 48, 180];
  
  for (const s of sizes) {
    // 1. Resize from 1024 to target size with high-quality resampling
    const rawResized = await sharp(squareMaster)
      .resize(s, s, { kernel: 'lanczos3' })
      .raw()
      .toBuffer({ resolveWithObject: true });
      
    const { data, info } = rawResized;
    const optimized = Buffer.alloc(data.length);
    
    // Choose gamma based on size: smaller sizes (16, 20, 24) benefit from gamma 0.45 - 0.55
    // Larger sizes (48, 180) need less boosting (gamma 0.7 - 0.85)
    let gamma = 0.5;
    let thresh = 12;
    if (s <= 16) { gamma = 0.42; thresh = 10; }
    else if (s <= 24) { gamma = 0.48; thresh = 12; }
    else if (s <= 32) { gamma = 0.55; thresh = 14; }
    else if (s <= 48) { gamma = 0.70; thresh = 15; }
    else { gamma = 0.85; thresh = 16; }
    
    let solid = 0, mid = 0, faint = 0, zero = 0;
    
    for (let i = 0; i < s * s; i++) {
      const idx = i * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
      
      const newAlpha = boostAlpha(a, gamma, thresh);
      
      // Preserve the clean ROOTS red (DC292E / rgb(220, 41, 46) / rgb(240, 20, 25))
      // Standard ROOTS brand red
      optimized[idx] = 224;     // R
      optimized[idx+1] = 36;    // G
      optimized[idx+2] = 42;    // B
      optimized[idx+3] = newAlpha;
      
      if (newAlpha === 0) zero++;
      else if (newAlpha < 80) faint++;
      else if (newAlpha < 180) mid++;
      else solid++;
    }
    
    const optPng = await sharp(optimized, { raw: { width: s, height: s, channels: 4 } }).png().toBuffer();
    fs.writeFileSync(`scratch/favicon-opt-${s}.png`, optPng);
    
    console.log(`\nSize ${s}x${s}: solid: ${solid}, mid: ${mid}, faint: ${faint}, zero: ${zero}`);
    if (s <= 32) {
      await renderAsciiGrid(optPng, s, `Optimized ROOTS Favicon`);
    }
  }
}

testOptimizedRasterization();
