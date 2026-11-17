// 실제 HTTP 응답의 운영 SEO와 추천·API·미리보기 검색 제외 경계를 확인합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import sharp from 'sharp';

const appUrl = process.env.LANDING_APP_URL;
const indexable = process.env.LANDING_INDEXABLE === 'true';
const productionOrigin = 'https://www.manspick.co.kr';
const deploymentOrigin =
  process.env.LANDING_DEPLOYMENT_ORIGIN ||
  (indexable ? productionOrigin : 'https://manspick-landing-test.winningant8.workers.dev');
const isLocal = appUrl && ['localhost', '127.0.0.1', '[::1]'].includes(new URL(appUrl).hostname);
const productionHeaders = { Host: 'www.manspick.co.kr' };

function get(pathname, options) {
  const url = new URL(pathname, appUrl);
  if (!options?.headers?.Host) return fetch(url, options);
  // Node fetch는 Host를 덮어쓰므로 실제 운영 호스트 검사는 native HTTP를 사용합니다.
  return new Promise((resolve, reject) => {
    const request = url.protocol === 'https:' ? httpsRequest : httpRequest;
    request(url, options, async (incoming) => {
      try {
        const chunks = [];
        for await (const chunk of incoming) chunks.push(chunk);
        resolve(
          new Response(Buffer.concat(chunks), {
            status: incoming.statusCode,
            headers: incoming.headers,
          }),
        );
      } catch (error) {
        reject(error);
      }
    })
      .on('error', reject)
      .end();
  });
}

test(
  'public pages expose one production canonical and the intended indexing metadata',
  { skip: !appUrl, timeout: 30000 },
  async () => {
    for (const pathname of ['/', '/terms', '/privacy']) {
      const response = await get(pathname);
      assert.equal(response.status, 200, pathname);
      const html = await response.text();
      const canonicals = [...html.matchAll(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/g)];
      assert.equal(canonicals.length, 1, pathname);
      assert.equal(new URL(canonicals[0][1]).href, new URL(pathname, productionOrigin).href);
      const robots = html.match(/<meta name="robots" content="([^"]+)"/)?.[1];
      assert.ok(robots, pathname);
      assert.equal(robots.split(/,\s*/).includes('noindex'), !indexable, pathname);
      assert.equal(robots.split(/,\s*/).includes('noimageindex'), !indexable, pathname);
      if (indexable) assert.match(robots, /max-image-preview:large/);
      const ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/)?.[1];
      assert.equal(new URL(ogUrl).href, new URL(pathname, deploymentOrigin).href);
      for (const script of html.matchAll(
        /<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs,
      )) {
        const data = JSON.parse(script[1]);
        for (const field of JSON.stringify(data).matchAll(/"(@id|url|image)":"([^"]+)"/g)) {
          assert.equal(
            new URL(field[2]).origin,
            field[1] === 'image' ? deploymentOrigin : productionOrigin,
            field[2],
          );
        }
      }
    }
    const recommendation = await get('/recommend', isLocal ? { headers: productionHeaders } : {});
    assert.equal(recommendation.status, 200);
    assert.match(recommendation.headers.get('x-robots-tag') ?? '', /noindex/);
    assert.match(await recommendation.text(), /<meta name="robots" content="[^"]*noindex/);
  },
);

test(
  'deployed OG and Twitter metadata point to an image that is actually reachable',
  { skip: !appUrl || isLocal, timeout: 30000 },
  async () => {
    const html = await (await get('/')).text();
    const imageUrl = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
    const twitterImage = html.match(/<meta name="twitter:image" content="([^"]+)"/)?.[1];
    assert.ok(imageUrl, 'OG metadata includes an absolute image URL');
    assert.equal(twitterImage, imageUrl);
    // 경로를 테스트 서버로 바꾸지 않고 공유 크롤러가 읽는 실제 URL을 요청합니다.
    const image = await fetch(imageUrl);
    assert.equal(image.status, 200, imageUrl);
    assert.match(image.headers.get('content-type') ?? '', /^image\/jpeg/);
    const dimensions = await sharp(Buffer.from(await image.arrayBuffer())).metadata();
    assert.equal(dimensions.width, 1200);
    assert.equal(dimensions.height, 630);
    assert.equal(html.match(/<meta property="og:image:width" content="([^"]+)"/)?.[1], '1200');
    assert.equal(html.match(/<meta property="og:image:height" content="([^"]+)"/)?.[1], '630');
    assert.equal(new URL(imageUrl).origin, deploymentOrigin);
  },
);

test(
  'sitemap and robots advertise only the public canonical pages in an indexable build',
  { skip: !appUrl, timeout: 30000 },
  async () => {
    const sitemap = await get('/sitemap.xml');
    assert.equal(sitemap.status, 200);
    assert.match(sitemap.headers.get('content-type') ?? '', /xml/);
    const xml = await sitemap.text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    assert.deepEqual(
      urls.sort(),
      indexable
        ? [
            `${productionOrigin}/`,
            `${productionOrigin}/terms`,
            `${productionOrigin}/privacy`,
          ].sort()
        : [],
    );
    assert.doesNotMatch(xml, /\/recommend|\/api\/|localhost|workers\.dev/);
    const robots = await get('/robots.txt');
    assert.equal(robots.status, 200);
    const text = await robots.text();
    assert.match(text, /^Allow:\s*\/\s*$/im);
    assert.doesNotMatch(text, /^Disallow:\s*\/\s*$/im);
    const sitemaps = [...text.matchAll(/^Sitemap:\s*(\S+)/gim)].map((match) => match[1]);
    assert.deepEqual(sitemaps, indexable ? [`${productionOrigin}/sitemap.xml`] : []);
  },
);

test(
  'production headers allow public HTML and images while excluding previews and private endpoints',
  { skip: !appUrl || !isLocal, timeout: 30000 },
  async () => {
    const localHome = await get('/');
    assert.equal(localHome.status, 200);
    if (new URL(appUrl).origin !== productionOrigin) {
      assert.match(localHome.headers.get('x-robots-tag') ?? '', /noindex/);
    }
    const html = await localHome.text();
    const productionHome = await get('/', { headers: productionHeaders });
    assert.equal(productionHome.status, 200);
    assert.doesNotMatch(productionHome.headers.get('x-robots-tag') ?? '', /noindex/);

    const imageUrl = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
    assert.ok(imageUrl, 'sharing metadata references an absolute image URL');
    assert.equal(new URL(imageUrl).origin, deploymentOrigin);
    const imagePath = new URL(imageUrl).pathname;
    const image = await get(imagePath, { headers: productionHeaders });
    assert.equal(image.status, 200);
    assert.match(image.headers.get('content-type') ?? '', /^image\/jpeg/);
    assert.doesNotMatch(image.headers.get('x-robots-tag') ?? '', /noindex/);
    const dimensions = await sharp(Buffer.from(await image.arrayBuffer())).metadata();
    assert.equal(dimensions.width, 1200);
    assert.equal(dimensions.height, 630);
    const localImage = await get(imagePath);
    assert.equal(localImage.status, 200);
    if (new URL(appUrl).origin !== productionOrigin) {
      assert.match(localImage.headers.get('x-robots-tag') ?? '', /noindex/);
    }

    const assetPath = html.match(/\/_next\/static\/media\/[^"<>\s]+\.webp/)?.[0];
    assert.ok(assetPath, 'home references a public portfolio image');
    const asset = await get(assetPath, { headers: productionHeaders });
    assert.equal(asset.status, 200);
    assert.doesNotMatch(asset.headers.get('x-robots-tag') ?? '', /noindex/);

    const api = await get('/api/admin/shoots', { headers: productionHeaders });
    assert.equal(api.status, 403);
    assert.match(api.headers.get('x-robots-tag') ?? '', /noindex/);
    assert.equal((await get('/_vinext/static-cache/index.json')).status, 404);
  },
);

test(
  'apex host redirects to the canonical host without losing the path or query',
  { skip: !appUrl || !isLocal, timeout: 30000 },
  async () => {
    const response = await get('/recommend?pkg=hybrid&utm_source=naver', {
      headers: { Host: 'manspick.co.kr' },
    });
    assert.equal(response.status, 308);
    assert.equal(
      response.headers.get('location'),
      `${productionOrigin}/recommend?pkg=hybrid&utm_source=naver`,
    );
  },
);
