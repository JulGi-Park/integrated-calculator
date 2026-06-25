import { UNEMPLOYMENT_POLICY_2026 } from "./policy";
import type {
  UnemploymentAgeGroup,
  UnemploymentCalculationResponse,
  UnemploymentEligibilityStatus,
  UnemploymentInput,
  UnemploymentInputField,
  UnemploymentLeavingReason,
  UnemploymentValidationError,
  UnemploymentValidationErrorCode,
  UnemploymentWageInputType,
} from "./types";

const wageInputTypes = new Set<UnemploymentWageInputType>([
  "monthlyWage",
  "averageDailyWage",
]);
const ageGroups = new Set<UnemploymentAgeGroup>([
  "under50",
  "over50OrDisabled",
]);
const leavingReasons = new Set<UnemploymentLeavingReason>([
  "involuntary",
  "contractExpired",
  "recommendedResignation",
  "voluntary",
  "voluntaryExceptionReview",
  "unclear",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isEmpty(value: unknown): boolean {
  return value === "" || value === undefined || value === null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function addError(
  errors: UnemploymentValidationError[],
  field: UnemploymentInputField,
  code: UnemploymentValidationErrorCode,
  message: string,
) {
  errors.push({ field, code, message });
}

function validateOption<T extends string>(
  errors: UnemploymentValidationError[],
  field: UnemploymentInputField,
  value: unknown,
  values: ReadonlySet<T>,
) {
  if (isEmpty(value)) {
    addError(errors, field, "REQUIRED", `${field} 값을 선택해 주세요.`);
    return;
  }

  if (typeof value !== "string" || !values.has(value as T)) {
    addError(errors, field, "INVALID_OPTION", `${field} 선택값이 올바르지 않습니다.`);
  }
}

function validateWageAmount(
  errors: UnemploymentValidationError[],
  input: Record<string, unknown>,
) {
  const wageInputType = input.wageInputType;
  const wageAmount = input.wageAmount;

  if (isEmpty(wageAmount)) {
    addError(errors, "wageAmount", "REQUIRED", "임금 금액을 입력해 주세요.");
    return;
  }

  if (!isFiniteNumber(wageAmount)) {
    addError(
      errors,
      "wageAmount",
      "INVALID_NUMBER",
      "임금 금액은 유한한 숫자여야 합니다.",
    );
    return;
  }

  if (!Number.isInteger(wageAmount)) {
    addError(
      errors,
      "wageAmount",
      "MUST_BE_INTEGER",
      "임금 금액은 원 단위 정수로 입력해 주세요.",
    );
  } else if (!Number.isSafeInteger(wageAmount)) {
    addError(
      errors,
      "wageAmount",
      "MUST_BE_SAFE_INTEGER",
      "임금 금액이 안전한 정수 범위를 벗어났습니다.",
    );
  }

  if (wageAmount <= 0) {
    addError(
      errors,
      "wageAmount",
      "MUST_BE_POSITIVE",
      "임금 금액은 0원보다 커야 합니다.",
    );
    return;
  }

  const policy = UNEMPLOYMENT_POLICY_2026;
  const isMonthly = wageInputType === "monthlyWage";
  const minimum = isMonthly
    ? policy.minimumMonthlyWage
    : policy.minimumAverageDailyWage;
  const maximum = isMonthly
    ? policy.maximumMonthlyWage
    : policy.maximumAverageDailyWage;

  if (wageAmount < minimum) {
    addError(
      errors,
      "wageAmount",
      "AMOUNT_BELOW_LIMIT",
      `임금 금액은 ${minimum.toLocaleString("ko-KR")}원 이상이어야 합니다.`,
    );
  }

  if (wageAmount > maximum) {
    addError(
      errors,
      "wageAmount",
      "AMOUNT_EXCEEDS_LIMIT",
      `임금 금액은 ${maximum.toLocaleString("ko-KR")}원 이하여야 합니다.`,
    );
  }
}

function validateInsuredMonths(
  errors: UnemploymentValidationError[],
  input: Record<string, unknown>,
) {
  const value = input.insuredMonths;
  const policy = UNEMPLOYMENT_POLICY_2026;

  if (isEmpty(value)) {
    addError(
      errors,
      "insuredMonths",
      "REQUIRED",
      "고용보험 가입기간을 입력해 주세요.",
    );
    return;
  }

  if (!isFiniteNumber(value)) {
    addError(
      errors,
      "insuredMonths",
      "INVALID_NUMBER",
      "고용보험 가입기간은 유한한 숫자여야 합니다.",
    );
    return;
  }

  if (!Number.isInteger(value)) {
    addError(
      errors,
      "insuredMonths",
      "MUST_BE_INTEGER",
      "고용보험 가입기간은 월 단위 정수로 입력해 주세요.",
    );
  } else if (!Number.isSafeInteger(value)) {
    addError(
      errors,
      "insuredMonths",
      "MUST_BE_SAFE_INTEGER",
      "고용보험 가입기간이 안전한 정수 범위를 벗어났습니다.",
    );
  }

  if (value <= 0) {
    addError(
      errors,
      "insuredMonths",
      "MUST_BE_POSITIVE",
      "고용보험 가입기간은 0개월보다 커야 합니다.",
    );
    return;
  }

  if (value < policy.minimumInsuredMonthsForEstimate) {
    addError(
      errors,
      "insuredMonths",
      "INSURED_MONTHS_UNDER_MINIMUM",
      "가입기간이 6개월 미만이면 피보험 단위기간 180일 충족 여부 확인이 먼저 필요합니다.",
    );
  }

  if (value > policy.maximumInsuredMonths) {
    addError(
      errors,
      "insuredMonths",
      "INSURED_MONTHS_EXCEEDS_LIMIT",
      `고용보험 가입기간은 ${policy.maximumInsuredMonths}개월 이하여야 합니다.`,
    );
  }
}

function hasValidInput(
  input: Record<string, unknown>,
): input is Record<string, unknown> & UnemploymentInput {
  return (
    wageInputTypes.has(input.wageInputType as UnemploymentWageInputType) &&
    isFiniteNumber(input.wageAmount) &&
    Number.isSafeInteger(input.wageAmount) &&
    isFiniteNumber(input.insuredMonths) &&
    Number.isSafeInteger(input.insuredMonths) &&
    ageGroups.has(input.ageGroup as UnemploymentAgeGroup) &&
    leavingReasons.has(input.leavingReason as UnemploymentLeavingReason)
  );
}

export function validateUnemploymentInput(
  input: unknown,
): UnemploymentValidationError[] {
  const errors: UnemploymentValidationError[] = [];

  if (!isRecord(input)) {
    return [
      "wageInputType",
      "wageAmount",
      "insuredMonths",
      "ageGroup",
      "leavingReason",
    ].map((field) => ({
      field: field as UnemploymentInputField,
      code: "REQUIRED",
      message: `${field} 값을 입력해 주세요.`,
    }));
  }

  validateOption(errors, "wageInputType", input.wageInputType, wageInputTypes);
  validateWageAmount(errors, input);
  validateInsuredMonths(errors, input);
  validateOption(errors, "ageGroup", input.ageGroup, ageGroups);
  validateOption(errors, "leavingReason", input.leavingReason, leavingReasons);

  return errors;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export function getPrescribedBenefitDays(
  insuredMonths: number,
  ageGroup: UnemploymentAgeGroup,
): number {
  const policy = UNEMPLOYMENT_POLICY_2026.prescribedBenefitDays;

  if (insuredMonths < 12) {
    return policy.underOneYear;
  }

  if (insuredMonths < 36) {
    return policy.underThreeYears[ageGroup];
  }

  if (insuredMonths < 60) {
    return policy.underFiveYears[ageGroup];
  }

  if (insuredMonths < 120) {
    return policy.underTenYears[ageGroup];
  }

  return policy.tenYearsOrMore[ageGroup];
}

function getEligibilityStatus(
  leavingReason: UnemploymentLeavingReason,
): UnemploymentEligibilityStatus {
  switch (leavingReason) {
    case "involuntary":
    case "contractExpired":
    case "recommendedResignation":
      return "possible";
    case "voluntary":
      return "restricted";
    case "voluntaryExceptionReview":
      return "reviewRequired";
    case "unclear":
      return "officialReviewRequired";
  }
}

export function getEligibilityMessage(
  leavingReason: UnemploymentLeavingReason,
): string {
  switch (leavingReason) {
    case "involuntary":
    case "contractExpired":
    case "recommendedResignation":
      return "수급 가능성 있음. 단, 피보험 단위기간, 이직확인서, 실업인정과 구직활동 요건 확인이 필요합니다.";
    case "voluntary":
      return "자발적 퇴사는 일반적으로 제한될 수 있습니다. 정당한 이직 사유 예외 여부 확인이 필요합니다.";
    case "voluntaryExceptionReview":
      return "질병, 임금체불, 통근 곤란 등 정당한 이직 사유에 대한 객관적 증빙 검토가 필요합니다.";
    case "unclear":
      return "퇴직 사유 판단이 어려운 경우 고용센터 또는 고용보험 공식 절차에서 확인해야 합니다.";
  }
}

export function calculateUnemploymentBenefit(
  input: unknown,
): UnemploymentCalculationResponse {
  const errors = validateUnemploymentInput(input);

  if (errors.length > 0 || !isRecord(input) || !hasValidInput(input)) {
    return { success: false, errors };
  }

  const policy = UNEMPLOYMENT_POLICY_2026;
  const estimatedAverageDailyWage =
    input.wageInputType === "monthlyWage"
      ? Math.round(input.wageAmount / policy.monthlyWageDivisor)
      : input.wageAmount;
  const baseDailyBenefit = Math.round(
    (estimatedAverageDailyWage * policy.benefitRateNumerator) /
      policy.benefitRateDenominator,
  );
  const dailyBenefitAmount = clamp(
    baseDailyBenefit,
    policy.dailyBenefitLowerLimit,
    policy.dailyBenefitUpperLimit,
  );
  const prescribedBenefitDays = getPrescribedBenefitDays(
    input.insuredMonths,
    input.ageGroup,
  );

  return {
    success: true,
    data: {
      policyVersion: policy.policyVersion,
      basisDate: policy.basisDate,
      sourceNote: policy.sourceNote,
      needsOfficialVerification: policy.needsOfficialVerification,
      wageInputType: input.wageInputType,
      wageAmount: input.wageAmount,
      estimatedAverageDailyWage,
      baseDailyBenefit,
      dailyBenefitUpperLimit: policy.dailyBenefitUpperLimit,
      dailyBenefitLowerLimit: policy.dailyBenefitLowerLimit,
      dailyBenefitAmount,
      isUpperLimitApplied: baseDailyBenefit > policy.dailyBenefitUpperLimit,
      isLowerLimitApplied: baseDailyBenefit < policy.dailyBenefitLowerLimit,
      insuredMonths: input.insuredMonths,
      prescribedBenefitDays,
      estimatedTotalBenefit: dailyBenefitAmount * prescribedBenefitDays,
      ageGroup: input.ageGroup,
      leavingReason: input.leavingReason,
      eligibilityStatus: getEligibilityStatus(input.leavingReason),
      eligibilityMessage: getEligibilityMessage(input.leavingReason),
      procedureGuide: [
        "사업주의 이직확인서 처리 여부와 이직 사유가 실제 판단에 영향을 줍니다.",
        "워크넷 구직신청, 수급자격 신청자 교육, 고용센터 방문 또는 온라인 신청 절차를 확인하세요.",
        "실업인정일마다 재취업 활동과 구직활동 내역을 제출해야 실제 지급이 이어질 수 있습니다.",
      ],
      disclaimer:
        "이 결과는 입력값과 정책 상수에 따른 예상 계산입니다. 실제 지급 여부와 금액은 고용센터 판단, 고용보험 가입 이력, 이직확인서와 공식 기준에 따라 달라질 수 있습니다.",
    },
  };
}
