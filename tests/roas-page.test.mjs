import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import sitemapModule from "../app/sitemap.ts";
import { metadata } from "../app/calculators/roas/page.tsx";
import { serializeJsonLd } from "../components/common/JsonLdScripts.tsx";
import {
  roasBreadcrumbJsonLd,
  roasExampleInput,
  roasExampleResult,
  roasExclusions,
  roasFaqJsonLd,
  roasFaqs,
  roasFormulas,
  roasWebApplicationJsonLd,
} from "../components/calculators/roasContentData.ts";

const pageSource = await readFile("app/calculators/roas/page.tsx", "utf8");
const contentSource = await readFile(
  "components/calculators/RoasContent.tsx",
  "utf8",
);
const calculatorListSource = await readFile("app/calculators/page.tsx", "utf8");
const homeSource = await readFile("app/page.tsx", "utf8");
const sitemapSource = await readFile("app/sitemap.ts", "utf8");

test("ROAS 페이지는 로컬 라우트와 계산기 UI, 기준일을 가진다", () => {
  assert.equal((pageSource.match(/<h1/g) ?? []).length, 1);
  assert.match(pageSource, /<h1>ROAS 계산기<\/h1>/);
  assert.match(pageSource, /RoasCalculator/);
  assert.match(pageSource, /RoasContent/);
  assert.match(pageSource, /계산 기준일: 2026-08-09/);
});

test("ROAS 페이지는 공개 라우트로 렌더링된다", () => {
  assert.doesNotMatch(pageSource, /notFound|isRoasCalculatorEnabled|AdSense 승인 전/);
  assert.match(pageSource, /JsonLdScripts/);
});

test("ROAS 메타데이터는 canonical을 제공하고 색인을 막지 않는다", () => {
  assert.equal(
    metadata.title,
    "ROAS 계산기 - 광고비 대비 매출과 손익분기 ROAS 계산 | 계산박스",
  );
  assert.equal(
    metadata.description,
    "광고비와 광고 매출을 입력해 ROAS, 광고비 비중, 광고 후 순이익, 손익분기 ROAS를 계산해보세요.",
  );
  assert.equal(metadata.alternates.canonical, "https://gyesanbox.kr/calculators/roas/");
  assert.equal(metadata.robots, undefined);
});

test("계산 기준 설명, 예시, 예외, FAQ와 면책 문구를 포함한다", () => {
  assert.match(contentSource, /ROAS는 광고비 대비 광고 매출을 보는 지표/);
  assert.equal(roasExampleInput.length, 4);
  assert.equal(roasExampleResult.length, 4);
  assert.equal(roasFormulas.length, 6);
  assert.equal(roasExclusions.length, 7);
  assert.equal(roasFaqs.length, 8);
  assert.match(contentSource, /이 계산기는 입력값을 기준으로 한 단순 예상 계산 도구/);
});

test("FAQPage JSON-LD가 화면 FAQ와 동일한 데이터 원본을 사용한다", () => {
  assert.equal(roasFaqJsonLd.mainEntity.length, roasFaqs.length);

  for (const [index, faq] of roasFaqs.entries()) {
    assert.equal(roasFaqJsonLd.mainEntity[index].name, faq.question);
    assert.equal(roasFaqJsonLd.mainEntity[index].acceptedAnswer.text, faq.answer);
  }
});

test("WebApplication, BreadcrumbList와 FAQPage JSON-LD가 유효하다", () => {
  const jsonLdItems = [
    roasWebApplicationJsonLd,
    roasBreadcrumbJsonLd,
    roasFaqJsonLd,
  ];

  assert.deepEqual(
    jsonLdItems.map((item) => item["@type"]),
    ["WebApplication", "BreadcrumbList", "FAQPage"],
  );
  assert.equal(roasWebApplicationJsonLd.name, "ROAS 계산기");
  assert.deepEqual(
    roasBreadcrumbJsonLd.itemListElement.map((item) => item.name),
    ["홈", "계산기 목록", "ROAS 계산기"],
  );

  for (const item of jsonLdItems) {
    const serialized = serializeJsonLd(item);
    assert.deepEqual(JSON.parse(serialized), item);
    assert.doesNotMatch(serialized, /NaN|Infinity|undefined|localhost|127\.0\.0\.1/);
  }
});

test("ROAS는 sitemap, 메인 서비스 목록, 계산기 목록에 공개 연결된다", () => {
  const sitemapUrls = sitemapModule.default().map((entry) => entry.url);

  assert.match(sitemapSource, /\/calculators\/roas/);
  assert.equal(
    sitemapUrls.includes("https://gyesanbox.kr/calculators/roas/"),
    true,
  );
  assert.match(calculatorListSource, /\/calculators\/roas|ROAS 계산기/);
  assert.match(homeSource, /\/calculators\/roas|ROAS 계산기/);
});

test("ROAS 페이지 본문은 수익성 검토에 직접 연관된 계산기로 연결한다", () => {
  assert.doesNotMatch(pageSource, /href="\/calculators/);
  assert.match(contentSource, /href="\/calculators\/seller-margin\/"/);
  assert.match(contentSource, /href="\/calculators\/vat-profit\/"/);
});
