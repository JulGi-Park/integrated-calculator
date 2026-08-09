import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateDsr,
  resolveStressDsrPolicy,
} from "../lib/calculators/dsr/index.ts";

const basePolicyInput = {
  referenceDate: "2026-08-09",
  loanType: "mortgage",
  regionType: "capital",
  isRegulatedArea: false,
  interestRateType: "variable",
  termMonths: 360,
  fixedRatePeriodMonths: 60,
  rateResetPeriodMonths: 60,
  creditLoanTotalBalance: 0,
};

const baseDsrInput = {
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
  regionType: "capital",
  isRegulatedArea: false,
  interestRateType: "variable",
  fixedRatePeriodMonths: 60,
  rateResetPeriodMonths: 60,
  creditLoanTotalBalance: 100_000_000,
  stressInterestRate: 1.5,
  dsrLimitRate: 40,
};

test("수도권·규제지역 담보대출 변동형은 3단계 3.0%p를 적용한다", () => {
  const capital = resolveStressDsrPolicy(basePolicyInput);
  const regulatedLocal = resolveStressDsrPolicy({
    ...basePolicyInput,
    regionType: "local",
    isRegulatedArea: true,
  });

  for (const result of [capital, regulatedLocal]) {
    assert.equal(result.applicable, true);
    assert.equal(result.policyStage, 3);
    assert.equal(result.baseStressRate, 3);
    assert.equal(result.stageMultiplier, 1);
    assert.equal(result.productMultiplier, 1);
    assert.equal(result.finalStressRate, 3);
  }
});

test("지방 비규제지역 담보대출 변동형은 2단계 0.75%p를 적용한다", () => {
  const result = resolveStressDsrPolicy({
    ...basePolicyInput,
    regionType: "local",
    isRegulatedArea: false,
  });
  assert.equal(result.policyStage, 2);
  assert.equal(result.baseStressRate, 1.5);
  assert.equal(result.stageMultiplier, 0.5);
  assert.equal(result.productMultiplier, 1);
  assert.equal(result.finalStressRate, 0.75);
});

test("오피스텔은 주담대 방식, 그 외 대출은 신용대출 방식을 준용한다", () => {
  const officetel = resolveStressDsrPolicy({
    ...basePolicyInput,
    loanType: "officetelMortgage",
  });
  const nonHousing = resolveStressDsrPolicy({
    ...basePolicyInput,
    loanType: "nonHousingMortgage",
    regionType: "local",
  });
  assert.equal(officetel.baseStressRate, 3);
  assert.equal(officetel.finalStressRate, 3);
  assert.equal(nonHousing.policyStage, 3);
  assert.equal(nonHousing.baseStressRate, 1.5);
  assert.equal(nonHousing.finalStressRate, 1.5);
});

test("신용대출 총잔액 1억원 초과 경계를 정확히 판정한다", () => {
  for (const balance of [99_999_999, 100_000_000]) {
    const result = resolveStressDsrPolicy({
      ...basePolicyInput,
      loanType: "credit",
      creditLoanTotalBalance: balance,
    });
    assert.equal(result.applicable, false);
    assert.equal(result.finalStressRate, 0);
  }

  const over = resolveStressDsrPolicy({
    ...basePolicyInput,
    loanType: "credit",
    creditLoanTotalBalance: 100_000_001,
  });
  assert.equal(over.applicable, true);
  assert.equal(over.finalStressRate, 1.5);
});

test("신용·기타대출 완전 고정금리는 3년·5년 경계를 적용한다", () => {
  for (const loanType of ["credit", "leaseDepositSecured"]) {
    const input = {
      ...basePolicyInput,
      loanType,
      interestRateType: "fixed",
      creditLoanTotalBalance: 100_000_001,
    };
    assert.equal(resolveStressDsrPolicy({ ...input, termMonths: 35 }).productMultiplier, 1);
    assert.equal(resolveStressDsrPolicy({ ...input, termMonths: 36 }).productMultiplier, 0.6);
    assert.equal(resolveStressDsrPolicy({ ...input, termMonths: 59 }).productMultiplier, 0.6);
    assert.equal(resolveStressDsrPolicy({ ...input, termMonths: 60 }).productMultiplier, 0);
    assert.equal(resolveStressDsrPolicy({ ...input, termMonths: 61 }).productMultiplier, 0);
  }
});

test("혼합형은 5년 및 30·50·70% 경계를 교차곱으로 판정한다", () => {
  const input = { ...basePolicyInput, interestRateType: "mixed", termMonths: 240 };
  assert.equal(resolveStressDsrPolicy({ ...input, fixedRatePeriodMonths: 59 }).productMultiplier, 1);
  assert.equal(resolveStressDsrPolicy({ ...input, fixedRatePeriodMonths: 71 }).productMultiplier, 0.8);
  assert.equal(resolveStressDsrPolicy({ ...input, fixedRatePeriodMonths: 72 }).productMultiplier, 0.6);
  assert.equal(resolveStressDsrPolicy({ ...input, fixedRatePeriodMonths: 119 }).productMultiplier, 0.6);
  assert.equal(resolveStressDsrPolicy({ ...input, fixedRatePeriodMonths: 120 }).productMultiplier, 0.4);
  assert.equal(resolveStressDsrPolicy({ ...input, fixedRatePeriodMonths: 167 }).productMultiplier, 0.4);
  assert.equal(resolveStressDsrPolicy({ ...input, fixedRatePeriodMonths: 168 }).productMultiplier, 0);
});

test("2단계 혼합형과 주기형은 공식 적용비율을 사용한다", () => {
  const local = {
    ...basePolicyInput,
    regionType: "local",
    termMonths: 120,
    fixedRatePeriodMonths: 60,
    rateResetPeriodMonths: 60,
  };
  assert.equal(resolveStressDsrPolicy({ ...local, interestRateType: "mixed" }).productMultiplier, 0.2);
  assert.equal(resolveStressDsrPolicy({ ...local, interestRateType: "periodic" }).productMultiplier, 0.1);
});

test("주기형은 30·50·70% 경계를 판정한다", () => {
  const input = { ...basePolicyInput, interestRateType: "periodic", termMonths: 240 };
  assert.equal(resolveStressDsrPolicy({ ...input, rateResetPeriodMonths: 71 }).productMultiplier, 0.4);
  assert.equal(resolveStressDsrPolicy({ ...input, rateResetPeriodMonths: 72 }).productMultiplier, 0.3);
  assert.equal(resolveStressDsrPolicy({ ...input, rateResetPeriodMonths: 120 }).productMultiplier, 0.2);
  assert.equal(resolveStressDsrPolicy({ ...input, rateResetPeriodMonths: 168 }).productMultiplier, 0);
});

test("지원 기간 밖에서는 최신 정책을 추정하지 않는다", () => {
  for (const referenceDate of ["2026-06-30", "2027-01-01"]) {
    const result = resolveStressDsrPolicy({ ...basePolicyInput, referenceDate });
    assert.equal(result.supported, false);
    assert.equal(result.applicable, false);
    assert.equal(result.finalStressRate, 0);
    assert.match(result.reason, /추정하지 않습니다/);
  }
});

test("공식 최종 스트레스 금리로 별도 DSR을 계산하고 일반 DSR을 보존한다", () => {
  const response = calculateDsr(baseDsrInput);
  assert.equal(response.success, true);
  if (!response.success) return;

  assert.equal(response.data.base.newLoanPayment.annualPaymentForDsr, 12_160_447);
  assert.equal(response.data.base.dsrRate, 33.6);
  assert.equal(response.data.officialStressPolicy.finalStressRate, 3);
  assert.equal(response.data.officialStressed.newLoanPayment.annualPaymentForDsr, 16_781_148);
  assert.equal(response.data.officialStressed.dsrRate, 41.3);
  assert.equal(response.data.stressed.dsrRate, 37.32);
});
