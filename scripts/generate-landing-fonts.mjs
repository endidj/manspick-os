// 고정 랜딩 문구의 가변 폰트를 명시적으로 생성합니다. 일반 앱 빌드에서는 실행하지 않습니다.
import { createHash } from 'node:crypto';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

export const root = fileURLToPath(new URL('../', import.meta.url));
const destination = path.join(root, 'packages/design-system/src/assets/fonts/landing');
const cssPath = path.join(root, 'packages/design-system/src/styles/landing-fonts.css');
const hash = (value) => createHash('sha256').update(value).digest('hex');
const versions = { fonttools: '4.68.0', brotli: '1.2.1' };

async function generatorHash() {
  const sources = await Promise.all([
    readFile(fileURLToPath(import.meta.url), 'utf8'),
    readFile(path.join(root, 'scripts/generate-landing-fonts.py'), 'utf8'),
  ]);
  return hash(sources.map((source) => source.replace(/\r\n/g, '\n')).join('\0'));
}

export async function collectLandingCodepoints() {
  const characters = new Set(Array.from({ length: 95 }, (_, index) => index + 32));
  characters.add(0xa0);
  const sourceRoot = path.join(root, 'apps/frontend-landing-page/src');
  const add = (text) => {
    for (const character of text.normalize('NFC')) {
      const point = character.codePointAt(0);
      if (point >= 32 && point !== 0x7f) characters.add(point);
    }
  };
  const visitDirectory = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) await visitDirectory(filename);
      else if (/\.(tsx?|css)$/.test(entry.name) && !/\.(test|spec)\./.test(entry.name)) {
        const text = await readFile(filename, 'utf8');
        if (entry.name.endsWith('.css')) {
          for (const match of text.matchAll(/\bcontent\s*:\s*(['"])(.*?)\1/g)) add(match[2]);
          continue;
        }
        const source = ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true);
        const visit = (node) => {
          if (
            ts.isStringLiteral(node) ||
            ts.isNoSubstitutionTemplateLiteral(node) ||
            ts.isTemplateHead(node) ||
            ts.isTemplateMiddle(node) ||
            ts.isTemplateTail(node) ||
            ts.isJsxText(node)
          )
            add(node.text);
          ts.forEachChild(node, visit);
        };
        visit(source);
      }
    }
  };
  await visitDirectory(sourceRoot);
  return [...characters].sort((a, b) => a - b);
}

function stylesheet(fonts) {
  return `/* 생성본: node scripts/generate-landing-fonts.mjs. 원본 폰트는 새 글자의 폴백입니다. */
@import './fonts.css';

${fonts
  .map(
    (font) => `@font-face {
  font-family: '${font.family}';
  font-style: normal;
  font-display: swap;
  font-weight: ${font.cssWeightRange.join(' ')};
  src: url('../assets/fonts/landing/${font.file}') format('woff2-variations');
  unicode-range: ${font.unicodeRange};
}`,
  )
  .join('\n\n')}

html[data-manspick-landing] {
  --mp-primitive-font-body: 'Manspick Landing Sans', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Malgun Gothic', sans-serif;
  --mp-primitive-font-display: 'Manspick Landing Display', 'Manspick Landing Sans', 'Geist', 'Pretendard', sans-serif;
  --mp-site-type-font-family-pretendard-geist-system-ui-sans-serif: 'Manspick Landing Sans', 'Pretendard', 'Manspick Landing Display', 'Geist', system-ui, sans-serif;
  --mp-site-type-font-family-geist-pretendard-system-ui-sans-serif: 'Manspick Landing Display', 'Manspick Landing Sans', 'Geist', 'Pretendard', system-ui, sans-serif;
}
`;
}

export async function verifyLandingFonts() {
  const manifest = JSON.parse(await readFile(path.join(destination, 'manifest.json'), 'utf8'));
  if (
    manifest.generatorSha256 !== (await generatorHash()) ||
    JSON.stringify(manifest.tools) !== JSON.stringify(versions)
  ) {
    throw new Error('Font generator changed. Run node scripts/generate-landing-fonts.mjs.');
  }
  const codepoints = await collectLandingCodepoints();
  if (hash(JSON.stringify(codepoints)) !== manifest.corpusSha256) {
    throw new Error(
      'Landing copy contains a changed glyph set. Run node scripts/generate-landing-fonts.mjs.',
    );
  }
  for (const font of manifest.fonts) {
    if (hash(await readFile(path.join(destination, font.file))) !== font.sha256) {
      throw new Error(`Generated font changed: ${font.file}`);
    }
    if (hash(await readFile(path.join(destination, '..', font.source))) !== font.sourceSha256) {
      throw new Error(`Original font changed: ${font.source}`);
    }
  }
  const actualCss = (await readFile(cssPath, 'utf8')).replace(/\s/g, '');
  if (actualCss !== stylesheet(manifest.fonts).replace(/\s/g, '')) {
    throw new Error('Landing font CSS differs from its generated manifest.');
  }
  return manifest;
}

async function main() {
  const check = process.argv.includes('--check');
  if (check || !process.argv.includes('--force')) {
    try {
      const manifest = await verifyLandingFonts();
      console.log(
        `Landing fonts unchanged: ${manifest.fonts.reduce((sum, font) => sum + font.bytes, 0)} bytes.`,
      );
      return;
    } catch (error) {
      if (check) throw error;
    }
  }
  await mkdir(destination, { recursive: true });
  const codepoints = await collectLandingCodepoints();
  const input = { root, destination, codepoints, versions };
  const result = spawnSync(
    process.env.PYTHON || 'python',
    [path.join(root, 'scripts/generate-landing-fonts.py')],
    {
      input: JSON.stringify(input),
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    },
  );
  if (result.status !== 0)
    throw new Error(result.stderr || result.error?.message || 'Font generator failed');
  const fonts = JSON.parse(result.stdout);
  const manifest = {
    schemaVersion: 1,
    generator: 'scripts/generate-landing-fonts.mjs + scripts/generate-landing-fonts.py',
    generatorSha256: await generatorHash(),
    tools: versions,
    source:
      'apps/frontend-landing-page/src/**/*.{ts,tsx,css}; TypeScript string/template/JSX text; CSS content; tests/comments excluded',
    corpusSha256: hash(JSON.stringify(codepoints)),
    codepoints,
    fonts,
  };
  await writeFile(
    path.join(destination, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  await writeFile(cssPath, stylesheet(fonts));
  console.log(
    JSON.stringify(
      fonts.map(({ file, bytes, glyphCount, weightRange }) => ({
        file,
        bytes,
        glyphCount,
        weightRange,
      })),
    ),
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
