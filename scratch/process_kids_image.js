const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processKids() {
  const input = 'KIDS.jpeg';
  const outDir = 'assets/images';
  
  if (!fs.existsSync(input)) {
    console.error('KIDS.jpeg not found');
    process.exit(1);
  }
  
  // Master WebP
  await sharp(input)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 88, effort: 6 })
    .toFile(path.join(outDir, 'roots-focus-kids.webp'));
    
  // 800px WebP
  await sharp(input)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 86, effort: 6 })
    .toFile(path.join(outDir, 'roots-focus-kids-800.webp'));
    
  // 400px WebP
  await sharp(input)
    .resize({ width: 400, withoutEnlargement: true })
    .webp({ quality: 86, effort: 6 })
    .toFile(path.join(outDir, 'roots-focus-kids-400.webp'));
    
  // JPEG fallback
  await sharp(input)
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 88, progressive: true })
    .toFile(path.join(outDir, 'roots-focus-kids.jpg'));
    
  console.log('KIDS.jpeg processed and deployed to assets/images/roots-focus-kids.*');
}

processKids().catch(console.error);
