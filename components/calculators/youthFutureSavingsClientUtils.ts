import type {
  YouthFutureSavingsInput,
  YouthFutureSavingsResult,
} from "@/lib/calculators/youth-future-savings";

export interface YouthFutureSavingsRawInputs {
  monthlyDeposit: string;
  termMonths: string;
  annualInterestRate: string;
  contributionType: YouthFutureSavingsInput["contributionType"];
  customContributionRate: string;
  customMonthlyContribution: string;
  taxType: YouthFutureSavingsInput["taxType"];
}

export const YOUTH_FUTURE_SAVINGS_STORAGE_KEY =
  "gyesanbox:youth-future-savings-inputs";

export const initialYouthFutureSavingsInputs: YouthFutureSavingsRawInputs = {
  monthlyDeposit: "500,000",
  termMonths: "36",
  annualInterestRate: "7",
  contributionType: "standard",
  customContributionRate: "6",
  customMonthlyContribution: "30,000",
  taxType: "taxFree",
};

export function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function formatPercent(value: number): string {
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

export function parseYouthFutureSavingsInputs(
  input: YouthFutureSavingsRawInputs,
): Partial<YouthFutureSavingsInput> {
  const monthlyDeposit = input.monthlyDeposit.trim().replaceAll(",", "");
  const termMonths = input.termMonths.trim();
  const annualInterestRate = input.annualInterestRate.trim();
  const customContributionRate = input.customContributionRate.trim();
  const customMonthlyContribution = input.customMonthlyContribution
    .trim()
    .replaceAll(",", "");

  return {
    monthlyDeposit:
      monthlyDeposit === "" ? undefined : Number(monthlyDeposit),
    termMonths: termMonths === "" ? undefined : Number(termMonths),
    annualInterestRate:
      annualInterestRate === "" ? undefined : Number(annualInterestRate),
    contributionType: input.contributionType,
    customContributionRate:
      customContributionRate === ""
        ? undefined
        : Number(customContributionRate),
    customMonthlyContribution:
      customMonthlyContribution === ""
        ? undefined
        : Number(customMonthlyContribution),
    taxType: input.taxType,
  };
}

export function serializeYouthFutureSavingsInputs(
  input: YouthFutureSavingsRawInputs,
): string {
  return JSON.stringify(input);
}

export function parseYouthFutureSavingsStoredInputs(
  value: string,
): YouthFutureSavingsRawInputs | null {
  try {
    const parsed = JSON.parse(value) as Partial<YouthFutureSavingsRawInputs>;

    if (
      typeof parsed.monthlyDeposit !== "string" ||
      typeof parsed.termMonths !== "string" ||
      typeof parsed.annualInterestRate !== "string" ||
      typeof parsed.customContributionRate !== "string" ||
      typeof parsed.customMonthlyContribution !== "string" ||
      !["standard", "preferred", "customRate", "customMonthly"].includes(
        parsed.contributionType ?? "",
      ) ||
      !["taxFree", "taxable"].includes(parsed.taxType ?? "")
    ) {
      return null;
    }

    return parsed as YouthFutureSavingsRawInputs;
  } catch {
    return null;
  }
}

export function buildYouthFutureSavingsResultText(
  result: YouthFutureSavingsResult,
): string {
  return [
    "청년미래적금 계산 결과",
    `총 납입 원금: ${formatWon(result.totalPrincipal)}`,
    `예상 세전 이자: ${formatWon(result.grossInterest)}`,
    `예상 이자세: ${formatWon(result.interestTax)}`,
    `비과세 절감액: ${formatWon(result.taxSaving)}`,
    `정부기여금 합계: ${formatWon(result.governmentContribution)}`,
    `예상 만기수령액: ${formatWon(result.maturityAmount)}`,
    `월평균 적립 효과: ${formatWon(result.averageMonthlyBenefit)}`,
    "단순 예상치이며 실제 상품 조건, 은행 금리, 납입일, 중도해지, 우대조건에 따라 달라질 수 있습니다.",
  ].join("\n");
}
