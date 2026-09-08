const sharp = require('sharp');

async function calibrate() {
  const { data, info } = await sharp('assets/images/roots-logo.png').raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  
  // Find all red pixels in 480x320, convert to 1200x800 space (x*2.5, y*2.5)
  const redPixels = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * info.channels;
      if (data[idx] > 120 && data[idx+3] > 80) {
        redPixels.push({ x: x * 2.5, y: y * 2.5 });
      }
    }
  }
  
  // Tagline pixels (y > 500, x > 400)
  const tagline = redPixels.filter(p => p.y >= 520);
  const minTagX = Math.min(...tagline.map(p => p.x));
  const maxTagX = Math.max(...tagline.map(p => p.x));
  const minTagY = Math.min(...tagline.map(p => p.y));
  const maxTagY = Math.max(...tagline.map(p => p.y));
  console.log(`Tagline bounds: X: ${minTagX}..${maxTagX}, Y: ${minTagY}..${maxTagY}`);
  
  // T pixels (x between 620 and 780, y between 100 and 380)
  const tPixels = redPixels.filter(p => p.x >= 600 && p.x <= 760 && p.y <= 380);
  console.log(`T bounds: X: ${Math.min(...tPixels.map(p => p.x))}..${Math.max(...tPixels.map(p => p.x))}, Y: ${Math.min(...tPixels.map(p => p.y))}..${Math.max(...tPixels.map(p => p.y))}`);
  
  // S pixels (x > 750, y between 120 and 380)
  const sPixels = redPixels.filter(p => p.x >= 750 && p.y <= 380);
  console.log(`S bounds: X: ${Math.min(...sPixels.map(p => p.x))}..${Math.max(...sPixels.map(p => p.x))}, Y: ${Math.min(...sPixels.map(p => p.y))}..${Math.max(...sPixels.map(p => p.y))}`);
}

calibrate();
