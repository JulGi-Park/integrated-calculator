import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { metadata } from "../app/calculators/unemployment/page.tsx";
import { serializeJsonLd } from "../components/common/JsonLdScripts.tsx";
import { UnemploymentContent } from "../components/calculators/UnemploymentContent.tsx";
import {
  unemploymentBreadcrumbJsonLd,
  unemploymentCriteriaRows,
  unemploymentExampleInput,
  unemploymentExampleResultItems,
  unemploymentExcludedItems,
  unemploymentFaqJsonLd,
  unemploymentFaqs,
  unemploymentInterpretationCards,
  unemploymentQuickCheckRows,
  unemploymentRelatedCalculators,
  unemploymentSources,
  unemploymentWebApplicationJsonLd,
} from "../components/calculators/unemploymentContentData.ts";
import { UNEMPLOYMENT_POLICY_2026 } from "../lib/calculators/unemployment/policy.ts";

const pageSource = await readFile(
  "app/calculators/unemployment/page.tsx",
  "utf8",
);
const contentSource = await readFile(
  "components/calculators/UnemploymentContent.tsx",
  "utf8",
);
const dataSource = await readFile(
  "components/calculators/unemploymentContentData.ts",
  "utf8",
);
const renderedContent = renderToStaticMarkup(
  React.createElement(UnemploymentContent),
);

test("실업급여 계산기 SEO 메타데이터를 검색 유입 페이지에 맞게 보강한다", () => {
  const expectedTitle =
    "실업급여 계산기 2026 | 구직급여 상한액·하한액·수급기간 예상";
  const expectedDescription =
    "실업급여 계산기로 퇴직 전 임금 기준 1일 구직급여액, 상한액·하한액 적용 여부, 고용보험 가입기간별 수급기간과 예상 총액을 확인하세요. 실제 지급 여부는 퇴직 사유, 이직확인서, 실업인정 절차에 따라 달라질 수 있습니다.";

  assert.equal(metadata.title, expectedTitle);
  assert.equal(metadata.description, expectedDescription);
  assert.deepEqual(metadata.robots, { index: true, follow: true });
  assert.equal(metadata.openGraph.title, expectedTitle);
  assert.equal(metadata.openGraph.description, expectedDescription);
  assert.equal(metadata.openGraph.type, "website");
  assert.equal(metadata.twitter.card, "summary");
  assert.equal(metadata.twitter.title, expectedTitle);
  assert.equal(metadata.twitter.description, expectedDescription);
  assert.equal(metadata.alternates, undefined);

  const metadataText = JSON.stringify(metadata);
  assert.match(metadataText, /실업급여 계산기/);
  assert.match(metadataText, /구직급여/);
  assert.match(metadataText, /상한액/);
  assert.match(metadataText, /하한액/);
  assert.match(metadataText, /수급기간/);
  assert.doesNotMatch(
    metadataText,
    /canonical|localhost|127\.0\.0\.1|pages\.dev|example\.com/,
  );
});

test("페이지 상단은 H1 하나와 계산기, 본문 콘텐츠, JSON-LD 세 종류를 유지한다", () => {
  assert.equal((pageSource.match(/<h1/g) ?? []).length, 1);
  assert.match(pageSource, /<UnemploymentCalculator \/>/);
  assert.match(pageSource, /<UnemploymentContent \/>/);
  assert.match(pageSource, /unemploymentWebApplicationJsonLd/);
  assert.match(pageSource, /unemploymentBreadcrumbJsonLd/);
  assert.match(pageSource, /unemploymentFaqJsonLd/);
  assert.match(pageSource, /<JsonLdScripts items=\{jsonLdItems\}/);
});

test("주요 본문 섹션을 모두 렌더링한다", () => {
  const headings = [
    "실업급여 계산 전 먼저 확인할 항목",
    "2026년 실업급여 계산 기준",
    "1일 구직급여액 계산 방식",
    "상한액·하한액 적용 방식",
    "고용보험 가입기간과 소정급여일수",
    "자발적 퇴사와 예외 인정 가능성",
    "이직확인서와 실업인정 절차",
    "계산 예시",
    "결과 해석 방법",
    "공식 출처",
    "면책 문구",
  ];

  for (const heading of headings) {
    assert.match(renderedContent, new RegExp(heading));
  }

  assert.equal(unemploymentInterpretationCards.length, 4);
  assert.ok(unemploymentExcludedItems.length >= 6);
  assert.match(renderedContent, /신청 전 체크리스트/);
});

test("표 2개 이상과 요구된 표 제목을 렌더링한다", () => {
  assert.equal((renderedContent.match(/<table/g) ?? []).length, 2);
  assert.match(renderedContent, /빠른 판단표/);
  assert.match(renderedContent, /계산 기준 요약표/);
  assert.ok(unemploymentQuickCheckRows.length >= 5);
  assert.ok(unemploymentCriteriaRows.length >= 8);
});

test("계산 예시는 현재 엔진 결과와 같은 확정값을 사용한다", () => {
  assert.deepEqual(unemploymentExampleInput, {
    wageInputType: "monthlyWage",
    wageAmount: 3_300_000,
    insuredMonths: 36,
    ageGroup: "under50",
    leavingReason: "involuntary",
  });

  assert.deepEqual(unemploymentExampleResultItems, [
    { label: "추정 1일 평균임금", value: "110,000원" },
    { label: "계산 전 기준 급여액", value: "66,000원" },
    { label: "1일 예상 구직급여액", value: "66,048원" },
    { label: "예상 소정급여일수", value: "180일" },
    { label: "예상 총 지급액", value: "11,888,640원" },
  ]);

  assert.match(dataSource, /calculateUnemploymentBenefit\(/);
});

test("FAQ 8개를 데이터 파일에서 관리하고 FAQPage JSON-LD와 일치한다", () => {
  const expectedQuestions = [
    "실업급여 계산기는 실제 지급액과 같은가요?",
    "월급만 알아도 실업급여를 계산할 수 있나요?",
    "상한액과 하한액은 왜 적용되나요?",
    "고용보험 가입기간이 6개월이면 바로 받을 수 있나요?",
    "자발적 퇴사도 실업급여를 받을 수 있나요?",
    "계약만료와 권고사직은 어떻게 보나요?",
    "이직확인서가 처리되지 않으면 어떻게 되나요?",
    "실업인정은 계산 결과와 어떤 관계가 있나요?",
  ];

  assert.deepEqual(
    unemploymentFaqs.map((faq) => faq.question),
    expectedQuestions,
  );
  assert.equal(unemploymentFaqJsonLd.mainEntity.length, 8);
  assert.match(contentSource, /unemploymentFaqs\.map/);
  assert.match(renderedContent, /<details/);

  for (const [index, faq] of unemploymentFaqs.entries()) {
    assert.equal(unemploymentFaqJsonLd.mainEntity[index].name, faq.question);
    assert.equal(
      unemploymentFaqJsonLd.mainEntity[index].acceptedAnswer.text,
      faq.answer,
    );
  }
});

test("공식 출처 섹션과 외부 링크 보안 속성을 제공한다", () => {
  assert.ok(unemploymentSources.length >= 5);
  assert.match(renderedContent, /공식 출처/);
  assert.match(contentSource, /target="_blank" rel="noopener noreferrer"/);

  const organizations = unemploymentSources.map((source) => source.organization);
  assert.ok(organizations.includes("고용보험"));
  assert.ok(organizations.includes("고용노동부"));
  assert.ok(organizations.includes("최저임금위원회"));

  for (const source of unemploymentSources) {
    assert.equal(source.checkedAt, "2026-06-25");
    assert.ok(source.criterion.length > 0);
    assert.match(
      source.href,
      /^https:\/\/(m\.work24\.go\.kr|eiac\.ei\.go\.kr|www\.law\.go\.kr|www\.moel\.go\.kr|www\.minimumwage\.go\.kr)\//,
    );
  }
});

test("관련 계산기는 기존 구현 URL만 활성 링크로 제공한다", () => {
  assert.deepEqual(
    unemploymentRelatedCalculators.map((item) => item.href),
    [
      "/calculators/severance",
      "/calculators/salary",
      "/calculators/loan",
      "/calculators/seller-margin",
    ],
  );

  assert.doesNotMatch(
    dataSource,
    /\/calculators\/(?:hourly|overtime|night|tax|vat|pension|unimplemented)/,
  );
});

test("수급 판단을 단정하거나 승인 보장 표현을 사용하지 않는다", () => {
  const combined = [pageSource, contentSource, dataSource].join("\n");
  const bannedPatterns = [
    /수급\s*확정/,
    /승인\s*보장/,
    /100%\s*지급/,
    /무조건\s*받을\s*수/,
    /실제\s*지급액과\s*동일/,
    /애드센스\s*승인\s*보장/,
    /고용센터\s*심사\s*없이\s*가능/,
    /자발적\s*퇴사도\s*모두\s*가능/,
  ];

  for (const pattern of bannedPatterns) {
    assert.doesNotMatch(combined, pattern);
  }
});

test("WebApplication, BreadcrumbList와 FAQPage JSON-LD가 안전하다", () => {
  const items = [
    unemploymentWebApplicationJsonLd,
    unemploymentBreadcrumbJsonLd,
    unemploymentFaqJsonLd,
  ];

  assert.deepEqual(
    items.map((item) => item["@type"]),
    ["WebApplication", "BreadcrumbList", "FAQPage"],
  );
  assert.equal(
    unemploymentWebApplicationJsonLd.applicationCategory,
    "FinanceApplication",
  );
  assert.equal(unemploymentWebApplicationJsonLd.name, "실업급여 계산기");
  assert.equal(unemploymentWebApplicationJsonLd.url, "/calculators/unemployment");
  assert.deepEqual(
    unemploymentBreadcrumbJsonLd.itemListElement.map((item) => item.name),
    ["홈", "계산기", "실업급여 계산기"],
  );

  for (const item of items) {
    const serialized = serializeJsonLd(item);
    assert.deepEqual(JSON.parse(serialized), item);
    assert.doesNotMatch(
      serialized,
      /aggregateRating|review|offers|NaN|Infinity|undefined|localhost|127\.0\.0\.1|pages\.dev|연봉·월급|판매자 마진/,
    );
  }
});

test("policy 설명 필드는 공식 재검증 필요 상태와 충돌하지 않는다", () => {
  assert.equal(UNEMPLOYMENT_POLICY_2026.needsOfficialVerification, true);
  assert.match(UNEMPLOYMENT_POLICY_2026.sourceNote, /현재 계산기 적용 기준/);
  assert.match(UNEMPLOYMENT_POLICY_2026.sourceNote, /공식 원문 재검증/);
  assert.equal(UNEMPLOYMENT_POLICY_2026.dailyBenefitUpperLimit, 68_100);
  assert.equal(UNEMPLOYMENT_POLICY_2026.dailyBenefitLowerLimit, 66_048);
});
