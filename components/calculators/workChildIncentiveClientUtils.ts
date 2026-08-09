import type {
  WorkChildIncentiveInput,
  WorkChildIncentiveInputField,
  WorkChildIncentiveResult,
} from "@/lib/calculators/work-child-incentive/types";

export type WorkChildIncentiveRawInputs = Record<
  WorkChildIncentiveInputField,
  string
>;

export const WORK_CHILD_INCENTIVE_STORAGE_KEY =
  "integrated-calculator:work-child-incentive:inputs";

export const initialWorkChildIncentiveInputs: WorkChildIncentiveRawInputs = {
  applicationType: "both",
  householdType: "singleIncome",
  totalIncome: "",
  totalSalary: "",
  propertyAmount: "0",
  childCount: "0",
  childAgeEligible: "false",
  spouseSalary: "0",
  filingType: "regular",
  hasTaxArrears: "no",
  hasChildTaxCredit: "no",
};

const fields = Object.keys(initialWorkChildIncentiveInputs) as WorkChildIncentiveInputField[];
const wonFormatter = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });

export function formatNumericInput(value: string): string {
  const trimmed = value.replaceAll(",", "").trim();

  if (trimmed === "") {
    return "";
  }

  if (!/^-?\d+$/.test(trimmed)) {
    return value;
  }

  return Number(trimmed).toLocaleString("ko-KR");
}

function parseAmount(value: string): number {
  if (value.trim() === "") {
    return Number.NaN;
  }

  return Number(value.replaceAll(",", ""));
}

export function parseWorkChildIncentiveInputs(
  input: WorkChildIncentiveRawInputs,
): WorkChildIncentiveInput {
  return {
    applicationType: input.applicationType as WorkChildIncentiveInput["applicationType"],
    householdType: input.householdType as WorkChildIncentiveInput["householdType"],
    totalIncome: parseAmount(input.totalIncome),
    totalSalary: parseAmount(input.totalSalary),
    propertyAmount: parseAmount(input.propertyAmount),
    childCount: parseAmount(input.childCount),
    childAgeEligible: input.childAgeEligible === "true",
    spouseSalary: parseAmount(input.spouseSalary),
    filingType: input.filingType as WorkChildIncentiveInput["filingType"],
    hasTaxArrears: input.hasTaxArrears as WorkChildIncentiveInput["hasTaxArrears"],
    hasChildTaxCredit: input.hasChildTaxCredit as WorkChildIncentiveInput["hasChildTaxCredit"],
  };
}

export function serializeWorkChildIncentiveInputs(
  input: WorkChildIncentiveRawInputs,
): string {
  return JSON.stringify({ version: 1, inputs: input });
}

export function parseWorkChildIncentiveStoredInputs(
  value: string,
): WorkChildIncentiveRawInputs | null {
  if (value.length === 0 || value.length > 3_000) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed) ||
    (parsed as { version?: unknown }).version !== 1
  ) {
    return null;
  }

  const inputs = (parsed as { inputs?: unknown }).inputs;

  if (typeof inputs !== "object" || inputs === null || Array.isArray(inputs)) {
    return null;
  }

  const record = inputs as Record<string, unknown>;

  if (!fields.every((field) => typeof record[field] === "string")) {
    return null;
  }

  return Object.fromEntries(fields.map((field) => [field, record[field]])) as WorkChildIncentiveRawInputs;
}

export function formatWon(value: number): string {
  return `${wonFormatter.format(Math.max(0, Math.round(value)))}원`;
}

export function buildWorkChildIncentiveResultText(
  result: WorkChildIncentiveResult,
): string {
  return [
    "근로·자녀장려금 계산 결과",
    "",
    "[결과 요약]",
    `근로장려금 신청 가능성: ${result.work.reason}`,
    `자녀장려금 신청 가능성: ${result.child.reason}`,
    `근로장려금 예상액: ${formatWon(result.work.estimatedAfterReduction)}`,
    `자녀장려금 예상액: ${formatWon(result.child.estimatedAfterReduction)}`,
    `최종 예상 수령액: ${formatWon(result.totalEstimatedAmount)}`,
    "",
    "[감액 및 안내]",
    result.propertyMessage,
    ...(result.reductionReasons.length > 0 ? result.reductionReasons : ["추가 감액 안내 없음"]),
    "",
    result.interpretation,
  ].join("\n");
}
