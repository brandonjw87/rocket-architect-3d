const fs = require('fs');
const path = require('path');

// Simple pure Node PNG generator for Android mipmap icons
// Creates an ultra-crisp neon Cyan/Gold "Arrow Up" vector icon on a dark slate circle/square
function createIconPng(width, height, isRound) {
  const zlib = require('zlib');
  const buffer = Buffer.alloc(width * height * 4);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width / 2 - 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (isRound && dist > radius) {
        // Transparent outer boundary for round icon
        buffer[idx] = 0;
        buffer[idx + 1] = 0;
        buffer[idx + 2] = 0;
        buffer[idx + 3] = 0;
        continue;
      }

      // Background: Dark Slate #0b1120
      let r = 11;
      let g = 17;
      let b = 32;
      let a = 255;

      // Outer Cyan Ring
      if (dist > radius - 3 && dist <= radius) {
        r = 0; g = 240; b = 255;
      }

      // Normalized coordinates from -1 to 1
      const nx = (x - cx) / (width * 0.4);
      const ny = (y - cy) / (height * 0.4);

      // Arrow Up Vector geometry:
      // Tip at (0, -0.75), Left Wing (-0.55, 0.25), Right Wing (0.55, 0.25), Notch (0, 0.05), Stem bottom (0, 0.75)
      const inArrow = (
        (ny >= -0.75 && ny <= 0.25 && Math.abs(nx) <= (ny + 0.75) * 0.55) || // Triangular Head
        (Math.abs(nx) <= 0.18 && ny >= -0.1 && ny <= 0.75) // Center Vertical Shaft
      );

      const inGoldCore = (
        (Math.abs(nx) <= 0.06 && ny >= -0.5 && ny <= 0.6) // Central Gold Core Beam
      );

      if (inGoldCore) {
        r = 255; g = 183; b = 0; // Gold Core
      } else if (inArrow) {
        r = 0; g = 240; b = 255; // Neon Cyan Body
      }

      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  // Build raw uncompressed PNG chunk structure
  return buildPng(width, height, buffer, zlib);
}

function buildPng(width, height, rgbaBuffer, zlib) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type 6 (RGBA)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT Chunk (Scanlines with filter byte 0)
  const rawLines = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    rawLines[y * (width * 4 + 1)] = 0; // Filter 0 (None)
    rgbaBuffer.copy(rawLines, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressedData = zlib.deflateSync(rawLines);
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);

  const crc32 = calcCrc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc32, 8 + len);
  return buf;
}

function calcCrc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Generate across all Android mipmap density folders
const BASE_RES_DIR = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

Object.entries(SIZES).forEach(([dirName, size]) => {
  const targetDir = path.join(BASE_RES_DIR, dirName);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const standardPng = createIconPng(size, size, false);
  fs.writeFileSync(path.join(targetDir, 'ic_launcher.png'), standardPng);

  const roundPng = createIconPng(size, size, true);
  fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), roundPng);

  console.log(`Generated ${dirName} icons (${size}x${size})`);
});
console.log('All Android Launcher Icons generated successfully!');
