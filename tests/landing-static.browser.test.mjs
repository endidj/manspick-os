// 배포용 Worker가 사전 생성 HTML/RSC를 제공하고 동적 경로·검색 제외를 보존하는지 확인합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const appUrl = process.env.LANDING_APP_URL;
const buildRoot = process.env.LANDING_BUILD_ROOT;

test(
  'landing serves prebuilt HTML and RSC while query routes remain dynamic',
  { skip: !appUrl || !buildRoot, timeout: 60000 },
  async () => {
    const server = path.join(buildRoot, 'dist/server');
    const assets = path.join(buildRoot, '.cloudflare/output/v0/workers/default/assets');
    const manifest = JSON.parse(await readFile(path.join(server, 'vinext-prerender.json'), 'utf8'));
    const cacheIndex = JSON.parse(
      await readFile(path.join(assets, '_vinext/static-cache/index.json'), 'utf8'),
    );
    const get = (url, options) => fetch(new URL(url, appUrl), options);
    for (const [url, file, heading] of [
      ['/', 'index', 'id="hero"'],
      ['/terms', 'terms', '이용약관'],
      ['/privacy', 'privacy', '개인정보'],
    ]) {
      assert.equal(manifest.routes.find((route) => route.route === url)?.status, 'rendered');
      for (const rsc of [false, true]) {
        const response = await get(url, { headers: rsc ? { RSC: '1' } : {} });
        assert.equal(response.status, 200, url);
        assert.equal(response.headers.get('x-vinext-cache'), 'HIT', url);
        assert.match(response.headers.get('x-robots-tag'), /noindex/);
        const body = await response.text();
        const generated = await readFile(
          path.join(server, 'prerendered-routes', `${file}.${rsc ? 'rsc' : 'html'}`),
          'utf8',
        );
        assert.equal(body, generated, `${url}: response must use the build output`);
        if (!rsc) {
          assert.ok(body.includes(heading), `${url}: primary content is in HTML`);
          assert.match(body, /<meta name="robots" content="[^"]*noindex/);
        }
      }
    }
    const recommendation = manifest.routes.find((route) => route.route === '/recommend');
    assert.equal(recommendation.status, 'skipped');
    assert.equal(recommendation.reason, 'dynamic');
    for (const pkg of ['one', 'hybrid', 'allday']) {
      const response = await get(`/recommend?pkg=${pkg}`);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('cache-control'), /no-store/);
      assert.match(response.headers.get('x-robots-tag'), /noindex/);
      assert.notEqual(response.headers.get('x-vinext-cache'), 'HIT');
      const html = await response.text();
      assert.match(html, new RegExp(`<input[^>]*checked=""[^>]*value="${pkg}"`));
    }
    for (const [oldPath, target] of [
      ['/index.html?utm_source=test', '/?utm_source=test'],
      ['/recommend.html?pkg=hybrid', '/recommend?pkg=hybrid'],
      ['/legal', '/terms'],
    ]) {
      const response = await get(oldPath, { redirect: 'manual' });
      assert.equal(response.status, 308);
      const location = new URL(response.headers.get('location'), appUrl);
      assert.equal(location.pathname + location.search, target);
    }
    const hash = Object.keys(cacheIndex).find((key) => cacheIndex[key].kind === 'html');
    assert.ok(hash, 'static cache has generated HTML');
    for (const file of ['index.json', `${hash}.html`]) {
      const response = await get(`/_vinext/static-cache/${file}`);
      assert.equal(response.status, 404, `private cache ${file}`);
    }
    assert.equal((await get('/api/admin/shoots')).status, 403);
    console.log(
      JSON.stringify({ staticPages: ['/', '/terms', '/privacy'], dynamic: '/recommend' }),
    );
  },
);
