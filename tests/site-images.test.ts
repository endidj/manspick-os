// 웹용 사본의 방향·메타데이터 제거·증분 캐시와 원본 보존을 검사합니다.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import sharp from 'sharp';

const script = resolve('scripts/generate-site-images.mjs');
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

function generate(site: string, check = false) {
  return spawnSync(process.execPath, [script, '--site-dir', site, ...(check ? ['--check'] : [])], {
    encoding: 'utf8',
    windowsHide: true,
  });
}

async function fixture() {
  const site = await mkdtemp(join(tmpdir(), 'manspick-site-images-'));
  await mkdir(join(site, 'originals'));
  const portrait = await sharp({
    create: { width: 24, height: 12, channels: 3, background: '#d85a24' },
  })
    .withMetadata({ orientation: 6 })
    .withExifMerge({ IFD0: { Artist: 'Private photographer', Copyright: 'Private location' } })
    .withXmp('<x:xmpmeta xmlns:x="adobe:ns:meta/"><private>location</private></x:xmpmeta>')
    .jpeg()
    .toBuffer();
  const alpha = await sharp({
    create: {
      width: 32,
      height: 20,
      channels: 4,
      background: { r: 30, g: 80, b: 150, alpha: 0.5 },
    },
  })
    .withMetadata()
    .png()
    .toBuffer();
  const originals = { 'portrait.jpg': portrait, 'hero-after-1.png': alpha };
  for (const [name, bytes] of Object.entries(originals)) {
    await writeFile(join(site, 'originals', name), bytes);
  }
  await writeFile(
    join(site, 'originals/manifest.json'),
    JSON.stringify({
      files: Object.entries(originals).map(([file, bytes]) => ({
        file,
        bytes: bytes.length,
        sha256: hash(bytes),
      })),
    }),
  );
  return { site, originals };
}

test('generated WebP preserves oriented dimensions and alpha while stripping private metadata', async () => {
  const { site, originals } = await fixture();
  try {
    const sourceMeta = await sharp(originals['portrait.jpg']).metadata();
    assert.equal(sourceMeta.orientation, 6);
    assert.ok(sourceMeta.exif && sourceMeta.icc && sourceMeta.xmp);
    const result = generate(site);
    assert.equal(result.status, 0, result.stderr);
    const manifest = JSON.parse(await readFile(join(site, 'generated/manifest.json'), 'utf8'));
    assert.equal(manifest.images['portrait.jpg'].width, 12);
    assert.equal(manifest.images['portrait.jpg'].height, 24);
    for (const [name, original] of Object.entries(originals)) {
      assert.deepEqual(await readFile(join(site, 'originals', name)), original);
      for (const variant of manifest.images[name].variants) {
        const output = await readFile(join(site, 'generated', variant.file));
        const metadata = await sharp(output).metadata();
        assert.equal(metadata.format, 'webp');
        assert.equal(metadata.width, variant.width);
        assert.equal(metadata.height, variant.height);
        assert.ok(metadata.width! <= manifest.images[name].width);
        for (const key of ['exif', 'icc', 'iptc', 'xmp', 'orientation', 'comments'] as const) {
          assert.equal(metadata[key], undefined, `${name}: ${key}`);
        }
        if (name.endsWith('.png')) assert.equal(metadata.hasAlpha, true);
        assert.equal(hash(output), variant.sha256);
      }
    }
    const sourceModule = await readFile(join(site, 'source-images.ts'), 'utf8');
    assert.doesNotMatch(sourceModule, /from ['"]\.\/originals\//);
    assert.match(sourceModule, /export const sourceImages/);
    assert.match(sourceModule, /thumbnailSrc/);
  } finally {
    await rm(site, { recursive: true, force: true });
  }
});

test('warm generation skips encoding and check detects stale, missing and corrupt output without writing', async () => {
  const { site } = await fixture();
  try {
    const first = generate(site);
    assert.equal(first.status, 0, first.stderr);
    const manifestPath = join(site, 'generated/manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    const outputPath = join(site, 'generated', manifest.images['portrait.jpg'].variants[0].file);
    const before = await stat(outputPath);
    const warm = generate(site);
    assert.equal(warm.status, 0, warm.stderr);
    assert.equal(JSON.parse(warm.stdout).encoded, 0);
    assert.equal((await stat(outputPath)).mtimeMs, before.mtimeMs);
    assert.equal(generate(site, true).status, 0);

    await writeFile(outputPath, 'broken image');
    const broken = generate(site, true);
    assert.notEqual(broken.status, 0);
    assert.equal(await readFile(outputPath, 'utf8'), 'broken image');
    const repaired = generate(site);
    assert.equal(repaired.status, 0, repaired.stderr);
    assert.equal(JSON.parse(repaired.stdout).encoded, 1);

    await rm(outputPath);
    assert.notEqual(generate(site, true).status, 0);
    assert.equal(generate(site).status, 0);
    const current = JSON.parse(await readFile(manifestPath, 'utf8'));
    current.pipeline.quality = 1;
    await writeFile(manifestPath, JSON.stringify(current));
    assert.notEqual(generate(site, true).status, 0);
    assert.equal(generate(site).status, 0);
    assert.equal(generate(site, true).status, 0);
  } finally {
    await rm(site, { recursive: true, force: true });
  }
});

test('checked-in site images are fresh, smaller and contain no private metadata', () => {
  const result = generate(resolve('packages/design-system/src/assets/site'), true);
  assert.equal(result.status, 0, result.stderr);
  const summary = JSON.parse(result.stdout);
  assert.equal(summary.images, 72);
  assert.equal(summary.encoded, 0);
  assert.ok(summary.generatedBytes < summary.originalBytes);
});
