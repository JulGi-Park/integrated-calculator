import type {
  DsrCalculationResult,
  DsrInput,
} from "@/lib/calculators/dsr";

export interface DsrRawInputs {
  annualIncome: string;
  existingAnnualDebtPayment: string;
  newLoanPrincipal: string;
  annualInterestRate: string;
  termMonths: string;
  repaymentType: DsrInput["repaymentType"];
  stressInterestRate: string;
  dsrLimitRate: string;
}

export const DSR_STORAGE_KEY = "gyesanbox:dsr-inputs";

export const initialDsrInputs: DsrRawInputs = {
  annualIncome: "60,000,000",
  existingAnnualDebtPayment: "8,000,000",
  newLoanPrincipal: "200,000,000",
  annualInterestRate: "4.5",
  termMonths: "360",
  repaymentType: "levelPayment",
  stressInterestRate: "1.5",
  dsrLimitRate: "40",
};

export function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function formatRate(value: number): string {
  return `${value.toLocaleString("ko-KR", {
    maximumFractionDigits: 2,
  })}%`;
}

export function formatNumericInput(value: string): string {
  const normalized = value.replaceAll(",", "");

  if (!/^\d+$/.test(normalized)) {
    return value;
  }

  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function parseAmount(value: string): number | undefined {
  const normalized = value.trim().replaceAll(",", "");
  return normalized === "" ? undefined : Number(normalized);
}

function parseNumber(value: string): number | undefined {
  const normalized = value.trim();
  return normalized === "" ? undefined : Number(normalized);
}

export function parseDsrInputs(input: DsrRawInputs): Partial<DsrInput> {
  return {
    annualIncome: parseAmount(input.annualIncome),
    existingAnnualDebtPayment: parseAmount(input.existingAnnualDebtPayment),
    newLoanPrincipal: parseAmount(input.newLoanPrincipal),
    annualInterestRate: parseNumber(input.annualInterestRate),
    termMonths: parseNumber(input.termMonths),
    repaymentType: input.repaymentType,
    stressInterestRate: parseNumber(input.stressInterestRate),
    dsrLimitRate: parseNumber(input.dsrLimitRate),
  };
}

export function serializeDsrInputs(input: DsrRawInputs): string {
  return JSON.stringify(input);
}

export function parseDsrStoredInputs(value: string): DsrRawInputs | null {
  try {
    const parsed = JSON.parse(value) as Partial<DsrRawInputs>;

    if (
      typeof parsed.annualIncome !== "string" ||
      typeof parsed.existingAnnualDebtPayment !== "string" ||
      typeof parsed.newLoanPrincipal !== "string" ||
      typeof parsed.annualInterestRate !== "string" ||
      typeof parsed.termMonths !== "string" ||
      typeof parsed.stressInterestRate !== "string" ||
      typeof parsed.dsrLimitRate !== "string" ||
      !["levelPayment", "equalPrincipal", "bullet"].includes(
        parsed.repaymentType ?? "",
      )
    ) {
      return null;
    }

    return parsed as DsrRawInputs;
  } catch {
    return null;
  }
}

export function buildDsrResultText(result: DsrCalculationResult): string {
  return [
    "DSR 계산 결과",
    `기준 DSR: ${formatRate(result.base.dsrRate)}`,
    `스트레스 DSR: ${formatRate(result.stressed.dsrRate)}`,
    `기존 대출 연간 원리금: ${formatWon(result.input.existingAnnualDebtPayment)}`,
    `신규 대출 연간 원리금: ${formatWon(result.base.newLoanPayment.annualPaymentForDsr)}`,
    `전체 연간 원리금: ${formatWon(result.base.totalAnnualDebtPayment)}`,
    `DSR 기준: ${formatRate(result.input.dsrLimitRate)}`,
    "예상 계산용이며 실제 금융기관 심사 결과와 다를 수 있습니다.",
  ].join("\n");
}
