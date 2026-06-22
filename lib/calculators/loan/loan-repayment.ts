import { LOAN_REPAYMENT_POLICY } from "./policy";
import type {
  BulletResult,
  EqualPaymentResult,
  EqualPrincipalResult,
  LoanRepaymentCalculationResponse,
  LoanRepaymentComparisonResult,
  LoanRepaymentInput,
  LoanRepaymentInputField,
  LoanRepaymentSummary,
  LoanRepaymentType,
  LoanRepaymentValidationError,
  LoanRepaymentValidationErrorCode,
  LoanScheduleItem,
} from "./types";

const inputFields: LoanRepaymentInputField[] = [
  "principal",
  "annualInterestRate",
  "termMonths",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isEmpty(value: unknown): boolean {
  return value === "" || value === null || value === undefined;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function addError(
  errors: LoanRepaymentValidationError[],
  field: LoanRepaymentInputField,
  code: LoanRepaymentValidationErrorCode,
  message: string,
) {
  errors.push({ field, code, message });
}

function getDecimalPlaces(value: number): number {
  const [coefficient, exponentText] = value.toString().toLowerCase().split("e");
  const decimalPlaces = coefficient.split(".")[1]?.length ?? 0;
  const exponent = Number(exponentText ?? 0);

  return Math.max(0, decimalPlaces - exponent);
}

function hasValidInput(
  input: Record<string, unknown>,
): input is Record<string, unknown> & LoanRepaymentInput {
  return (
    isFiniteNumber(input.principal) &&
    Number.isSafeInteger(input.principal) &&
    isFiniteNumber(input.annualInterestRate) &&
    isFiniteNumber(input.termMonths) &&
    Number.isSafeInteger(input.termMonths)
  );
}

export function validateLoanRepaymentInput(
  input: unknown,
): LoanRepaymentValidationError[] {
  const errors: LoanRepaymentValidationError[] = [];

  if (!isRecord(input)) {
    return inputFields.map((field) => ({
      field,
      code: "REQUIRED",
      message: `${field} 값을 입력해 주세요.`,
    }));
  }

  for (const field of inputFields) {
    const value = input[field];

    if (isEmpty(value)) {
      addError(errors, field, "REQUIRED", `${field} 값을 입력해 주세요.`);
      continue;
    }

    if (!isFiniteNumber(value)) {
      addError(
        errors,
        field,
        "INVALID_NUMBER",
        `${field} 값은 유한한 숫자여야 합니다.`,
      );
    }
  }

  if (isFiniteNumber(input.principal)) {
    if (!Number.isInteger(input.principal)) {
      addError(
        errors,
        "principal",
        "MUST_BE_INTEGER",
        "대출원금은 원 단위 정수여야 합니다.",
      );
    } else if (!Number.isSafeInteger(input.principal)) {
      addError(
        errors,
        "principal",
        "MUST_BE_SAFE_INTEGER",
        "대출원금은 안전한 정수 범위여야 합니다.",
      );
    }

    if (input.principal < LOAN_REPAYMENT_POLICY.minimumPrincipal) {
      addError(
        errors,
        "principal",
        "MUST_BE_POSITIVE",
        "대출원금은 1원 이상이어야 합니다.",
      );
    }

    if (input.principal > LOAN_REPAYMENT_POLICY.maximumPrincipal) {
      addError(
        errors,
        "principal",
        "PRINCIPAL_EXCEEDS_LIMIT",
        `대출원금은 ${LOAN_REPAYMENT_POLICY.maximumPrincipal.toLocaleString("ko-KR")}원 이하여야 합니다.`,
      );
    }
  }

  if (isFiniteNumber(input.annualInterestRate)) {
    if (
      input.annualInterestRate <
      LOAN_REPAYMENT_POLICY.minimumAnnualInterestRate
    ) {
      addError(
        errors,
        "annualInterestRate",
        "MUST_BE_NON_NEGATIVE",
        "연이율은 0% 이상이어야 합니다.",
      );
    }

    if (
      input.annualInterestRate >
      LOAN_REPAYMENT_POLICY.maximumAnnualInterestRate
    ) {
      addError(
        errors,
        "annualInterestRate",
        "RATE_EXCEEDS_LIMIT",
        `연이율은 ${LOAN_REPAYMENT_POLICY.maximumAnnualInterestRate}% 이하여야 합니다.`,
      );
    }

    if (
      getDecimalPlaces(input.annualInterestRate) >
      LOAN_REPAYMENT_POLICY.annualInterestRateDecimalPlaces
    ) {
      addError(
        errors,
        "annualInterestRate",
        "RATE_PRECISION_EXCEEDED",
        `연이율은 소수점 이하 ${LOAN_REPAYMENT_POLICY.annualInterestRateDecimalPlaces}자리까지 지원합니다.`,
      );
    }
  }

  if (isFiniteNumber(input.termMonths)) {
    if (!Number.isInteger(input.termMonths)) {
      addError(
        errors,
        "termMonths",
        "MUST_BE_INTEGER",
        "대출기간은 정수 개월이어야 합니다.",
      );
    } else if (!Number.isSafeInteger(input.termMonths)) {
      addError(
        errors,
        "termMonths",
        "MUST_BE_SAFE_INTEGER",
        "대출기간은 안전한 정수 범위여야 합니다.",
      );
    }

    if (input.termMonths < LOAN_REPAYMENT_POLICY.minimumTermMonths) {
      addError(
        errors,
        "termMonths",
        "MUST_BE_POSITIVE",
        "대출기간은 1개월 이상이어야 합니다.",
      );
    }

    if (input.termMonths > LOAN_REPAYMENT_POLICY.maximumTermMonths) {
      addError(
        errors,
        "termMonths",
        "TERM_EXCEEDS_LIMIT",
        `대출기간은 ${LOAN_REPAYMENT_POLICY.maximumTermMonths}개월 이하여야 합니다.`,
      );
    }
  }

  return errors;
}

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  let a = left;
  let b = right;

  while (b !== BigInt(0)) {
    [a, b] = [b, a % b];
  }

  return a;
}

function getMonthlyRate(annualInterestRate: number) {
  const numerator = BigInt(
    Math.round(annualInterestRate * LOAN_REPAYMENT_POLICY.rateScale),
  );
  const denominator = BigInt(
    LOAN_REPAYMENT_POLICY.monthlyRateDenominator,
  );

  if (numerator === BigInt(0)) {
    return { numerator, denominator };
  }

  const divisor = greatestCommonDivisor(numerator, denominator);
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  };
}

function divideHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (numerator < BigInt(0) || denominator <= BigInt(0)) {
    throw new RangeError("Half-up division requires non-negative values.");
  }

  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  return remainder * BigInt(2) >= denominator
    ? quotient + BigInt(1)
    : quotient;
}

function toSafeNumber(value: bigint): number {
  const numberValue = Number(value);

  if (!Number.isSafeInteger(numberValue)) {
    throw new RangeError("Calculated amount exceeds the safe integer range.");
  }

  return numberValue;
}

function calculateInterest(
  balance: number,
  rate: ReturnType<typeof getMonthlyRate>,
): number {
  return toSafeNumber(
    divideHalfUp(BigInt(balance) * rate.numerator, rate.denominator),
  );
}

function calculateRegularEqualPayment(
  principal: number,
  termMonths: number,
  rate: ReturnType<typeof getMonthlyRate>,
): number {
  if (rate.numerator === BigInt(0)) {
    return Math.floor(principal / termMonths);
  }

  const growthNumerator = rate.denominator + rate.numerator;
  const growthNumeratorPower =
    growthNumerator ** BigInt(termMonths);
  const denominatorPower = rate.denominator ** BigInt(termMonths);
  const paymentNumerator =
    BigInt(principal) * rate.numerator * growthNumeratorPower;
  const paymentDenominator =
    rate.denominator * (growthNumeratorPower - denominatorPower);

  return toSafeNumber(divideHalfUp(paymentNumerator, paymentDenominator));
}

function summarizeSchedule(
  repaymentType: LoanRepaymentType,
  principal: number,
  termMonths: number,
  schedule: LoanScheduleItem[],
): LoanRepaymentSummary {
  const totalInterest = schedule.reduce(
    (sum, item) => sum + item.interestPayment,
    0,
  );
  const totalPayment = schedule.reduce(
    (sum, item) => sum + item.monthlyPayment,
    0,
  );

  return {
    repaymentType,
    principal,
    totalInterest,
    totalPayment,
    termMonths,
    schedule,
  };
}

export function calculateEqualPayment(
  input: LoanRepaymentInput,
): EqualPaymentResult {
  const rate = getMonthlyRate(input.annualInterestRate);
  const regularMonthlyPayment = calculateRegularEqualPayment(
    input.principal,
    input.termMonths,
    rate,
  );
  const schedule: LoanScheduleItem[] = [];
  let balance = input.principal;

  for (
    let installmentNumber = 1;
    installmentNumber <= input.termMonths;
    installmentNumber += 1
  ) {
    const openingBalance = balance;
    const interestPayment = calculateInterest(openingBalance, rate);
    const isLast = installmentNumber === input.termMonths;
    const scheduledPrincipal = Math.max(
      0,
      regularMonthlyPayment - interestPayment,
    );
    const principalPayment = isLast
      ? openingBalance
      : Math.min(openingBalance, scheduledPrincipal);
    const closingBalance = openingBalance - principalPayment;
    const monthlyPayment = principalPayment + interestPayment;

    schedule.push({
      installmentNumber,
      openingBalance,
      principalPayment,
      interestPayment,
      monthlyPayment,
      closingBalance,
    });
    balance = closingBalance;
  }

  const first = schedule[0];
  const last = schedule[schedule.length - 1];

  return {
    ...summarizeSchedule(
      "equalPayment",
      input.principal,
      input.termMonths,
      schedule,
    ),
    repaymentType: "equalPayment",
    regularMonthlyPayment,
    firstMonthPrincipal: first.principalPayment,
    firstMonthInterest: first.interestPayment,
    lastMonthPrincipal: last.principalPayment,
    lastMonthInterest: last.interestPayment,
    lastMonthPayment: last.monthlyPayment,
  };
}

export function calculateEqualPrincipal(
  input: LoanRepaymentInput,
): EqualPrincipalResult {
  const rate = getMonthlyRate(input.annualInterestRate);
  const baseMonthlyPrincipal = Math.floor(
    input.principal / input.termMonths,
  );
  const schedule: LoanScheduleItem[] = [];
  let balance = input.principal;

  for (
    let installmentNumber = 1;
    installmentNumber <= input.termMonths;
    installmentNumber += 1
  ) {
    const openingBalance = balance;
    const principalPayment =
      installmentNumber === input.termMonths
        ? openingBalance
        : Math.min(openingBalance, baseMonthlyPrincipal);
    const interestPayment = calculateInterest(openingBalance, rate);
    const closingBalance = openingBalance - principalPayment;

    schedule.push({
      installmentNumber,
      openingBalance,
      principalPayment,
      interestPayment,
      monthlyPayment: principalPayment + interestPayment,
      closingBalance,
    });
    balance = closingBalance;
  }

  const first = schedule[0];
  const last = schedule[schedule.length - 1];

  return {
    ...summarizeSchedule(
      "equalPrincipal",
      input.principal,
      input.termMonths,
      schedule,
    ),
    repaymentType: "equalPrincipal",
    baseMonthlyPrincipal,
    firstMonthPayment: first.monthlyPayment,
    lastMonthPayment: last.monthlyPayment,
    firstMonthInterest: first.interestPayment,
    lastMonthInterest: last.interestPayment,
  };
}

export function calculateBullet(
  input: LoanRepaymentInput,
): BulletResult {
  const rate = getMonthlyRate(input.annualInterestRate);
  const regularMonthlyInterest = calculateInterest(input.principal, rate);
  const schedule: LoanScheduleItem[] = [];

  for (
    let installmentNumber = 1;
    installmentNumber <= input.termMonths;
    installmentNumber += 1
  ) {
    const isLast = installmentNumber === input.termMonths;
    const principalPayment = isLast ? input.principal : 0;

    schedule.push({
      installmentNumber,
      openingBalance: input.principal,
      principalPayment,
      interestPayment: regularMonthlyInterest,
      monthlyPayment: principalPayment + regularMonthlyInterest,
      closingBalance: isLast ? 0 : input.principal,
    });
  }

  const last = schedule[schedule.length - 1];

  return {
    ...summarizeSchedule(
      "bullet",
      input.principal,
      input.termMonths,
      schedule,
    ),
    repaymentType: "bullet",
    regularMonthlyInterest,
    maturityMonthPayment: last.monthlyPayment,
    maturityMonthPrincipal: last.principalPayment,
    maturityMonthInterest: last.interestPayment,
  };
}

function getLowestTypes(
  values: Array<{ type: LoanRepaymentType; value: number }>,
): LoanRepaymentType[] {
  const minimum = Math.min(...values.map(({ value }) => value));
  return values
    .filter(({ value }) => value === minimum)
    .map(({ type }) => type);
}

export function compareLoanRepayments(
  input: LoanRepaymentInput,
): LoanRepaymentComparisonResult {
  const equalPayment = calculateEqualPayment(input);
  const equalPrincipal = calculateEqualPrincipal(input);
  const bullet = calculateBullet(input);
  const results = [equalPayment, equalPrincipal, bullet];

  return {
    equalPayment,
    equalPrincipal,
    bullet,
    lowestTotalInterestTypes: getLowestTypes(
      results.map((result) => ({
        type: result.repaymentType,
        value: result.totalInterest,
      })),
    ),
    lowestFirstMonthPaymentTypes: getLowestTypes(
      results.map((result) => ({
        type: result.repaymentType,
        value: result.schedule[0].monthlyPayment,
      })),
    ),
    levelPaymentTypes: ["equalPayment"],
    totalInterestDifferences: {
      equalPaymentVsEqualPrincipal: Math.abs(
        equalPayment.totalInterest - equalPrincipal.totalInterest,
      ),
      equalPaymentVsBullet: Math.abs(
        equalPayment.totalInterest - bullet.totalInterest,
      ),
      equalPrincipalVsBullet: Math.abs(
        equalPrincipal.totalInterest - bullet.totalInterest,
      ),
    },
  };
}

export function calculateLoanRepaymentComparison(
  input: unknown,
): LoanRepaymentCalculationResponse {
  const errors = validateLoanRepaymentInput(input);

  if (errors.length > 0 || !isRecord(input) || !hasValidInput(input)) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: compareLoanRepayments(input),
  };
}
