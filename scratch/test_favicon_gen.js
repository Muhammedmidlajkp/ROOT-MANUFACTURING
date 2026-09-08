const sharp = require('sharp');
const fs = require('fs');

async function testSizes() {
  const sizes = [16, 20, 24, 32, 48, 180];
  for (const s of sizes) {
    const buf = await sharp('scratch/favicon-square-1024.png')
      .resize(s, s, { kernel: 'lanczos3' })
      .raw()
      .toBuffer({ resolveWithObject: true });
      
    const { data, info } = buf;
    let solidCount = 0, midCount = 0, faintCount = 0, zeroCount = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      const a = data[i+3];
      if (a === 0) zeroCount++;
      else if (a < 80) faintCount++;
      else if (a < 180) midCount++;
      else solidCount++;
    }
    console.log('Size ' + s + 'x' + s + ' (standard lanczos3): solid(>180): ' + solidCount + ', mid(80..180): ' + midCount + ', faint(<80): ' + faintCount + ', zero: ' + zeroCount);
  }
}
testSizes();
