const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processLinen() {
  const input = 'mens linen.jpeg';
  const outDir = 'assets/images';
  
  if (!fs.existsSync(input)) {
    console.error('mens linen.jpeg not found');
    process.exit(1);
  }
  
  // Master WebP
  await sharp(input)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 88, effort: 6 })
    .toFile(path.join(outDir, 'roots-focus-linen.webp'));
    
  // 800px WebP
  await sharp(input)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 86, effort: 6 })
    .toFile(path.join(outDir, 'roots-focus-linen-800.webp'));
    
  // 400px WebP
  await sharp(input)
    .resize({ width: 400, withoutEnlargement: true })
    .webp({ quality: 86, effort: 6 })
    .toFile(path.join(outDir, 'roots-focus-linen-400.webp'));
    
  // JPEG fallback
  await sharp(input)
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 88, progressive: true })
    .toFile(path.join(outDir, 'roots-focus-linen.jpg'));
    
  console.log('mens linen.jpeg processed and deployed to assets/images/roots-focus-linen.*');
}

processLinen().catch(console.error);
