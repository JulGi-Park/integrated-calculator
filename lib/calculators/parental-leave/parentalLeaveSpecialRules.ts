import {
  PARENTAL_LEAVE_POLICY_2026,
  PARENTAL_LEAVE_SPECIAL_SOURCE_NAMES,
  PARENTS_TOGETHER_SIX_PLUS_SIX_POLICY_2026,
  SINGLE_PARENT_POLICY_2026,
} from "./parentalLeavePolicy";
import {
  calculateParentalLeaveBenefit,
  validateParentalLeaveInput,
} from "./parentalLeave";
import type {
  ParentalLeaveMonthlyBenefit,
  ParentalLeavePolicyName,
  ParentalLeaveSpecialCalculationInput,
  ParentalLeaveSpecialCalculationResponse,
  ParentalLeaveSpecialMissingInput,
  ParentalLeaveSpecialPolicyName,
  ParentalLeaveSpecialReason,
  ParentalLeaveSpecialPolicyResult,
} from "./parentalLeaveTypes";

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

function toNumber(value: unknown): number {
  if (typeof value === "string") {
    return Number(value.replaceAll(",", "").trim());
  }

  return Number(value);
}

function getSelectedPolicies(
  input: ParentalLeaveSpecialCalculationInput,
): ParentalLeaveSpecialPolicyName[] {
  if (input.selectedSpecialPolicies) {
    return input.selectedSpecialPolicies;
  }

  return input.specialPolicy ? [input.specialPolicy] : [];
}

function applyBand(
  month: number,
  monthlyOrdinaryWage: number,
  rate: number,
  upperLimit: number,
  label: string,
  appliedPolicy: ParentalLeavePolicyName,
): ParentalLeaveMonthlyBenefit {
  const baseAmount = Math.floor(monthlyOrdinaryWage * rate);
  const estimatedAmount = Math.min(
    Math.max(baseAmount, PARENTAL_LEAVE_POLICY_2026.lowerLimit),
    upperLimit,
  );

  return {
    month,
    rate,
    baseAmount,
    lowerLimit: PARENTAL_LEAVE_POLICY_2026.lowerLimit,
    upperLimit,
    estimatedAmount,
    capApplied: baseAmount > upperLimit,
    floorApplied: baseAmount < PARENTAL_LEAVE_POLICY_2026.lowerLimit,
    bandLabel: label,
    appliedPolicy,
  };
}

function getGeneralMonthlyBenefit(month: number, monthlyOrdinaryWage: number) {
  const response = calculateParentalLeaveBenefit({
    monthlyOrdinaryWage,
    leaveMonths: month,
  });

  if (!response.success) {
    throw new Error("검증된 입력으로 일반 육아휴직급여 계산에 실패했습니다.");
  }

  return response.data.monthlyBenefits[month - 1];
}

function getFallbackGeneralResult(
  input: ParentalLeaveSpecialCalculationInput,
): Pick<ParentalLeaveSpecialPolicyResult, "monthlyResults" | "totalEstimatedAmount"> {
  const fallback = calculateParentalLeaveBenefit(input);

  if (!fallback.success) {
    throw new Error("검증된 입력으로 일반 육아휴직급여 fallback 계산에 실패했습니다.");
  }

  return {
    monthlyResults: fallback.data.monthlyBenefits,
    totalEstimatedAmount: fallback.data.totalEstimatedAmount,
  };
}

function buildSpecialResult(params: {
  requestedPolicy: ParentalLeaveSpecialPolicyResult["requestedPolicy"];
  appliedPolicy: ParentalLeavePolicyName;
  isApplicable: boolean;
  fallbackPolicy: ParentalLeavePolicyName | null;
  reasons: ParentalLeaveSpecialReason[];
  missingInputs: ParentalLeaveSpecialMissingInput[];
  warnings: string[];
  monthlyResults: ParentalLeaveMonthlyBenefit[];
  totalEstimatedAmount: number;
}): ParentalLeaveSpecialPolicyResult {
  return {
    ...params,
    sourceNames: [...PARENTAL_LEAVE_SPECIAL_SOURCE_NAMES],
    policyDate: PARENTAL_LEAVE_POLICY_2026.basisDate,
    disclaimer:
      "확정 지급액이 아닌 참고용 예상값입니다. 특례 적용 여부와 실제 지급액은 고용보험 가입 기간, 신청 요건, 고용센터 심사 결과에 따라 달라질 수 있습니다.",
  };
}

function buildFallbackResult(
  input: ParentalLeaveSpecialCalculationInput,
  requestedPolicy: ParentalLeaveSpecialPolicyResult["requestedPolicy"],
  reasons: ParentalLeaveSpecialReason[],
  missingInputs: ParentalLeaveSpecialMissingInput[],
  warnings: string[],
) {
  const fallback = getFallbackGeneralResult(input);

  return buildSpecialResult({
    requestedPolicy,
    appliedPolicy: "general",
    isApplicable: false,
    fallbackPolicy: "general",
    reasons,
    missingInputs,
    warnings,
    ...fallback,
  });
}

function getIntegerInputReason(
  value: unknown,
  missingInput: ParentalLeaveSpecialMissingInput,
  invalidReason: ParentalLeaveSpecialReason = "unknownEligibility",
) {
  if (isBlank(value)) {
    return {
      missingInputs: [missingInput],
      reasons: ["insufficientInputs"] as ParentalLeaveSpecialReason[],
      value: null,
    };
  }

  const numericValue = toNumber(value);

  if (!Number.isInteger(numericValue) || numericValue < 0) {
    return {
      missingInputs: [] as ParentalLeaveSpecialMissingInput[],
      reasons: [invalidReason],
      value: null,
    };
  }

  return {
    missingInputs: [] as ParentalLeaveSpecialMissingInput[],
    reasons: [] as ParentalLeaveSpecialReason[],
    value: numericValue,
  };
}

function calculateParentsTogetherSixPlusSix(
  input: ParentalLeaveSpecialCalculationInput,
) {
  const missingInputs: ParentalLeaveSpecialMissingInput[] = [];
  const reasons: ParentalLeaveSpecialReason[] = [];
  const childAge = getIntegerInputReason(input.childAgeMonths, "childAgeMonths");
  const partnerMonths = getIntegerInputReason(
    input.partnerLeaveMonths,
    "partnerLeaveMonths",
  );

  missingInputs.push(...childAge.missingInputs, ...partnerMonths.missingInputs);
  reasons.push(...childAge.reasons, ...partnerMonths.reasons);

  if (input.partnerUsedParentalLeave === undefined || input.partnerUsedParentalLeave === "unknown") {
    missingInputs.push("partnerUsedParentalLeave");
    reasons.push("insufficientInputs");
  } else if (!input.partnerUsedParentalLeave) {
    reasons.push("partnerLeaveNotUsed");
  }

  if (input.sameChild === undefined || input.sameChild === "unknown") {
    missingInputs.push("sameChild");
    reasons.push("insufficientInputs");
  } else if (!input.sameChild) {
    reasons.push("notSameChild");
  }

  if (
    childAge.value !== null &&
    childAge.value > PARENTS_TOGETHER_SIX_PLUS_SIX_POLICY_2026.childAgeMonthLimit
  ) {
    reasons.push("childAgeMonthsOver18");
  }

  if (partnerMonths.value !== null && (partnerMonths.value < 1 || partnerMonths.value > 6)) {
    reasons.push("leaveMonthOutOfSpecialRange");
  }

  if (missingInputs.length > 0 || reasons.length > 0) {
    return buildFallbackResult(
      input,
      "parentsTogetherSixPlusSix",
      [...new Set(reasons)],
      [...new Set(missingInputs)],
      ["6+6 특례 판단 입력이 부족하거나 조건을 충족하지 않아 일반 계산만 참고값으로 제공합니다."],
    );
  }

  const monthlyOrdinaryWage = toNumber(input.monthlyOrdinaryWage);
  const leaveMonths = toNumber(input.leaveMonths);
  const commonSpecialMonths = Math.min(
    leaveMonths,
    partnerMonths.value ?? 0,
    PARENTS_TOGETHER_SIX_PLUS_SIX_POLICY_2026.maxSpecialMonths,
  );
  const monthlyResults = Array.from({ length: leaveMonths }, (_, index) => {
    const month = index + 1;

    if (month <= commonSpecialMonths) {
      const upperLimit =
        PARENTS_TOGETHER_SIX_PLUS_SIX_POLICY_2026.monthlyUpperLimits[month - 1];

      return applyBand(
        month,
        monthlyOrdinaryWage,
        1,
        upperLimit,
        `${month}개월차 6+6 특례: 통상임금 100%, 상한 ${upperLimit.toLocaleString("ko-KR")}원`,
        "parentsTogetherSixPlusSix",
      );
    }

    return getGeneralMonthlyBenefit(month, monthlyOrdinaryWage);
  });
  const totalEstimatedAmount = monthlyResults.reduce(
    (sum, item) => sum + item.estimatedAmount,
    0,
  );

  return buildSpecialResult({
    requestedPolicy: "parentsTogetherSixPlusSix",
    appliedPolicy: "parentsTogetherSixPlusSix",
    isApplicable: true,
    fallbackPolicy: commonSpecialMonths < leaveMonths ? "general" : null,
    reasons: [],
    missingInputs: [],
    warnings:
      commonSpecialMonths < leaveMonths
        ? ["공통으로 사용한 기간 이후의 월은 일반 육아휴직급여 기준으로 계산했습니다."]
        : [],
    monthlyResults,
    totalEstimatedAmount,
  });
}

function calculateSingleParent(input: ParentalLeaveSpecialCalculationInput) {
  if (input.isSingleParent === undefined || input.isSingleParent === "unknown") {
    return buildFallbackResult(
      input,
      "singleParent",
      ["insufficientInputs", "missingSingleParentStatus"],
      ["isSingleParent"],
      ["한부모 특례 여부가 명확하지 않아 일반 계산만 참고값으로 제공합니다."],
    );
  }

  if (!input.isSingleParent) {
    return buildFallbackResult(
      input,
      "singleParent",
      ["notSingleParent"],
      [],
      ["한부모 특례 대상이 아니므로 일반 육아휴직급여 기준으로 계산했습니다."],
    );
  }

  const monthlyOrdinaryWage = toNumber(input.monthlyOrdinaryWage);
  const leaveMonths = toNumber(input.leaveMonths);
  const monthlyResults = Array.from({ length: leaveMonths }, (_, index) => {
    const month = index + 1;

    if (month <= 3) {
      return applyBand(
        month,
        monthlyOrdinaryWage,
        1,
        SINGLE_PARENT_POLICY_2026.firstThreeMonthsUpperLimit,
        "한부모 특례 1~3개월: 통상임금 100%, 상한 300만원",
        "singleParent",
      );
    }

    return getGeneralMonthlyBenefit(month, monthlyOrdinaryWage);
  });
  const totalEstimatedAmount = monthlyResults.reduce(
    (sum, item) => sum + item.estimatedAmount,
    0,
  );

  return buildSpecialResult({
    requestedPolicy: "singleParent",
    appliedPolicy: "singleParent",
    isApplicable: true,
    fallbackPolicy: leaveMonths > 3 ? "general" : null,
    reasons: [],
    missingInputs: [],
    warnings:
      leaveMonths > 3
        ? ["4개월차 이후는 일반 육아휴직급여 기준으로 계산했습니다."]
        : [],
    monthlyResults,
    totalEstimatedAmount,
  });
}

export function calculateParentalLeaveWithSpecialPolicy(
  input: ParentalLeaveSpecialCalculationInput,
): ParentalLeaveSpecialCalculationResponse {
  const errors = validateParentalLeaveInput(input);

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const selectedPolicies = getSelectedPolicies(input);

  if (selectedPolicies.length === 0) {
    const fallback = getFallbackGeneralResult(input);

    return {
      success: true,
      data: buildSpecialResult({
        requestedPolicy: "none",
        appliedPolicy: "general",
        isApplicable: true,
        fallbackPolicy: null,
        reasons: [],
        missingInputs: [],
        warnings: [],
        ...fallback,
      }),
    };
  }

  if (selectedPolicies.length > 1) {
    const fallback = getFallbackGeneralResult(input);

    return {
      success: true,
      data: buildSpecialResult({
        requestedPolicy: "multiple",
        appliedPolicy: "general",
        isApplicable: false,
        fallbackPolicy: "general",
        reasons: ["multipleSpecialPoliciesSelected", "centerReviewRequired"],
        missingInputs: [],
        warnings: [
          "특례가 중복될 수 있는 경우에는 고용센터 확인이 필요합니다. 임의로 더 유리한 특례를 자동 적용하지 않았습니다.",
        ],
        ...fallback,
      }),
    };
  }

  const result =
    selectedPolicies[0] === "parentsTogetherSixPlusSix"
      ? calculateParentsTogetherSixPlusSix(input)
      : calculateSingleParent(input);

  return { success: true, data: result };
}
