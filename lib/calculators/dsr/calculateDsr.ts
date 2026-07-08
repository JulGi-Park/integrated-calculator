import { DSR_POLICY } from "./constants";
import { validateDsrInput } from "./validation";
import type {
  DsrCalculationResponse,
  DsrInput,
  DsrLoanPaymentSummary,
  DsrRepaymentType,
  DsrScenarioResult,
} from "./types";

function roundWon(value: number): number {
  return Math.round(value);
}

function roundRate(value: number): number {
  return Math.round(value * 100) / 100;
}

function getLevelPaymentMonthlyPayment(
  principal: number,
  annualInterestRate: number,
  termMonths: number,
): number {
  const monthlyRate = annualInterestRate / 100 / 12;

  if (monthlyRate === 0) {
    return roundWon(principal / termMonths);
  }

  const factor = (1 + monthlyRate) ** termMonths;
  return roundWon((principal * monthlyRate * factor) / (factor - 1));
}

export function calculateNewLoanPayment(
  principal: number,
  annualInterestRate: number,
  termMonths: number,
  repaymentType: DsrRepaymentType,
): DsrLoanPaymentSummary {
  const monthlyRate = annualInterestRate / 100 / 12;

  if (repaymentType === "levelPayment") {
    const monthlyPayment = getLevelPaymentMonthlyPayment(
      principal,
      annualInterestRate,
      termMonths,
    );
    const totalPayment = monthlyPayment * termMonths;

    return {
      repaymentType,
      monthlyPayment,
      firstMonthlyPayment: monthlyPayment,
      averageMonthlyPayment: monthlyPayment,
      annualPaymentForDsr: roundWon(monthlyPayment * 12),
      totalInterest: roundWon(totalPayment - principal),
      maturityPrincipal: 0,
      annualInterestRate,
    };
  }

  if (repaymentType === "equalPrincipal") {
    const monthlyPrincipal = principal / termMonths;
    let totalInterest = 0;

    for (let month = 0; month < termMonths; month += 1) {
      const openingBalance = Math.max(principal - monthlyPrincipal * month, 0);
      totalInterest += openingBalance * monthlyRate;
    }

    const firstMonthlyPayment = roundWon(principal * monthlyRate + monthlyPrincipal);
    const averageMonthlyPayment = roundWon((principal + totalInterest) / termMonths);

    return {
      repaymentType,
      monthlyPayment: averageMonthlyPayment,
      firstMonthlyPayment,
      averageMonthlyPayment,
      annualPaymentForDsr: roundWon(averageMonthlyPayment * 12),
      totalInterest: roundWon(totalInterest),
      maturityPrincipal: 0,
      annualInterestRate,
    };
  }

  const monthlyInterest = roundWon(principal * monthlyRate);

  return {
    repaymentType,
    monthlyPayment: monthlyInterest,
    firstMonthlyPayment: monthlyInterest,
    averageMonthlyPayment: monthlyInterest,
    annualPaymentForDsr: roundWon(monthlyInterest * 12),
    totalInterest: roundWon(monthlyInterest * termMonths),
    maturityPrincipal: roundWon(principal),
    annualInterestRate,
  };
}

function buildScenario(
  input: DsrInput,
  annualInterestRate: number,
): DsrScenarioResult {
  const newLoanPayment = calculateNewLoanPayment(
    input.newLoanPrincipal,
    annualInterestRate,
    input.termMonths,
    input.repaymentType,
  );
  const totalAnnualDebtPayment = roundWon(
    input.existingAnnualDebtPayment + newLoanPayment.annualPaymentForDsr,
  );
  const dsrRate = roundRate(
    (totalAnnualDebtPayment / input.annualIncome) * 100,
  );
  const remainingAnnualPaymentRoom = roundWon(
    input.annualIncome * (input.dsrLimitRate / 100) -
      totalAnnualDebtPayment,
  );
  const remainingDsrRateRoom = roundRate(input.dsrLimitRate - dsrRate);
  const status = dsrRate <= input.dsrLimitRate ? "withinLimit" : "exceedsLimit";

  return {
    newLoanPayment,
    totalAnnualDebtPayment,
    dsrRate,
    remainingAnnualPaymentRoom,
    remainingDsrRateRoom,
    status,
    interpretation:
      status === "withinLimit"
        ? "입력한 DSR 기준 안에 있는 예상값입니다. 실제 승인 가능 여부는 금융기관 심사에서 달라질 수 있습니다."
        : "입력한 DSR 기준을 초과하는 예상값입니다. 대출금액, 기간, 금리 조건을 다시 확인해 보세요.",
  };
}

export function calculateDsr(
  input: Partial<DsrInput>,
): DsrCalculationResponse {
  const errors = validateDsrInput(input);

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const safeInput = input as DsrInput;
  const base = buildScenario(safeInput, safeInput.annualInterestRate);
  const stressed = buildScenario(
    safeInput,
    safeInput.annualInterestRate + safeInput.stressInterestRate,
  );

  if (
    !Number.isFinite(base.dsrRate) ||
    !Number.isFinite(stressed.dsrRate) ||
    base.totalAnnualDebtPayment > DSR_POLICY.maximumAmount ||
    stressed.totalAnnualDebtPayment > DSR_POLICY.maximumAmount
  ) {
    return {
      success: false,
      errors: [
        {
          field: "newLoanPrincipal",
          code: "RESULT_EXCEEDS_LIMIT",
          message: "계산 결과가 너무 큽니다. 입력값을 다시 확인해 주세요.",
        },
      ],
    };
  }

  return {
    success: true,
    data: {
      input: safeInput,
      base,
      stressed,
    },
  };
}
