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
  "https://gyesanbox.kr/calculators/roas/",
  "https://gyesanbox.kr/calculators/savings/",
  "https://gyesanbox.kr/calculators/average-price/",
  "https://gyesanbox.kr/calculators/card-installment/",
  "https://gyesanbox.kr/calculators/brokerage-fee/",
  "https://gyesanbox.kr/calculators/car-cost/",
  "https://gyesanbox.kr/calculators/overtime-pay/",
  "https://gyesanbox.kr/calculators/youth-future-savings/",
  "https://gyesanbox.kr/calculators/dsr/",
  "https://gyesanbox.kr/calculators/work-child-incentive/",
  "https://gyesanbox.kr/about/",
  "https://gyesanbox.kr/methodology/",
  "https://gyesanbox.kr/updates/",
  "https://gyesanbox.kr/contact/",
  "https://gyesanbox.kr/privacy-policy/",
  "https://gyesanbox.kr/terms/",
  "https://gyesanbox.kr/disclaimer/",
];

test("sitemap은 운영 도메인과 구현 완료 페이지 및 정책 페이지 29개를 포함한다", () => {
  const entries = sitemap();

  assert.deepEqual(
    entries.map((entry) => entry.url),
    expectedUrls,
  );
  assert.equal(entries.length, 29);
  assert.equal(new Set(entries.map((entry) => entry.url)).size, entries.length);

  for (const entry of entries) {
    assert.equal(entry.url.startsWith("https://gyesanbox.kr"), true);
    assert.doesNotMatch(entry.url, /pages\.dev|localhost|127\.0\.0\.1|example\.com/);
  }
});

test("sitemap은 신규 공개 계산기 10개를 모두 포함한다", () => {
  const urls = sitemap().map((entry) => entry.url).join("\n");
  for (const slug of [
    "roas", "savings", "average-price", "card-installment", "brokerage-fee",
    "car-cost", "overtime-pay", "youth-future-savings", "dsr", "work-child-incentive",
  ]) assert.match(urls, new RegExp(`/calculators/${slug}/`));
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
