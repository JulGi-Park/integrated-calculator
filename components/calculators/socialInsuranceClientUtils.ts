import type {
  SocialInsuranceInput,
  SocialInsuranceResult,
} from "@/lib/calculators/social-insurance/types";

export interface SocialInsuranceRawInputs {
  monthlySalary: string;
  nonTaxableAmount: string;
}

export const SOCIAL_INSURANCE_STORAGE_KEY =
  "gyesanbox:social-insurance-inputs";

export const initialSocialInsuranceInputs: SocialInsuranceRawInputs = {
  monthlySalary: "",
  nonTaxableAmount: "0",
};

function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function serializeSocialInsuranceInputs(
  input: SocialInsuranceRawInputs,
): string {
  return JSON.stringify(input);
}

export function parseSocialInsuranceStoredInputs(
  value: string,
): SocialInsuranceRawInputs | null {
  try {
    const parsed = JSON.parse(value) as Partial<SocialInsuranceRawInputs>;

    if (
      typeof parsed.monthlySalary === "string" &&
      typeof parsed.nonTaxableAmount === "string"
    ) {
      return {
        monthlySalary: parsed.monthlySalary,
        nonTaxableAmount: parsed.nonTaxableAmount,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function buildSocialInsuranceResultText(
  input: SocialInsuranceInput,
  result: SocialInsuranceResult,
): string {
  return [
    "2026 4대보험 계산 결과",
    `월 급여: ${formatWon(input.monthlySalary)}`,
    `비과세 금액: ${formatWon(input.nonTaxableAmount)}`,
    `과세기준급여: ${formatWon(result.taxableMonthlyPay)}`,
    `국민연금: ${formatWon(result.employeePension)}`,
    `건강보험: ${formatWon(result.employeeHealthInsurance)}`,
    `장기요양보험: ${formatWon(result.employeeLongTermCare)}`,
    `고용보험: ${formatWon(result.employeeEmploymentInsurance)}`,
    `총 공제액: ${formatWon(result.totalEmployeeContribution)}`,
    `공제 후 참고 금액: ${formatWon(result.afterContributionAmount)}`,
    `기준일: ${result.policyVerifiedAt}`,
    "산재보험과 소득세·지방소득세는 포함하지 않습니다.",
  ].join("\n");
}
