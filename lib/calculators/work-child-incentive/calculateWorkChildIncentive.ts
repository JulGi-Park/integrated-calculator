import { WORK_CHILD_INCENTIVE_POLICY } from "./constants";
import type {
  IncentiveEligibility,
  WorkChildIncentiveInput,
  WorkChildIncentiveResponse,
} from "./types";
import { validateWorkChildIncentiveInput } from "./validation";

function clampAmount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value));
}

function getPropertyStatus(propertyAmount: number) {
  const policy = WORK_CHILD_INCENTIVE_POLICY;

  if (propertyAmount >= policy.propertyLimit) {
    return {
      status: "excluded" as const,
      rate: 0,
      message: "재산 합계액이 2.4억원 이상이면 장려금 예상 계산에서 제외됩니다.",
    };
  }

  if (propertyAmount >= policy.propertyReductionThreshold) {
    return {
      status: "reduced" as const,
      rate: policy.propertyReductionRate,
      message: "재산 합계액이 1.7억원 이상 2.4억원 미만이라 산정액의 50%를 반영합니다.",
    };
  }

  return {
    status: "pass" as const,
    rate: 1,
    message: "재산 합계액이 1.7억원 미만인 조건으로 예상 계산합니다.",
  };
}

function applyCommonReductions(amount: number, input: WorkChildIncentiveInput) {
  let reduced = amount;

  if (input.propertyAmount >= WORK_CHILD_INCENTIVE_POLICY.propertyReductionThreshold) {
    reduced *= WORK_CHILD_INCENTIVE_POLICY.propertyReductionRate;
  }

  if (input.filingType === "late") {
    reduced *= WORK_CHILD_INCENTIVE_POLICY.lateFilingRate;
  }

  return clampAmount(reduced);
}

function getReductionReasons(input: WorkChildIncentiveInput): string[] {
  const reasons: string[] = [];

  if (
    input.propertyAmount >= WORK_CHILD_INCENTIVE_POLICY.propertyReductionThreshold &&
    input.propertyAmount < WORK_CHILD_INCENTIVE_POLICY.propertyLimit
  ) {
    reasons.push("재산 1.7억원 이상 2.4억원 미만: 산정액 50% 반영");
  }

  if (input.filingType === "late") {
    reasons.push("기한 후 신청: 예상 산정액의 95% 반영");
  }

  if (input.hasTaxArrears === "yes") {
    reasons.push("체납액이 있으면 지급액 일부가 충당될 수 있음");
  }

  if (input.hasChildTaxCredit === "yes") {
    reasons.push("자녀세액공제와 중복되는 경우 자녀장려금에서 차감될 수 있음");
  }

  if (input.filingType === "halfYear") {
    reasons.push("반기 신청은 안내용으로 표시하며 정산 시점에 달라질 수 있음");
  }

  return reasons;
}

function estimateWorkBase(input: WorkChildIncentiveInput): number {
  const policy = WORK_CHILD_INCENTIVE_POLICY;
  const max = policy.workMaximumAmounts[input.householdType];
  const limit = policy.workIncomeLimits[input.householdType];
  const salaryBasis = Math.min(Math.max(input.totalSalary, input.totalIncome * 0.75), limit);
  const ratio = Math.max(0, 1 - salaryBasis / limit);

  // 국세청 지급가능액 그래프의 세부 산정표는 실제 심사에서 확정됩니다.
  // 1차 MVP는 최대지급액과 소득 기준을 이용해 완만히 체감하는 예상 산정액으로 표시합니다.
  return clampAmount(max * (0.35 + ratio * 0.65));
}

function estimateChildBase(input: WorkChildIncentiveInput): number {
  const policy = WORK_CHILD_INCENTIVE_POLICY;
  const maxTotal = policy.childMaximumPerChild * input.childCount;
  const minTotal = policy.childMinimumPerChild * input.childCount;
  const ratio = Math.max(0, 1 - input.totalIncome / policy.childIncomeLimit);

  return clampAmount(minTotal + (maxTotal - minTotal) * ratio);
}

function notRequested(): IncentiveEligibility {
  return {
    requested: false,
    eligible: false,
    status: "notRequested",
    reason: "선택한 신청 유형에 포함되지 않았습니다.",
    incomeLimit: null,
    estimatedBeforeReduction: 0,
    estimatedAfterReduction: 0,
    estimatedRange: { min: 0, max: 0 },
    notes: [],
  };
}

function buildWorkEligibility(input: WorkChildIncentiveInput): IncentiveEligibility {
  const requested = input.applicationType === "work" || input.applicationType === "both";

  if (!requested) {
    return notRequested();
  }

  const policy = WORK_CHILD_INCENTIVE_POLICY;
  const incomeLimit = policy.workIncomeLimits[input.householdType];
  const notes: string[] = [];

  if (input.totalIncome >= incomeLimit) {
    return {
      requested,
      eligible: false,
      status: "excluded",
      reason: "근로장려금 총소득 기준을 초과했습니다.",
      incomeLimit,
      estimatedBeforeReduction: 0,
      estimatedAfterReduction: 0,
      estimatedRange: { min: 0, max: 0 },
      notes,
    };
  }

  if (input.propertyAmount >= policy.propertyLimit) {
    return {
      requested,
      eligible: false,
      status: "excluded",
      reason: "재산 기준을 초과했습니다.",
      incomeLimit,
      estimatedBeforeReduction: 0,
      estimatedAfterReduction: 0,
      estimatedRange: { min: 0, max: 0 },
      notes,
    };
  }

  const base = estimateWorkBase(input);
  const reduced = applyCommonReductions(base, input);

  return {
    requested,
    eligible: true,
    status: "eligible",
    reason: "입력값 기준으로 근로장려금 신청 가능성을 검토할 수 있습니다.",
    incomeLimit,
    estimatedBeforeReduction: base,
    estimatedAfterReduction: reduced,
    estimatedRange: {
      min: clampAmount(reduced * 0.9),
      max: clampAmount(reduced * 1.1),
    },
    notes,
  };
}

function buildChildEligibility(input: WorkChildIncentiveInput): IncentiveEligibility {
  const requested = input.applicationType === "child" || input.applicationType === "both";

  if (!requested) {
    return notRequested();
  }

  const policy = WORK_CHILD_INCENTIVE_POLICY;
  const notes: string[] = [];

  if (input.householdType === "single") {
    return {
      requested,
      eligible: false,
      status: "excluded",
      reason: "단독가구는 자녀장려금 예상 계산 대상에서 제외됩니다.",
      incomeLimit: policy.childIncomeLimit,
      estimatedBeforeReduction: 0,
      estimatedAfterReduction: 0,
      estimatedRange: { min: 0, max: 0 },
      notes,
    };
  }

  if (input.childCount === 0) {
    return {
      requested,
      eligible: false,
      status: "excluded",
      reason: "부양자녀 수가 0명이면 자녀장려금 예상액을 계산하지 않습니다.",
      incomeLimit: policy.childIncomeLimit,
      estimatedBeforeReduction: 0,
      estimatedAfterReduction: 0,
      estimatedRange: { min: 0, max: 0 },
      notes,
    };
  }

  if (!input.childAgeEligible) {
    return {
      requested,
      eligible: false,
      status: "excluded",
      reason: "부양자녀 18세 미만 기준 확인이 필요합니다.",
      incomeLimit: policy.childIncomeLimit,
      estimatedBeforeReduction: 0,
      estimatedAfterReduction: 0,
      estimatedRange: { min: 0, max: 0 },
      notes,
    };
  }

  if (input.totalIncome >= policy.childIncomeLimit) {
    return {
      requested,
      eligible: false,
      status: "excluded",
      reason: "자녀장려금 총소득 기준을 초과했습니다.",
      incomeLimit: policy.childIncomeLimit,
      estimatedBeforeReduction: 0,
      estimatedAfterReduction: 0,
      estimatedRange: { min: 0, max: 0 },
      notes,
    };
  }

  if (input.propertyAmount >= policy.propertyLimit) {
    return {
      requested,
      eligible: false,
      status: "excluded",
      reason: "재산 기준을 초과했습니다.",
      incomeLimit: policy.childIncomeLimit,
      estimatedBeforeReduction: 0,
      estimatedAfterReduction: 0,
      estimatedRange: { min: 0, max: 0 },
      notes,
    };
  }

  if (input.hasChildTaxCredit === "yes") {
    notes.push("자녀세액공제 중복분은 실제 심사에서 차감될 수 있습니다.");
  }

  const base = estimateChildBase(input);
  const reduced = applyCommonReductions(base, input);

  return {
    requested,
    eligible: true,
    status: "eligible",
    reason: "입력값 기준으로 자녀장려금 신청 가능성을 검토할 수 있습니다.",
    incomeLimit: policy.childIncomeLimit,
    estimatedBeforeReduction: base,
    estimatedAfterReduction: reduced,
    estimatedRange: {
      min: clampAmount(reduced * 0.9),
      max: clampAmount(reduced * 1.1),
    },
    notes,
  };
}

export function calculateWorkChildIncentive(
  input: WorkChildIncentiveInput,
): WorkChildIncentiveResponse {
  const errors = validateWorkChildIncentiveInput(input);

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const work = buildWorkEligibility(input);
  const child = buildChildEligibility(input);
  const property = getPropertyStatus(input.propertyAmount);
  const totalEstimatedAmount = clampAmount(
    work.estimatedAfterReduction + child.estimatedAfterReduction,
  );
  const reductionReasons = getReductionReasons(input);

  return {
    success: true,
    data: {
      input,
      work,
      child,
      propertyStatus: property.status,
      propertyMessage: property.message,
      reductionRate: property.rate,
      reductionReasons,
      totalEstimatedAmount,
      interpretation:
        totalEstimatedAmount > 0
          ? "입력값 기준 예상액입니다. 실제 지급 여부와 금액은 국세청 심사 결과에 따라 달라질 수 있습니다."
          : "입력값 기준으로는 예상 지급액이 산출되지 않았습니다. 신청 안내문 수령 여부와 실제 신청 가능 여부는 다를 수 있습니다.",
      policyVerifiedAt: WORK_CHILD_INCENTIVE_POLICY.verifiedAt,
    },
  };
}
