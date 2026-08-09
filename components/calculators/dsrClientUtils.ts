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
  loanType: DsrInput["loanType"];
  repaymentType: DsrInput["repaymentType"];
  gracePeriodMonths: string;
  balloonPrincipal: string;
  creditInstallmentRatio: string;
  creditRepaymentFrequency: DsrInput["creditRepaymentFrequency"];
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
  loanType: "mortgage",
  repaymentType: "levelPayment",
  gracePeriodMonths: "0",
  balloonPrincipal: "0",
  creditInstallmentRatio: "100",
  creditRepaymentFrequency: "monthly",
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
    loanType: input.loanType,
    repaymentType: input.repaymentType,
    gracePeriodMonths: parseNumber(input.gracePeriodMonths),
    balloonPrincipal: parseAmount(input.balloonPrincipal),
    creditInstallmentRatio: parseNumber(input.creditInstallmentRatio),
    creditRepaymentFrequency: input.creditRepaymentFrequency,
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
      typeof parsed.gracePeriodMonths !== "string" ||
      typeof parsed.balloonPrincipal !== "string" ||
      typeof parsed.creditInstallmentRatio !== "string" ||
      typeof parsed.stressInterestRate !== "string" ||
      typeof parsed.dsrLimitRate !== "string" ||
      !["levelPayment", "equalPrincipal", "partialInstallment", "bullet"].includes(
        parsed.repaymentType ?? "",
      ) ||
      !["mortgage", "credit", "officetelMortgage", "nonHousingMortgage", "leaseDepositSecured"].includes(parsed.loanType ?? "") ||
      !["monthly", "quarterly", "other"].includes(parsed.creditRepaymentFrequency ?? "")
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
    `기존 대출 연간 DSR 원리금: ${formatWon(result.input.existingAnnualDebtPayment)}`,
    `신규 대출 계약상 향후 1년 납입액: ${formatWon(result.base.newLoanPayment.contractAnnualPayment)}`,
    `신규 대출 DSR 산정 연간 원금: ${formatWon(result.base.newLoanPayment.annualPrincipalForDsr)}`,
    `신규 대출 DSR 산정 연간 이자: ${formatWon(result.base.newLoanPayment.annualInterestForDsr)}`,
    `신규 대출 DSR 산정 연간 원리금: ${formatWon(result.base.newLoanPayment.annualPaymentForDsr)}`,
    `DSR 산정만기: ${result.base.newLoanPayment.assessmentMaturityMonths}개월`,
    `전체 연간 원리금: ${formatWon(result.base.totalAnnualDebtPayment)}`,
    `DSR 기준: ${formatRate(result.input.dsrLimitRate)}`,
    `사용자 금리상승 시나리오 DSR: ${formatRate(result.stressed.dsrRate)}`,
    "공식 스트레스 DSR 자동판정이 아닌 참고용 금리상승 시나리오이며 실제 금융기관 심사 결과와 다를 수 있습니다.",
  ].join("\n");
}
