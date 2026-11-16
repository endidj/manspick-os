// 생성 폰트의 고정 문구 범위·크기·원본 폴백과 증분 생성 정보를 확인합니다.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  collectLandingCodepoints,
  verifyLandingFonts,
} from '../scripts/generate-landing-fonts.mjs';

test('landing font artifacts match the current fixed copy and pinned generator', async () => {
  const manifest = await verifyLandingFonts();
  assert.equal(manifest.fonts.length, 2);
  assert.ok(manifest.fonts.reduce((sum, font) => sum + font.bytes, 0) < 200_000);
  const body = manifest.fonts.find((font) => font.family === 'Manspick Landing Sans');
  const display = manifest.fonts.find((font) => font.family === 'Manspick Landing Display');
  assert.deepEqual(body.cssWeightRange, [45, 920]);
  assert.deepEqual(body.weightRange, [45, 930]);
  assert.deepEqual(display.weightRange, [100, 900]);
  for (const font of manifest.fonts) {
    assert.ok(font.verifiedOutlineAndAdvanceWeights.includes(400));
    assert.ok(font.verifiedOutlineAndAdvanceWeights.includes(700));
    assert.equal(new Set(font.codepoints).size, font.codepoints.length);
    for (let point = 0x20; point <= 0x7e; point++) assert.ok(font.codepoints.includes(point));
  }
  for (const character of '맨즈픽상담개인정보약관호감비호감ONEHYBRIDALLDAY0123456789') {
    assert.ok(
      body.codepoints.includes(character.codePointAt(0)),
      `Missing fixed glyph ${character}`,
    );
  }
  assert.equal(
    body.codepoints.includes('힣'.codePointAt(0)),
    false,
    'Rare input must exercise the original font fallback',
  );
  assert.deepEqual(manifest.codepoints, await collectLandingCodepoints());
});

test('landing-only families retain the original complete fonts as fallback', async () => {
  const css = await readFile(
    new URL('../packages/design-system/src/styles/landing-fonts.css', import.meta.url),
    'utf8',
  );
  assert.match(css, /@import '\.\/fonts\.css'/);
  assert.match(css, /html\[data-manspick-landing\]/);
  assert.match(css, /'Manspick Landing Sans',\s*'Pretendard'/);
  assert.match(css, /'Manspick Landing Display',\s*'Manspick Landing Sans',\s*'Geist'/);
  assert.equal([...css.matchAll(/font-display:\s*swap/g)].length, 2);
  const original = await readFile(
    new URL('../packages/design-system/src/styles/fonts.css', import.meta.url),
    'utf8',
  );
  assert.equal([...original.matchAll(/font-family:\s*'Pretendard'/g)].length, 92);
});
