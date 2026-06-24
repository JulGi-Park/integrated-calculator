import type {
  SeveranceInput,
  SeveranceInputField,
  SeveranceResult,
} from "@/lib/calculators/severance/types";

export type SeveranceRawInputs = Record<SeveranceInputField, string>;

export interface SeveranceStoredInputsV1 {
  version: 1;
  inputs: SeveranceRawInputs;
}

export const SEVERANCE_STORAGE_KEY =
  "integrated-calculator:severance:inputs";
export const SEVERANCE_STORAGE_VERSION = 1;

export const severanceInputFields: SeveranceInputField[] = [
  "employmentStartDate",
  "retirementDate",
  "wagesForAveragePeriod",
  "annualBonusTotal",
  "annualLeaveAllowanceTotal",
  "ordinaryDailyWage",
  "averageWeeklyContractHours",
];

export const initialSeveranceInputs: SeveranceRawInputs = {
  employmentStartDate: "",
  retirementDate: "",
  wagesForAveragePeriod: "",
  annualBonusTotal: "0",
  annualLeaveAllowanceTotal: "0",
  ordinaryDailyWage: "",
  averageWeeklyContractHours: "40",
};

const maximumStoredLength = 2_000;
const maximumFieldLength = 64;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const rawIntegerPattern = /^-?(?:\d+|\d{1,3}(?:,\d{3})+)$/;
const rawDecimalPattern = /^-?(?:\d+(?:\.\d*)?|\.\d+)$/;

const wonFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 0,
});

const flexibleWonFormatter = new Intl.NumberFormat("ko-KR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatWon(value: number): string {
  if (!Number.isFinite(value)) {
    throw new TypeError("A finite amount is required.");
  }

  return `${wonFormatter.format(value)}원`;
}

function formatWonFlexible(value: number): string {
  if (!Number.isFinite(value)) {
    throw new TypeError("A finite amount is required.");
  }

  return `${flexibleWonFormatter.format(value)}원`;
}

function formatKoreanDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new TypeError("A YYYY-MM-DD date is required.");
  }

  return `${Number(match[1])}년 ${Number(match[2])}월 ${Number(match[3])}일`;
}

function normalizeStoredInputs(inputs: SeveranceRawInputs): SeveranceRawInputs {
  return {
    ...inputs,
    wagesForAveragePeriod: inputs.wagesForAveragePeriod.replaceAll(",", ""),
    annualBonusTotal: inputs.annualBonusTotal.replaceAll(",", ""),
    annualLeaveAllowanceTotal:
      inputs.annualLeaveAllowanceTotal.replaceAll(",", ""),
    ordinaryDailyWage: inputs.ordinaryDailyWage.replaceAll(",", ""),
  };
}

export function formatSeveranceAmountInput(value: string): string {
  const normalized = value.replaceAll(",", "");

  if (normalized === "") {
    return "";
  }

  if (!/^-?\d+$/.test(normalized)) {
    return value;
  }

  const sign = normalized.startsWith("-") ? "-" : "";
  const digits = sign ? normalized.slice(1) : normalized;
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export function serializeSeveranceInputs(inputs: SeveranceRawInputs): string {
  const storedValue: SeveranceStoredInputsV1 = {
    version: SEVERANCE_STORAGE_VERSION,
    inputs: normalizeStoredInputs(inputs),
  };

  return JSON.stringify(storedValue);
}

export function parseSeveranceStoredInputs(
  serializedValue: string,
): SeveranceRawInputs | null {
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

  if (!isRecord(parsed) || parsed.version !== SEVERANCE_STORAGE_VERSION) {
    return null;
  }

  const storedInputs = parsed.inputs;

  if (!isRecord(storedInputs)) {
    return null;
  }

  const storedFields = Object.keys(storedInputs);

  if (
    storedFields.length !== severanceInputFields.length ||
    !storedFields.every((field) =>
      severanceInputFields.includes(field as SeveranceInputField),
    )
  ) {
    return null;
  }

  for (const field of severanceInputFields) {
    const value = storedInputs[field];

    if (typeof value !== "string" || value.length > maximumFieldLength) {
      return null;
    }

    if (value === "") {
      continue;
    }

    if (field === "employmentStartDate" || field === "retirementDate") {
      if (!datePattern.test(value)) {
        return null;
      }
      continue;
    }

    if (field === "averageWeeklyContractHours") {
      if (!rawDecimalPattern.test(value)) {
        return null;
      }
      continue;
    }

    if (!rawIntegerPattern.test(value)) {
      return null;
    }
  }

  const normalizedInputs = Object.fromEntries(
    severanceInputFields.map((field) => [field, storedInputs[field]]),
  ) as SeveranceRawInputs;

  return {
    ...normalizedInputs,
    wagesForAveragePeriod: formatSeveranceAmountInput(
      normalizedInputs.wagesForAveragePeriod,
    ),
    annualBonusTotal: formatSeveranceAmountInput(
      normalizedInputs.annualBonusTotal,
    ),
    annualLeaveAllowanceTotal: formatSeveranceAmountInput(
      normalizedInputs.annualLeaveAllowanceTotal,
    ),
    ordinaryDailyWage: formatSeveranceAmountInput(
      normalizedInputs.ordinaryDailyWage,
    ),
  };
}

export function buildSeveranceResultText(
  input: SeveranceInput,
  result: SeveranceResult,
): string {
  const eligibility = result.isBasicallyEligible ? "대상" : "비대상";
  const ordinaryDailyWage =
    input.ordinaryDailyWage === null
      ? "입력하지 않음"
      : formatWon(input.ordinaryDailyWage);

  return [
    "퇴직금 계산 결과",
    "",
    "[입력 및 계산 기준]",
    `입사일: ${formatKoreanDate(input.employmentStartDate)}`,
    `퇴직일: ${formatKoreanDate(input.retirementDate)}`,
    `퇴직 전 3개월 임금총액: ${formatWon(input.wagesForAveragePeriod)}`,
    `최근 1년 상여금 총액: ${formatWon(input.annualBonusTotal)}`,
    `연차수당 총액: ${formatWon(input.annualLeaveAllowanceTotal)}`,
    `입력된 1일 통상임금: ${ordinaryDailyWage}`,
    `4주 평균 주당 소정근로시간: ${input.averageWeeklyContractHours}시간`,
    "",
    "[결과]",
    `예상 퇴직금: ${formatWon(result.estimatedSeverance)}`,
    `대상 여부: ${eligibility}`,
    `총 재직일수: ${result.totalServiceDays.toLocaleString("ko-KR")}일`,
    `적용 1일 임금: ${formatWonFlexible(result.appliedDailyWage)}`,
    `평균임금: ${formatWonFlexible(result.averageDailyWage)}`,
    `통상임금: ${
      result.ordinaryDailyWage === null
        ? "입력하지 않음"
        : formatWon(result.ordinaryDailyWage)
    }`,
    `기준 확인일: ${formatKoreanDate(result.policyVerifiedAt)}`,
    "",
    "[계산식]",
    `${formatWonFlexible(result.appliedDailyWage)} × 30일 × ${result.totalServiceDays.toLocaleString("ko-KR")}일 ÷ 365일 = ${formatWon(result.estimatedSeverance)}`,
    "",
    "입력값과 기준일에 따른 예상 계산 결과이며 실제 지급액은 사업장 규정과 산정 자료에 따라 달라질 수 있습니다.",
  ].join("\n");
}
