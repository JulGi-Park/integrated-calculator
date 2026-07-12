import assert from "node:assert/strict";
import test from "node:test";
import robotsModule from "../app/robots.ts";
import sitemapModule from "../app/sitemap.ts";

const robots = robotsModule.default;
const sitemap = sitemapModule.default;

const expectedUrls = [
  "https://gyesanbox.kr/",
  "https://gyesanbox.kr/calculators/",
  "https://gyesanbox.kr/calculators/seller-margin/",
  "https://gyesanbox.kr/calculators/vat-profit/",
  "https://gyesanbox.kr/calculators/salary/",
  "https://gyesanbox.kr/calculators/social-insurance/",
  "https://gyesanbox.kr/calculators/labor-pay/",
  "https://gyesanbox.kr/calculators/loan/",
  "https://gyesanbox.kr/calculators/severance/",
  "https://gyesanbox.kr/calculators/unemployment/",
  "https://gyesanbox.kr/calculators/parental-leave/",
  "https://gyesanbox.kr/calculators/rent-vs-jeonse/",
  "https://gyesanbox.kr/about/",
  "https://gyesanbox.kr/contact/",
  "https://gyesanbox.kr/privacy-policy/",
  "https://gyesanbox.kr/terms/",
  "https://gyesanbox.kr/disclaimer/",
];

test("sitemap은 운영 도메인과 구현 완료 페이지 및 정책 페이지 17개를 포함한다", () => {
  const entries = sitemap();

  assert.deepEqual(
    entries.map((entry) => entry.url),
    expectedUrls,
  );
  assert.equal(entries.length, 17);

  for (const entry of entries) {
    assert.equal(entry.url.startsWith("https://gyesanbox.kr"), true);
    assert.doesNotMatch(entry.url, /pages\.dev|localhost|127\.0\.0\.1|example\.com/);
  }
});

test("robots는 주요 페이지 색인을 막지 않고 운영 sitemap을 가리킨다", () => {
  const config = robots();

  assert.deepEqual(config.rules, {
    userAgent: "*",
    allow: "/",
  });
  assert.equal(config.sitemap, "https://gyesanbox.kr/sitemap.xml");
  assert.notDeepEqual(config.rules, {
    userAgent: "*",
    disallow: "/",
  });
});
