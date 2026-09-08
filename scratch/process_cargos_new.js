const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processCargosNew() {
  const input = 'CARGOS NEW.png';
  const outDir = 'assets/images';
  
  if (!fs.existsSync(input)) {
    console.error('CARGOS NEW.png not found');
    process.exit(1);
  }
  
  // 1200px master
  await sharp(input)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 88, effort: 6 })
    .toFile(path.join(outDir, 'roots-focus-cargos.webp'));
    
  // 800px tablet
  await sharp(input)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 86, effort: 6 })
    .toFile(path.join(outDir, 'roots-focus-cargos-800.webp'));
    
  // 400px mobile
  await sharp(input)
    .resize({ width: 400, withoutEnlargement: true })
    .webp({ quality: 86, effort: 6 })
    .toFile(path.join(outDir, 'roots-focus-cargos-400.webp'));
    
  // 1200px JPEG fallback
  await sharp(input)
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 88, progressive: true })
    .toFile(path.join(outDir, 'roots-focus-cargos.jpg'));
    
  console.log('CARGOS NEW.png processed and deployed to assets/images/roots-focus-cargos.*');
}

processCargosNew().catch(console.error);
