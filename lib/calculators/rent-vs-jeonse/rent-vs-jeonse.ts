export const RENT_VS_JEONSE_LEGAL_REFERENCE = {
  baseRate: 2.5,
  legalAdditionalRate: 2,
  maxLegalRate: 10,
  referenceDate: "2026-07-12",
  notice:
    "2026-07-12 기준 참고값이며, 한국은행 기준금리 변동 시 직접 수정해 계산해야 합니다.",
  sources: [
    "주택임대차보호법 제7조의2",
    "주택임대차보호법 시행령 제9조",
    "한국은행 기준금리 추이",
    "한국부동산원·LH 임대차분쟁조정위원회 전월세전환 계산기",
  ],
} as const;

export type RentVsJeonseInputField =
  | "jeonseDeposit"
  | "jeonseLoanAmount"
  | "jeonseLoanRate"
  | "jeonseExtraMonthlyCost"
  | "monthlyRentDeposit"
  | "monthlyRent"
  | "monthlyMaintenanceFee"
  | "opportunityRate"
  | "residenceMonths"
  | "conversionRate"
  | "baseRate"
  | "legalAdditionalRate"
  | "maxLegalRate";

export type RentVsJeonseValidationErrorCode =
  | "REQUIRED"
  | "INVALID_NUMBER"
  | "MUST_BE_INTEGER"
  | "MUST_BE_NON_NEGATIVE"
  | "MUST_BE_POSITIVE"
  | "LOAN_EXCEEDS_DEPOSIT"
  | "OUT_OF_RANGE";

export const RENT_VS_JEONSE_SERVICE_LIMITS = {
  maxMoney: 10_000_000_000,
  maxRate: 100,
  maxResidenceMonths: 600,
} as const;

export type CheaperHousingOption = "jeonse" | "monthlyRent" | "same";

export interface RentVsJeonseInput {
  jeonseDeposit: number;
  jeonseLoanAmount: number;
  jeonseLoanRate: number;
  jeonseExtraMonthlyCost: number;
  monthlyRentDeposit: number;
  monthlyRent: number;
  monthlyMaintenanceFee: number;
  opportunityRate: number;
  residenceMonths: number;
  conversionRate: number;
  baseRate: number;
  legalAdditionalRate: number;
  maxLegalRate: number;
}

export interface RentVsJeonseValidationError {
  field: RentVsJeonseInputField;
  code: RentVsJeonseValidationErrorCode;
  message: string;
}

export interface RentVsJeonseResult {
  jeonseMonthlyInterestCost: number;
  jeonseEquity: number;
  jeonseEquityMonthlyOpportunityCost: number;
  jeonseExtraMonthlyCost: number;
  jeonseMonthlyBurden: number;
  jeonseTotalCost: number;
  monthlyRentDepositMonthlyOpportunityCost: number;
  monthlyRentBurden: number;
  monthlyRentTotalCost: number;
  monthlyBurdenDifference: number;
  totalCostDifference: number;
  cheaperOption: CheaperHousingOption;
  legalReferenceRate: number;
  depositDifference: number;
  depositDifferenceMonthlyRentEquivalent: number;
  referenceNotice: string;
  disclaimer: string;
}

export type RentVsJeonseCalculationResponse =
  | { success: true; data: RentVsJeonseResult }
  | { success: false; errors: RentVsJeonseValidationError[] };

const inputFields: RentVsJeonseInputField[] = [
  "jeonseDeposit",
  "jeonseLoanAmount",
  "jeonseLoanRate",
  "jeonseExtraMonthlyCost",
  "monthlyRentDeposit",
  "monthlyRent",
  "monthlyMaintenanceFee",
  "opportunityRate",
  "residenceMonths",
  "conversionRate",
  "baseRate",
  "legalAdditionalRate",
  "maxLegalRate",
];

const fieldMessages: Record<RentVsJeonseInputField, string> = {
  jeonseDeposit: "전세보증금은 0원 이상이어야 합니다.",
  jeonseLoanAmount: "전세대출금은 0원 이상이어야 합니다.",
  jeonseLoanRate: "전세대출금리는 0% 이상이어야 합니다.",
  jeonseExtraMonthlyCost: "전세 기타 월비용은 0원 이상이어야 합니다.",
  monthlyRentDeposit: "월세 보증금은 0원 이상이어야 합니다.",
  monthlyRent: "월세는 0원 이상이어야 합니다.",
  monthlyMaintenanceFee: "관리비는 0원 이상이어야 합니다.",
  opportunityRate: "기회비용 금리는 0% 이상이어야 합니다.",
  residenceMonths: "거주 예정 개월 수는 1개월 이상이어야 합니다.",
  conversionRate: "전월세전환율은 0% 이상이어야 합니다.",
  baseRate: "기준금리는 0% 이상이어야 합니다.",
  legalAdditionalRate: "시행령상 가산 이율은 0% 이상이어야 합니다.",
  maxLegalRate: "법정 상한율은 0%보다 커야 합니다.",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isEmpty(value: unknown): boolean {
  return value === "" || value === null || value === undefined;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function addError(
  errors: RentVsJeonseValidationError[],
  field: RentVsJeonseInputField,
  code: RentVsJeonseValidationErrorCode,
  message: string,
) {
  errors.push({ field, code, message });
}

function hasValidInput(
  input: Record<string, unknown>,
): input is Record<string, unknown> & RentVsJeonseInput {
  return inputFields.every((field) => isFiniteNumber(input[field]));
}

function roundWon(value: number): number {
  return Math.round(value);
}

function calculateMonthlyRateAmount(amount: number, annualRate: number): number {
  return roundWon((amount * annualRate) / 100 / 12);
}

export function getDefaultRentVsJeonseInput(): RentVsJeonseInput {
  return {
    jeonseDeposit: 300_000_000,
    jeonseLoanAmount: 180_000_000,
    jeonseLoanRate: 4,
    jeonseExtraMonthlyCost: 0,
    monthlyRentDeposit: 50_000_000,
    monthlyRent: 900_000,
    monthlyMaintenanceFee: 100_000,
    opportunityRate: 3,
    residenceMonths: 24,
    conversionRate: 4.5,
    baseRate: RENT_VS_JEONSE_LEGAL_REFERENCE.baseRate,
    legalAdditionalRate: RENT_VS_JEONSE_LEGAL_REFERENCE.legalAdditionalRate,
    maxLegalRate: RENT_VS_JEONSE_LEGAL_REFERENCE.maxLegalRate,
  };
}

export function calculateLegalReferenceRate(input: {
  baseRate: number;
  legalAdditionalRate: number;
  maxLegalRate: number;
}): number {
  return Math.min(input.maxLegalRate, input.baseRate + input.legalAdditionalRate);
}

export function validateRentVsJeonseInput(
  input: unknown,
): RentVsJeonseValidationError[] {
  const errors: RentVsJeonseValidationError[] = [];

  if (!isRecord(input)) {
    return inputFields.map((field) => ({
      field,
      code: "REQUIRED",
      message: `${field} 값을 입력해 주세요.`,
    }));
  }

  for (const field of inputFields) {
    const value = input[field];

    if (isEmpty(value)) {
      addError(errors, field, "REQUIRED", `${field} 값을 입력해 주세요.`);
      continue;
    }

    if (!isFiniteNumber(value)) {
      addError(errors, field, "INVALID_NUMBER", `${field} 값은 유한한 숫자여야 합니다.`);
    }
  }

  const nonNegativeFields: RentVsJeonseInputField[] = [
    "jeonseDeposit",
    "jeonseLoanAmount",
    "jeonseLoanRate",
    "jeonseExtraMonthlyCost",
    "monthlyRentDeposit",
    "monthlyRent",
    "monthlyMaintenanceFee",
    "opportunityRate",
    "conversionRate",
    "baseRate",
    "legalAdditionalRate",
  ];

  for (const field of nonNegativeFields) {
    const value = input[field];
    if (isFiniteNumber(value) && value < 0) {
      addError(errors, field, "MUST_BE_NON_NEGATIVE", fieldMessages[field]);
    }
  }

  const moneyFields: RentVsJeonseInputField[] = [
    "jeonseDeposit",
    "jeonseLoanAmount",
    "jeonseExtraMonthlyCost",
    "monthlyRentDeposit",
    "monthlyRent",
    "monthlyMaintenanceFee",
  ];

  for (const field of moneyFields) {
    const value = input[field];
    if (isFiniteNumber(value) && (!Number.isSafeInteger(value) || value > RENT_VS_JEONSE_SERVICE_LIMITS.maxMoney)) {
      addError(errors, field, "OUT_OF_RANGE", `${field} 값이 계산 지원 범위를 벗어났습니다.`);
    }
  }

  const rateFields: RentVsJeonseInputField[] = [
    "jeonseLoanRate",
    "opportunityRate",
    "conversionRate",
    "baseRate",
    "legalAdditionalRate",
    "maxLegalRate",
  ];

  for (const field of rateFields) {
    const value = input[field];
    if (isFiniteNumber(value) && value > RENT_VS_JEONSE_SERVICE_LIMITS.maxRate) {
      addError(errors, field, "OUT_OF_RANGE", `${field} 값은 100% 이하여야 합니다.`);
    }
  }

  if (
    isFiniteNumber(input.jeonseLoanAmount) &&
    isFiniteNumber(input.jeonseDeposit) &&
    input.jeonseLoanAmount > input.jeonseDeposit
  ) {
    addError(
      errors,
      "jeonseLoanAmount",
      "LOAN_EXCEEDS_DEPOSIT",
      "전세대출금은 전세보증금을 초과할 수 없습니다.",
    );
  }

  if (isFiniteNumber(input.residenceMonths)) {
    if (!Number.isInteger(input.residenceMonths)) {
      addError(
        errors,
        "residenceMonths",
        "MUST_BE_INTEGER",
        "거주 예정 개월 수는 정수여야 합니다.",
      );
    }

    if (input.residenceMonths < 1) {
      addError(
        errors,
        "residenceMonths",
        "MUST_BE_POSITIVE",
        fieldMessages.residenceMonths,
      );
    }

    if (input.residenceMonths > RENT_VS_JEONSE_SERVICE_LIMITS.maxResidenceMonths) {
      addError(errors, "residenceMonths", "OUT_OF_RANGE", "거주 예정 기간은 600개월 이하여야 합니다.");
    }
  }

  if (isFiniteNumber(input.maxLegalRate) && input.maxLegalRate <= 0) {
    addError(
      errors,
      "maxLegalRate",
      "MUST_BE_POSITIVE",
      fieldMessages.maxLegalRate,
    );
  }

  return errors;
}

export function compareRentVsJeonse(input: RentVsJeonseInput): RentVsJeonseResult {
  const jeonseMonthlyInterestCost = calculateMonthlyRateAmount(
    input.jeonseLoanAmount,
    input.jeonseLoanRate,
  );
  const jeonseEquity = input.jeonseDeposit - input.jeonseLoanAmount;
  const jeonseEquityMonthlyOpportunityCost = calculateMonthlyRateAmount(
    jeonseEquity,
    input.opportunityRate,
  );
  const jeonseMonthlyBurden = roundWon(
    jeonseMonthlyInterestCost +
      jeonseEquityMonthlyOpportunityCost +
      input.jeonseExtraMonthlyCost,
  );
  const jeonseTotalCost = roundWon(
    jeonseMonthlyBurden * input.residenceMonths,
  );
  const monthlyRentDepositMonthlyOpportunityCost = calculateMonthlyRateAmount(
    input.monthlyRentDeposit,
    input.opportunityRate,
  );
  const monthlyRentBurden = roundWon(
    input.monthlyRent +
      input.monthlyMaintenanceFee +
      monthlyRentDepositMonthlyOpportunityCost,
  );
  const monthlyRentTotalCost = roundWon(
    monthlyRentBurden * input.residenceMonths,
  );
  const monthlyBurdenDifference = roundWon(
    jeonseMonthlyBurden - monthlyRentBurden,
  );
  const totalCostDifference = roundWon(jeonseTotalCost - monthlyRentTotalCost);
  const cheaperOption: CheaperHousingOption =
    totalCostDifference < 0
      ? "jeonse"
      : totalCostDifference > 0
        ? "monthlyRent"
        : "same";
  const legalReferenceRate = calculateLegalReferenceRate(input);
  const depositDifference = input.jeonseDeposit - input.monthlyRentDeposit;
  const depositDifferenceMonthlyRentEquivalent = roundWon(
    (depositDifference * input.conversionRate) / 100 / 12,
  );

  return {
    jeonseMonthlyInterestCost,
    jeonseEquity,
    jeonseEquityMonthlyOpportunityCost,
    jeonseExtraMonthlyCost: roundWon(input.jeonseExtraMonthlyCost),
    jeonseMonthlyBurden,
    jeonseTotalCost,
    monthlyRentDepositMonthlyOpportunityCost,
    monthlyRentBurden,
    monthlyRentTotalCost,
    monthlyBurdenDifference,
    totalCostDifference,
    cheaperOption,
    legalReferenceRate,
    depositDifference,
    depositDifferenceMonthlyRentEquivalent,
    referenceNotice: RENT_VS_JEONSE_LEGAL_REFERENCE.notice,
    disclaimer:
      "이 결과는 참고용 예상 계산이며, 실제 계약·분쟁·임대료 증액 제한·특수 계약은 전문가 또는 공식 기관 확인이 필요합니다.",
  };
}

export function calculateRentVsJeonse(
  input: unknown,
): RentVsJeonseCalculationResponse {
  const errors = validateRentVsJeonseInput(input);

  if (errors.length > 0 || !isRecord(input) || !hasValidInput(input)) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: compareRentVsJeonse(input),
  };
}
