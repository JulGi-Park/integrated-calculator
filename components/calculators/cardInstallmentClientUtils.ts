import {
  calculateCardInstallmentFromUnknown,
  CARD_INSTALLMENT_LIMITS,
} from "@/lib/calculators/card-installment";
import type {
  CardInstallmentInput,
  CardInstallmentInputField,
  CardInstallmentResult,
} from "@/lib/calculators/card-installment";

export type CardInstallmentRawInputs = Record<
  CardInstallmentInputField,
  string
>;

export interface CardInstallmentStoredInputsV1 {
  version: 1;
  inputs: CardInstallmentRawInputs;
}

export const CARD_INSTALLMENT_STORAGE_KEY =
  "integrated-calculator:card-installment:inputs";
export const CARD_INSTALLMENT_STORAGE_VERSION = 1;

export const cardInstallmentInputFields: CardInstallmentInputField[] = [
  "purchaseAmount",
  "installmentMonths",
  "annualFeeRatePercent",
];

export const initialCardInstallmentInputs: CardInstallmentRawInputs = {
  purchaseAmount: "1,000,000",
  installmentMonths: "12",
  annualFeeRatePercent: "15",
};

const maximumStoredLength = 1_000;
const maximumFieldLength = 64;
const rawIntegerPattern = /^-?(?:\d+|\d{1,3}(?:,\d{3})+)$/;
const rawRatePattern = /^-?(?:\d+(?:\.\d*)?|\.\d+)$/;

const wonFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 0,
});

const rateFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 4,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function formatWon(value: number): string {
  if (!Number.isFinite(value)) {
    throw new TypeError("A finite amount is required.");
  }

  return `${wonFormatter.format(value)}원`;
}

export function formatRate(value: number): string {
  if (!Number.isFinite(value)) {
    throw new TypeError("A finite rate is required.");
  }

  return `${rateFormatter.format(value)}%`;
}

function normalizeStoredInputs(
  inputs: CardInstallmentRawInputs,
): CardInstallmentRawInputs {
  return {
    purchaseAmount: inputs.purchaseAmount.replaceAll(",", ""),
    installmentMonths: inputs.installmentMonths,
    annualFeeRatePercent: inputs.annualFeeRatePercent,
  };
}

export function parseCardInstallmentInputs(
  input: CardInstallmentRawInputs,
): Record<string, unknown> {
  return {
    purchaseAmount:
      input.purchaseAmount.trim() === ""
        ? undefined
        : Number(input.purchaseAmount.replaceAll(",", "")),
    installmentMonths:
      input.installmentMonths.trim() === ""
        ? undefined
        : Number(input.installmentMonths),
    annualFeeRatePercent:
      input.annualFeeRatePercent.trim() === ""
        ? undefined
        : Number(input.annualFeeRatePercent),
  };
}

export function serializeCardInstallmentInputs(
  inputs: CardInstallmentRawInputs,
): string {
  const storedValue: CardInstallmentStoredInputsV1 = {
    version: CARD_INSTALLMENT_STORAGE_VERSION,
    inputs: normalizeStoredInputs(inputs),
  };

  return JSON.stringify(storedValue);
}

export function parseCardInstallmentStoredInputs(
  serializedValue: string,
): CardInstallmentRawInputs | null {
  if (
    serializedValue.length === 0 ||
    serializedValue.length > maximumStoredLength
  ) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(serializedValue);
  } catch {
    return null;
  }

  if (
    !isRecord(parsed) ||
    parsed.version !== CARD_INSTALLMENT_STORAGE_VERSION ||
    !isRecord(parsed.inputs)
  ) {
    return null;
  }

  const storedInputs = parsed.inputs;
  const storedFields = Object.keys(storedInputs);

  if (
    storedFields.length !== cardInstallmentInputFields.length ||
    !storedFields.every((field) =>
      cardInstallmentInputFields.includes(field as CardInstallmentInputField),
    )
  ) {
    return null;
  }

  for (const field of cardInstallmentInputFields) {
    const value = storedInputs[field];

    if (typeof value !== "string" || value.length > maximumFieldLength) {
      return null;
    }

    if (value === "") {
      continue;
    }

    if (field === "annualFeeRatePercent") {
      if (!rawRatePattern.test(value)) {
        return null;
      }
      continue;
    }

    if (!rawIntegerPattern.test(value)) {
      return null;
    }
  }

  const normalizedInputs = Object.fromEntries(
    cardInstallmentInputFields.map((field) => [field, storedInputs[field]]),
  ) as CardInstallmentRawInputs;
  const response = calculateCardInstallmentFromUnknown(
    parseCardInstallmentInputs(normalizedInputs),
  );

  if (!response.success) {
    return null;
  }

  return {
    purchaseAmount: formatWon(response.data.purchaseAmount).replace("원", ""),
    installmentMonths: String(response.data.installmentMonths),
    annualFeeRatePercent: String(response.data.annualFeeRatePercent),
  };
}

export function buildCardInstallmentResultText(
  input: CardInstallmentInput,
  result: CardInstallmentResult,
): string {
  return [
    "카드 할부 계산 결과",
    "",
    "[입력 조건]",
    `구매금액: ${formatWon(input.purchaseAmount)}`,
    `할부 개월 수: ${wonFormatter.format(input.installmentMonths)}개월`,
    `연 할부 수수료율: ${formatRate(input.annualFeeRatePercent)}`,
    "",
    "[예상 결과]",
    `월 기본 원금: ${formatWon(result.baseMonthlyPrincipal)}`,
    `총 수수료: ${formatWon(result.totalFee)}`,
    `총 납부액: ${formatWon(result.totalPayment)}`,
    `일시불 대비 추가 부담액: ${formatWon(result.extraCostComparedWithLumpSum)}`,
    "",
    "월별 수수료는 해당 월 시작 잔여 원금에 연 수수료율/12를 곱해 원 단위 반올림했습니다.",
    "카드사별 실제 청구 조건, 무이자·부분 무이자, 할인, 포인트, 선결제, 연체이자는 반영하지 않습니다.",
  ].join("\n");
}

export function isCardInstallmentStoredInputInRange(
  inputs: CardInstallmentRawInputs,
): boolean {
  const response = calculateCardInstallmentFromUnknown(
    parseCardInstallmentInputs(inputs),
  );

  return (
    response.success &&
    response.data.purchaseAmount <=
      CARD_INSTALLMENT_LIMITS.maximumPurchaseAmount
  );
}
