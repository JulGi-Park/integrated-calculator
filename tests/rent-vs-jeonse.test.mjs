import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  rentVsJeonseFaqJsonLd,
  rentVsJeonseFaqs,
  rentVsJeonseSources,
} from "../components/calculators/rentVsJeonseContentData.ts";
import {
  calculateLegalReferenceRate,
  calculateRentVsJeonse,
  compareRentVsJeonse,
  getDefaultRentVsJeonseInput,
  RENT_VS_JEONSE_LEGAL_REFERENCE,
  validateRentVsJeonseInput,
} from "../lib/calculators/rent-vs-jeonse/rent-vs-jeonse.ts";

const baseInput = {
  jeonseDeposit: 300_000_000,
  jeonseLoanAmount: 180_000_000,
  jeonseLoanRate: 4,
  jeonseExtraMonthlyCost: 50_000,
  monthlyRentDeposit: 50_000_000,
  monthlyRent: 900_000,
  monthlyMaintenanceFee: 100_000,
  opportunityRate: 3,
  residenceMonths: 24,
  conversionRate: 4.5,
  baseRate: 2.5,
  legalAdditionalRate: 2,
  maxLegalRate: 10,
};

function assertSuccess(response) {
  assert.equal(response.success, true);
  return response.data;
}

function assertHasError(input, field, code) {
  const response = calculateRentVsJeonse(input);
  assert.equal(response.success, false);
  assert.ok(
    response.errors.some((error) => error.field === field && error.code === code),
    `${field} 필드에 ${code} 오류가 있어야 합니다.`,
  );
}

test("기본 계산: 전세와 월세의 월 부담, 총비용, 차이, 보증금 환산액을 계산한다", () => {
  const result = assertSuccess(calculateRentVsJeonse(baseInput));

  assert.equal(result.jeonseMonthlyInterestCost, 600_000);
  assert.equal(result.jeonseEquity, 120_000_000);
  assert.equal(result.jeonseEquityMonthlyOpportunityCost, 300_000);
  assert.equal(result.jeonseMonthlyBurden, 950_000);
  assert.equal(result.jeonseTotalCost, 22_800_000);
  assert.equal(result.monthlyRentDepositMonthlyOpportunityCost, 125_000);
  assert.equal(result.monthlyRentBurden, 1_125_000);
  assert.equal(result.monthlyRentTotalCost, 27_000_000);
  assert.equal(result.monthlyBurdenDifference, -175_000);
  assert.equal(result.totalCostDifference, -4_200_000);
  assert.equal(result.cheaperOption, "jeonse");
  assert.equal(result.depositDifference, 250_000_000);
  assert.equal(result.depositDifferenceMonthlyRentEquivalent, 937_500);
  assert.equal(result.legalReferenceRate, 4.5);
});

test("법정 참고 전환율: 기준금리와 가산 이율의 합과 상한 중 낮은 값을 사용한다", () => {
  assert.equal(
    calculateLegalReferenceRate({
      baseRate: 2.5,
      legalAdditionalRate: 2,
      maxLegalRate: 10,
    }),
    4.5,
  );
  assert.equal(
    calculateLegalReferenceRate({
      baseRate: 3,
      legalAdditionalRate: 2,
      maxLegalRate: 10,
    }),
    5,
  );
  assert.equal(
    calculateLegalReferenceRate({
      baseRate: 9,
      legalAdditionalRate: 3,
      maxLegalRate: 10,
    }),
    10,
  );
});

test("경계값: 전세대출금 0, 월세 0, 관리비 0, 같은 보증금, 1개월을 계산한다", () => {
  const result = compareRentVsJeonse({
    ...baseInput,
    jeonseDeposit: 100_000_000,
    jeonseLoanAmount: 0,
    monthlyRentDeposit: 100_000_000,
    monthlyRent: 0,
    monthlyMaintenanceFee: 0,
    residenceMonths: 1,
  });

  assert.equal(result.jeonseMonthlyInterestCost, 0);
  assert.equal(result.jeonseEquityMonthlyOpportunityCost, 250_000);
  assert.equal(result.monthlyRentDepositMonthlyOpportunityCost, 250_000);
  assert.equal(result.depositDifference, 0);
  assert.equal(result.depositDifferenceMonthlyRentEquivalent, 0);
  assert.equal(result.jeonseTotalCost, result.jeonseMonthlyBurden);
});

test("경계값: 전세대출금이 전세보증금과 같고 거주기간 24개월인 경우를 계산한다", () => {
  const result = compareRentVsJeonse({
    ...baseInput,
    jeonseDeposit: 200_000_000,
    jeonseLoanAmount: 200_000_000,
    residenceMonths: 24,
  });

  assert.equal(result.jeonseEquity, 0);
  assert.equal(result.jeonseEquityMonthlyOpportunityCost, 0);
  assert.equal(result.jeonseTotalCost, result.jeonseMonthlyBurden * 24);
});

test("경계값: 금리가 모두 0이면 이자와 기회비용이 0원이다", () => {
  const result = compareRentVsJeonse({
    ...baseInput,
    jeonseLoanRate: 0,
    opportunityRate: 0,
    conversionRate: 0,
  });

  assert.equal(result.jeonseMonthlyInterestCost, 0);
  assert.equal(result.jeonseEquityMonthlyOpportunityCost, 0);
  assert.equal(result.monthlyRentDepositMonthlyOpportunityCost, 0);
  assert.equal(result.depositDifferenceMonthlyRentEquivalent, 0);
});

test("비교 상태: 전세와 월세 총비용이 같은 경우 same을 반환한다", () => {
  const result = compareRentVsJeonse({
    ...baseInput,
    jeonseDeposit: 0,
    jeonseLoanAmount: 0,
    jeonseLoanRate: 0,
    jeonseExtraMonthlyCost: 1_000_000,
    monthlyRentDeposit: 0,
    monthlyRent: 900_000,
    monthlyMaintenanceFee: 100_000,
    opportunityRate: 0,
  });

  assert.equal(result.totalCostDifference, 0);
  assert.equal(result.cheaperOption, "same");
});

test("비교 상태: 전세가 더 유리한 경우와 월세가 더 유리한 경우를 구분한다", () => {
  assert.equal(compareRentVsJeonse(baseInput).cheaperOption, "jeonse");
  assert.equal(
    compareRentVsJeonse({
      ...baseInput,
      jeonseExtraMonthlyCost: 500_000,
      monthlyRent: 100_000,
    }).cheaperOption,
    "monthlyRent",
  );
});

test("보증금 차이가 음수여도 월세 환산 참고값을 계산한다", () => {
  const result = compareRentVsJeonse({
    ...baseInput,
    jeonseDeposit: 30_000_000,
    jeonseLoanAmount: 0,
    monthlyRentDeposit: 50_000_000,
  });

  assert.equal(result.depositDifference, -20_000_000);
  assert.equal(result.depositDifferenceMonthlyRentEquivalent, -75_000);
});

test("입력값 검증: 필수 오류 케이스를 반환한다", () => {
  assertHasError({ ...baseInput, jeonseDeposit: -1 }, "jeonseDeposit", "MUST_BE_NON_NEGATIVE");
  assertHasError({ ...baseInput, jeonseLoanAmount: -1 }, "jeonseLoanAmount", "MUST_BE_NON_NEGATIVE");
  assertHasError({ ...baseInput, jeonseLoanAmount: 400_000_000 }, "jeonseLoanAmount", "LOAN_EXCEEDS_DEPOSIT");
  assertHasError({ ...baseInput, jeonseLoanRate: -1 }, "jeonseLoanRate", "MUST_BE_NON_NEGATIVE");
  assertHasError({ ...baseInput, monthlyRentDeposit: -1 }, "monthlyRentDeposit", "MUST_BE_NON_NEGATIVE");
  assertHasError({ ...baseInput, monthlyRent: -1 }, "monthlyRent", "MUST_BE_NON_NEGATIVE");
  assertHasError({ ...baseInput, monthlyMaintenanceFee: -1 }, "monthlyMaintenanceFee", "MUST_BE_NON_NEGATIVE");
  assertHasError({ ...baseInput, opportunityRate: -1 }, "opportunityRate", "MUST_BE_NON_NEGATIVE");
  assertHasError({ ...baseInput, residenceMonths: 0 }, "residenceMonths", "MUST_BE_POSITIVE");
  assertHasError({ ...baseInput, residenceMonths: 1.5 }, "residenceMonths", "MUST_BE_INTEGER");
  assertHasError({ ...baseInput, conversionRate: -1 }, "conversionRate", "MUST_BE_NON_NEGATIVE");
  assertHasError({ ...baseInput, baseRate: -1 }, "baseRate", "MUST_BE_NON_NEGATIVE");
  assertHasError({ ...baseInput, legalAdditionalRate: -1 }, "legalAdditionalRate", "MUST_BE_NON_NEGATIVE");
  assertHasError({ ...baseInput, maxLegalRate: 0 }, "maxLegalRate", "MUST_BE_POSITIVE");
  assertHasError({ ...baseInput, monthlyRent: Number.NaN }, "monthlyRent", "INVALID_NUMBER");
  assertHasError({ ...baseInput, monthlyRent: Number.POSITIVE_INFINITY }, "monthlyRent", "INVALID_NUMBER");
});

test("기본값과 공식 기준 문구는 2026-07-02 참고값을 포함한다", () => {
  const input = getDefaultRentVsJeonseInput();
  const result = assertSuccess(calculateRentVsJeonse(input));

  assert.equal(input.baseRate, 2.5);
  assert.equal(input.legalAdditionalRate, 2);
  assert.equal(input.maxLegalRate, 10);
  assert.equal(result.legalReferenceRate, 4.5);
  assert.equal(RENT_VS_JEONSE_LEGAL_REFERENCE.referenceDate, "2026-07-02");
  assert.match(result.referenceNotice, /2026-07-02 기준 참고값/);
  assert.match(result.disclaimer, /참고용 예상 계산/);
});

test("검증 함수는 객체가 아닌 입력과 빈 값을 명확한 오류로 반환한다", () => {
  assert.equal(validateRentVsJeonseInput(null).length, 13);

  const response = calculateRentVsJeonse({
    ...baseInput,
    monthlyRent: "",
  });

  assert.equal(response.success, false);
  assert.ok(response.errors.some((error) => error.field === "monthlyRent" && error.code === "REQUIRED"));
});

test("라우트는 정확히 true 문자열 플래그에서만 렌더링되고 목록·sitemap에 노출되지 않는다", async () => {
  const [
    pageSource,
    listSource,
    homeSource,
    sitemapSource,
    packageJsonSource,
    pruneScriptSource,
    verifyScriptSource,
  ] = await Promise.all([
    readFile("app/calculators/rent-vs-jeonse/page.tsx", "utf8"),
    readFile("app/calculators/page.tsx", "utf8"),
    readFile("app/page.tsx", "utf8"),
    readFile("app/sitemap.ts", "utf8"),
    readFile("package.json", "utf8"),
    readFile("scripts/prune-local-only-routes.mjs", "utf8"),
    readFile("scripts/verify-cloudflare-pages.mjs", "utf8"),
  ]);

  assert.match(pageSource, /NEXT_PUBLIC_ENABLE_RENT_VS_JEONSE_CALCULATOR/);
  assert.match(pageSource, /=== "true"/);
  assert.match(pageSource, /notFound\(\)/);
  assert.doesNotMatch(listSource, /rent-vs-jeonse/);
  assert.doesNotMatch(homeSource, /rent-vs-jeonse/);
  assert.doesNotMatch(sitemapSource, /rent-vs-jeonse/);
  assert.match(packageJsonSource, /prune:local-only-routes/);
  assert.match(pruneScriptSource, /out\/calculators\/rent-vs-jeonse/);
  assert.match(verifyScriptSource, /out\/calculators\/rent-vs-jeonse/);
});

test("2차 콘텐츠는 계산 기준, 예시, FAQ, 출처와 면책 문구를 제공한다", async () => {
  const [contentSource, pageSource] = await Promise.all([
    readFile("components/calculators/RentVsJeonseContent.tsx", "utf8"),
    readFile("app/calculators/rent-vs-jeonse/page.tsx", "utf8"),
  ]);

  assert.match(contentSource, /계산 기준/);
  assert.match(contentSource, /법정 전월세전환율 참고/);
  assert.match(contentSource, /계산 예시/);
  assert.match(contentSource, /자동 반영되지 않는 항목/);
  assert.match(contentSource, /공식 출처/);
  assert.match(contentSource, /법률 판단이나 분쟁\s*해결을 대신하지/);
  assert.match(pageSource, /JsonLdScripts/);
  assert.match(pageSource, /rentVsJeonseFaqJsonLd/);

  assert.ok(rentVsJeonseFaqs.length >= 6);
  assert.equal(rentVsJeonseSources.length, 4);
  assert.ok(
    rentVsJeonseSources.every((source) => source.verifiedAt === "2026년 7월 2일"),
  );
  assert.deepEqual(
    rentVsJeonseFaqJsonLd.mainEntity.map((item) => item.name),
    rentVsJeonseFaqs.map(({ question }) => question),
  );
  assert.deepEqual(
    rentVsJeonseFaqJsonLd.mainEntity.map(
      (item) => item.acceptedAnswer.text,
    ),
    rentVsJeonseFaqs.map(({ answer }) => answer),
  );
});
