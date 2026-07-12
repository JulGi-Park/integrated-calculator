import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import homeModule from "../app/page.tsx";

const Home = homeModule.default;
const metadata = homeModule.metadata;

const expectedTitle = "계산박스 | 생활·금융·근로 계산기 모음";
const expectedDescription =
  "계산박스는 판매자 마진, 부가세, 연봉 실수령액, 4대보험, 주휴수당, 대출 이자, 퇴직금, 실업급여, 육아휴직급여 등 급여·금융·사업 계산을 한 곳에서 확인할 수 있는 참고용 계산 서비스입니다.";
const expectedOgTitle = "계산박스 - 생활 계산기 모음";
const expectedOgDescription =
  "부가세, 연봉, 4대보험, 주휴수당, 대출, 퇴직금, 실업급여, 육아휴직급여 등 실생활에 필요한 계산기를 한곳에서 확인할 수 있습니다.";
const expectedOgImage = "https://gyesanbox.kr/og/home.png";

const calculators = [
  ["판매자 마진 계산기", "/calculators/seller-margin/", "https://gyesanbox.kr/calculators/seller-margin/"],
  ["부가세 계산기", "/calculators/vat-profit/", "https://gyesanbox.kr/calculators/vat-profit/"],
  ["연봉 실수령액 계산기", "/calculators/salary/", "https://gyesanbox.kr/calculators/salary/"],
  ["4대보험 계산기", "/calculators/social-insurance/", "https://gyesanbox.kr/calculators/social-insurance/"],
  ["주휴수당 계산기", "/calculators/labor-pay/", "https://gyesanbox.kr/calculators/labor-pay/"],
  ["대출 이자 계산기", "/calculators/loan/", "https://gyesanbox.kr/calculators/loan/"],
  ["퇴직금 계산기", "/calculators/severance/", "https://gyesanbox.kr/calculators/severance/"],
  ["실업급여 계산기", "/calculators/unemployment/", "https://gyesanbox.kr/calculators/unemployment/"],
  ["육아휴직급여 계산기", "/calculators/parental-leave/", "https://gyesanbox.kr/calculators/parental-leave/"],
];

test("홈 메타데이터가 계산박스 운영 도메인 기준 SEO 정보를 가진다", () => {
  assert.equal(metadata.title, expectedTitle);
  assert.equal(metadata.description, expectedDescription);
  assert.deepEqual(metadata.keywords, [
    "계산박스",
    "계산기",
    "판매자 마진 계산기",
    "부가세 계산기",
    "연봉 실수령액 계산기",
    "4대보험 계산기",
    "주휴수당 계산기",
    "대출 이자 계산기",
    "퇴직금 계산기",
    "실업급여 계산기",
    "육아휴직급여 계산기",
  ]);
  assert.equal(metadata.alternates.canonical, "https://gyesanbox.kr/");
  assert.equal(metadata.openGraph.title, expectedOgTitle);
  assert.equal(metadata.openGraph.description, expectedOgDescription);
  assert.equal(metadata.openGraph.url, "https://gyesanbox.kr/");
  assert.deepEqual(metadata.openGraph.images, [
    {
      url: expectedOgImage,
      width: 1200,
      height: 630,
      alt: expectedOgTitle,
    },
  ]);
  assert.equal(metadata.openGraph.siteName, "계산박스");
  assert.equal(metadata.openGraph.type, "website");
  assert.equal(metadata.openGraph.locale, "ko_KR");
  assert.equal(metadata.twitter.card, "summary_large_image");
  assert.equal(metadata.twitter.title, expectedOgTitle);
  assert.equal(metadata.twitter.description, expectedOgDescription);
  assert.deepEqual(metadata.twitter.images, [expectedOgImage]);
});

test("공통 metadataBase가 계산박스 운영 도메인을 기준으로 한다", async () => {
  const layoutSource = await readFile("app/layout.tsx", "utf8");

  assert.match(layoutSource, /metadataBase:\s*new URL\("https:\/\/gyesanbox\.kr"\)/);
  assert.match(layoutSource, /"naver-site-verification"/);
  assert.match(layoutSource, /76f6c949e0161b082d322460a1b7a9883fa21c73/);
  assert.doesNotMatch(layoutSource, /integrated-calculator\.pages\.dev|localhost|127\.0\.0\.1|example\.com/);
});

test("홈 화면에서 구현 완료 계산기 9개로 이동할 수 있다", () => {
  const html = renderToStaticMarkup(React.createElement(Home));

  assert.match(html, /계산박스/);
  assert.match(html, /각 계산기는 입력값 기준의\s*예상 결과와 계산 기준/);
  assert.match(html, /계산 기준 공개/);
  assert.match(html, /공식 기준 확인/);
  assert.match(html, /입력한 값은 서버에 저장하지 않으며/);
  assert.match(html, /참고용 결과 안내/);
  assert.match(html, /운영 문의 창구/);
  for (const [name, href] of calculators) {
    assert.match(html, new RegExp(`href="${href}"`));
    assert.match(html, new RegExp(name));
  }
});

test("홈 JSON-LD는 화면 내용과 연락처 및 구현 완료 계산기만 담는다", () => {
  const html = renderToStaticMarkup(React.createElement(Home));
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(
    (match) => JSON.parse(match[1]),
  );

  assert.deepEqual(
    scripts.map((item) => item["@type"]),
    ["WebSite", "Organization", "BreadcrumbList", "ItemList"],
  );
  assert.equal(scripts[0].name, "계산박스");
  assert.equal(scripts[0].url, "https://gyesanbox.kr/");
  assert.equal(scripts[0].description, "생활·금융·근로 계산기 모음 서비스");
  assert.equal(scripts[1].contactPoint.url, "https://gyesanbox.kr/contact/");
  assert.deepEqual(
    scripts[3].itemListElement.map((item) => [item.name, item.url]),
    calculators.map(([name, , url]) => [name, url]),
  );
  assert.equal(scripts[3].itemListElement.length, 9);

  const serialized = JSON.stringify(scripts);
  assert.doesNotMatch(
    serialized,
    /integrated-calculator\.pages\.dev|localhost|127\.0\.0\.1|example\.com|placeholder|준비 중/,
  );
});

test("공통 푸터에 문의 링크와 참고용 면책 문구가 있다", async () => {
  const footerSource = await readFile("components/common/SiteFooter.tsx", "utf8");

  assert.match(footerSource, /href="\/contact\/"/);
  assert.match(footerSource, /<ContactEmail \/>/);
  assert.match(footerSource, /계산 결과는 참고용입니다/);
  assert.match(footerSource, /관련 기관 또는 전문가 확인/);
  assert.doesNotMatch(footerSource, /example\.com|placeholder/);
});
