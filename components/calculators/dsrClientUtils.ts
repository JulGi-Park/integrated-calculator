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
  regionType: DsrInput["regionType"];
  isRegulatedArea: "yes" | "no";
  interestRateType: DsrInput["interestRateType"];
  fixedRatePeriodMonths: string;
  rateResetPeriodMonths: string;
  creditLoanTotalBalance: string;
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
  regionType: "capital",
  isRegulatedArea: "no",
  interestRateType: "variable",
  fixedRatePeriodMonths: "60",
  rateResetPeriodMonths: "60",
  creditLoanTotalBalance: "100,000,000",
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

export function formatPercentPoint(value: number): string {
  return `${value.toLocaleString("ko-KR", {
    maximumFractionDigits: 4,
  })}%p`;
}

export function formatMultiplier(value: number): string {
  return `${(value * 100).toLocaleString("ko-KR", {
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
    regionType: input.regionType,
    isRegulatedArea: input.isRegulatedArea === "yes",
    interestRateType: input.interestRateType,
    fixedRatePeriodMonths: parseNumber(input.fixedRatePeriodMonths),
    rateResetPeriodMonths: parseNumber(input.rateResetPeriodMonths),
    creditLoanTotalBalance: parseAmount(input.creditLoanTotalBalance),
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
      typeof parsed.fixedRatePeriodMonths !== "string" ||
      typeof parsed.rateResetPeriodMonths !== "string" ||
      typeof parsed.creditLoanTotalBalance !== "string" ||
      typeof parsed.stressInterestRate !== "string" ||
      typeof parsed.dsrLimitRate !== "string" ||
      !["levelPayment", "equalPrincipal", "partialInstallment", "bullet"].includes(
        parsed.repaymentType ?? "",
      ) ||
      !["mortgage", "credit", "officetelMortgage", "nonHousingMortgage", "leaseDepositSecured"].includes(parsed.loanType ?? "") ||
      !["monthly", "quarterly", "other"].includes(parsed.creditRepaymentFrequency ?? "") ||
      !["capital", "local"].includes(parsed.regionType ?? "") ||
      !["yes", "no"].includes(parsed.isRegulatedArea ?? "") ||
      !["variable", "mixed", "periodic", "fixed"].includes(parsed.interestRateType ?? "")
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
    `일반 DSR: ${formatRate(result.base.dsrRate)}`,
    `공식 스트레스 DSR: ${formatRate(result.officialStressed.dsrRate)}`,
    `공식 최종 적용 스트레스 금리: ${formatPercentPoint(result.officialStressPolicy.finalStressRate)}`,
    `공식 정책 적용 여부: ${result.officialStressPolicy.applicable ? "적용" : "미적용"}`,
    `공식 정책 단계: ${result.officialStressPolicy.policyStage ? `${result.officialStressPolicy.policyStage}단계` : "지원 기간 밖"}`,
    `공식 정책 기준일: ${result.officialStressPolicy.referenceDate}`,
    `공식 정책 근거: ${result.officialStressPolicy.reason}`,
    `기존 대출 연간 DSR 원리금: ${formatWon(result.input.existingAnnualDebtPayment)}`,
    `신규 대출 계약상 향후 1년 납입액: ${formatWon(result.base.newLoanPayment.contractAnnualPayment)}`,
    `신규 대출 DSR 산정 연간 원금: ${formatWon(result.base.newLoanPayment.annualPrincipalForDsr)}`,
    `신규 대출 DSR 산정 연간 이자: ${formatWon(result.base.newLoanPayment.annualInterestForDsr)}`,
    `신규 대출 DSR 산정 연간 원리금: ${formatWon(result.base.newLoanPayment.annualPaymentForDsr)}`,
    `DSR 산정만기: ${result.base.newLoanPayment.assessmentMaturityMonths}개월`,
    `전체 연간 원리금: ${formatWon(result.base.totalAnnualDebtPayment)}`,
    `DSR 기준: ${formatRate(result.input.dsrLimitRate)}`,
    `사용자 금리상승 시나리오 DSR: ${formatRate(result.stressed.dsrRate)}`,
    `사용자 금리상승 시나리오 가산금리: ${formatPercentPoint(result.input.stressInterestRate)}`,
    "공식 스트레스 금리는 실제 약정금리에 추가로 부과되는 이자가 아니며, 모든 결과는 참고용으로 실제 금융기관 심사와 다를 수 있습니다.",
  ].join("\n");
}
