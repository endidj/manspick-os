// 초기 HTML의 사업자·서비스·가격 구조화 데이터가 공개 화면과 연결되는지 검사합니다.
import assert from 'node:assert/strict';
import test from 'node:test';

const appUrl = process.env.LANDING_APP_URL;

test(
  'landing publishes linked business, service and package data in its initial HTML',
  { skip: !appUrl, timeout: 30000 },
  async () => {
    const response = await fetch(appUrl);
    assert.equal(response.status, 200);
    const html = await response.text();
    const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
    assert.ok(canonical, 'home has a canonical URL');
    const origin = new URL(canonical).origin;
    const script = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/s);
    assert.ok(script, 'structured data is available without JavaScript execution');
    const data = JSON.parse(script[1]);
    assert.equal(data['@context'], 'https://schema.org');
    const website = data['@graph'].find((item) => item['@type'] === 'WebSite');
    const webpage = data['@graph'].find((item) => item['@type'] === 'WebPage');
    const business = data['@graph'].find((item) => item['@type'] === 'LocalBusiness');
    const service = data['@graph'].find((item) => item['@type'] === 'Service');
    const imageUrl = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
    assert.ok(imageUrl);
    assert.equal(business.image, imageUrl, 'schema and sharing metadata reuse the deployed image');
    assert.equal(website.url, `${origin}/`);
    assert.equal(website.publisher['@id'], business['@id']);
    assert.equal(webpage.isPartOf['@id'], website['@id']);
    assert.equal(webpage.about['@id'], business['@id']);
    assert.equal(webpage.mainEntity['@id'], service['@id']);
    assert.ok(business.sameAs.includes('https://smartstore.naver.com/_manspick'));
    assert.ok(html.includes(`href="${business.hasMap}"`), 'map matches the visible business link');
    assert.equal(service.provider['@id'], business['@id']);
    assert.equal(service.hasOfferCatalog['@id'], business.hasOfferCatalog['@id']);
    assert.equal(business.openingHoursSpecification.opens, '11:00');
    assert.equal(business.openingHoursSpecification.closes, '21:00');
    assert.equal(business.openingHoursSpecification.dayOfWeek.length, 7);
    assert.deepEqual(service.areaServed, ['서울특별시', '경기도']);
    assert.deepEqual(
      service.hasOfferCatalog.itemListElement.map((offer) => [offer.name, offer.price]),
      [
        ['ONE 패키지', 85000],
        ['HYBRID 패키지', 160000],
        ['ALL DAY 패키지', 500000],
      ],
    );
    for (const offer of service.hasOfferCatalog.itemListElement) {
      assert.equal(offer.priceCurrency, 'KRW');
      assert.equal(offer.url, `${origin}/#pricing`);
      assert.equal(offer.itemOffered.provider['@id'], business['@id']);
      assert.ok(offer.itemOffered.description.includes('포즈·표정 디렉팅'));
      assert.ok(html.includes(offer.price.toLocaleString('en-US')), 'offer price is visible');
      assert.equal(offer.availability, undefined, 'simulated remaining seats are not stock data');
    }
    assert.ok(html.includes('id="pricing"'));
    assert.equal(business.aggregateRating, undefined, 'self reviews do not claim rating results');
  },
);
