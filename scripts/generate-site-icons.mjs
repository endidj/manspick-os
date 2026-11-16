// 원본 ICO를 보존하면서 작은 favicon과 큰 PNG 아이콘을 필요할 때만 생성합니다.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { format } from 'prettier';
import sharp from 'sharp';

const directory = new URL('../apps/frontend-landing-page/src/features/seo/icons/', import.meta.url);
const fallback = new URL('../apps/frontend-landing-page/public/favicon.ico', import.meta.url);
const sourceHash = '98963b29d8487c66ba5a5a43e79169970c5ec34c1919a20213ad93bafe9442c9';
const options = {
  version: 1,
  sharp: sharp.versions.sharp,
  sizes: [16, 32, 48, 180, 256],
  compressionLevel: 9,
  adaptiveFiltering: true,
};
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

function decodeOriginal(bytes) {
  if (hash(bytes) !== sourceHash) throw new Error('Original favicon hash changed');
  const offset = bytes.readUInt32LE(18);
  const dib = bytes.subarray(offset);
  const width = dib.readInt32LE(4);
  const height = dib.readInt32LE(8) / 2;
  if (
    bytes.readUInt16LE(2) !== 1 ||
    bytes.readUInt16LE(4) !== 1 ||
    dib.readUInt32LE(0) !== 40 ||
    width !== 256 ||
    height !== 256 ||
    dib.readUInt16LE(14) !== 32 ||
    dib.readUInt32LE(16) !== 0
  ) {
    throw new Error('Expected the preserved 256px uncompressed 32bit ICO');
  }
  const pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const source = 40 + ((height - y - 1) * width + x) * 4;
      const target = (y * width + x) * 4;
      pixels[target] = dib[source + 2];
      pixels[target + 1] = dib[source + 1];
      pixels[target + 2] = dib[source];
      pixels[target + 3] = dib[source + 3];
    }
  }
  return pixels;
}

function makeIcon(frames) {
  const header = Buffer.alloc(6 + frames.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);
  let offset = header.length;
  frames.forEach(({ size, png }, index) => {
    const entry = 6 + index * 16;
    header[entry] = size;
    header[entry + 1] = size;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...frames.map(({ png }) => png)]);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((argument) => argument !== '--check')) throw new Error('Only --check is supported');
  const check = args.includes('--check');
  const original = await readFile(new URL('originals/favicon.ico', directory));
  const pixels = decodeOriginal(original);
  const manifestUrl = new URL('manifest.json', directory);
  if (check) {
    const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));
    if (
      manifest.sourceSha256 !== sourceHash ||
      JSON.stringify(manifest.options) !== JSON.stringify(options)
    ) {
      throw new Error('Icon source or encoding options are stale');
    }
    for (const name of ['favicon.ico', 'apple-touch-icon.png', 'icon-256.png']) {
      const bytes = await readFile(new URL(name, directory));
      if (
        hash(bytes) !== manifest.files[name]?.sha256 ||
        bytes.length !== manifest.files[name]?.bytes
      ) {
        throw new Error(`Missing, changed or corrupt icon: ${name}`);
      }
    }
    if (!(await readFile(fallback)).equals(await readFile(new URL('favicon.ico', directory)))) {
      throw new Error('Public favicon fallback is stale');
    }
    console.log(
      JSON.stringify({ check: true, originalBytes: original.length, files: manifest.files }),
    );
    return;
  }
  const frames = [];
  for (const size of options.sizes) {
    const png = await sharp(pixels, { raw: { width: 256, height: 256, channels: 4 } })
      .resize(size, size, { withoutEnlargement: true })
      .png({
        compressionLevel: options.compressionLevel,
        adaptiveFiltering: options.adaptiveFiltering,
      })
      .toBuffer();
    frames.push({ size, png });
  }
  const files = {
    'favicon.ico': makeIcon(frames.filter(({ size }) => size <= 48)),
    'apple-touch-icon.png': frames.find(({ size }) => size === 180).png,
    'icon-256.png': frames.find(({ size }) => size === 256).png,
  };
  const records = {};
  for (const [name, bytes] of Object.entries(files)) {
    await writeFile(new URL(name, directory), bytes);
    records[name] = { bytes: bytes.length, sha256: hash(bytes) };
  }
  await writeFile(fallback, files['favicon.ico']);
  await writeFile(
    manifestUrl,
    await format(JSON.stringify({ sourceSha256: sourceHash, options, files: records }), {
      parser: 'json',
      printWidth: 100,
    }),
  );
  console.log(
    JSON.stringify({
      check: false,
      original: fileURLToPath(new URL('originals/favicon.ico', directory)),
      originalBytes: original.length,
      files: records,
    }),
  );
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
