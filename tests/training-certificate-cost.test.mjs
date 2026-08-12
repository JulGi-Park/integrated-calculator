import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateTrainingCertificateCost,
  calculateTrainingCertificateCostFromUnknown,
} from "../lib/calculators/training-certificate-cost/calculateTrainingCertificateCost.ts";
import {
  TRAINING_CERTIFICATE_COST_LIMITS,
  validateTrainingCertificateCostInput,
} from "../lib/calculators/training-certificate-cost/validation.ts";

const representativeInput = {
  totalTrainingCost: 1_500_000,
  trainingSelfPayAmount: 300_000,
  examFee: 50_000,
  expectedExamAttempts: 2,
  textbookCost: 30_000,
  practiceMaterialCost: 50_000,
  transportationCost: 120_000,
  mealCost: 0,
  otherCost: 0,
};

function assertSuccess(response) {
  assert.equal(response.success, true);
  return response.data;
}

function assertHasError(response, field, code) {
  assert.equal(response.success, false);
  assert.ok(
    response.errors.some(
      (error) => error.field === field && error.code === code,
    ),
    `${field} 필드에 ${code} 오류가 있어야 합니다.`,
  );
}

test("대표 fixture의 훈련비·시험비·부대비용을 계산한다", () => {
  const result = assertSuccess(
    calculateTrainingCertificateCostFromUnknown(representativeInput),
  );

  assert.deepEqual(result, {
    totalExamCost: 100_000,
    ancillaryCost: 300_000,
    estimatedGovernmentSupportAmount: 1_200_000,
    estimatedTotalCostWithoutSupport: 1_800_000,
    estimatedTotalOutOfPocket: 600_000,
    estimatedSavingsAmount: 1_200_000,
  });
});

test("지원 전·후 비용의 관계와 지원액·절감액의 동일성을 유지한다", () => {
  const result = calculateTrainingCertificateCost(representativeInput);

  assert.equal(
    result.estimatedTotalCostWithoutSupport,
    result.estimatedTotalOutOfPocket +
      result.estimatedGovernmentSupportAmount,
  );
  assert.equal(
    result.estimatedGovernmentSupportAmount,
    result.estimatedSavingsAmount,
  );
});

test("선택 비용 빈 값은 0원으로 처리한다", () => {
  const result = assertSuccess(
    calculateTrainingCertificateCostFromUnknown({
      ...representativeInput,
      textbookCost: "",
      practiceMaterialCost: undefined,
      transportationCost: null,
      mealCost: "",
      otherCost: undefined,
    }),
  );

  assert.equal(result.totalExamCost, 100_000);
  assert.equal(result.ancillaryCost, 100_000);
  assert.equal(result.estimatedTotalOutOfPocket, 400_000);
});

test("본인부담액 0원과 본인부담액이 총 훈련비와 같은 경우를 계산한다", () => {
  const noSelfPay = assertSuccess(
    calculateTrainingCertificateCostFromUnknown({
      ...representativeInput,
      trainingSelfPayAmount: 0,
    }),
  );
  const fullSelfPay = assertSuccess(
    calculateTrainingCertificateCostFromUnknown({
      ...representativeInput,
      trainingSelfPayAmount: representativeInput.totalTrainingCost,
    }),
  );

  assert.equal(noSelfPay.estimatedGovernmentSupportAmount, 1_500_000);
  assert.equal(noSelfPay.estimatedTotalOutOfPocket, 300_000);
  assert.equal(fullSelfPay.estimatedGovernmentSupportAmount, 0);
  assert.equal(fullSelfPay.estimatedSavingsAmount, 0);
  assert.equal(fullSelfPay.estimatedTotalOutOfPocket, 1_800_000);
});

test("총 훈련비 0원과 응시료 0원을 정상 처리한다", () => {
  const result = assertSuccess(
    calculateTrainingCertificateCostFromUnknown({
      ...representativeInput,
      totalTrainingCost: 0,
      trainingSelfPayAmount: 0,
      examFee: 0,
      expectedExamAttempts: 1,
      textbookCost: 0,
      practiceMaterialCost: 0,
      transportationCost: 0,
      mealCost: 0,
      otherCost: 0,
    }),
  );

  assert.deepEqual(result, {
    totalExamCost: 0,
    ancillaryCost: 0,
    estimatedGovernmentSupportAmount: 0,
    estimatedTotalCostWithoutSupport: 0,
    estimatedTotalOutOfPocket: 0,
    estimatedSavingsAmount: 0,
  });
});

test("최소 응시 횟수 1회와 재응시 비용을 계산한다", () => {
  const result = assertSuccess(
    calculateTrainingCertificateCostFromUnknown({
      ...representativeInput,
      expectedExamAttempts: 1,
      examFee: 50_000,
      textbookCost: 0,
      practiceMaterialCost: 0,
      transportationCost: 0,
      mealCost: 0,
      otherCost: 0,
    }),
  );

  assert.equal(result.totalExamCost, 50_000);
  assert.equal(result.ancillaryCost, 50_000);
});

test("금액 상한 경계를 허용하고 초과 금액을 거부한다", () => {
  const valid = validateTrainingCertificateCostInput({
    ...representativeInput,
    totalTrainingCost: TRAINING_CERTIFICATE_COST_LIMITS.maximumAmount,
    trainingSelfPayAmount: 0,
    examFee: 0,
  });

  assert.equal(valid.length, 0);
  assertHasError(
    calculateTrainingCertificateCostFromUnknown({
      ...representativeInput,
      totalTrainingCost: TRAINING_CERTIFICATE_COST_LIMITS.maximumAmount + 1,
    }),
    "totalTrainingCost",
    "AMOUNT_EXCEEDS_LIMIT",
  );
});

test("음수·소수·비수치·NaN·Infinity를 거부한다", () => {
  assertHasError(
    calculateTrainingCertificateCostFromUnknown({
      ...representativeInput,
      textbookCost: -1,
    }),
    "textbookCost",
    "MUST_BE_NON_NEGATIVE",
  );
  assertHasError(
    calculateTrainingCertificateCostFromUnknown({
      ...representativeInput,
      examFee: 1.5,
    }),
    "examFee",
    "MUST_BE_INTEGER",
  );

  for (const value of ["50000", Number.NaN, Infinity, -Infinity]) {
    assertHasError(
      calculateTrainingCertificateCostFromUnknown({
        ...representativeInput,
        examFee: value,
      }),
      "examFee",
      "INVALID_NUMBER",
    );
  }
});

test("예상 응시 횟수는 1회 이상 정수여야 한다", () => {
  assertHasError(
    calculateTrainingCertificateCostFromUnknown({
      ...representativeInput,
      expectedExamAttempts: 0,
    }),
    "expectedExamAttempts",
    "MUST_BE_POSITIVE",
  );
  assertHasError(
    calculateTrainingCertificateCostFromUnknown({
      ...representativeInput,
      expectedExamAttempts: 1.5,
    }),
    "expectedExamAttempts",
    "MUST_BE_INTEGER",
  );
  assertHasError(
    calculateTrainingCertificateCostFromUnknown({
      ...representativeInput,
      expectedExamAttempts: Number.MAX_SAFE_INTEGER + 1,
    }),
    "expectedExamAttempts",
    "MUST_BE_SAFE_INTEGER",
  );
});

test("본인부담액이 총 훈련비를 초과하면 계산하지 않는다", () => {
  const response = calculateTrainingCertificateCostFromUnknown({
    ...representativeInput,
    trainingSelfPayAmount: representativeInput.totalTrainingCost + 1,
  });

  assertHasError(
    response,
    "trainingSelfPayAmount",
    "SELF_PAY_EXCEEDS_TOTAL",
  );
  assert.equal("data" in response, false);
});

test("필수 입력 빈 값은 오류이고 선택 비용 빈 값은 유효하다", () => {
  assertHasError(
    calculateTrainingCertificateCostFromUnknown({
      ...representativeInput,
      totalTrainingCost: "",
    }),
    "totalTrainingCost",
    "REQUIRED",
  );
  assertHasError(
    calculateTrainingCertificateCostFromUnknown({
      ...representativeInput,
      expectedExamAttempts: "",
    }),
    "expectedExamAttempts",
    "REQUIRED",
  );
  assert.equal(
    validateTrainingCertificateCostInput({
      ...representativeInput,
      textbookCost: "",
      practiceMaterialCost: "",
      transportationCost: "",
      mealCost: "",
      otherCost: "",
    }).length,
    0,
  );
});

test("응시료와 응시 횟수의 조합이 안전 정수 범위를 넘으면 차단한다", () => {
  const response = calculateTrainingCertificateCostFromUnknown({
    ...representativeInput,
    totalTrainingCost: 0,
    trainingSelfPayAmount: 0,
    examFee: TRAINING_CERTIFICATE_COST_LIMITS.maximumAmount,
    expectedExamAttempts: 900_720,
  });

  assertHasError(response, "calculation", "CALCULATION_EXCEEDS_SAFE_RANGE");
  assert.equal("data" in response, false);
});

test("계산 함수는 입력 객체를 변경하지 않는다", () => {
  const input = { ...representativeInput };
  const snapshot = structuredClone(input);

  calculateTrainingCertificateCostFromUnknown(input);

  assert.deepEqual(input, snapshot);
});
