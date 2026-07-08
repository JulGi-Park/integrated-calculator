import { YOUTH_FUTURE_SAVINGS_POLICY } from "./constants";
import { validateYouthFutureSavingsInput } from "./validation";
import type {
  YouthFutureSavingsCalculationResponse,
  YouthFutureSavingsInput,
} from "./types";

function roundWon(value: number): number {
  return Math.round(value);
}

function getContributionRate(input: YouthFutureSavingsInput): number {
  if (input.contributionType === "standard") {
    return YOUTH_FUTURE_SAVINGS_POLICY.standardContributionRate;
  }

  if (input.contributionType === "preferred") {
    return YOUTH_FUTURE_SAVINGS_POLICY.preferredContributionRate;
  }

  if (input.contributionType === "customRate") {
    return input.customContributionRate ?? 0;
  }

  return 0;
}

export function calculateYouthFutureSavings(
  input: Partial<YouthFutureSavingsInput>,
): YouthFutureSavingsCalculationResponse {
  const errors = validateYouthFutureSavingsInput(input);

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const safeInput = input as YouthFutureSavingsInput;
  const totalPrincipal = roundWon(
    safeInput.monthlyDeposit * safeInput.termMonths,
  );
  const monthFactor = (safeInput.termMonths * (safeInput.termMonths + 1)) / 2;
  const monthlyRate = safeInput.annualInterestRate / 100 / 12;
  const grossInterest = roundWon(safeInput.monthlyDeposit * monthlyRate * monthFactor);
  const taxableInterestTax = roundWon(
    grossInterest * (YOUTH_FUTURE_SAVINGS_POLICY.interestIncomeTaxRate / 100),
  );
  const interestTax =
    safeInput.taxType === "taxable" ? taxableInterestTax : 0;
  const taxSaving = safeInput.taxType === "taxFree" ? taxableInterestTax : 0;
  const governmentContribution =
    safeInput.contributionType === "customMonthly"
      ? roundWon((safeInput.customMonthlyContribution ?? 0) * safeInput.termMonths)
      : roundWon(totalPrincipal * (getContributionRate(safeInput) / 100));
  const maturityAmount = roundWon(
    totalPrincipal + grossInterest - interestTax + governmentContribution,
  );
  const averageMonthlyBenefit = roundWon(
    (grossInterest - interestTax + governmentContribution) /
      safeInput.termMonths,
  );
  const effectiveContributionRate =
    totalPrincipal > 0
      ? roundWon((governmentContribution / totalPrincipal) * 10_000) / 100
      : 0;

  if (
    !Number.isFinite(maturityAmount) ||
    maturityAmount > YOUTH_FUTURE_SAVINGS_POLICY.maximumResultAmount
  ) {
    return {
      success: false,
      errors: [
        {
          field: "monthlyDeposit",
          code: "RESULT_EXCEEDS_LIMIT",
          message: "계산 결과가 너무 큽니다. 입력값을 다시 확인해 주세요.",
        },
      ],
    };
  }

  return {
    success: true,
    data: {
      monthlyDeposit: safeInput.monthlyDeposit,
      termMonths: safeInput.termMonths,
      annualInterestRate: safeInput.annualInterestRate,
      contributionType: safeInput.contributionType,
      taxType: safeInput.taxType,
      totalPrincipal,
      grossInterest,
      interestTax,
      taxSaving,
      governmentContribution,
      maturityAmount,
      averageMonthlyBenefit,
      effectiveContributionRate,
    },
  };
}
