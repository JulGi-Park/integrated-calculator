import { DSR_POLICY } from "./constants";
import { DSR_DEBT_SERVICE_POLICY } from "./debtServicePolicy";
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

interface AssessmentMaturity {
  months: number;
  reason: string;
}

interface PaymentScheduleSummary {
  monthlyPayment: number;
  firstMonthlyPayment: number;
  averageMonthlyPayment: number;
  firstYearPrincipal: number;
  firstYearInterest: number;
  firstYearPayment: number;
  totalInterest: number;
}

export function getDsrAssessmentMaturity(input: DsrInput): AssessmentMaturity {
  const policy = DSR_DEBT_SERVICE_POLICY;

  if (input.loanType === "credit") {
    const isRecognizedInstallment =
      input.repaymentType !== "bullet" &&
      input.gracePeriodMonths === 0 &&
      (input.creditRepaymentFrequency === "monthly" ||
        input.creditRepaymentFrequency === "quarterly") &&
      input.creditInstallmentRatio >= policy.creditInstallmentMinimumRatio &&
      input.termMonths >= policy.creditInstallmentMinimumMaturityMonths &&
      input.termMonths <= policy.creditInstallmentMaximumMaturityMonths;

    return isRecognizedInstallment
      ? {
          months: input.termMonths,
          reason: "무거치·월/분기 균등분할·40% 이상 상환 요건을 충족해 실제 약정만기를 적용했습니다.",
        }
      : {
          months: policy.creditDefaultMaturityMonths,
          reason: "신용대출 분할상환 인정요건을 충족하지 않아 5년을 적용했습니다.",
        };
  }

  if (input.loanType === "nonHousingMortgage") {
    return {
      months: policy.nonHousingMortgageMaturityMonths,
      reason: "오피스텔 외 비주택담보대출 기준인 8년을 적용했습니다.",
    };
  }

  if (input.loanType === "leaseDepositSecured") {
    return {
      months: policy.leaseDepositSecuredMaturityMonths,
      reason: "전세보증금담보대출 기준인 4년을 적용했습니다.",
    };
  }

  if (
    input.loanType === "officetelMortgage" &&
    (input.repaymentType === "bullet" ||
      (input.repaymentType === "partialInstallment" &&
        input.gracePeriodMonths > 12))
  ) {
    return {
      months: policy.officetelBulletMaturityMonths,
      reason: "오피스텔담보 일시상환(또는 1년 초과 거치 일부상환) 기준인 8년을 적용했습니다.",
    };
  }

  if (input.repaymentType === "bullet") {
    return {
      months: Math.min(input.termMonths, policy.mortgageBulletMaximumMaturityMonths),
      reason: "주택담보 일시상환 기준에 따라 실제 만기를 최대 10년까지만 적용했습니다.",
    };
  }

  return {
    months: Math.min(input.termMonths, policy.generalMaximumMaturityMonths),
    reason:
      input.termMonths > policy.generalMaximumMaturityMonths
        ? "상환능력 입증을 별도로 입력받지 않아 산정만기를 40년으로 제한했습니다."
        : "입력한 실제 약정만기를 적용했습니다.",
  };
}

function buildSchedule(
  principal: number,
  annualInterestRate: number,
  termMonths: number,
  repaymentType: DsrRepaymentType,
  gracePeriodMonths: number,
  balloonPrincipal: number,
): PaymentScheduleSummary {
  const monthlyRate = annualInterestRate / 100 / 12;
  const safeGrace = Math.min(gracePeriodMonths, Math.max(termMonths - 1, 0));
  const amortizationMonths = Math.max(termMonths - safeGrace, 1);
  const amortizingPrincipal =
    repaymentType === "partialInstallment"
      ? Math.max(principal - balloonPrincipal, 0)
      : repaymentType === "bullet"
        ? 0
        : principal;
  const levelPayment =
    amortizingPrincipal === 0
      ? 0
      : monthlyRate === 0
        ? amortizingPrincipal / amortizationMonths
        : (amortizingPrincipal * monthlyRate * (1 + monthlyRate) ** amortizationMonths) /
          ((1 + monthlyRate) ** amortizationMonths - 1);
  const equalPrincipal = amortizingPrincipal / amortizationMonths;
  let balance = principal;
  let firstMonthlyPayment = 0;
  let firstYearPrincipal = 0;
  let firstYearInterest = 0;
  let firstYearPayment = 0;
  let totalInterest = 0;
  let totalContractPayment = 0;

  for (let month = 0; month < termMonths; month += 1) {
    const interest = balance * monthlyRate;
    const isGrace = month < safeGrace;
    let principalPayment = 0;

    if (!isGrace && repaymentType !== "bullet") {
      principalPayment =
        repaymentType === "levelPayment"
          ? Math.min(Math.max(levelPayment - interest, 0), balance)
          : Math.min(equalPrincipal, Math.max(balance - balloonPrincipal, 0));
    }

    const payment = interest + principalPayment;
    if (month === 0) firstMonthlyPayment = payment;
    if (month < 12) {
      firstYearPrincipal += principalPayment;
      firstYearInterest += interest;
      firstYearPayment += payment;
    }
    totalInterest += interest;
    totalContractPayment += payment;
    balance = Math.max(balance - principalPayment, 0);
  }

  return {
    monthlyPayment: roundWon(firstMonthlyPayment),
    firstMonthlyPayment: roundWon(firstMonthlyPayment),
    averageMonthlyPayment: roundWon(totalContractPayment / termMonths),
    firstYearPrincipal: roundWon(firstYearPrincipal),
    firstYearInterest: roundWon(firstYearInterest),
    firstYearPayment: roundWon(firstYearPayment),
    totalInterest: roundWon(totalInterest),
  };
}

export function calculateAnnualDsrDebtService(
  input: DsrInput,
  annualInterestRate = input.annualInterestRate,
): DsrLoanPaymentSummary {
  const assessment = getDsrAssessmentMaturity(input);
  const scheduleRepaymentType =
    input.loanType === "officetelMortgage" &&
    input.repaymentType === "partialInstallment" &&
    input.gracePeriodMonths > 12
      ? "bullet"
      : input.repaymentType;
  const assessmentSchedule = buildSchedule(
    input.newLoanPrincipal,
    annualInterestRate,
    assessment.months,
    scheduleRepaymentType,
    input.gracePeriodMonths,
    input.balloonPrincipal,
  );
  const contractSchedule = buildSchedule(
    input.newLoanPrincipal,
    annualInterestRate,
    input.termMonths,
    input.repaymentType,
    input.gracePeriodMonths,
    input.balloonPrincipal,
  );
  const annualPrincipalForDsr = calculateDsrPrincipal(
    input,
    assessment,
    assessmentSchedule,
    scheduleRepaymentType,
  );
  const annualInterestForDsr = calculateDsrInterest(contractSchedule);

  return {
    repaymentType: input.repaymentType,
    monthlyPayment: contractSchedule.monthlyPayment,
    firstMonthlyPayment: contractSchedule.firstMonthlyPayment,
    averageMonthlyPayment: contractSchedule.averageMonthlyPayment,
    contractAnnualPayment: contractSchedule.firstYearPayment,
    annualPrincipalForDsr,
    annualInterestForDsr,
    annualPaymentForDsr: roundWon(annualPrincipalForDsr + annualInterestForDsr),
    assessmentMaturityMonths: assessment.months,
    assessmentReason: assessment.reason,
    totalInterest: contractSchedule.totalInterest,
    maturityPrincipal:
      input.repaymentType === "partialInstallment"
        ? roundWon(input.balloonPrincipal)
        : input.repaymentType === "bullet"
          ? roundWon(input.newLoanPrincipal)
          : 0,
    annualInterestRate,
  };
}

export function calculateDsrPrincipal(
  input: DsrInput,
  assessment = getDsrAssessmentMaturity(input),
  schedule = buildSchedule(
    input.newLoanPrincipal,
    input.annualInterestRate,
    assessment.months,
    input.repaymentType,
    input.gracePeriodMonths,
    input.balloonPrincipal,
  ),
  scheduleRepaymentType: DsrRepaymentType = input.repaymentType,
): number {
  let annualPrincipalForDsr: number;

  if (
    input.loanType === "credit" ||
    input.loanType === "nonHousingMortgage" ||
    input.loanType === "leaseDepositSecured" ||
    scheduleRepaymentType === "bullet"
  ) {
    annualPrincipalForDsr =
      (input.newLoanPrincipal / assessment.months) * 12;
  } else if (input.repaymentType === "partialInstallment") {
    const repaymentMonths = Math.max(
      assessment.months - Math.min(input.gracePeriodMonths, assessment.months - 1),
      1,
    );
    annualPrincipalForDsr =
      schedule.firstYearPrincipal + (input.balloonPrincipal / repaymentMonths) * 12;
  } else {
    annualPrincipalForDsr = schedule.firstYearPrincipal;
  }

  return roundWon(annualPrincipalForDsr);
}

export function calculateDsrInterest(schedule: PaymentScheduleSummary): number {
  return roundWon(schedule.firstYearInterest);
}

export function calculateNewLoanPayment(
  principal: number,
  annualInterestRate: number,
  termMonths: number,
  repaymentType: DsrRepaymentType,
): DsrLoanPaymentSummary {
  return calculateAnnualDsrDebtService({
    annualIncome: 1,
    existingAnnualDebtPayment: 0,
    newLoanPrincipal: principal,
    annualInterestRate,
    termMonths,
    loanType: "mortgage",
    repaymentType,
    gracePeriodMonths: 0,
    balloonPrincipal: 0,
    creditInstallmentRatio: 100,
    creditRepaymentFrequency: "monthly",
    stressInterestRate: 0,
    dsrLimitRate: 40,
  });
}

function buildScenario(input: DsrInput, annualInterestRate: number): DsrScenarioResult {
  const newLoanPayment = calculateAnnualDsrDebtService(input, annualInterestRate);
  const totalAnnualDebtPayment = roundWon(
    input.existingAnnualDebtPayment + newLoanPayment.annualPaymentForDsr,
  );
  const dsrRate = roundRate((totalAnnualDebtPayment / input.annualIncome) * 100);
  const remainingAnnualPaymentRoom = roundWon(
    input.annualIncome * (input.dsrLimitRate / 100) - totalAnnualDebtPayment,
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
        ? "입력한 DSR 기준 안에 있는 예상값입니다. 실제 심사는 소득 인정, 제외대출, 상품 조건에 따라 달라질 수 있습니다."
        : "입력한 DSR 기준을 초과하는 예상값입니다. 대출금액, 기간, 금리 조건을 다시 확인해 보세요.",
  };
}

export function calculateDsr(input: Partial<DsrInput>): DsrCalculationResponse {
  const errors = validateDsrInput(input);
  if (errors.length > 0) return { success: false, errors };

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
      errors: [{
        field: "newLoanPrincipal",
        code: "RESULT_EXCEEDS_LIMIT",
        message: "계산 결과가 너무 큽니다. 입력값을 다시 확인해 주세요.",
      }],
    };
  }

  return { success: true, data: { input: safeInput, base, stressed } };
}
