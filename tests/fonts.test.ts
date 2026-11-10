// 폰트 원본 보존과 한글·영문 범위, 필요한 조각만 제공하는 로컬 서브셋을 검사합니다.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { assetManifest } from '../packages/design-system/src/assets/manifest.ts';

const fontsRoot = new URL('../packages/design-system/src/assets/fonts/', import.meta.url);
const stylesheet = new URL('../packages/design-system/src/styles/fonts.css', import.meta.url);
const css = readFileSync(stylesheet, 'utf8');
const faces = [...css.matchAll(/@font-face\s*\{([^}]+)\}/g)].map(([, body]) => ({
  family: /font-family:\s*'([^']+)'/.exec(body)?.[1],
  weight: /font-weight:\s*([^;]+)/.exec(body)?.[1].trim(),
  display: /font-display:\s*([^;]+)/.exec(body)?.[1].trim(),
  src: /url\(['"]?([^'"\)]+)['"]?\)/.exec(body)?.[1] ?? '',
  range: /unicode-range:\s*([^;]+)/.exec(body)?.[1].toLowerCase().replace(/\s+/g, ''),
}));
const pretendard = faces.filter((face) => face.family === 'Pretendard');

test('official full font originals remain unchanged', () => {
  for (const [filename, hash] of [
    [
      'PretendardVariable.woff2',
      '9599f12fd42fc0bce1cd50b47a0c022e108d7aa64dd0d1bb0ed44f3282d900b4',
    ],
    ['GeistVariable.woff2', '2ffebe993e969069a9789d15164b7715d42491b5835516c5e3b935d5f81b05f1'],
  ]) {
    assert.equal(
      createHash('sha256')
        .update(readFileSync(new URL(filename, fontsRoot)))
        .digest('hex'),
      hash,
    );
  }
});

test('local variable fonts retain their family names, weight ranges and swap behavior', () => {
  assert.ok(pretendard.length > 0);
  assert.equal(faces.filter((face) => face.family === 'Geist').length, 1);
  for (const face of faces) {
    assert.equal(face.weight, face.family === 'Pretendard' ? '45 920' : '100 900');
    assert.equal(face.display, 'swap');
    assert.ok(face.src.startsWith('../assets/fonts/'));
    assert.equal(readFileSync(new URL(face.src, stylesheet)).toString('ascii', 0, 4), 'wOF2');
  }
});

test('font declarations cover English, every modern Korean syllable and common jamo', () => {
  const supported = new Set<number>();
  for (const face of pretendard) {
    if (!face.range) return; // 기존 전체 폰트도 같은 문자 범위를 제공합니다.
    for (const range of face.range.split(',')) {
      const [start, end = start] = range
        .replace('u+', '')
        .split('-')
        .map((value) => parseInt(value, 16));
      for (let code = start; code <= end; code++) supported.add(code);
    }
  }
  for (const [start, end] of [
    [0x20, 0x7e],
    [0xac00, 0xd7a3],
    [0x3131, 0x3163],
  ]) {
    for (let code = start; code <= end; code++) {
      assert.ok(supported.has(code), `Missing U+${code.toString(16)}`);
    }
  }
});

test('Pretendard serves the complete official dynamic subset instead of its full file', () => {
  const official = readFileSync(
    new URL('pretendard/pretendardvariable-dynamic-subset.css', fontsRoot),
    'utf8',
  );
  const officialFaces = [...official.matchAll(/@font-face\s*\{([^}]+)\}/g)];
  const manifest = JSON.parse(
    readFileSync(new URL('pretendard/manifest.json', fontsRoot), 'utf8'),
  ) as {
    stylesheet: { sha256: string };
    files: { file: string; bytes: number; sha256: string }[];
  };
  assert.equal(createHash('sha256').update(official).digest('hex'), manifest.stylesheet.sha256);
  assert.equal(pretendard.length, officialFaces.length);
  assert.equal(pretendard.length, manifest.files.length);
  assert.equal(assetManifest.fonts.subsetFiles, manifest.files.length);
  assert.equal(
    assetManifest.fonts.bytes,
    manifest.files.reduce((total, file) => total + file.bytes, 0) +
      readFileSync(new URL('GeistVariable.woff2', fontsRoot)).length,
  );
  assert.equal(
    assetManifest.fonts.originalsBytes,
    readFileSync(new URL('PretendardVariable.woff2', fontsRoot)).length,
  );
  for (const [index, [, body]] of officialFaces.entries()) {
    const face = pretendard[index];
    assert.equal(
      face.range,
      /unicode-range:\s*([^;]+)/.exec(body)?.[1].toLowerCase().replace(/\s+/g, ''),
    );
    const originalPath = /url\(([^)]+)\)/.exec(body)?.[1] ?? '';
    const filename = originalPath.split('/').at(-1);
    assert.equal(face.src.split('/').at(-1), filename);
    assert.ok(face.range);
    const recorded = manifest.files.find((entry) => entry.file === originalPath.replace('./', ''));
    assert.ok(recorded, filename);
    const data = readFileSync(new URL(face.src, stylesheet));
    assert.equal(data.length, recorded.bytes);
    assert.equal(createHash('sha256').update(data).digest('hex'), recorded.sha256);
  }
  assert.ok(!faces.some((face) => face.src.endsWith('/PretendardVariable.woff2')));
});
