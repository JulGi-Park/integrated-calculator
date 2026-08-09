import type {
  BrokerageFeeCalculationResponse,
  BrokerageFeeInput,
  BrokerageFeeInputField,
  BrokerageFeeRateBand,
  BrokerageFeeValidationError,
  BrokerageFeeValidationErrorCode,
  BrokerageFeeValidationField,
  BrokerageTransactionType,
} from "./types";

export const BROKERAGE_FEE_POLICY_VERIFIED_AT = "2026-08-09 확인 기준";
export const BROKERAGE_FEE_MAX_INPUT = 1_000_000_000_000_000;
export const BROKERAGE_FEE_MAX_RESULT = Number.MAX_SAFE_INTEGER;
export const BROKERAGE_FEE_VAT_RATE = 0.1;

const transactionTypes: BrokerageTransactionType[] = [
  "sale",
  "jeonse",
  "monthlyRent",
];

export const brokerageSaleRateBands: BrokerageFeeRateBand[] = [
  {
    minAmount: 0,
    maxAmount: 50_000_000,
    ratePercent: 0.6,
    limitAmount: 250_000,
    label: "5천만원 미만",
  },
  {
    minAmount: 50_000_000,
    maxAmount: 200_000_000,
    ratePercent: 0.5,
    limitAmount: 800_000,
    label: "5천만원 이상 ~ 2억원 미만",
  },
  {
    minAmount: 200_000_000,
    maxAmount: 900_000_000,
    ratePercent: 0.4,
    limitAmount: null,
    label: "2억원 이상 ~ 9억원 미만",
  },
  {
    minAmount: 900_000_000,
    maxAmount: 1_200_000_000,
    ratePercent: 0.5,
    limitAmount: null,
    label: "9억원 이상 ~ 12억원 미만",
  },
  {
    minAmount: 1_200_000_000,
    maxAmount: 1_500_000_000,
    ratePercent: 0.6,
    limitAmount: null,
    label: "12억원 이상 ~ 15억원 미만",
  },
  {
    minAmount: 1_500_000_000,
    maxAmount: null,
    ratePercent: 0.7,
    limitAmount: null,
    label: "15억원 이상",
  },
];

export const brokerageLeaseRateBands: BrokerageFeeRateBand[] = [
  {
    minAmount: 0,
    maxAmount: 50_000_000,
    ratePercent: 0.5,
    limitAmount: 200_000,
    label: "5천만원 미만",
  },
  {
    minAmount: 50_000_000,
    maxAmount: 100_000_000,
    ratePercent: 0.4,
    limitAmount: 300_000,
    label: "5천만원 이상 ~ 1억원 미만",
  },
  {
    minAmount: 100_000_000,
    maxAmount: 600_000_000,
    ratePercent: 0.3,
    limitAmount: null,
    label: "1억원 이상 ~ 6억원 미만",
  },
  {
    minAmount: 600_000_000,
    maxAmount: 1_200_000_000,
    ratePercent: 0.4,
    limitAmount: null,
    label: "6억원 이상 ~ 12억원 미만",
  },
  {
    minAmount: 1_200_000_000,
    maxAmount: 1_500_000_000,
    ratePercent: 0.5,
    limitAmount: null,
    label: "12억원 이상 ~ 15억원 미만",
  },
  {
    minAmount: 1_500_000_000,
    maxAmount: null,
    ratePercent: 0.6,
    limitAmount: null,
    label: "15억원 이상",
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function roundToWon(value: number): number {
  return Math.round(value);
}

function addError(
  errors: BrokerageFeeValidationError[],
  field: BrokerageFeeValidationField,
  code: BrokerageFeeValidationErrorCode,
  message: string,
) {
  errors.push({ field, code, message });
}

function validateAmount(
  errors: BrokerageFeeValidationError[],
  field: BrokerageFeeInputField,
  value: unknown,
  label: string,
  options: Readonly<{ positive?: boolean; optional?: boolean }> = {},
) {
  if (options.optional && typeof value === "undefined") {
    return;
  }

  if (!isFiniteNumber(value)) {
    addError(errors, field, "INVALID_NUMBER", `${label}은 숫자로 입력해 주세요.`);
    return;
  }

  if (options.positive ? value <= 0 : value < 0) {
    addError(
      errors,
      field,
      options.positive ? "MUST_BE_POSITIVE" : "MUST_BE_NON_NEGATIVE",
      options.positive
        ? `${label}은 0원보다 큰 숫자로 입력해 주세요.`
        : `${label}은 0원 이상으로 입력해 주세요.`,
    );
    return;
  }

  if (value > BROKERAGE_FEE_MAX_INPUT) {
    addError(
      errors,
      field,
      "TOO_LARGE",
      `${label}이 너무 큽니다. 1,000조원 이하로 입력해 주세요.`,
    );
  }
}

function validateNegotiatedRate(
  errors: BrokerageFeeValidationError[],
  value: unknown,
) {
  if (typeof value === "undefined") {
    return;
  }

  if (!isFiniteNumber(value)) {
    addError(
      errors,
      "negotiatedRatePercent",
      "INVALID_NUMBER",
      "협의요율은 숫자로 입력해 주세요.",
    );
    return;
  }

  if (value < 0) {
    addError(
      errors,
      "negotiatedRatePercent",
      "MUST_BE_NON_NEGATIVE",
      "협의요율은 0% 이상으로 입력해 주세요.",
    );
    return;
  }

  if (value > 100) {
    addError(
      errors,
      "negotiatedRatePercent",
      "TOO_LARGE",
      "협의요율은 100% 이하로 입력해 주세요.",
    );
  }
}

function getRateBand(
  transactionType: BrokerageTransactionType,
  amount: number,
): BrokerageFeeRateBand {
  const bands =
    transactionType === "sale" ? brokerageSaleRateBands : brokerageLeaseRateBands;
  const band = bands.find(
    ({ minAmount, maxAmount }) =>
      amount >= minAmount && (maxAmount === null || amount < maxAmount),
  );

  if (!band) {
    throw new RangeError("No brokerage fee rate band matched the amount.");
  }

  return band;
}

function applyLimit(amount: number, limitAmount: number | null): number {
  return limitAmount === null ? amount : Math.min(amount, limitAmount);
}

function assertFiniteResult(
  errors: BrokerageFeeValidationError[],
  value: number,
  label: string,
) {
  if (
    !Number.isFinite(value) ||
    value < 0 ||
    Math.abs(value) > BROKERAGE_FEE_MAX_RESULT
  ) {
    addError(
      errors,
      "result",
      "NON_FINITE_RESULT",
      `${label} 계산 결과가 유효하지 않습니다. 입력값을 줄여 주세요.`,
    );
  }
}

function getAppliedAmount(input: BrokerageFeeInput): {
  amount: number;
  firstMonthlyRentConvertedAmount: number | null;
  monthlyRentRecalculated: boolean;
  finalMonthlyRentConvertedAmount: number | null;
} {
  if (input.transactionType === "sale") {
    return {
      amount: input.transactionAmount ?? Number.NaN,
      firstMonthlyRentConvertedAmount: null,
      monthlyRentRecalculated: false,
      finalMonthlyRentConvertedAmount: null,
    };
  }

  if (input.transactionType === "jeonse") {
    return {
      amount: input.jeonseDeposit ?? Number.NaN,
      firstMonthlyRentConvertedAmount: null,
      monthlyRentRecalculated: false,
      finalMonthlyRentConvertedAmount: null,
    };
  }

  const deposit = input.monthlyRentDeposit ?? Number.NaN;
  const rent = input.monthlyRent ?? Number.NaN;
  const firstAmount = deposit + rent * 100;
  const shouldRecalculate = firstAmount < 50_000_000;
  const finalAmount = shouldRecalculate ? deposit + rent * 70 : firstAmount;

  return {
    amount: finalAmount,
    firstMonthlyRentConvertedAmount: firstAmount,
    monthlyRentRecalculated: shouldRecalculate,
    finalMonthlyRentConvertedAmount: finalAmount,
  };
}

export function validateBrokerageFeeInput(
  input: unknown,
): BrokerageFeeValidationError[] {
  const errors: BrokerageFeeValidationError[] = [];

  if (!isRecord(input)) {
    return [
      {
        field: "transactionType",
        code: "INVALID_TRANSACTION_TYPE",
        message: "지원하는 거래유형을 선택해 주세요.",
      },
    ];
  }

  const transactionType = input.transactionType;

  if (
    typeof transactionType !== "string" ||
    !transactionTypes.includes(transactionType as BrokerageTransactionType)
  ) {
    addError(
      errors,
      "transactionType",
      "INVALID_TRANSACTION_TYPE",
      "지원하는 거래유형을 선택해 주세요.",
    );
  }

  validateNegotiatedRate(errors, input.negotiatedRatePercent);

  if (transactionType === "sale") {
    validateAmount(
      errors,
      "transactionAmount",
      input.transactionAmount,
      "거래금액",
      { positive: true },
    );
  } else if (transactionType === "jeonse") {
    validateAmount(
      errors,
      "jeonseDeposit",
      input.jeonseDeposit,
      "전세보증금",
      { positive: true },
    );
  } else if (transactionType === "monthlyRent") {
    validateAmount(
      errors,
      "monthlyRentDeposit",
      input.monthlyRentDeposit,
      "월세 보증금",
    );
    validateAmount(errors, "monthlyRent", input.monthlyRent, "월세");

    if (
      isFiniteNumber(input.monthlyRentDeposit) &&
      isFiniteNumber(input.monthlyRent) &&
      input.monthlyRentDeposit === 0 &&
      input.monthlyRent === 0
    ) {
      addError(
        errors,
        "monthlyRent",
        "RENT_REQUIRES_VALUE",
        "월세 거래는 보증금 또는 월세 중 하나 이상을 입력해 주세요.",
      );
    }
  }

  if (errors.length > 0) {
    return errors;
  }

  const normalizedInput = input as unknown as BrokerageFeeInput;
  const { amount } = getAppliedAmount(normalizedInput);

  assertFiniteResult(errors, amount, "적용 거래금액");

  if (amount <= 0) {
    addError(
      errors,
      "result",
      "MUST_BE_POSITIVE",
      "적용 거래금액은 0원보다 커야 합니다.",
    );
  }

  if (errors.length === 0 && isFiniteNumber(normalizedInput.negotiatedRatePercent)) {
    const band = getRateBand(normalizedInput.transactionType, amount);

    if (normalizedInput.negotiatedRatePercent > band.ratePercent) {
      addError(
        errors,
        "negotiatedRatePercent",
        "RATE_EXCEEDS_MAX",
        "협의요율은 적용 상한요율을 넘을 수 없습니다.",
      );
    }
  }

  return errors;
}

export function calculateBrokerageFee(
  input: unknown,
): BrokerageFeeCalculationResponse {
  const errors = validateBrokerageFeeInput(input);

  if (errors.length > 0 || !isRecord(input)) {
    return { success: false, errors };
  }

  const normalizedInput = input as unknown as BrokerageFeeInput;
  const {
    amount,
    firstMonthlyRentConvertedAmount,
    monthlyRentRecalculated,
    finalMonthlyRentConvertedAmount,
  } = getAppliedAmount(normalizedInput);
  const rateBand = getRateBand(normalizedInput.transactionType, amount);
  const rawBaseFee = (amount * rateBand.ratePercent) / 100;
  const baseFee = roundToWon(applyLimit(rawBaseFee, rateBand.limitAmount));
  const vatAmount = roundToWon(baseFee * BROKERAGE_FEE_VAT_RATE);
  const vatIncludedFee = baseFee + vatAmount;
  const hasNegotiatedRate = isFiniteNumber(normalizedInput.negotiatedRatePercent);
  const negotiatedRatePercent = normalizedInput.negotiatedRatePercent;
  const rawNegotiatedFee =
    hasNegotiatedRate && typeof negotiatedRatePercent === "number"
      ? (amount * negotiatedRatePercent) / 100
    : null;
  const negotiatedFee =
    rawNegotiatedFee === null
      ? null
      : roundToWon(applyLimit(rawNegotiatedFee, rateBand.limitAmount));
  const negotiatedVatIncludedFee =
    negotiatedFee === null
      ? null
      : negotiatedFee + roundToWon(negotiatedFee * BROKERAGE_FEE_VAT_RATE);
  const negotiatedLimitApplied =
    rawNegotiatedFee !== null &&
    rateBand.limitAmount !== null &&
    rawNegotiatedFee > rateBand.limitAmount;

  const resultErrors: BrokerageFeeValidationError[] = [];

  for (const [label, value] of [
    ["부가세 별도 상한보수", baseFee],
    ["부가세", vatAmount],
    ["부가세 포함 예상 금액", vatIncludedFee],
    ["협의보수", negotiatedFee ?? 0],
    ["부가세 포함 협의보수", negotiatedVatIncludedFee ?? 0],
  ] as const) {
    assertFiniteResult(resultErrors, value, label);
  }

  if (resultErrors.length > 0) {
    return { success: false, errors: resultErrors };
  }

  return {
    success: true,
    data: {
      transactionType: normalizedInput.transactionType,
      appliedTransactionAmount: roundToWon(amount),
      firstMonthlyRentConvertedAmount:
        firstMonthlyRentConvertedAmount === null
          ? null
          : roundToWon(firstMonthlyRentConvertedAmount),
      monthlyRentRecalculated,
      finalMonthlyRentConvertedAmount:
        finalMonthlyRentConvertedAmount === null
          ? null
          : roundToWon(finalMonthlyRentConvertedAmount),
      rateBand,
      maxRatePercent: rateBand.ratePercent,
      limitAmount: rateBand.limitAmount,
      baseFee,
      vatAmount,
      vatIncludedFee,
      negotiatedRatePercent:
        hasNegotiatedRate && typeof negotiatedRatePercent === "number"
          ? negotiatedRatePercent
          : null,
      negotiatedFee,
      negotiatedVatIncludedFee,
      negotiatedLimitApplied,
    },
  };
}
