import type {
  CardInstallmentCalculationResponse,
  CardInstallmentInput,
  CardInstallmentResult,
  CardInstallmentScheduleItem,
} from "./types";
import {
  hasValidCardInstallmentInput,
  validateCardInstallmentInput,
} from "./validation";

function assertFiniteSafeResult(result: CardInstallmentResult) {
  const numericValues = [
    result.purchaseAmount,
    result.installmentMonths,
    result.annualFeeRatePercent,
    result.monthlyFeeRate,
    result.baseMonthlyPrincipal,
    result.totalFee,
    result.totalPayment,
    result.extraCostComparedWithLumpSum,
    ...result.schedule.flatMap((item) => [
      item.installmentNumber,
      item.openingBalance,
      item.principalPayment,
      item.fee,
      item.monthlyPayment,
      item.closingBalance,
    ]),
  ];

  if (numericValues.some((value) => !Number.isFinite(value))) {
    throw new RangeError("Card installment calculation produced NaN/Infinity.");
  }

  if (result.totalPayment < result.purchaseAmount) {
    throw new RangeError("Total payment cannot be less than purchase amount.");
  }

  const principalSum = result.schedule.reduce(
    (sum, item) => sum + item.principalPayment,
    0,
  );
  const feeSum = result.schedule.reduce((sum, item) => sum + item.fee, 0);
  const paymentSum = result.schedule.reduce(
    (sum, item) => sum + item.monthlyPayment,
    0,
  );

  if (
    principalSum !== result.purchaseAmount ||
    feeSum !== result.totalFee ||
    paymentSum !== result.totalPayment
  ) {
    throw new RangeError("Card installment schedule totals are inconsistent.");
  }
}

export function calculateCardInstallment(
  input: CardInstallmentInput,
): CardInstallmentResult {
  const monthlyFeeRate = input.annualFeeRatePercent / 100 / 12;
  const baseMonthlyPrincipal = Math.floor(
    input.purchaseAmount / input.installmentMonths,
  );
  const schedule: CardInstallmentScheduleItem[] = [];
  let balance = input.purchaseAmount;
  let paidPrincipal = 0;

  for (
    let installmentNumber = 1;
    installmentNumber <= input.installmentMonths;
    installmentNumber += 1
  ) {
    const openingBalance = balance;
    const isLast = installmentNumber === input.installmentMonths;
    const principalPayment = isLast
      ? input.purchaseAmount - paidPrincipal
      : baseMonthlyPrincipal;
    const fee = Math.round(openingBalance * monthlyFeeRate);
    const monthlyPayment = principalPayment + fee;
    const closingBalance = openingBalance - principalPayment;

    schedule.push({
      installmentNumber,
      openingBalance,
      principalPayment,
      fee,
      monthlyPayment,
      closingBalance,
    });

    paidPrincipal += principalPayment;
    balance = closingBalance;
  }

  const totalFee = schedule.reduce((sum, item) => sum + item.fee, 0);
  const result: CardInstallmentResult = {
    purchaseAmount: input.purchaseAmount,
    installmentMonths: input.installmentMonths,
    annualFeeRatePercent: input.annualFeeRatePercent,
    monthlyFeeRate,
    baseMonthlyPrincipal,
    totalFee,
    totalPayment: input.purchaseAmount + totalFee,
    extraCostComparedWithLumpSum: totalFee,
    schedule,
  };

  assertFiniteSafeResult(result);
  return result;
}

export function calculateCardInstallmentFromUnknown(
  input: unknown,
): CardInstallmentCalculationResponse {
  const errors = validateCardInstallmentInput(input);

  if (errors.length > 0 || !hasValidCardInstallmentInput(input)) {
    return { success: false, errors };
  }

  try {
    return {
      success: true,
      data: calculateCardInstallment(input),
    };
  } catch {
    return {
      success: false,
      errors: [
        {
          field: "purchaseAmount",
          code: "INVALID_NUMBER",
          message: "계산 결과를 만들 수 없습니다. 입력값을 확인해 주세요.",
        },
      ],
    };
  }
}
