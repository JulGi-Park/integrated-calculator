import type {
  RoasInput,
  RoasInputField,
  RoasResult,
} from "@/lib/calculators/roas/roas";

export type RoasRawInputs = Record<RoasInputField, string>;

export interface RoasStoredInputsV1 {
  version: 1;
  inputs: RoasRawInputs;
}

export const ROAS_STORAGE_KEY = "integrated-calculator:roas:inputs";
export const ROAS_STORAGE_VERSION = 1;

export const roasInputFields: RoasInputField[] = [
  "adCost",
  "adRevenue",
  "productCost",
  "otherCost",
  "targetRoas",
];

export const initialRoasInput: RoasRawInputs = {
  adCost: "",
  adRevenue: "",
  productCost: "0",
  otherCost: "0",
  targetRoas: "",
};

const maximumStoredLength = 10_000;
const maximumFieldLength = 64;
const rawNumberPattern = /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
const displayNumberPattern = /^-?(?:\d{1,3}(?:,\d{3})+|\d+)?(?:\.\d*)?$/;

const wonFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 0,
});

const rateFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 2,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeRoasNumericInput(value: string): string {
  return value.replace(/,/g, "").trim();
}

export function formatRoasInputValue(value: string): string {
  const normalized = normalizeRoasNumericInput(value);

  if (
    normalized === "" ||
    normalized === "-" ||
    normalized.endsWith(".") ||
    !rawNumberPattern.test(normalized)
  ) {
    return value;
  }

  const numberValue = Number(normalized);

  if (!Number.isFinite(numberValue)) {
    return value;
  }

  const [, decimalPart] = normalized.split(".");
  const formattedInteger = wonFormatter.format(Math.trunc(numberValue));

  if (typeof decimalPart === "undefined") {
    return formattedInteger;
  }

  return `${formattedInteger}.${decimalPart}`;
}

export function parseRoasRawInputs(input: RoasRawInputs): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).map(([field, value]) => {
      const normalized = normalizeRoasNumericInput(value);
      return [field, normalized === "" ? undefined : Number(normalized)];
    }),
  );
}

export function formatRoasWon(value: number) {
  return `${wonFormatter.format(value)}원`;
}

export function formatRoasRate(value: number | null) {
  return value === null ? "계산 불가" : `${rateFormatter.format(value)}%`;
}

export function serializeRoasInputs(inputs: RoasRawInputs): string {
  const storedValue: RoasStoredInputsV1 = {
    version: ROAS_STORAGE_VERSION,
    inputs,
  };

  return JSON.stringify(storedValue);
}

export function parseRoasStoredInputs(serializedValue: string): RoasRawInputs | null {
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

  if (!isRecord(parsed) || parsed.version !== ROAS_STORAGE_VERSION) {
    return null;
  }

  const storedInputs = parsed.inputs;

  if (!isRecord(storedInputs)) {
    return null;
  }

  const storedFields = Object.keys(storedInputs);

  if (
    storedFields.length !== roasInputFields.length ||
    !storedFields.every((field) =>
      roasInputFields.includes(field as RoasInputField),
    )
  ) {
    return null;
  }

  for (const field of roasInputFields) {
    const value = storedInputs[field];

    if (
      typeof value !== "string" ||
      value.length > maximumFieldLength ||
      (value !== "" && !displayNumberPattern.test(value) && !rawNumberPattern.test(value))
    ) {
      return null;
    }
  }

  return Object.fromEntries(
    roasInputFields.map((field) => [field, storedInputs[field]]),
  ) as RoasRawInputs;
}

export function buildRoasResultText(input: RoasInput, result: RoasResult): string {
  return [
    "ROAS 계산 결과",
    "",
    "[입력 조건]",
    `광고비: ${formatRoasWon(input.adCost)}`,
    `광고 매출: ${formatRoasWon(input.adRevenue)}`,
    `상품 원가: ${formatRoasWon(input.productCost)}`,
    `기타 비용: ${formatRoasWon(input.otherCost)}`,
    typeof input.targetRoas === "number"
      ? `목표 ROAS: ${formatRoasRate(input.targetRoas)}`
      : "목표 ROAS: 입력 안 함",
    "",
    "[계산 결과]",
    `ROAS: ${formatRoasRate(result.roasRate)}`,
    `광고비 비중: ${formatRoasRate(result.adCostShareRate)}`,
    `광고 후 순이익: ${formatRoasWon(result.netProfitAfterAd)}`,
    `공헌이익률: ${formatRoasRate(result.contributionMarginRate)}`,
    `손익분기 ROAS: ${formatRoasRate(result.breakEvenRoasRate)}`,
    `목표 달성 여부: ${
      result.targetStatus === "NOT_SET"
        ? "목표 미입력"
        : result.targetStatus === "ACHIEVED"
          ? "목표 달성"
          : "목표 미달"
    }`,
  ].join("\n");
}
