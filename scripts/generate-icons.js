import fs from 'fs';
import zlib from 'zlib';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c >>> 0;
  }
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createIconPng(size) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);

  const rowSize = 1 + size * 4;
  const rawData = Buffer.alloc(rowSize * size);

  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0;
    const ny = y / (size - 1); // 0 to 1

    for (let x = 0; x < size; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const nx = x / (size - 1); // 0 to 1

      // Rounded container / icon background
      const padding = 0.08;
      const isInsideBase = (
        nx >= padding && nx <= 1 - padding &&
        ny >= padding && ny <= 1 - padding
      );

      // Icon design: Modern Folder in vibrant Blue with subtle gradient
      let r = 0, g = 0, b = 0, a = 0;

      // Outer squircle container
      const cx = nx - 0.5;
      const cy = ny - 0.5;
      const distFromCenter = Math.pow(Math.abs(cx * 2.2), 3) + Math.pow(Math.abs(cy * 2.2), 3);

      if (distFromCenter <= 1.0) {
        // App icon background: clean soft gradient
        r = Math.floor(37 + ny * 20); // 37 -> 57
        g = Math.floor(99 + ny * 25); // 99 -> 124
        b = Math.floor(235 + ny * 15); // 235 -> 250
        a = 255;

        // Folder graphic inside
        // Folder tab
        const inTab = (nx >= 0.22 && nx <= 0.48 && ny >= 0.28 && ny <= 0.38);
        // Folder body
        const inBody = (nx >= 0.22 && nx <= 0.78 && ny >= 0.38 && ny <= 0.72);

        if (inTab || inBody) {
          // White folder shape
          r = 255;
          g = 255;
          b = 255;
          a = 255;
        }

        // Inner document accent on folder
        const inDoc = (nx >= 0.36 && nx <= 0.64 && ny >= 0.46 && ny <= 0.64);
        if (inDoc) {
          r = 224;
          g = 242;
          b = 254; // Sky blue tint
          a = 255;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const idat = makeChunk('IDAT', zlib.deflateSync(rawData));
  const iend = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

if (!fs.existsSync('public/icons')) fs.mkdirSync('public/icons', { recursive: true });
fs.writeFileSync('public/icons/icon16.png', createIconPng(16));
fs.writeFileSync('public/icons/icon48.png', createIconPng(48));
fs.writeFileSync('public/icons/icon128.png', createIconPng(128));
console.log('App icons refreshed');
