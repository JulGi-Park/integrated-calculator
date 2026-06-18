/**
 * 주문 1건의 세전 예상 손익 계산 엔진입니다.
 *
 * 부가가치세, 소득세, 법인세, 원천징수, 반품·환불, 쿠폰 분담,
 * 플랫폼별 자동 수수료·반올림 정책과 손익분기 판매가는 계산하지 않습니다.
 * 모든 비용과 수수료율은 사용자가 직접 입력한 값을 사용합니다.
 */

export interface SellerMarginInput {
  /** 상품 판매단가 (원) */
  unitPrice: number;
  /** 판매수량 (양의 정수) */
  quantity: number;
  /** 판매자 부담 할인금액 (원) */
  sellerDiscount: number;
  /** 고객에게 받은 배송비 (원) */
  customerShippingFee: number;
  /** 상품 원가 총액 (원) */
  totalProductCost: number;
  /** 플랫폼 수수료율 (%) */
  platformFeeRate: number;
  /** 결제 수수료율 (%) */
  paymentFeeRate: number;
  /** 판매자 부담 배송비 (원) */
  sellerShippingCost: number;
  /** 주문에 배분된 광고비 (원) */
  allocatedAdCost: number;
  /** 기타 비용 (원) */
  otherCost: number;
}

export interface SellerMarginResult {
  /** 상품 판매금액 (원, 정수) */
  productSalesAmount: number;
  /** 결제금액 (원, 정수) */
  paymentAmount: number;
  /** 플랫폼 수수료 (원, 정수) */
  platformFee: number;
  /** 결제 수수료 (원, 정수) */
  paymentFee: number;
  /** 총수수료 (원, 정수) */
  totalFees: number;
  /** 예상 정산금액 (원, 정수) */
  estimatedSettlement: number;
  /** 총비용 (원, 정수) */
  totalCosts: number;
  /** 예상 순이익 (원, 정수) */
  estimatedNetProfit: number;
  /** 순이익률 (%, 소수점 둘째 자리) */
  netProfitMarginRate: number;
  /** 원가율 (%, 소수점 둘째 자리) */
  productCostRate: number;
  /** 총수수료율 (%, 소수점 둘째 자리) */
  totalFeeRate: number;
}

export type SellerMarginInputField = keyof SellerMarginInput;

export type SellerMarginValidationField =
  | SellerMarginInputField
  | "productSalesAmount"
  | "paymentAmount";

export type SellerMarginValidationErrorCode =
  | "INVALID_NUMBER"
  | "MUST_BE_POSITIVE"
  | "MUST_BE_INTEGER"
  | "MUST_BE_NON_NEGATIVE"
  | "RATE_OUT_OF_RANGE"
  | "DISCOUNT_EXCEEDS_PRODUCT_SALES"
  | "ZERO_DENOMINATOR";

export interface SellerMarginValidationError {
  field: SellerMarginValidationField;
  code: SellerMarginValidationErrorCode;
  message: string;
}

export type SellerMarginCalculationResponse =
  | {
      success: true;
      data: SellerMarginResult;
    }
  | {
      success: false;
      errors: SellerMarginValidationError[];
    };

const inputFields: SellerMarginInputField[] = [
  "unitPrice",
  "quantity",
  "sellerDiscount",
  "customerShippingFee",
  "totalProductCost",
  "platformFeeRate",
  "paymentFeeRate",
  "sellerShippingCost",
  "allocatedAdCost",
  "otherCost",
];

const nonNegativeAmountFields: SellerMarginInputField[] = [
  "sellerDiscount",
  "customerShippingFee",
  "totalProductCost",
  "sellerShippingCost",
  "allocatedAdCost",
  "otherCost",
];

const rateFields: SellerMarginInputField[] = [
  "platformFeeRate",
  "paymentFeeRate",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function hasFiniteInputFields(
  input: Record<string, unknown>,
): input is Record<string, unknown> & SellerMarginInput {
  return inputFields.every((field) => isFiniteNumber(input[field]));
}

/**
 * 0.5 경계는 0에서 먼 방향으로 반올림합니다.
 * 지수 이동을 문자열로 수행해 1.005 같은 값의 이진 부동소수점 경계 오차가
 * 소수점 둘째 자리 반올림 결과에 노출되지 않게 합니다.
 */
export function roundToDecimalPlaces(value: number, decimalPlaces: number): number {
  if (!Number.isFinite(value) || !Number.isInteger(decimalPlaces)) {
    throw new TypeError("A finite number and an integer decimal place are required.");
  }

  const sign = value < 0 ? -1 : 1;
  const absoluteValue = Math.abs(value);
  const [coefficient, exponent = "0"] = absoluteValue.toString().split("e");
  const shifted = Number(`${coefficient}e${Number(exponent) + decimalPlaces}`);
  const rounded = Math.round(shifted);
  const [roundedCoefficient, roundedExponent = "0"] = rounded
    .toString()
    .split("e");
  const restored = Number(
    `${roundedCoefficient}e${Number(roundedExponent) - decimalPlaces}`,
  );

  return sign * restored;
}

/** 금액을 원 단위 정수로 반올림합니다. */
export function roundToWon(value: number): number {
  return roundToDecimalPlaces(value, 0);
}

function addError(
  errors: SellerMarginValidationError[],
  field: SellerMarginValidationField,
  code: SellerMarginValidationErrorCode,
  message: string,
) {
  errors.push({ field, code, message });
}

export function validateSellerMarginInput(
  input: unknown,
): SellerMarginValidationError[] {
  const errors: SellerMarginValidationError[] = [];

  if (!isRecord(input)) {
    return inputFields.map((field) => ({
      field,
      code: "INVALID_NUMBER",
      message: `${field} 값은 유한한 숫자여야 합니다.`,
    }));
  }

  for (const field of inputFields) {
    if (!isFiniteNumber(input[field])) {
      addError(
        errors,
        field,
        "INVALID_NUMBER",
        `${field} 값은 유한한 숫자여야 합니다.`,
      );
    }
  }

  if (isFiniteNumber(input.unitPrice) && input.unitPrice <= 0) {
    addError(
      errors,
      "unitPrice",
      "MUST_BE_POSITIVE",
      "상품 판매단가는 0보다 커야 합니다.",
    );
  }

  if (isFiniteNumber(input.quantity)) {
    if (input.quantity < 1) {
      addError(
        errors,
        "quantity",
        "MUST_BE_POSITIVE",
        "판매수량은 1 이상이어야 합니다.",
      );
    }

    if (!Number.isInteger(input.quantity)) {
      addError(
        errors,
        "quantity",
        "MUST_BE_INTEGER",
        "판매수량은 정수여야 합니다.",
      );
    }
  }

  for (const field of nonNegativeAmountFields) {
    const value = input[field];

    if (isFiniteNumber(value) && value < 0) {
      addError(
        errors,
        field,
        "MUST_BE_NON_NEGATIVE",
        `${field} 값은 0 이상이어야 합니다.`,
      );
    }
  }

  for (const field of rateFields) {
    const value = input[field];

    if (isFiniteNumber(value) && (value < 0 || value > 100)) {
      addError(
        errors,
        field,
        "RATE_OUT_OF_RANGE",
        `${field} 값은 0% 이상 100% 이하여야 합니다.`,
      );
    }
  }

  const unitPrice = input.unitPrice;
  const quantity = input.quantity;
  const canCalculateProductSales =
    isFiniteNumber(unitPrice) &&
    unitPrice > 0 &&
    isFiniteNumber(quantity) &&
    quantity >= 1 &&
    Number.isInteger(quantity);

  if (canCalculateProductSales) {
    const productSalesAmount = roundToWon(unitPrice * quantity);

    if (
      isFiniteNumber(input.sellerDiscount) &&
      input.sellerDiscount > productSalesAmount
    ) {
      addError(
        errors,
        "sellerDiscount",
        "DISCOUNT_EXCEEDS_PRODUCT_SALES",
        "판매자 부담 할인금액은 상품 판매금액보다 클 수 없습니다.",
      );
    }

    if (productSalesAmount === 0) {
      addError(
        errors,
        "productSalesAmount",
        "ZERO_DENOMINATOR",
        "상품 판매금액이 0이면 원가율을 계산할 수 없습니다.",
      );
    }

    if (
      isFiniteNumber(input.sellerDiscount) &&
      isFiniteNumber(input.customerShippingFee) &&
      input.sellerDiscount <= productSalesAmount
    ) {
      const paymentAmount = roundToWon(
        productSalesAmount -
          input.sellerDiscount +
          input.customerShippingFee,
      );

      if (paymentAmount === 0) {
        addError(
          errors,
          "paymentAmount",
          "ZERO_DENOMINATOR",
          "결제금액이 0이면 순이익률과 총수수료율을 계산할 수 없습니다.",
        );
      }
    }
  }

  return errors;
}

export function calculateSellerMargin(
  input: unknown,
): SellerMarginCalculationResponse {
  const errors = validateSellerMarginInput(input);

  if (
    errors.length > 0 ||
    !isRecord(input) ||
    !hasFiniteInputFields(input)
  ) {
    return { success: false, errors };
  }

  const productSalesAmount = roundToWon(input.unitPrice * input.quantity);
  const paymentAmount = roundToWon(
    productSalesAmount -
      input.sellerDiscount +
      input.customerShippingFee,
  );

  // 수수료는 각각 원 단위로 먼저 반올림하고 이후 합계에 사용합니다.
  const platformFee = roundToWon(
    (productSalesAmount * input.platformFeeRate) / 100,
  );
  const paymentFee = roundToWon(
    (paymentAmount * input.paymentFeeRate) / 100,
  );
  const totalFees = platformFee + paymentFee;

  // 정산금액과 순이익은 반올림된 금액 및 수수료만으로 계산합니다.
  const estimatedSettlement = paymentAmount - platformFee - paymentFee;
  const totalCosts = roundToWon(
    input.totalProductCost +
      input.sellerShippingCost +
      input.allocatedAdCost +
      input.otherCost,
  );
  const estimatedNetProfit = estimatedSettlement - totalCosts;

  return {
    success: true,
    data: {
      productSalesAmount,
      paymentAmount,
      platformFee,
      paymentFee,
      totalFees,
      estimatedSettlement,
      totalCosts,
      estimatedNetProfit,
      netProfitMarginRate: roundToDecimalPlaces(
        (estimatedNetProfit / paymentAmount) * 100,
        2,
      ),
      productCostRate: roundToDecimalPlaces(
        (input.totalProductCost / productSalesAmount) * 100,
        2,
      ),
      totalFeeRate: roundToDecimalPlaces(
        (totalFees / paymentAmount) * 100,
        2,
      ),
    },
  };
}
