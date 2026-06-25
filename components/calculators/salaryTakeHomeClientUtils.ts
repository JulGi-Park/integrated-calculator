import type {
  SalaryTakeHomeInput,
  SalaryTakeHomeInputField,
  SalaryTakeHomeResult,
} from "@/lib/calculators/salary-take-home/types";

export type SalaryTakeHomeRawInputs = Record<
  SalaryTakeHomeInputField,
  string
>;

export interface SalaryTakeHomeStoredInputsV1 {
  version: 1;
  inputs: SalaryTakeHomeRawInputs;
}

export const SALARY_TAKE_HOME_STORAGE_KEY =
  "integrated-calculator:salary-take-home:inputs";
export const SALARY_TAKE_HOME_STORAGE_VERSION = 1;

export const salaryTakeHomeInputFields: SalaryTakeHomeInputField[] = [
  "annualSalary",
  "monthlyNonTaxableAmount",
  "dependentCount",
  "childCount",
];

export const initialSalaryTakeHomeInputs: SalaryTakeHomeRawInputs = {
  annualSalary: "",
  monthlyNonTaxableAmount: "0",
  dependentCount: "1",
  childCount: "0",
};

const maximumStoredLength = 2_000;
const maximumFieldLength = 64;
const rawIntegerPattern = /^-?(?:\d+|\d{1,3}(?:,\d{3})+)$/;

const wonFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 0,
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

function formatKoreanDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new TypeError("A YYYY-MM-DD date is required.");
  }

  return `${Number(match[1])}년 ${Number(match[2])}월 ${Number(match[3])}일`;
}

export function serializeSalaryTakeHomeInputs(
  inputs: SalaryTakeHomeRawInputs,
): string {
  const storedValue: SalaryTakeHomeStoredInputsV1 = {
    version: SALARY_TAKE_HOME_STORAGE_VERSION,
    inputs,
  };

  return JSON.stringify(storedValue);
}

export function parseSalaryTakeHomeStoredInputs(
  serializedValue: string,
): SalaryTakeHomeRawInputs | null {
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
    parsed.version !== SALARY_TAKE_HOME_STORAGE_VERSION
  ) {
    return null;
  }

  const storedInputs = parsed.inputs;

  if (!isRecord(storedInputs)) {
    return null;
  }

  const storedFields = Object.keys(storedInputs);

  if (
    storedFields.length !== salaryTakeHomeInputFields.length ||
    !storedFields.every((field) =>
      salaryTakeHomeInputFields.includes(field as SalaryTakeHomeInputField),
    )
  ) {
    return null;
  }

  for (const field of salaryTakeHomeInputFields) {
    const value = storedInputs[field];

    if (
      typeof value !== "string" ||
      value.length > maximumFieldLength ||
      (value !== "" && !rawIntegerPattern.test(value))
    ) {
      return null;
    }
  }

  return Object.fromEntries(
    salaryTakeHomeInputFields.map((field) => [field, storedInputs[field]]),
  ) as SalaryTakeHomeRawInputs;
}

export function buildSalaryTakeHomeResultText(
  input: SalaryTakeHomeInput,
  result: SalaryTakeHomeResult,
): string {
  return [
    "연봉 실수령액 계산 결과",
    "",
    "[입력 및 계산 기준]",
    `연봉: ${formatWon(input.annualSalary)}`,
    `월 급여: ${formatWon(result.monthlyGrossSalary)}`,
    `월 비과세액: ${formatWon(input.monthlyNonTaxableAmount)}`,
    `월 과세 급여: ${formatWon(result.monthlyTaxableSalary)}`,
    "",
    "[상세 공제]",
    `국민연금: ${formatWon(result.nationalPension)}`,
    `건강보험: ${formatWon(result.healthInsurance)}`,
    `장기요양보험: ${formatWon(result.longTermCareInsurance)}`,
    `고용보험: ${formatWon(result.employmentInsurance)}`,
    `소득세: ${formatWon(result.incomeTax)}`,
    `지방소득세: ${formatWon(result.localIncomeTax)}`,
    "",
    "[결과]",
    `월 공제 합계: ${formatWon(result.totalMonthlyDeductions)}`,
    `월 예상 실수령액: ${formatWon(result.estimatedMonthlyTakeHome)}`,
    `연간 예상 실수령액: ${formatWon(result.estimatedAnnualTakeHome)}`,
    `적용 정책: ${result.policyYear}년`,
    `기준 확인일: ${formatKoreanDate(result.policyVerifiedAt)}`,
    "",
    "입력값과 적용 정책에 따른 예상 결과이며 실제 급여명세서와 차이가 날 수 있습니다.",
  ].join("\n");
}
