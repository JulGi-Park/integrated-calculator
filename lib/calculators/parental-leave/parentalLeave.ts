export type ParentalLeaveInputField = "monthlyOrdinaryWage" | "leaveMonths";

export type ParentalLeaveValidationCode =
  | "REQUIRED"
  | "INVALID_NUMBER"
  | "MUST_BE_INTEGER"
  | "MUST_BE_POSITIVE"
  | "MONTHS_UNDER_MINIMUM"
  | "MONTHS_EXCEEDS_LIMIT";

export interface ParentalLeaveValidationError {
  field: ParentalLeaveInputField;
  code: ParentalLeaveValidationCode;
  message: string;
}

export interface ParentalLeaveInput {
  monthlyOrdinaryWage: unknown;
  leaveMonths: unknown;
}

export interface ParentalLeaveMonthlyBenefit {
  month: number;
  rate: number;
  baseAmount: number;
  lowerLimit: number;
  upperLimit: number;
  estimatedAmount: number;
  capApplied: boolean;
  floorApplied: boolean;
  bandLabel: string;
}

export interface ParentalLeaveResult {
  monthlyOrdinaryWage: number;
  leaveMonths: number;
  totalEstimatedAmount: number;
  basisDate: string;
  monthlyBenefits: ParentalLeaveMonthlyBenefit[];
  interpretation: string;
  disclaimer: string;
}

export type ParentalLeaveCalculationResponse =
  | { success: true; data: ParentalLeaveResult }
  | { success: false; errors: ParentalLeaveValidationError[] };

export const PARENTAL_LEAVE_POLICY_2026 = {
  basisDate: "2026-07-01",
  maxLeaveMonths: 12,
  lowerLimit: 700_000,
  bands: [
    {
      fromMonth: 1,
      toMonth: 3,
      rate: 1,
      upperLimit: 2_500_000,
      label: "1~3개월: 통상임금 100%, 상한 250만원",
    },
    {
      fromMonth: 4,
      toMonth: 6,
      rate: 1,
      upperLimit: 2_000_000,
      label: "4~6개월: 통상임금 100%, 상한 200만원",
    },
    {
      fromMonth: 7,
      toMonth: 12,
      rate: 0.8,
      upperLimit: 1_600_000,
      label: "7~12개월: 통상임금 80%, 상한 160만원",
    },
  ],
  sourceNote:
    "고용24 육아휴직급여 안내와 고용보험법 시행령 제95조의 일반 육아휴직급여 구간을 기준으로 한 참고용 예상 계산입니다.",
} as const;

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
