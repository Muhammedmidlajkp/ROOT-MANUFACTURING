const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

function boostAlpha(alpha, gamma = 0.5, threshold = 12) {
  if (alpha < threshold) return 0;
  const normalized = (alpha - threshold) / (255 - threshold);
  const boosted = Math.pow(normalized, gamma);
  return Math.min(255, Math.round(boosted * 255));
}

function createIco(pngBuffers) {
  // pngBuffers: array of { width, height, buffer }
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = count * dirEntrySize;
  
  let offset = headerSize + dirSize;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(count, 4); // Number of images
  
  const entries = [];
  for (const item of pngBuffers) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(item.width === 256 ? 0 : item.width, 0);
    entry.writeUInt8(item.height === 256 ? 0 : item.height, 1);
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(item.buffer.length, 8); // Image size in bytes
    entry.writeUInt32LE(offset, 12); // Offset to image data
    entries.push(entry);
    offset += item.buffer.length;
  }
  
  return Buffer.concat([header, ...entries, ...pngBuffers.map(p => p.buffer)]);
}

async function generateProductionFavicons() {
  console.log('=== Generating Production ROOTS Favicon System ===');
  
  // 1. Source unmatting from ROOTS FAV.png
  const { data, info } = await sharp('ROOTS FAV.png').raw().toBuffer({ resolveWithObject: true });
  const unflattened = Buffer.alloc(info.width * info.height * 4);
  
  for (let i = 0; i < info.width * info.height; i++) {
    const srcIdx = i * info.channels;
    const dstIdx = i * 4;
    const r = data[srcIdx], g = data[srcIdx+1], b = data[srcIdx+2];
    
    const diffG = 255 - g;
    const diffB = 255 - b;
    const maxDiff = Math.max(diffG, diffB);
    
    if (maxDiff < 8) {
      unflattened[dstIdx] = 0;
      unflattened[dstIdx+1] = 0;
      unflattened[dstIdx+2] = 0;
      unflattened[dstIdx+3] = 0;
    } else {
      let alpha = Math.min(255, Math.round((maxDiff / 212) * 255));
      const aNorm = alpha / 255;
      let fgR = Math.min(255, Math.max(0, Math.round((r - (1 - aNorm) * 255) / aNorm)));
      let fgG = Math.min(255, Math.max(0, Math.round((g - (1 - aNorm) * 255) / aNorm)));
      let fgB = Math.min(255, Math.max(0, Math.round((b - (1 - aNorm) * 255) / aNorm)));
      if (fgR < 180) fgR = 224;
      
      unflattened[dstIdx] = fgR;
      unflattened[dstIdx+1] = fgG;
      unflattened[dstIdx+2] = fgB;
      unflattened[dstIdx+3] = alpha;
    }
  }
  
  // Exclude detached crop remnants (0..11 and 910..911)
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (x < 45 || x > 880 || y > 706 || y < 35) {
        const idx = (y * info.width + x) * 4;
        unflattened[idx+3] = 0;
      }
    }
  }
  
  // Crop to exact ink bounds
  let minX = info.width, maxX = 0, minY = info.height, maxY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * 4;
      if (unflattened[idx+3] > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  const croppedWidth = maxX - minX + 1;
  const croppedHeight = maxY - minY + 1;
  const croppedBuf = Buffer.alloc(croppedWidth * croppedHeight * 4);
  for (let y = 0; y < croppedHeight; y++) {
    for (let x = 0; x < croppedWidth; x++) {
      const srcIdx = ((minY + y) * info.width + (minX + x)) * 4;
      const dstIdx = (y * croppedWidth + x) * 4;
      croppedBuf[dstIdx] = unflattened[srcIdx];
      croppedBuf[dstIdx+1] = unflattened[srcIdx+1];
      croppedBuf[dstIdx+2] = unflattened[srcIdx+2];
      croppedBuf[dstIdx+3] = unflattened[srcIdx+3];
    }
  }
  
  // Create 1024x1024 high-res master square canvas
  const canvasSize = 1024;
  const logoWidth = Math.round(canvasSize * 0.94); // 963px
  const logoHeight = Math.round(logoWidth * (croppedHeight / croppedWidth));
  const top = Math.round((canvasSize - logoHeight) / 2);
  const left = Math.round((canvasSize - logoWidth) / 2);
  
  const resizedMasterPng = await sharp(croppedBuf, { raw: { width: croppedWidth, height: croppedHeight, channels: 4 } })
    .resize(logoWidth, logoHeight, { kernel: 'lanczos3' })
    .png()
    .toBuffer();
    
  const squareMaster = await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  }).composite([{ input: resizedMasterPng, top, left }]).png().toBuffer();
  
  async function generateSize(s) {
    const rawResized = await sharp(squareMaster)
      .resize(s, s, { kernel: 'lanczos3' })
      .raw()
      .toBuffer({ resolveWithObject: true });
      
    const { data: resData } = rawResized;
    const optBuf = Buffer.alloc(resData.length);
    
    let gamma = 0.5;
    let thresh = 12;
    if (s <= 16) { gamma = 0.42; thresh = 10; }
    else if (s <= 24) { gamma = 0.48; thresh = 12; }
    else if (s <= 32) { gamma = 0.55; thresh = 14; }
    else if (s <= 48) { gamma = 0.70; thresh = 15; }
    else { gamma = 0.85; thresh = 16; }
    
    for (let i = 0; i < s * s; i++) {
      const idx = i * 4;
      const a = resData[idx+3];
      const newAlpha = boostAlpha(a, gamma, thresh);
      optBuf[idx] = 224;   // R
      optBuf[idx+1] = 36;  // G
      optBuf[idx+2] = 42;  // B
      optBuf[idx+3] = newAlpha;
    }
    
    return await sharp(optBuf, { raw: { width: s, height: s, channels: 4 } }).png().toBuffer();
  }
  
  const png16 = await generateSize(16);
  const png32 = await generateSize(32);
  const png48 = await generateSize(48);
  const png180 = await generateSize(180);
  
  // Write output files to workspace root:
  fs.writeFileSync('favicon-32.png', png32);
  fs.writeFileSync('favicon-180.png', png180);
  fs.writeFileSync('apple-touch-icon.png', png180);
  
  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: png16 },
    { width: 32, height: 32, buffer: png32 },
    { width: 48, height: 48, buffer: png48 }
  ]);
  fs.writeFileSync('favicon.ico', icoBuffer);
  
  console.log('Production favicon files generated successfully:');
  console.log('- favicon.ico:', (icoBuffer.length / 1024).toFixed(2), 'KB (' + icoBuffer.length + ' bytes)');
  console.log('- favicon-32.png:', (png32.length / 1024).toFixed(2), 'KB (' + png32.length + ' bytes)');
  console.log('- favicon-180.png:', (png180.length / 1024).toFixed(2), 'KB (' + png180.length + ' bytes)');
  console.log('- apple-touch-icon.png:', (png180.length / 1024).toFixed(2), 'KB (' + png180.length + ' bytes)');
}

generateProductionFavicons();
