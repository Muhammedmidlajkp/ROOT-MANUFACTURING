const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

async function processHero() {
  const inputPath = path.resolve('HERO IMG.png');
  const outDir = path.resolve('assets/images');

  if (!fs.existsSync(inputPath)) {
    console.error('HERO IMG.png not found at', inputPath);
    process.exit(1);
  }

  console.log('Processing HERO IMG.png with sharp...');

  // 1. Desktop WebP master
  await sharp(inputPath)
    .webp({ quality: 90, effort: 6 })
    .toFile(path.join(outDir, 'roots-hero-craftsmanship.webp'));
  console.log('Generated assets/images/roots-hero-craftsmanship.webp');

  // 2. Mobile WebP
  await sharp(inputPath)
    .resize({ width: 1080, withoutEnlargement: true })
    .webp({ quality: 88, effort: 6 })
    .toFile(path.join(outDir, 'roots-hero-craftsmanship-mobile.webp'));
  console.log('Generated assets/images/roots-hero-craftsmanship-mobile.webp');

  // 3. Fallback high-res PNG / JPEG
  await sharp(inputPath)
    .jpeg({ quality: 90, progressive: true })
    .toFile(path.join(outDir, 'roots-hero-craftsmanship.jpg'));
  console.log('Generated assets/images/roots-hero-craftsmanship.jpg');

  console.log('Hero image replacement complete.');
}

processHero().catch(err => {
  console.error(err);
  process.exit(1);
});
