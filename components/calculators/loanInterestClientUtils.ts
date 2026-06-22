import {
  calculateLoanRepaymentComparison,
} from "@/lib/calculators/loan/loan-repayment";
import type {
  LoanRepaymentComparisonResult,
  LoanRepaymentInput,
  LoanRepaymentInputField,
  LoanRepaymentType,
} from "@/lib/calculators/loan/types";

export type LoanInterestRawInputs = Record<LoanRepaymentInputField, string>;

export interface LoanInterestStoredInputsV1 {
  version: 1;
  inputs: LoanInterestRawInputs;
}

export const LOAN_INTEREST_STORAGE_KEY =
  "integrated-calculator:loan-interest:inputs";
export const LOAN_INTEREST_STORAGE_VERSION = 1;

export const loanInterestInputFields: LoanRepaymentInputField[] = [
  "principal",
  "annualInterestRate",
  "termMonths",
];

export const initialLoanInterestInputs: LoanInterestRawInputs = {
  principal: "",
  annualInterestRate: "",
  termMonths: "",
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

function formatWon(value: number): string {
  if (!Number.isFinite(value)) {
    throw new TypeError("A finite amount is required.");
  }

  return `${wonFormatter.format(value)}원`;
}

function formatRate(value: number): string {
  if (!Number.isFinite(value)) {
    throw new TypeError("A finite rate is required.");
  }

  return `${rateFormatter.format(value)}%`;
}

function formatTerm(value: number): string {
  if (!Number.isFinite(value)) {
    throw new TypeError("A finite term is required.");
  }

  return `${wonFormatter.format(value)}개월`;
}

function formatType(type: LoanRepaymentType): string {
  switch (type) {
    case "equalPayment":
      return "원리금균등상환";
    case "equalPrincipal":
      return "원금균등상환";
    case "bullet":
      return "만기일시상환";
  }
}

function formatTypeList(types: LoanRepaymentType[]): string {
  return types.map(formatType).join(", ");
}

function normalizeStoredInputs(
  inputs: LoanInterestRawInputs,
): LoanInterestRawInputs {
  return {
    principal: inputs.principal.replaceAll(",", ""),
    annualInterestRate: inputs.annualInterestRate,
    termMonths: inputs.termMonths,
  };
}

function parseStoredNumbers(inputs: LoanInterestRawInputs) {
  return {
    principal:
      inputs.principal.trim() === ""
        ? undefined
        : Number(inputs.principal.replaceAll(",", "")),
    annualInterestRate:
      inputs.annualInterestRate.trim() === ""
        ? undefined
        : Number(inputs.annualInterestRate),
    termMonths:
      inputs.termMonths.trim() === ""
        ? undefined
        : Number(inputs.termMonths),
  };
}

export function serializeLoanInterestInputs(
  inputs: LoanInterestRawInputs,
): string {
  const storedValue: LoanInterestStoredInputsV1 = {
    version: LOAN_INTEREST_STORAGE_VERSION,
    inputs: normalizeStoredInputs(inputs),
  };

  return JSON.stringify(storedValue);
}

export function parseLoanInterestStoredInputs(
  serializedValue: string,
): LoanInterestRawInputs | null {
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
    parsed.version !== LOAN_INTEREST_STORAGE_VERSION
  ) {
    return null;
  }

  const storedInputs = parsed.inputs;

  if (!isRecord(storedInputs)) {
    return null;
  }

  const storedFields = Object.keys(storedInputs);

  if (
    storedFields.length !== loanInterestInputFields.length ||
    !storedFields.every((field) =>
      loanInterestInputFields.includes(field as LoanRepaymentInputField),
    )
  ) {
    return null;
  }

  for (const field of loanInterestInputFields) {
    const value = storedInputs[field];

    if (typeof value !== "string" || value.length > maximumFieldLength) {
      return null;
    }

    if (value === "") {
      continue;
    }

    if (field === "annualInterestRate") {
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
    loanInterestInputFields.map((field) => [field, storedInputs[field]]),
  ) as LoanInterestRawInputs;
  const response = calculateLoanRepaymentComparison(
    parseStoredNumbers(normalizedInputs),
  );

  if (!response.success) {
    return null;
  }

  return {
    principal: formatWon(response.data.equalPayment.principal).replace("원", ""),
    annualInterestRate: normalizedInputs.annualInterestRate,
    termMonths: normalizedInputs.termMonths,
  };
}

export function buildLoanInterestResultText(
  input: LoanRepaymentInput,
  result: LoanRepaymentComparisonResult,
): string {
  return [
    "대출이자 계산 결과",
    "",
    "[입력 조건]",
    `대출금액: ${formatWon(input.principal)}`,
    `연이율: ${formatRate(input.annualInterestRate)}`,
    `대출기간: ${formatTerm(input.termMonths)}`,
    "",
    "[원리금균등상환]",
    `첫 달 납입액: ${formatWon(result.equalPayment.schedule[0].monthlyPayment)}`,
    `총이자: ${formatWon(result.equalPayment.totalInterest)}`,
    `총상환금액: ${formatWon(result.equalPayment.totalPayment)}`,
    "",
    "[원금균등상환]",
    `첫 달 납입액: ${formatWon(result.equalPrincipal.schedule[0].monthlyPayment)}`,
    `총이자: ${formatWon(result.equalPrincipal.totalInterest)}`,
    `총상환금액: ${formatWon(result.equalPrincipal.totalPayment)}`,
    "",
    "[만기일시상환]",
    `첫 달 납입액: ${formatWon(result.bullet.schedule[0].monthlyPayment)}`,
    `총이자: ${formatWon(result.bullet.totalInterest)}`,
    `총상환금액: ${formatWon(result.bullet.totalPayment)}`,
    "",
    "[비교 결과]",
    `총이자가 가장 적은 방식: ${formatTypeList(result.lowestTotalInterestTypes)}`,
    `첫 달 부담이 가장 적은 방식: ${formatTypeList(result.lowestFirstMonthPaymentTypes)}`,
    `동률 결과: ${formatTypeList(result.levelPaymentTypes)}`,
    "",
    "실제 금융회사 계산은 납부일, 일수와 반올림 기준 등에 따라 달라질 수 있습니다.",
  ].join("\n");
}
