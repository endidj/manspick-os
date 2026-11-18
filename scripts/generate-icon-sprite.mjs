// 보관한 SVG 원본으로부터 공용 아이콘 스프라이트를 생성합니다.
import { readdir, readFile, writeFile } from 'node:fs/promises';

const directory = new URL('../packages/design-system/src/assets/icons/', import.meta.url);
const paths = (await readdir(directory, { recursive: true }))
  .map((path) => path.replaceAll('\\', '/'))
  .filter((path) => /^[\w-]+\/[\w-]+\.svg$/.test(path))
  .sort();

const symbols = await Promise.all(
  paths.map(async (path) => {
    const source = await readFile(new URL(path, directory), 'utf8');
    const svg = source.trim().match(/^<svg\b([^>]*)>([\s\S]*)<\/svg>$/);
    if (!svg || !svg[1].includes('viewBox="0 0 24 24"')) {
      throw new Error(`Unexpected SVG format: ${path}`);
    }
    const id =
      path === 'site/gallery-wide-bold-duotone.svg'
        ? 'solar-gallery-wide-bold-duotone'
        : path.slice(0, -4).replace('/', '-');
    const fill = svg[1].includes('fill="none"') ? 'none' : 'currentColor';
    const artwork = svg[2].trim().replace(/\b(fill|stroke)="white"/g, '$1="currentColor"');
    return `  <symbol id="${id}" viewBox="0 0 24 24" fill="${fill}">${artwork}</symbol>`;
  }),
);

const sprite = `<svg xmlns="http://www.w3.org/2000/svg">\n${symbols.join('\n')}\n</svg>\n`;
const output = new URL('sprite.svg', directory);
if (process.argv.includes('--check')) {
  const current = await readFile(output, 'utf8');
  if (current.replaceAll('\r\n', '\n') !== sprite) throw new Error('Icon sprite is out of date.');
} else {
  await writeFile(output, sprite);
}
