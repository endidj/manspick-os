// 원본을 보존하고 변경된 공개 사진만 메타데이터 없는 반응형 WebP로 생성합니다.
import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, realpath, unlink, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { format } from 'prettier';
import sharp from 'sharp';

const pipeline = {
  version: 1,
  format: 'webp',
  quality: 88,
  effort: 4,
  alphaQuality: 100,
  colourspace: 'srgb',
  autoOrient: true,
  stripMetadata: true,
  widths: [480, 960, 1600],
  thumbnailWidths: [96, 192],
  sharp: sharp.versions.sharp,
  vips: sharp.versions.vips,
  webp: sharp.versions.webp,
};

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}

async function writeIfChanged(path, text) {
  try {
    if ((await readFile(path, 'utf8')) === text) return;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await writeFile(path, text);
}

function isAvatar(name) {
  return (
    /^hero-after-[1-4]\.png$/.test(name) || /^스타일링 포트폴리오 (?:[1-9]|10)\.png$/.test(name)
  );
}

function imageWidths(name, width) {
  return [
    ...new Set([
      ...pipeline.widths.map((value) => Math.min(value, width)),
      ...(isAvatar(name) ? pipeline.thumbnailWidths.map((value) => Math.min(value, width)) : []),
    ]),
  ].sort((a, b) => a - b);
}

function slug(name) {
  return (
    name
      .replace(/^스타일링 포트폴리오 /, 'styling-portfolio-')
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'image'
  );
}

async function assertCleanWebp(bytes, expected, heightTolerance = 0) {
  const metadata = await sharp(bytes).metadata();
  if (
    metadata.format !== 'webp' ||
    metadata.width !== expected.width ||
    Math.abs(metadata.height - expected.height) > heightTolerance
  ) {
    throw new Error(
      `${expected.file}: expected ${expected.width}x${expected.height}, received ${metadata.width}x${metadata.height}`,
    );
  }
  for (const key of ['exif', 'icc', 'iptc', 'xmp', 'orientation', 'comments']) {
    if (metadata[key] !== undefined) throw new Error(`Generated image retains ${key}`);
  }
  // WebP 메타데이터 청크도 직접 확인해 EXIF/GPS·ICC·XMP가 배포되지 않게 합니다.
  if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error('Generated image is not a WebP RIFF file');
  }
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const type = bytes.toString('ascii', offset, offset + 4);
    if (['EXIF', 'ICCP', 'XMP ', 'IPTC'].includes(type))
      throw new Error(`Unexpected ${type} chunk`);
    offset += 8 + bytes.readUInt32LE(offset + 4) + (bytes.readUInt32LE(offset + 4) % 2);
  }
  return metadata;
}

async function cachedVariant(directory, cached, expected) {
  if (
    !cached ||
    cached.file !== expected.file ||
    cached.width !== expected.width ||
    Math.abs(cached.height - expected.height) > 1
  )
    return undefined;
  try {
    const bytes = await readFile(join(directory, expected.file));
    if (bytes.length !== cached.bytes || sha256(bytes) !== cached.sha256) return undefined;
    await assertCleanWebp(bytes, cached);
    return cached;
  } catch (error) {
    if (error.code === 'EACCES' || error.code === 'EPERM') throw error;
    return undefined;
  }
}

async function renderModule(images) {
  const imports = [];
  const records = [];
  let nextImport = 0;
  for (const [name, entry] of Object.entries(images)) {
    const variants = entry.variants.map((variant) => {
      const variable = `image${nextImport++}`;
      imports.push(`import ${variable} from './generated/${variant.file}?url';`);
      return { ...variant, variable };
    });
    const fallback = variants.filter((variant) => variant.width <= 960).at(-1) ?? variants[0];
    const thumbnail = variants.find((variant) => variant.width >= 192) ?? variants.at(-1);
    records.push(`${JSON.stringify(name)}: {
      src: ${fallback.variable},
      srcSet: [${variants.map((variant) => `${variant.variable} + ' ${variant.width}w'`).join(',')}].join(', '),
      width: ${entry.width}, height: ${entry.height}, thumbnailSrc: ${thumbnail.variable},
      variants: [${variants.map((variant) => `{ src: ${variant.variable}, width: ${variant.width}, height: ${variant.height} }`).join(',')}],
    }`);
  }
  return format(
    `// images:generate가 생성한 메타데이터 없는 웹용 사진입니다. 원본은 런타임에 포함하지 않습니다.
${imports.join('\n')}
export const sourceImages = { ${records.join(',\n')} } as const;
export type SourceImageName = keyof typeof sourceImages;
export const sourceImageUrls = Object.fromEntries(
  Object.entries(sourceImages).map(([name, image]) => [name, image.src]),
) as { readonly [Name in SourceImageName]: (typeof sourceImages)[Name]['src'] };
`,
    { parser: 'typescript', singleQuote: true, semi: true, trailingComma: 'all', printWidth: 100 },
  );
}

async function generate({ siteDirectory, check }) {
  const started = performance.now();
  const site = await realpath(resolve(siteDirectory));
  const originals = join(site, 'originals');
  if ((await realpath(originals)) !== originals)
    throw new Error('Original directory must not be a link');
  const sourceManifest = await readJson(join(originals, 'manifest.json'));
  if (!Array.isArray(sourceManifest?.files) || !sourceManifest.files.length)
    throw new Error('Original manifest is missing');
  const generated = join(site, 'generated');
  if (!check) await mkdir(generated, { recursive: true });
  if ((await realpath(generated)) !== generated || (await lstat(generated)).isSymbolicLink())
    throw new Error('Generated directory must stay inside the site asset directory');
  const manifestPath = join(generated, 'manifest.json');
  const previous = await readJson(manifestPath);
  const compatible = JSON.stringify(previous?.pipeline) === JSON.stringify(pipeline);
  const entries = new Array(sourceManifest.files.length);
  let encoded = 0;
  let cursor = 0;
  // 큰 원본은 하나씩 처리하고 네이티브 캐시·스레드를 제한합니다.
  sharp.cache({ memory: 32, files: 0, items: 20 });
  sharp.concurrency(1);
  const worker = async () => {
    while (cursor < sourceManifest.files.length) {
      const index = cursor++;
      const source = sourceManifest.files[index];
      if (basename(source.file) !== source.file)
        throw new Error('Source filename must not contain a directory');
      const path = join(originals, source.file);
      if ((await lstat(path)).isSymbolicLink()) throw new Error('Source image must not be a link');
      const bytes = await readFile(path);
      const sourceHash = sha256(bytes);
      if (sourceHash !== source.sha256 || bytes.length !== source.bytes)
        throw new Error(`Original hash mismatch: ${source.file}`);
      const metadata = await sharp(bytes).metadata();
      if (metadata.pages > 1)
        throw new Error(`Animated images need an explicit policy: ${source.file}`);
      const { width, height } = metadata.autoOrient;
      if (!width || !height) throw new Error(`Invalid source dimensions: ${source.file}`);
      const widths = imageWidths(source.file, width);
      const cacheKey = sha256(JSON.stringify({ sourceHash, pipeline, widths }));
      const old =
        compatible && previous.images?.[source.file]?.cacheKey === cacheKey
          ? previous.images[source.file]
          : undefined;
      const variants = [];
      for (const target of widths) {
        const expected = {
          file: `${slug(source.file)}.${cacheKey.slice(0, 12)}.${target}w.webp`,
          width: target,
          height: Math.max(1, Math.round((height * target) / width)),
        };
        try {
          const existing = await lstat(join(generated, expected.file));
          if (!existing.isFile() || existing.isSymbolicLink()) {
            throw new Error(`Generated output must be a regular file: ${expected.file}`);
          }
        } catch (error) {
          if (error.code !== 'ENOENT') throw error;
        }
        const cached = await cachedVariant(
          generated,
          old?.variants.find((variant) => variant.file === expected.file),
          expected,
        );
        if (cached) {
          variants.push(cached);
          continue;
        }
        if (check)
          throw new Error(
            `Missing, stale or corrupt image: ${source.file} (${target}px). Run yarn images:generate.`,
          );
        // autoOrient는 EXIF 방향을 픽셀에 반영합니다. withMetadata/keepMetadata는 사용하지 않습니다.
        const output = await sharp(bytes)
          .autoOrient()
          .resize({ width: target, withoutEnlargement: true })
          .toColourspace('srgb')
          .webp({
            quality: pipeline.quality,
            effort: pipeline.effort,
            alphaQuality: pipeline.alphaQuality,
          })
          .toBuffer();
        const outputMetadata = await assertCleanWebp(output, expected, 1);
        await writeFile(join(generated, expected.file), output);
        variants.push({
          ...expected,
          height: outputMetadata.height,
          bytes: output.length,
          sha256: sha256(output),
        });
        encoded++;
      }
      entries[index] = [
        source.file,
        {
          sourceSha256: sourceHash,
          sourceBytes: bytes.length,
          width,
          height,
          hasAlpha: metadata.hasAlpha,
          cacheKey,
          variants,
        },
      ];
    }
  };
  await worker();
  const images = Object.fromEntries(entries);
  const manifest = { version: 1, pipeline, images };
  const manifestText = await format(JSON.stringify(manifest), { parser: 'json', printWidth: 100 });
  const moduleText = await renderModule(images);
  const modulePath = join(site, 'source-images.ts');
  const expectedFiles = new Set(
    entries.flatMap(([, entry]) => entry.variants.map((variant) => variant.file)),
  );
  for (const file of await readdir(generated, { withFileTypes: true })) {
    if (!file.name.endsWith('.webp') || expectedFiles.has(file.name)) continue;
    const target = resolve(generated, file.name);
    if (
      dirname(target) !== generated ||
      !file.isFile() ||
      !/^[a-zA-Z0-9_-]+\.[a-f0-9]{12}\.\d+w\.webp$/.test(file.name)
    )
      throw new Error(`Unexpected file in generated directory: ${file.name}`);
    if (check) throw new Error(`Stale generated image: ${file.name}`);
    await unlink(target);
  }
  if (check) {
    if (
      JSON.stringify(previous) !== JSON.stringify(manifest) ||
      (await readFile(modulePath, 'utf8')).replace(/\r\n/g, '\n') !== moduleText
    )
      throw new Error('Generated manifest or source-images.ts is stale. Run yarn images:generate.');
  } else {
    await writeIfChanged(manifestPath, manifestText);
    await writeIfChanged(modulePath, moduleText);
  }
  return {
    check,
    images: entries.length,
    variants: expectedFiles.size,
    encoded,
    reused: expectedFiles.size - encoded,
    originalBytes: entries.reduce((total, [, entry]) => total + entry.sourceBytes, 0),
    generatedBytes: entries.reduce(
      (total, [, entry]) => total + entry.variants.reduce((sum, variant) => sum + variant.bytes, 0),
      0,
    ),
    elapsedMs: Math.round(performance.now() - started),
  };
}

const args = process.argv.slice(2);
let siteDirectory = fileURLToPath(
  new URL('../packages/design-system/src/assets/site/', import.meta.url),
);
let check = false;
for (let index = 0; index < args.length; index++) {
  if (args[index] === '--check') check = true;
  else if (args[index] === '--site-dir' && args[index + 1]) siteDirectory = args[++index];
  else throw new Error(`Unknown argument: ${args[index]}`);
}
try {
  console.log(JSON.stringify(await generate({ siteDirectory, check })));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
