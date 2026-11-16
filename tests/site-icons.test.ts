// 원본 favicon 보존과 작은 PNG 프레임·큰 아이콘의 픽셀 및 메타데이터를 검사합니다.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import sharp from 'sharp';

const directory = resolve('apps/frontend-landing-page/src/features/seo/icons');
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

test('site icons retain the original artwork with small clean PNG-compressed ICO frames', async () => {
  const original = await readFile(resolve(directory, 'originals/favicon.ico'));
  assert.equal(hash(original), '98963b29d8487c66ba5a5a43e79169970c5ec34c1919a20213ad93bafe9442c9');
  const icon = await readFile(resolve(directory, 'favicon.ico'));
  assert.deepEqual(icon, await readFile('apps/frontend-landing-page/public/favicon.ico'));
  assert.ok(icon.length < 10000, `small favicon: ${icon.length}B`);
  assert.equal(icon.readUInt16LE(2), 1);
  assert.equal(icon.readUInt16LE(4), 3);
  for (const [index, size] of [16, 32, 48].entries()) {
    const entry = 6 + index * 16;
    const offset = icon.readUInt32LE(entry + 12);
    const bytes = icon.subarray(offset, offset + icon.readUInt32LE(entry + 8));
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.format, 'png');
    assert.equal(metadata.width, size);
    assert.equal(metadata.height, size);
    for (const key of ['exif', 'icc', 'iptc', 'xmp', 'orientation', 'comments'] as const) {
      assert.equal(metadata[key], undefined);
    }
  }

  const full = await sharp(resolve(directory, 'icon-256.png')).ensureAlpha().raw().toBuffer();
  const dib = original.readUInt32LE(18);
  const pixelOffset = dib + original.readUInt32LE(dib);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const source = pixelOffset + ((255 - y) * 256 + x) * 4;
      const target = (y * 256 + x) * 4;
      assert.deepEqual(
        full.subarray(target, target + 4),
        Buffer.from([
          original[source + 2],
          original[source + 1],
          original[source],
          original[source + 3],
        ]),
      );
    }
  }
  const manifest = JSON.parse(await readFile(resolve(directory, 'manifest.json'), 'utf8'));
  for (const [name, expected] of Object.entries(manifest.files) as Array<
    [string, { bytes: number; sha256: string }]
  >) {
    const bytes = await readFile(resolve(directory, name));
    assert.equal(bytes.length, expected.bytes);
    assert.equal(hash(bytes), expected.sha256);
  }
  for (const [name, size] of [
    ['apple-touch-icon.png', 180],
    ['icon-256.png', 256],
  ] as const) {
    const metadata = await sharp(resolve(directory, name)).metadata();
    assert.equal(metadata.width, size);
    assert.equal(metadata.height, size);
    for (const key of ['exif', 'icc', 'iptc', 'xmp', 'orientation', 'comments'] as const) {
      assert.equal(metadata[key], undefined);
    }
  }
});
