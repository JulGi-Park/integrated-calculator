import { PARENTAL_LEAVE_POLICY_2026 } from "./parentalLeavePolicy";
import type {
  ParentalLeaveCalculationResponse,
  ParentalLeaveInput,
  ParentalLeaveInputField,
  ParentalLeaveValidationCode,
  ParentalLeaveValidationError,
} from "./parentalLeaveTypes";

export { PARENTAL_LEAVE_POLICY_2026 } from "./parentalLeavePolicy";
export type {
  ParentalLeaveCalculationResponse,
  ParentalLeaveInput,
  ParentalLeaveInputField,
  ParentalLeaveMonthlyBenefit,
  ParentalLeaveResult,
  ParentalLeaveValidationCode,
  ParentalLeaveValidationError,
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

function buildError(
  field: ParentalLeaveInputField,
  code: ParentalLeaveValidationCode,
  message: string,
): ParentalLeaveValidationError {
  return { field, code, message };
}

export function validateParentalLeaveInput(
  input: ParentalLeaveInput,
): ParentalLeaveValidationError[] {
  const errors: ParentalLeaveValidationError[] = [];

  if (isBlank(input.monthlyOrdinaryWage)) {
    errors.push(
      buildError(
        "monthlyOrdinaryWage",
        "REQUIRED",
        "월 통상임금을 입력해 주세요.",
      ),
    );
  } else {
    const wage = toNumber(input.monthlyOrdinaryWage);

    if (!Number.isFinite(wage)) {
      errors.push(
        buildError(
          "monthlyOrdinaryWage",
          "INVALID_NUMBER",
          "월 통상임금은 숫자로 입력해 주세요.",
        ),
      );
    } else if (!Number.isInteger(wage)) {
      errors.push(
        buildError(
          "monthlyOrdinaryWage",
          "MUST_BE_INTEGER",
          "월 통상임금은 원 단위 정수로 입력해 주세요.",
        ),
      );
    } else if (wage <= 0) {
      errors.push(
        buildError(
          "monthlyOrdinaryWage",
          "MUST_BE_POSITIVE",
          "월 통상임금은 1원 이상이어야 합니다.",
        ),
      );
    }
  }

  if (isBlank(input.leaveMonths)) {
    errors.push(
      buildError("leaveMonths", "REQUIRED", "육아휴직 사용 개월 수를 입력해 주세요."),
    );
  } else {
    const months = toNumber(input.leaveMonths);

    if (!Number.isFinite(months)) {
      errors.push(
        buildError(
          "leaveMonths",
          "INVALID_NUMBER",
          "사용 개월 수는 숫자로 입력해 주세요.",
        ),
      );
    } else if (!Number.isInteger(months)) {
      errors.push(
        buildError(
          "leaveMonths",
          "MUST_BE_INTEGER",
          "이번 계산기는 1개월 단위로만 계산합니다.",
        ),
      );
    } else if (months <= 0) {
      errors.push(
        buildError(
          "leaveMonths",
          "MONTHS_UNDER_MINIMUM",
          "사용 개월 수는 1개월 이상이어야 합니다.",
        ),
      );
    } else if (months > PARENTAL_LEAVE_POLICY_2026.maxLeaveMonths) {
      errors.push(
        buildError(
          "leaveMonths",
          "MONTHS_EXCEEDS_LIMIT",
          "이번 계산기는 12개월까지 계산할 수 있습니다.",
        ),
      );
    }
  }

  return errors;
}

function getBand(month: number) {
  const band = PARENTAL_LEAVE_POLICY_2026.bands.find(
    (item) => month >= item.fromMonth && month <= item.toMonth,
  );

  if (!band) {
    throw new Error(`지원하지 않는 육아휴직 개월입니다: ${month}`);
  }

  return band;
}

export function calculateParentalLeaveBenefit(
  input: ParentalLeaveInput,
): ParentalLeaveCalculationResponse {
  const errors = validateParentalLeaveInput(input);

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const monthlyOrdinaryWage = toNumber(input.monthlyOrdinaryWage);
  const leaveMonths = toNumber(input.leaveMonths);

  const monthlyBenefits = Array.from({ length: leaveMonths }, (_, index) => {
    const month = index + 1;
    const band = getBand(month);
    const baseAmount = Math.floor(monthlyOrdinaryWage * band.rate);
    const estimatedAmount = Math.min(
      Math.max(baseAmount, PARENTAL_LEAVE_POLICY_2026.lowerLimit),
      band.upperLimit,
    );

    return {
      month,
      rate: band.rate,
      baseAmount,
      lowerLimit: PARENTAL_LEAVE_POLICY_2026.lowerLimit,
      upperLimit: band.upperLimit,
      estimatedAmount,
      capApplied: baseAmount > band.upperLimit,
      floorApplied: baseAmount < PARENTAL_LEAVE_POLICY_2026.lowerLimit,
      bandLabel: band.label,
      appliedPolicy: band.policyName,
    };
  });

  const totalEstimatedAmount = monthlyBenefits.reduce(
    (sum, item) => sum + item.estimatedAmount,
    0,
  );

  return {
    success: true,
    data: {
      monthlyOrdinaryWage,
      leaveMonths,
      totalEstimatedAmount,
      basisDate: PARENTAL_LEAVE_POLICY_2026.basisDate,
      monthlyBenefits,
      interpretation:
        "일반 육아휴직급여의 월별 지급률, 상한액, 하한액을 적용한 예상 금액입니다.",
      disclaimer:
        "확정 지급액이 아닌 예상값이며 실제 지급 여부와 금액은 고용보험 가입 기간, 신청 요건, 고용센터 심사 결과에 따라 달라질 수 있습니다.",
    },
  };
}
