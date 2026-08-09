import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  calculateDsr,
  calculateNewLoanPayment,
} from "../lib/calculators/dsr/index.ts";
import {
  dsrFaqJsonLd,
  dsrFaqs,
} from "../components/calculators/dsrContentData.ts";

test("원리금균등상환 DSR 대표 케이스를 계산한다", () => {
  const response = calculateDsr({
    annualIncome: 60_000_000,
    existingAnnualDebtPayment: 8_000_000,
    newLoanPrincipal: 200_000_000,
    annualInterestRate: 4.5,
    termMonths: 360,
    repaymentType: "levelPayment",
    stressInterestRate: 1.5,
    dsrLimitRate: 40,
  });

  assert.equal(response.success, true);

  if (!response.success) {
    return;
  }

  assert.equal(response.data.base.newLoanPayment.monthlyPayment, 1_013_371);
  assert.equal(response.data.base.newLoanPayment.annualPaymentForDsr, 12_160_452);
  assert.equal(response.data.base.totalAnnualDebtPayment, 20_160_452);
  assert.equal(response.data.base.dsrRate, 33.6);
  assert.equal(response.data.base.status, "withinLimit");
  assert.equal(response.data.stressed.newLoanPayment.monthlyPayment, 1_199_101);
  assert.equal(response.data.stressed.dsrRate, 37.32);
});

test("원금균등상환은 첫 달과 평균 월 상환액을 구분한다", () => {
  const payment = calculateNewLoanPayment(
    120_000_000,
    6,
    120,
    "equalPrincipal",
  );

  assert.equal(payment.firstMonthlyPayment, 1_600_000);
  assert.equal(payment.averageMonthlyPayment, 1_302_500);
  assert.equal(payment.annualPaymentForDsr, 15_630_000);
  assert.equal(payment.totalInterest, 36_300_000);
});

test("만기일시상환은 연간 이자와 만기 원금을 분리한다", () => {
  const payment = calculateNewLoanPayment(
    100_000_000,
    4.8,
    60,
    "bullet",
  );

  assert.equal(payment.monthlyPayment, 400_000);
  assert.equal(payment.annualPaymentForDsr, 4_800_000);
  assert.equal(payment.maturityPrincipal, 100_000_000);
});

test("0% 금리 원리금균등상환을 정상 처리한다", () => {
  const payment = calculateNewLoanPayment(
    120_000_000,
    0,
    120,
    "levelPayment",
  );

  assert.equal(payment.monthlyPayment, 1_000_000);
  assert.equal(payment.totalInterest, 0);
});

test("입력 검증과 NaN, Infinity 방어가 동작한다", () => {
  const response = calculateDsr({
    annualIncome: 0,
    existingAnnualDebtPayment: -1,
    newLoanPrincipal: Number.NaN,
    annualInterestRate: -0.1,
    termMonths: Number.POSITIVE_INFINITY,
    repaymentType: "invalid",
    stressInterestRate: -1,
    dsrLimitRate: 0,
  });

  assert.equal(response.success, false);

  if (response.success) {
    return;
  }

  assert.match(
    response.errors.map((error) => error.message).join(" "),
    /연소득|기존 대출|신규 대출|금리|기간|상환 방식|스트레스|DSR 기준/,
  );
});

test("라우트는 canonical을 가진 공개 페이지다", async () => {
  const source = await readFile("app/calculators/dsr/page.tsx", "utf8");

  assert.match(source, /canonical/);
  assert.doesNotMatch(source, /isDsrCalculatorEnabled|notFound\(\)|index:\s*false/);
});

test("sitemap, 목록, 홈에는 DSR 계산기를 노출한다", async () => {
  const files = [
    "app/sitemap.ts",
    "app/page.tsx",
    "app/calculators/page.tsx",
    "app/calculators/salary/page.tsx",
    "app/calculators/loan/page.tsx",
    "app/calculators/seller-margin/page.tsx",
    "app/calculators/severance/page.tsx",
    "app/calculators/unemployment/page.tsx",
  ];

  const sources = await Promise.all(files.map((file) => readFile(file, "utf8")));

  assert.match(sources[0], /\/calculators\/dsr/);
  assert.match(sources[1], /\/calculators\/dsr|DSR 계산기/);
  assert.match(sources[2], /\/calculators\/dsr|DSR 계산기/);
});

test("Cloudflare 검증은 DSR 산출물을 비공개 산출물로 차단한다", async () => {
  const source = await readFile("scripts/verify-cloudflare-pages.mjs", "utf8");

  assert.match(source, /out\/calculators\/dsr/);
  assert.match(source, /\/calculators\/dsr/);
});

test("FAQ 화면 데이터와 FAQPage JSON-LD 데이터가 일치한다", () => {
  assert.deepEqual(
    dsrFaqJsonLd.mainEntity.map((item) => ({
      question: item.name,
      answer: item.acceptedAnswer.text,
    })),
    dsrFaqs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
    })),
  );
});

test("공식 출처와 기준일, 면책 문구를 콘텐츠에 포함한다", async () => {
  const [contentSource, constantsSource] = await Promise.all([
    readFile("components/calculators/dsrContentData.ts", "utf8"),
    readFile("lib/calculators/dsr/constants.ts", "utf8"),
  ]);

  assert.match(constantsSource, /2026-08-09/);
  assert.match(constantsSource, /금융위원회/);
  assert.match(contentSource, /실제 금융기관 심사 결과와 다를 수 있습니다/);
});

test("DSR 콘텐츠와 결과 해석은 대출 승인 확정 표현을 사용하지 않는다", async () => {
  const files = [
    "app/calculators/dsr/page.tsx",
    "components/calculators/DsrCalculator.tsx",
    "components/calculators/DsrContent.tsx",
    "components/calculators/dsrContentData.ts",
    "lib/calculators/dsr/calculateDsr.ts",
  ];
  const source = (await Promise.all(files.map((file) => readFile(file, "utf8"))))
    .join("\n");

  assert.doesNotMatch(
    source,
    /대출 가능 확정|승인 가능|승인 보장|무조건 가능|은행 심사와 동일/,
  );
});
