// 배포 HTML이 실제로 연결한 CSS에 공통 토큰·리셋·폰트가 있는지 검사합니다.
const urls = process.argv.slice(2);

if (urls.length === 0) {
  console.error('Usage: node scripts/check-frontend-styles.mjs <url> [url ...]');
  process.exit(1);
}

async function fetchText(url, contentType) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000), cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }

  if (!response.headers.get('content-type')?.includes(contentType)) {
    throw new Error(
      `Expected ${contentType}, received ${response.headers.get('content-type')}: ${url}`,
    );
  }

  return { text: await response.text(), url: response.url };
}

function stylesheetUrls(html, pageUrl) {
  const markup = html.replace(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '');
  const stylesheets = new Set();

  for (const [tag] of markup.matchAll(/<link\b[^>]*>/gi)) {
    const attributes = new Map();

    for (const match of tag.matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
      attributes.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4]);
    }

    if (attributes.get('rel')?.toLowerCase().split(/\s+/).includes('stylesheet')) {
      const href = attributes.get('href');

      if (href) {
        stylesheets.add(new URL(href.replace(/&amp;/g, '&'), pageUrl).href);
      }
    }
  }

  return [...stylesheets];
}

function missingGlobalStyles(css) {
  const bodyRules = [...css.matchAll(/(?:^|})\s*body\s*\{([^}]*)}/g)].map((match) => match[1]);
  const checks = [
    ['background token', /--mp-color-bg-base\s*:/i.test(css)],
    ['body typography token', /--mp-type-body-m-size\s*:/i.test(css)],
    ['body font token', /--font\s*:\s*var\(\s*--mp-font-body\s*\)/i.test(css)],
    [
      'body margin reset',
      bodyRules.some((rule) => /(?:^|;)\s*margin\s*:\s*0(?:px)?\s*(?:;|$)/i.test(rule)),
    ],
    [
      'body font application',
      bodyRules.some((rule) => /font-family\s*:\s*var\(\s*--font\s*\)/i.test(rule)),
    ],
    [
      'Pretendard font face',
      /@font-face\s*\{[^}]*font-family\s*:\s*["']?Pretendard["']?\s*;/i.test(css),
    ],
  ];

  return checks.filter(([, passed]) => !passed).map(([name]) => name);
}

for (const url of urls) {
  try {
    const page = await fetchText(url, 'text/html');
    const links = stylesheetUrls(page.text, page.url);

    if (links.length === 0) {
      throw new Error('No stylesheet links in rendered HTML');
    }

    const stylesheets = await Promise.all(links.map((link) => fetchText(link, 'text/css')));
    const missing = missingGlobalStyles(
      stylesheets.map((stylesheet) => stylesheet.text).join('\n'),
    );

    if (missing.length > 0) {
      throw new Error(`${links.length} linked stylesheets; missing ${missing.join(', ')}`);
    }

    console.log(`PASS ${url} (${links.length} linked stylesheets)`);
  } catch (error) {
    console.error(`FAIL ${url}: ${error.message}`);
    process.exitCode = 1;
  }
}
