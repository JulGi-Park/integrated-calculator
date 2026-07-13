import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import guidesModule from "../app/guides/page.tsx";
import nationalPensionModule from "../app/guides/national-pension-july-2026/page.tsx";
import {
  nationalPensionGuideArticleJsonLd,
  nationalPensionGuideBreadcrumbJsonLd,
  nationalPensionGuideFaqJsonLd,
  nationalPensionGuideFaqs,
  nationalPensionGuideSources,
} from "../components/guides/nationalPensionGuideData.ts";
import { calculateSalaryTakeHome } from "../lib/calculators/salary-take-home/salary-take-home.ts";

function assertSuccess(response) {
  assert.equal(response.success, true);
  return response.data;
}

test("가이드 목록과 국민연금 가이드는 고유 metadata와 공개 경로를 제공한다", async () => {
  const pages = [
    ["app/guides/page.tsx", "https://gyesanbox.kr/guides/", "생활·근로 기준 가이드 | 계산박스"],
    ["app/guides/national-pension-july-2026/page.tsx", "https://gyesanbox.kr/guides/national-pension-july-2026/", "2026년 7월 국민연금 공제액이 달라진 이유 | 계산박스 가이드"],
  ];

  for (const [file, canonical, title] of pages) {
    const source = await readFile(file, "utf8");
    assert.match(source, new RegExp(canonical.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(source, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(source, /openGraph:/);
    assert.match(source, /twitter:/);
    assert.doesNotMatch(source, /준비 중|곧 공개|추후 제공|업데이트 예정|placeholder|TODO|샘플|임시/);
  }
});

test("국민연금 가이드는 Article·BreadcrumbList·FAQPage JSON-LD와 화면 FAQ를 일치시킨다", () => {
  const html = renderToStaticMarkup(React.createElement(nationalPensionModule.default));
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]));

  assert.equal((html.match(/<h1/g) ?? []).length, 1);
  assert.deepEqual(scripts.map((item) => item["@type"]), ["Article", "BreadcrumbList", "FAQPage"]);
  assert.equal(nationalPensionGuideArticleJsonLd.datePublished, "2026-07-13");
  assert.equal(nationalPensionGuideArticleJsonLd.dateModified, "2026-07-13");
  assert.equal(nationalPensionGuideArticleJsonLd.author["@type"], "Organization");
  assert.equal(nationalPensionGuideArticleJsonLd.image, "https://gyesanbox.kr/og/policy.png");
  assert.equal(nationalPensionGuideBreadcrumbJsonLd.itemListElement.length, 3);
  assert.equal(nationalPensionGuideFaqJsonLd.mainEntity.length, nationalPensionGuideFaqs.length);
  assert.ok(nationalPensionGuideFaqs.length >= 5 && nationalPensionGuideFaqs.length <= 7);

  for (const { question, answer } of nationalPensionGuideFaqs) {
    assert.match(html, new RegExp(question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, new RegExp(answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("국민연금 가이드의 세 사례는 현재 연봉 계산 엔진의 4.75%·10원 절사 결과와 맞는다", () => {
  const input = { monthlyNonTaxableAmount: 0, dependentCount: 1, childCount: 0 };
  const below = assertSuccess(calculateSalaryTakeHome({ ...input, annualSalary: 72_000_000 }));
  const middle = assertSuccess(calculateSalaryTakeHome({ ...input, annualSalary: 78_000_000 }));
  const above = assertSuccess(calculateSalaryTakeHome({ ...input, annualSalary: 84_000_000 }));

  assert.equal(below.nationalPension, 285_000);
  assert.equal(middle.nationalPension, 308_750);
  assert.equal(above.nationalPension, 313_020);
  assert.equal(Math.floor((6_370_000 * 0.0475) / 10) * 10, 302_570);
  assert.equal(middle.nationalPension - 302_570, 6_180);
  assert.equal(above.nationalPension - 302_570, 10_450);
});

test("가이드·홈·국민연금 관련 계산기는 서로의 공개 경로를 연결한다", async () => {
  const [home, guides, guidePage, guide, salary, socialInsurance] = await Promise.all([
    readFile("app/page.tsx", "utf8"),
    readFile("app/guides/page.tsx", "utf8"),
    readFile("app/guides/national-pension-july-2026/page.tsx", "utf8"),
    readFile("components/guides/NationalPensionGuideContent.tsx", "utf8"),
    readFile("components/calculators/SalaryTakeHomeContent.tsx", "utf8"),
    readFile("components/calculators/SocialInsuranceContent.tsx", "utf8"),
  ]);
  const guidePath = "/guides/national-pension-july-2026/";

  assert.match(home, /href="\/guides\//);
  assert.match(guides, new RegExp(`href="${guidePath}"`));
  assert.match(guidePage, /href="\/guides\//);
  assert.match(guide, /href="\/methodology\//);
  assert.match(guide, /href="\/calculators\/social-insurance\//);
  assert.match(guide, /href="\/calculators\/salary\//);
  assert.match(salary, new RegExp(`href="${guidePath}"`));
  assert.match(socialInsurance, new RegExp(`href="${guidePath}"`));
});

test("국민연금 가이드는 실제 공식 URL을 출처로 표시하고 핵심 본문을 기존 계산기와 대량 중복하지 않는다", async () => {
  const [guide, salary, socialInsurance] = await Promise.all([
    readFile("components/guides/NationalPensionGuideContent.tsx", "utf8"),
    readFile("components/calculators/SalaryTakeHomeContent.tsx", "utf8"),
    readFile("components/calculators/SocialInsuranceContent.tsx", "utf8"),
  ]);

  for (const source of nationalPensionGuideSources) {
    assert.match(source.href, /^https:\/\/(?:www\.nps\.or\.kr|www\.law\.go\.kr)\//);
    assert.ok(source.appliedAt.length > 10);
    assert.equal(source.checkedAt, "확인일: 2026년 7월 13일");
  }

  const normalized = (value) => value.replace(/\s+/g, "");
  const guideParagraphs = [...guide.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/g)]
    .map((match) => normalized(match[1].replace(/<[^>]+>/g, " ").replace(/\{[\s\S]*?\}/g, " ")))
    .filter((text) => text.length >= 35);
  const existing = new Set([...salary, ...socialInsurance]
    .join("")
    .split(/[.!?]/)
    .map(normalized)
    .filter((text) => text.length >= 35));
  for (const paragraph of guideParagraphs) assert.equal(existing.has(paragraph), false, `중복 문장: ${paragraph}`);
});

test("가이드 목록은 H1 하나와 CollectionPage·BreadcrumbList JSON-LD를 렌더링한다", () => {
  const html = renderToStaticMarkup(React.createElement(guidesModule.default));
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]));

  assert.equal((html.match(/<h1/g) ?? []).length, 1);
  assert.deepEqual(scripts.map((item) => item["@type"]), ["CollectionPage", "BreadcrumbList"]);
  assert.match(html, /국민연금 공제액이 달라진 이유/);
});

test("가이드 CSS는 좁은 화면에서 비교 카드와 링크 카드를 한 열로 전환한다", async () => {
  const styles = await readFile("components/guides/NationalPensionGuide.module.css", "utf8");

  assert.match(styles, /@media \(max-width: 700px\)/);
  assert.match(styles, /\.timeline,\s*\.caseGrid,\s*\.relatedGrid\s*\{\s*grid-template-columns: 1fr;/);
  assert.match(styles, /\.sourceList a\s*\{[\s\S]*?overflow-wrap: anywhere;/);
});
