import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { metadata } from "../app/calculators/severance/page.tsx";
import { serializeJsonLd } from "../components/common/JsonLdScripts.tsx";
import {
  severanceBreadcrumbJsonLd,
  severanceCalculationCriteria,
  severanceCautions,
  severanceFaqJsonLd,
  severanceFaqs,
  severanceFormulaItems,
  severanceInterpretationCards,
  severanceOfficialExampleInput,
  severanceOfficialExampleInputItems,
  severanceOfficialExampleResultItems,
  severanceSources,
  severanceWebApplicationJsonLd,
} from "../components/calculators/severanceContentData.ts";
import { calculateSeverance } from "../lib/calculators/severance/severance.ts";
import { SEVERANCE_POLICY_2026 } from "../lib/calculators/severance/policy.ts";

const pageSource = await readFile("app/calculators/severance/page.tsx", "utf8");
const contentSource = await readFile(
  "components/calculators/SeveranceContent.tsx",
  "utf8",
);
const dataSource = await readFile(
  "components/calculators/severanceContentData.ts",
  "utf8",
);

test("퇴직금 계산기 전용 SEO 메타데이터를 대표 URL 기준으로 설정한다", () => {
  const expectedTitle = "퇴직금 계산기 | 평균임금·통상임금 기준 예상 퇴직금 계산";
  const expectedDescription =
    "입사일, 퇴직일, 퇴직 전 3개월 임금과 상여금·연차수당을 입력해 평균임금·통상임금 기준 예상 퇴직금을 계산합니다.";
  const expectedOgTitle = "퇴직금 계산기 - 평균임금 기준 예상 퇴직금 확인";
  const expectedOgDescription =
    "입사일, 퇴사일, 임금 정보를 입력하면 평균임금 기준의 예상 퇴직금을 계산할 수 있습니다.";
  const expectedOgImage = "https://gyesanbox.kr/og/severance.png";

  assert.equal(metadata.title, expectedTitle);
  assert.equal(metadata.description, expectedDescription);
  assert.deepEqual(metadata.robots, { index: true, follow: true });
  assert.equal(metadata.openGraph.title, expectedOgTitle);
  assert.equal(metadata.openGraph.description, expectedOgDescription);
  assert.equal(metadata.openGraph.type, "website");
  assert.equal(metadata.openGraph.url, "https://gyesanbox.kr/calculators/severance/");
  assert.deepEqual(metadata.openGraph.images, [
    {
      url: expectedOgImage,
      width: 1200,
      height: 630,
      alt: expectedOgTitle,
    },
  ]);
  assert.equal(metadata.twitter.card, "summary_large_image");
  assert.equal(metadata.twitter.title, expectedOgTitle);
  assert.equal(metadata.twitter.description, expectedOgDescription);
  assert.deepEqual(metadata.twitter.images, [expectedOgImage]);
  assert.deepEqual(metadata.alternates, {
    canonical: "https://gyesanbox.kr/calculators/severance/",
  });

  const metadataText = JSON.stringify(metadata);
  assert.doesNotMatch(
    metadataText,
    /localhost|127\.0\.0\.1|pages\.dev|example\.com|www\.gyesanbox\.kr/,
  );
});

test("페이지 상단은 H1 하나와 공식 예제·기준일·예상값 안내를 표시한다", () => {
  assert.equal((pageSource.match(/<h1/g) ?? []).length, 1);
  assert.match(pageSource, /퇴직금 계산기/);
  assert.match(pageSource, /공식 예제 7,868,434원 재현/);
  assert.match(pageSource, /기준 확인일:/);
  assert.match(pageSource, /예상 금액이며 실제 지급액과 다를 수 있습니다/);
});

test("계산 기준과 계산식을 현재 정책 기준에 맞춰 정적으로 제공한다", () => {
  assert.equal(severanceCalculationCriteria.length, 7);
  assert.equal(severanceFormulaItems.length, 7);
  assert.match(contentSource, /severanceCalculationCriteria\.map/);
  assert.match(contentSource, /severanceFormulaItems\.map/);
  assert.match(contentSource, /1전 단위 올림/);
  assert.match(contentSource, /원 단위 반올림/);

  assert.deepEqual(
    severanceCalculationCriteria.map((item) => item.title),
    [
      "계속근로기간 요건",
      "주당 소정근로시간 요건",
      "퇴직일 입력 기준",
      "평균임금 산정기간",
      "통상임금 비교",
      "상여금·연차수당 반영",
      "기준 확인일",
    ],
  );

  assert.deepEqual(
    severanceFormulaItems.map((item) => item.title),
    [
      "퇴직금",
      "적용 1일 임금",
      "1일 평균임금",
      "퇴직 전 3개월 임금총액",
      "상여금 반영액",
      "연차수당 반영액",
      "반올림 기준",
    ],
  );
});

test("공식 예제 입력과 결과는 현재 엔진의 확정값과 일치한다", () => {
  assert.deepEqual(severanceOfficialExampleInput, {
    employmentStartDate: "2014-10-02",
    retirementDate: "2017-09-16",
    wagesForAveragePeriod: 7_080_000,
    annualBonusTotal: 4_000_000,
    annualLeaveAllowanceTotal: 300_000,
    ordinaryDailyWage: null,
    averageWeeklyContractHours: 40,
  });

  assert.deepEqual(severanceOfficialExampleInputItems, [
    { label: "입사일", value: "2014년 10월 2일" },
    { label: "퇴직일", value: "2017년 9월 16일" },
    { label: "퇴직 전 3개월 임금총액", value: "7,080,000원" },
    { label: "최근 1년 상여금 총액", value: "4,000,000원" },
    { label: "반영 대상 연차수당 총액", value: "300,000원" },
    { label: "1일 통상임금", value: "입력하지 않음" },
    { label: "4주 평균 주당 소정근로시간", value: "40시간" },
  ]);

  assert.deepEqual(severanceOfficialExampleResultItems, [
    { label: "총 재직일수", value: "1,080일" },
    {
      label: "평균임금 산정기간",
      value: "2017년 6월 16일 ~ 2017년 9월 15일 (92일)",
    },
    { label: "상여금 반영액", value: "1,000,000원" },
    { label: "연차수당 반영액", value: "75,000원" },
    { label: "평균임금 산정 임금총액", value: "8,155,000원" },
    { label: "1일 평균임금", value: "88,641.31원" },
    { label: "적용 1일 임금", value: "88,641.31원" },
    { label: "예상 퇴직금", value: "7,868,434원" },
  ]);

  assert.deepEqual(calculateSeverance(severanceOfficialExampleInput), {
    success: true,
    data: {
      totalServiceDays: 1_080,
      averageWagePeriodStartDate: "2017-06-16",
      averageWagePeriodEndDate: "2017-09-15",
      averageWagePeriodDays: 92,
      wagesForAveragePeriod: 7_080_000,
      reflectedBonusAmount: 1_000_000,
      reflectedAnnualLeaveAllowanceAmount: 75_000,
      totalWagesForAverageWage: 8_155_000,
      averageDailyWage: 88_641.31,
      ordinaryDailyWage: null,
      appliedDailyWage: 88_641.31,
      ordinaryWageSubstituted: false,
      appliedDailyWageReason: "AVERAGE_WAGE_USED_NO_ORDINARY_WAGE",
      estimatedSeverance: 7_868_434,
      meetsContinuousServiceRequirement: true,
      meetsWeeklyHoursRequirement: true,
      isBasicallyEligible: true,
      ineligibilityReasonCode: null,
      policyVerifiedAt: "2026-06-23",
    },
  });

  assert.match(dataSource, /calculateSeverance\(/);
  assert.match(dataSource, /if \(!severanceOfficialExampleResponse\.success\)/);
  assert.doesNotMatch(contentSource, /88,641\.31원\)\s*;/);
});

test("결과 해석·주의사항·면책 문구를 제공한다", () => {
  assert.equal(severanceInterpretationCards.length, 4);
  assert.match(contentSource, /예상 퇴직금은 입력값과 공개 정책 기준/);
  assert.match(contentSource, /실제 지급액 확정 전에는 대상 여부와 적용 기준/);

  assert.equal(severanceCautions.length, 6);
  assert.match(contentSource, /severanceCautions\.map/);
  assert.match(contentSource, /법률 자문을 제공하는 서비스는\s+아닙니다/);
});

test("공식 출처는 요구된 공식 기관 원문만 사용한다", () => {
  assert.equal(severanceSources.length, 3);
  assert.match(contentSource, /severanceSources\.map/);
  assert.match(contentSource, /target="_blank" rel="noopener noreferrer"/);

  for (const source of severanceSources) {
    assert.ok(source.organization.length > 0);
    assert.ok(source.title.length > 0);
    assert.ok(source.criterion.length > 0);
    assert.match(
      source.href,
      /^https:\/\/(www\.)?(moel\.go\.kr|law\.go\.kr)\//,
    );
  }

  assert.equal(SEVERANCE_POLICY_2026.verifiedAt, "2026-06-23");
});

test("FAQ 8개를 한 곳에서 관리하고 FAQPage와 질문·답변·순서가 일치한다", () => {
  const expectedQuestions = [
    "1년 미만 근무하면 퇴직금을 받을 수 있나요?",
    "주 15시간 미만 근로자도 퇴직금 대상인가요?",
    "평균임금과 통상임금은 무엇이 다른가요?",
    "상여금도 퇴직금 계산에 반영되나요?",
    "연차수당도 퇴직금 계산에 반영되나요?",
    "퇴직일은 어떤 기준으로 입력하나요?",
    "계산 결과는 세전인가요, 세후인가요?",
    "실제 지급액과 계산 결과가 달라지는 이유는 무엇인가요?",
  ];

  assert.deepEqual(
    severanceFaqs.map((faq) => faq.question),
    expectedQuestions,
  );
  assert.equal(severanceFaqJsonLd.mainEntity.length, 8);
  assert.match(contentSource, /severanceFaqs\.map/);
  assert.match(contentSource, /<details/);

  for (const [index, faq] of severanceFaqs.entries()) {
    assert.equal(severanceFaqJsonLd.mainEntity[index].name, faq.question);
    assert.equal(
      severanceFaqJsonLd.mainEntity[index].acceptedAnswer.text,
      faq.answer,
    );
  }
});

test("관련 계산기는 실제 내부 라우트만 링크한다", () => {
  assert.match(contentSource, /href="\/calculators\/salary\/"/);
  assert.match(contentSource, /href="\/calculators\/loan\/"/);
  assert.match(contentSource, /href="\/calculators\/unemployment\/"/);
  assert.match(contentSource, /href="\/calculators\/seller-margin\/"/);
  assert.doesNotMatch(
    contentSource,
    /href="(?:#|javascript:|\/calculators\/(?:hourly|overtime|night))/,
  );
  assert.doesNotMatch(contentSource, /준비 중|comingSoon/);
});

test("WebApplication, BreadcrumbList와 FAQPage JSON-LD가 안전하다", () => {
  const items = [
    severanceWebApplicationJsonLd,
    severanceBreadcrumbJsonLd,
    severanceFaqJsonLd,
  ];

  assert.deepEqual(
    items.map((item) => item["@type"]),
    ["WebApplication", "BreadcrumbList", "FAQPage"],
  );
  assert.equal(severanceWebApplicationJsonLd.applicationCategory, "FinanceApplication");
  assert.deepEqual(
    severanceBreadcrumbJsonLd.itemListElement.map((item) => item.name),
    ["홈", "계산기 목록", "퇴직금 계산기"],
  );
  assert.deepEqual(
    severanceBreadcrumbJsonLd.itemListElement.map((item) => item.item),
    [
      "https://gyesanbox.kr/",
      "https://gyesanbox.kr/calculators/",
      "https://gyesanbox.kr/calculators/severance/",
    ],
  );

  for (const item of items) {
    const serialized = serializeJsonLd(item);
    assert.deepEqual(JSON.parse(serialized), item);
    assert.doesNotMatch(
      serialized,
      /aggregateRating|review|offers|NaN|Infinity|undefined|localhost|127\.0\.0\.1|pages\.dev|연봉 실수령액 계산기|판매자 마진 계산기/,
    );
  }
});

test("페이지는 공통 JSON-LD 컴포넌트와 퇴직금 콘텐츠 컴포넌트를 사용한다", () => {
  assert.match(pageSource, /<JsonLdScripts items=\{jsonLdItems\}/);
  assert.match(pageSource, /severanceWebApplicationJsonLd/);
  assert.match(pageSource, /severanceBreadcrumbJsonLd/);
  assert.match(pageSource, /severanceFaqJsonLd/);
  assert.match(pageSource, /<SeveranceContent \/>/);
});
