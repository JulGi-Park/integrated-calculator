import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  calculateAnnualDsrDebtService,
  calculateDsr,
  calculateNewLoanPayment,
  DSR_DEBT_SERVICE_MATRIX,
  getDsrAssessmentMaturity,
} from "../lib/calculators/dsr/index.ts";
import {
  dsrFaqJsonLd,
  dsrFaqs,
} from "../components/calculators/dsrContentData.ts";
import { buildDsrResultText } from "../components/calculators/dsrClientUtils.ts";

const baseInput = {
  annualIncome: 60_000_000,
  existingAnnualDebtPayment: 8_000_000,
  newLoanPrincipal: 200_000_000,
  annualInterestRate: 4.5,
  termMonths: 360,
  loanType: "mortgage",
  repaymentType: "levelPayment",
  gracePeriodMonths: 0,
  balloonPrincipal: 0,
  creditInstallmentRatio: 100,
  creditRepaymentFrequency: "monthly",
  stressInterestRate: 1.5,
  dsrLimitRate: 40,
};

test("원리금균등상환 DSR 대표 케이스를 계산한다", () => {
  const response = calculateDsr(baseInput);

  assert.equal(response.success, true);

  if (!response.success) {
    return;
  }

  assert.equal(response.data.base.newLoanPayment.monthlyPayment, 1_013_371);
  assert.equal(response.data.base.newLoanPayment.annualPaymentForDsr, 12_160_447);
  assert.equal(response.data.base.totalAnnualDebtPayment, 20_160_447);
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
  assert.equal(payment.contractAnnualPayment, 18_870_000);
  assert.equal(payment.annualPaymentForDsr, 18_870_000);
  assert.equal(payment.totalInterest, 36_300_000);
});

test("주담대 만기일시상환은 원금을 최대 10년 산정만기로 포함한다", () => {
  const payment = calculateNewLoanPayment(
    100_000_000,
    4.8,
    60,
    "bullet",
  );

  assert.equal(payment.monthlyPayment, 400_000);
  assert.equal(payment.annualPrincipalForDsr, 20_000_000);
  assert.equal(payment.annualInterestForDsr, 4_800_000);
  assert.equal(payment.annualPaymentForDsr, 24_800_000);
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
    ...baseInput,
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

test("공식 정책 매트릭스는 주요 대출·상환·제외 유형을 포함한다", () => {
  const matrixText = JSON.stringify(DSR_DEBT_SERVICE_MATRIX);
  for (const value of [
    "mortgage",
    "credit",
    "officetelMortgage",
    "nonHousingMortgage",
    "leaseDepositSecured",
    "partialInstallment",
    "excluded",
  ]) {
    assert.match(matrixText, new RegExp(value));
  }
  assert.ok(DSR_DEBT_SERVICE_MATRIX.every((row) => row.source && row.effectiveFrom));
});

test("신용대출 일시상환은 5년 산정만기로 원금과 이자를 포함한다", () => {
  const payment = calculateAnnualDsrDebtService({
    ...baseInput,
    newLoanPrincipal: 100_000_000,
    annualInterestRate: 4.8,
    termMonths: 60,
    loanType: "credit",
    repaymentType: "bullet",
  });
  assert.equal(payment.assessmentMaturityMonths, 60);
  assert.equal(payment.annualPrincipalForDsr, 20_000_000);
  assert.equal(payment.annualInterestForDsr, 4_800_000);
  assert.equal(payment.annualPaymentForDsr, 24_800_000);
});

test("신용대출 분할상환 인정요건과 5·10년 경계를 적용한다", () => {
  const recognized = {
    ...baseInput,
    loanType: "credit",
    repaymentType: "equalPrincipal",
    termMonths: 120,
    gracePeriodMonths: 0,
    creditInstallmentRatio: 40,
    creditRepaymentFrequency: "quarterly",
  };
  assert.equal(getDsrAssessmentMaturity(recognized).months, 120);
  assert.equal(getDsrAssessmentMaturity({ ...recognized, termMonths: 60 }).months, 60);
  assert.equal(getDsrAssessmentMaturity({ ...recognized, termMonths: 121 }).months, 60);
  assert.equal(getDsrAssessmentMaturity({ ...recognized, creditInstallmentRatio: 39.99 }).months, 60);
  assert.equal(getDsrAssessmentMaturity({ ...recognized, gracePeriodMonths: 1 }).months, 60);
  assert.equal(getDsrAssessmentMaturity({ ...recognized, creditRepaymentFrequency: "other" }).months, 60);
});

test("주담대 분할상환과 일시상환 산정만기를 구분한다", () => {
  const installment = calculateAnnualDsrDebtService(baseInput);
  const bullet = calculateAnnualDsrDebtService({
    ...baseInput,
    newLoanPrincipal: 100_000_000,
    annualInterestRate: 4.8,
    repaymentType: "bullet",
  });
  assert.equal(installment.assessmentMaturityMonths, 360);
  assert.equal(installment.annualPaymentForDsr, installment.contractAnnualPayment);
  assert.equal(bullet.assessmentMaturityMonths, 120);
  assert.equal(bullet.annualPrincipalForDsr, 10_000_000);
  assert.equal(bullet.annualPaymentForDsr, 14_800_000);
});

test("주담대 일부 분할상환은 실제 분할원금과 만기상환분을 합산한다", () => {
  const payment = calculateAnnualDsrDebtService({
    ...baseInput,
    newLoanPrincipal: 100_000_000,
    annualInterestRate: 4.8,
    termMonths: 120,
    repaymentType: "partialInstallment",
    balloonPrincipal: 40_000_000,
  });
  assert.equal(payment.annualPrincipalForDsr, 10_000_000);
  assert.equal(payment.maturityPrincipal, 40_000_000);
  assert.ok(payment.annualInterestForDsr > 0);
});

test("일반 산정만기는 상환능력 입증 입력이 없으면 40년으로 제한한다", () => {
  const maturity = getDsrAssessmentMaturity({ ...baseInput, termMonths: 600 });
  assert.equal(maturity.months, 480);
  assert.match(maturity.reason, /40년/);
});

test("오피스텔·비주택·전세보증금담보 산정만기를 적용한다", () => {
  assert.equal(getDsrAssessmentMaturity({ ...baseInput, loanType: "nonHousingMortgage" }).months, 96);
  assert.equal(getDsrAssessmentMaturity({ ...baseInput, loanType: "leaseDepositSecured" }).months, 48);
  assert.equal(getDsrAssessmentMaturity({ ...baseInput, loanType: "officetelMortgage", repaymentType: "bullet" }).months, 96);
  assert.equal(getDsrAssessmentMaturity({ ...baseInput, loanType: "officetelMortgage", repaymentType: "partialInstallment", gracePeriodMonths: 13 }).months, 96);
});

test("0%·고액 안전범위와 비정상 입력 경계를 처리한다", () => {
  const zeroRate = calculateAnnualDsrDebtService({ ...baseInput, annualInterestRate: 0 });
  assert.equal(zeroRate.annualInterestForDsr, 0);
  assert.ok(zeroRate.annualPrincipalForDsr > 0);
  assert.equal(calculateDsr({
    ...baseInput,
    annualIncome: 10_000_000_000,
    newLoanPrincipal: 9_000_000_000,
    annualInterestRate: 1,
    termMonths: 480,
    stressInterestRate: 0,
    dsrLimitRate: 200,
  }).success, true);
  assert.equal(calculateDsr({ ...baseInput, newLoanPrincipal: 10_000_000_001 }).success, false);
  assert.equal(calculateDsr({ ...baseInput, annualIncome: 0 }).success, false);
});

test("복사 결과는 계약상 납입액과 DSR 원금·이자 및 사용자 시나리오를 구분한다", () => {
  const response = calculateDsr(baseInput);
  assert.equal(response.success, true);
  if (!response.success) return;
  const text = buildDsrResultText(response.data);
  assert.match(text, /계약상 향후 1년 납입액/);
  assert.match(text, /DSR 산정 연간 원금/);
  assert.match(text, /DSR 산정 연간 이자/);
  assert.match(text, /사용자 금리상승 시나리오/);
  assert.doesNotMatch(text, /공식 스트레스 DSR 자동계산/);
});

test("UI는 공식 산정 입력·결과와 안전한 스트레스 시나리오 명칭을 제공한다", async () => {
  const source = await readFile("components/calculators/DsrCalculator.tsx", "utf8");
  for (const phrase of ["신규 대출 종류", "DSR 산정 연간 원금", "DSR 산정 연간 이자", "DSR 산정만기", "사용자 금리상승 시나리오"]) {
    assert.match(source, new RegExp(phrase));
  }
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
