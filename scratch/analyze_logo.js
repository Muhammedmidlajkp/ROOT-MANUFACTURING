const sharp = require('sharp');
const fs = require('fs');

async function analyze() {
  const { data, info } = await sharp('assets/images/roots-logo.png').raw().toBuffer({ resolveWithObject: true });
  console.log('Analyzing logo channels and strokes...');
  
  // Let's create an ASCII map or bounding boxes for different sections:
  // Let's find pixel locations of key features in 480x320:
  // 1. R left tip: around minX=16
  // 2. R top loop apex
  // 3. R junction
  // 4. R bottom tail: around maxY=292
  // 5. First O
  // 6. Second O
  // 7. T top tip
  // 8. S top loop & bottom
  // 9. Tagline
  
  const width = info.width;
  const height = info.height;
  
  // Find points with red color (r > 150, g < 100, b < 100, alpha > 100)
  const isRed = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    const idx = (y * width + x) * info.channels;
    return data[idx] > 140 && data[idx+1] < 100 && data[idx+3] > 100;
  };
  
  // Search for features
  console.log('Logo scan complete.');
}

analyze();
