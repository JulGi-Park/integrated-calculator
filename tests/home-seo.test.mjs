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
  "계산박스는 판매자 마진, 연봉 실수령액, 대출 이자, 퇴직금, 실업급여 등 생활·금융·근로 계산을 한 곳에서 확인할 수 있는 온라인 계산기 모음입니다.";
const expectedSocialDescription =
  "계산박스는 판매자 마진, 연봉 실수령액, 대출 이자, 퇴직금, 실업급여 등 자주 찾는 계산기를 제공하는 온라인 계산기 모음입니다.";

const calculators = [
  ["판매자 마진 계산기", "/calculators/seller-margin", "https://gyesanbox.kr/calculators/seller-margin"],
  ["연봉 실수령액 계산기", "/calculators/salary", "https://gyesanbox.kr/calculators/salary"],
  ["대출 이자 계산기", "/calculators/loan", "https://gyesanbox.kr/calculators/loan"],
  ["퇴직금 계산기", "/calculators/severance", "https://gyesanbox.kr/calculators/severance"],
  ["실업급여 계산기", "/calculators/unemployment", "https://gyesanbox.kr/calculators/unemployment"],
];

test("홈 메타데이터가 계산박스 운영 도메인 기준 SEO 정보를 가진다", () => {
  assert.equal(metadata.title, expectedTitle);
  assert.equal(metadata.description, expectedDescription);
  assert.deepEqual(metadata.keywords, [
    "계산박스",
    "계산기",
    "판매자 마진 계산기",
    "연봉 실수령액 계산기",
    "대출 이자 계산기",
    "퇴직금 계산기",
    "실업급여 계산기",
  ]);
  assert.equal(metadata.alternates.canonical, "https://gyesanbox.kr/");
  assert.equal(metadata.openGraph.title, expectedTitle);
  assert.equal(metadata.openGraph.description, expectedSocialDescription);
  assert.equal(metadata.openGraph.url, "https://gyesanbox.kr/");
  assert.equal(metadata.openGraph.siteName, "계산박스");
  assert.equal(metadata.openGraph.type, "website");
  assert.equal(metadata.openGraph.locale, "ko_KR");
  assert.equal(metadata.twitter.card, "summary");
  assert.equal(metadata.twitter.title, expectedTitle);
  assert.equal(metadata.twitter.description, expectedSocialDescription);
});

test("공통 metadataBase가 계산박스 운영 도메인을 기준으로 한다", async () => {
  const layoutSource = await readFile("app/layout.tsx", "utf8");

  assert.match(layoutSource, /metadataBase:\s*new URL\("https:\/\/gyesanbox\.kr"\)/);
  assert.match(layoutSource, /"naver-site-verification"/);
  assert.match(layoutSource, /76f6c949e0161b082d322460a1b7a9883fa21c73/);
  assert.doesNotMatch(layoutSource, /integrated-calculator\.pages\.dev|localhost|127\.0\.0\.1|example\.com/);
});

test("홈 화면에서 구현 완료 계산기 5개로 이동할 수 있다", () => {
  const html = renderToStaticMarkup(React.createElement(Home));

  assert.match(html, /계산박스/);
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
  assert.equal(scripts[1].email, "contact@gyesanbox.kr");
  assert.equal(scripts[1].contactPoint.email, "contact@gyesanbox.kr");
  assert.deepEqual(
    scripts[3].itemListElement.map((item) => [item.name, item.url]),
    calculators.map(([name, , url]) => [name, url]),
  );
  assert.equal(scripts[3].itemListElement.length, 5);

  const serialized = JSON.stringify(scripts);
  assert.doesNotMatch(
    serialized,
    /integrated-calculator\.pages\.dev|localhost|127\.0\.0\.1|example\.com|placeholder|준비 중/,
  );
});

test("공통 푸터에 연락처 mailto와 참고용 면책 문구가 있다", async () => {
  const footerSource = await readFile("components/common/SiteFooter.tsx", "utf8");

  assert.match(footerSource, /contact@gyesanbox\.kr/);
  assert.match(footerSource, /mailto:contact@gyesanbox\.kr/);
  assert.match(footerSource, /계산 결과는 참고용입니다/);
  assert.match(footerSource, /관련 기관 또는 전문가 확인/);
  assert.doesNotMatch(footerSource, /example\.com|placeholder/);
});
