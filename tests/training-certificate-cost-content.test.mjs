import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { metadata } from "../app/calculators/training-certificate-cost/page.tsx";
import { TrainingCertificateCostCalculator } from "../components/calculators/TrainingCertificateCostCalculator.tsx";
import { TrainingCertificateCostContent } from "../components/calculators/TrainingCertificateCostContent.tsx";
import {
  trainingCertificateCostBreadcrumbJsonLd,
  trainingCertificateCostExampleResult,
  trainingCertificateCostFaqJsonLd,
  trainingCertificateCostFaqs,
  trainingCertificateCostSeo,
  trainingCertificateCostSources,
  trainingCertificateCostWebApplicationJsonLd,
} from "../components/calculators/trainingCertificateCostContentData.ts";

test("전용 title, description, canonical과 개별 OG 이미지를 제공한다", async () => {
  const imageUrl =
    "https://gyesanbox.kr/og/training-certificate-cost.png";
  const imageAlt =
    "국비지원 자격증 취득비용 계산기 - 내일배움카드 자비부담금과 추가 비용 계산";

  assert.equal(metadata.title, trainingCertificateCostSeo.title);
  assert.equal(metadata.description, trainingCertificateCostSeo.description);
  assert.equal(
    metadata.alternates.canonical,
    "https://gyesanbox.kr/calculators/training-certificate-cost/",
  );
  assert.equal(metadata.openGraph.url, trainingCertificateCostSeo.canonical);
  assert.deepEqual(metadata.openGraph.images, [
    {
      url: imageUrl,
      width: 1200,
      height: 630,
      alt: imageAlt,
    },
  ]);
  assert.deepEqual(metadata.twitter.images, [imageUrl]);

  const pageSource = await readFile(
    "app/calculators/training-certificate-cost/page.tsx",
    "utf8",
  );
  assert.equal(pageSource.includes("og-default.png"), false);

  const image = await readFile("public/og/training-certificate-cost.png");
  assert.deepEqual(
    [...image.subarray(0, 8)],
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  );
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
  assert.equal(image[25], 2, "OG 이미지는 투명도 없는 RGB PNG여야 한다");
});

test("페이지에는 정확히 하나의 H1과 계산기 다음 콘텐츠가 있다", async () => {
  const source = await readFile(
    "app/calculators/training-certificate-cost/page.tsx",
    "utf8",
  );

  assert.equal((source.match(/<h1(?:\s|>)/g) ?? []).length, 1);
  assert.match(source, /국비지원 자격증 취득비용 계산기/);
  assert.ok(
    source.indexOf("<TrainingCertificateCostCalculator />") <
      source.indexOf("<TrainingCertificateCostContent />"),
  );
});

test("계산기와 콘텐츠를 함께 렌더링해도 중복 id가 없다", () => {
  const markup = renderToStaticMarkup(
    React.createElement(
      React.Fragment,
      null,
      React.createElement(TrainingCertificateCostCalculator),
      React.createElement(TrainingCertificateCostContent),
    ),
  );
  const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);

  assert.equal(new Set(ids).size, ids.length);
});

test("핵심 안내, 고용24 확인 흐름, 결과 한계와 기준일을 표시한다", () => {
  const markup = renderToStaticMarkup(
    React.createElement(TrainingCertificateCostContent),
  );

  for (const text of [
    "국비지원 자격증 비용은 어떻게 계산하나요?",
    "내일배움카드 자비부담금이란?",
    "국비지원이어도 추가 비용이 발생할 수 있나요?",
    "시험 응시료도 자동으로 포함되나요?",
    "재응시하면 비용은 어떻게 달라지나요?",
    "고용24에서 자비부담액 확인하기",
    "훈련 통합검색",
    "자비부담액보기",
    "본 계산 결과는 입력값을 기준으로 한 예상값입니다.",
    "훈련장려금, 별도 응시료 지원, 환급금 등은 기본 계산 결과에",
    "2026년 8월 12일",
  ]) {
    assert.match(markup, new RegExp(text));
  }
});

test("본문 대표 예시는 엔진 fixture 결과와 일치한다", () => {
  assert.deepEqual(trainingCertificateCostExampleResult, {
    totalExamCost: 100_000,
    ancillaryCost: 300_000,
    estimatedGovernmentSupportAmount: 1_200_000,
    estimatedTotalCostWithoutSupport: 1_800_000,
    estimatedTotalOutOfPocket: 600_000,
    estimatedSavingsAmount: 1_200_000,
  });

  const markup = renderToStaticMarkup(
    React.createElement(TrainingCertificateCostContent),
  );

  for (const value of [
    "1,500,000원",
    "300,000원",
    "50,000원",
    "100,000원",
    "1,200,000원",
    "1,800,000원",
    "600,000원",
  ]) {
    assert.match(markup, new RegExp(value));
  }
});

test("화면 FAQ와 FAQPage JSON-LD는 같은 데이터와 순서를 사용한다", () => {
  assert.equal(trainingCertificateCostFaqs.length, 6);
  assert.deepEqual(
    trainingCertificateCostFaqJsonLd.mainEntity.map((item) => ({
      question: item.name,
      answer: item.acceptedAnswer.text,
    })),
    trainingCertificateCostFaqs.map(({ question, answer }) => ({
      question,
      answer,
    })),
  );

  const markup = renderToStaticMarkup(
    React.createElement(TrainingCertificateCostContent),
  );
  for (const { question, answer } of trainingCertificateCostFaqs) {
    assert.match(markup, new RegExp(question));
    assert.ok(markup.includes(answer));
  }
});

test("필요한 WebApplication, BreadcrumbList, FAQPage 구조화 데이터를 제공한다", () => {
  assert.equal(
    trainingCertificateCostWebApplicationJsonLd["@type"],
    "WebApplication",
  );
  assert.equal(
    trainingCertificateCostWebApplicationJsonLd.name,
    "국비지원 자격증 취득비용 계산기",
  );
  assert.equal(
    trainingCertificateCostWebApplicationJsonLd.url,
    trainingCertificateCostSeo.canonical,
  );
  assert.equal(
    trainingCertificateCostBreadcrumbJsonLd["@type"],
    "BreadcrumbList",
  );
  assert.equal(trainingCertificateCostFaqJsonLd["@type"], "FAQPage");

  for (const item of [
    trainingCertificateCostWebApplicationJsonLd,
    trainingCertificateCostBreadcrumbJsonLd,
    trainingCertificateCostFaqJsonLd,
  ]) {
    assert.doesNotThrow(() => JSON.stringify(item));
  }
});

test("공식 출처는 고용24와 고용노동부 원문만 사용하고 확인일을 가진다", () => {
  assert.equal(trainingCertificateCostSources.length, 3);

  for (const source of trainingCertificateCostSources) {
    const url = new URL(source.href);
    assert.ok(["www.work24.go.kr", "www.moel.go.kr"].includes(url.hostname));
    assert.equal(source.verifiedAt, "2026-08-12");
  }
});

test("금지 표현을 포함하지 않고 지원 자격 판정 한계를 명시한다", async () => {
  const sources = await Promise.all(
    [
      "app/calculators/training-certificate-cost/page.tsx",
      "components/calculators/TrainingCertificateCostContent.tsx",
      "components/calculators/trainingCertificateCostContentData.ts",
    ].map((path) => readFile(path, "utf8")),
  );
  const combined = sources.join("\n");

  for (const forbidden of [
    "국비지원 확정금액",
    "100% 무료",
    "무조건 무료",
    "누구나 지원 가능",
    "정부 공식 계산기",
    "반드시 지원",
    "지원 보장",
    "실제 확정 자비부담액",
  ]) {
    assert.equal(combined.includes(forbidden), false, forbidden);
  }

  assert.match(combined, /지원 자격이나 과정 지원 여부를 판정하지 않습니다/);
});

test("strict 공개 helper를 route와 공개 진입점이 함께 사용한다", async () => {
  const pageSource = await readFile(
    "app/calculators/training-certificate-cost/page.tsx",
    "utf8",
  );
  assert.match(
    pageSource,
    /isTrainingCertificateCostCalculatorEnabled\(\)/,
  );
  assert.match(pageSource, /notFound\(\)/);

  for (const path of [
    "app/page.tsx",
    "app/calculators/page.tsx",
    "app/sitemap.ts",
    "app/about/page.tsx",
    "app/updates/page.tsx",
    "lib/favorites.ts",
  ]) {
    const source = await readFile(path, "utf8");
    assert.match(
      source,
      /isTrainingCertificateCostCalculatorEnabled\(\)/,
      path,
    );
    assert.match(source, /TRAINING_CERTIFICATE_COST_PUBLICATION/, path);
  }
});
