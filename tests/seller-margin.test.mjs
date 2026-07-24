import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateSellerMargin,
  roundToDecimalPlaces,
  roundToWon,
  SELLER_MARGIN_SERVICE_LIMITS,
  validateSellerMarginInput,
} from "../lib/calculators/seller-margin/seller-margin.ts";

const baseInput = {
  unitPrice: 20_000,
  quantity: 2,
  sellerDiscount: 2_000,
  customerShippingFee: 3_000,
  unitProductCost: 9_000,
  platformFeeRate: 10,
  paymentFeeRate: 3,
  sellerShippingCost: 3_500,
  allocatedAdCost: 2_000,
  otherCost: 500,
};

function assertSuccess(response) {
  assert.equal(response.success, true);
  return response.data;
}

function assertHasError(response, field, code) {
  assert.equal(response.success, false);
  assert.ok(
    response.errors.some(
      (error) => error.field === field && error.code === code,
    ),
    `${field} 필드에 ${code} 오류가 있어야 합니다.`,
  );
}

test("일반적인 흑자 주문의 모든 중간 결과를 계산한다", () => {
  const data = assertSuccess(calculateSellerMargin(baseInput));

  assert.deepEqual(data, {
    productSalesAmount: 40_000,
    paymentAmount: 41_000,
    platformFee: 4_000,
    paymentFee: 1_230,
    totalFees: 5_230,
    estimatedSettlement: 35_770,
    totalCosts: 24_000,
    estimatedNetProfit: 11_770,
    netProfitMarginRate: 28.71,
    productCostRate: 45,
    totalFeeRate: 12.76,
  });
});

test("비용이 매출보다 큰 적자 주문을 계산한다", () => {
  const data = assertSuccess(
    calculateSellerMargin({
      ...baseInput,
      unitPrice: 10_000,
      quantity: 1,
      sellerDiscount: 0,
      customerShippingFee: 0,
      unitProductCost: 12_000,
      platformFeeRate: 0,
      paymentFeeRate: 0,
      sellerShippingCost: 0,
      allocatedAdCost: 0,
      otherCost: 0,
    }),
  );

  assert.deepEqual(data, {
    productSalesAmount: 10_000,
    paymentAmount: 10_000,
    platformFee: 0,
    paymentFee: 0,
    totalFees: 0,
    estimatedSettlement: 10_000,
    totalCosts: 12_000,
    estimatedNetProfit: -2_000,
    netProfitMarginRate: -20,
    productCostRate: 120,
    totalFeeRate: 0,
  });
});

test("플랫폼·결제 수수료율 0%를 허용한다", () => {
  const data = assertSuccess(
    calculateSellerMargin({
      ...baseInput,
      sellerDiscount: 0,
      customerShippingFee: 0,
      platformFeeRate: 0,
      paymentFeeRate: 0,
    }),
  );

  assert.equal(data.platformFee, 0);
  assert.equal(data.paymentFee, 0);
  assert.equal(data.totalFees, 0);
  assert.equal(data.totalFeeRate, 0);
});

test("판매자 부담 배송비가 0원인 무료배송 주문을 계산한다", () => {
  const data = assertSuccess(
    calculateSellerMargin({ ...baseInput, sellerShippingCost: 0 }),
  );

  assert.equal(data.totalCosts, 20_500);
  assert.equal(data.estimatedNetProfit, 15_270);
});

test("고객에게 받은 배송비를 결제금액에 더한다", () => {
  const data = assertSuccess(
    calculateSellerMargin({
      ...baseInput,
      unitPrice: 10_000,
      quantity: 1,
      sellerDiscount: 0,
      customerShippingFee: 3_000,
      unitProductCost: 4_000,
      platformFeeRate: 0,
      paymentFeeRate: 0,
      sellerShippingCost: 3_000,
      allocatedAdCost: 0,
      otherCost: 0,
    }),
  );

  assert.equal(data.productSalesAmount, 10_000);
  assert.equal(data.paymentAmount, 13_000);
  assert.equal(data.estimatedNetProfit, 6_000);
});

test("판매자 부담 할인금액을 결제금액에서 뺀다", () => {
  const data = assertSuccess(
    calculateSellerMargin({
      ...baseInput,
      unitPrice: 10_000,
      quantity: 1,
      sellerDiscount: 1_500,
      customerShippingFee: 0,
      unitProductCost: 4_000,
      platformFeeRate: 0,
      paymentFeeRate: 0,
      sellerShippingCost: 0,
      allocatedAdCost: 0,
      otherCost: 0,
    }),
  );

  assert.equal(data.paymentAmount, 8_500);
  assert.equal(data.estimatedNetProfit, 4_500);
});

test("소수 수수료율을 각각 원 단위로 반올림한다", () => {
  const data = assertSuccess(
    calculateSellerMargin({
      ...baseInput,
      unitPrice: 9_999,
      quantity: 1,
      sellerDiscount: 0,
      customerShippingFee: 0,
      unitProductCost: 5_000,
      platformFeeRate: 2.5,
      paymentFeeRate: 1.5,
      sellerShippingCost: 0,
      allocatedAdCost: 0,
      otherCost: 0,
    }),
  );

  assert.deepEqual(data, {
    productSalesAmount: 9_999,
    paymentAmount: 9_999,
    platformFee: 250,
    paymentFee: 150,
    totalFees: 400,
    estimatedSettlement: 9_599,
    totalCosts: 5_000,
    estimatedNetProfit: 4_599,
    netProfitMarginRate: 45.99,
    productCostRate: 50.01,
    totalFeeRate: 4,
  });
});

test("판매수량을 판매단가와 1개당 원가에 각각 곱한다", () => {
  const data = assertSuccess(
    calculateSellerMargin({
      ...baseInput,
      unitPrice: 7_500,
      quantity: 4,
      sellerDiscount: 0,
      customerShippingFee: 0,
      unitProductCost: 3_000,
      platformFeeRate: 0,
      paymentFeeRate: 0,
      sellerShippingCost: 0,
      allocatedAdCost: 0,
      otherCost: 0,
    }),
  );

  assert.equal(data.productSalesAmount, 30_000);
  assert.equal(data.totalCosts, 12_000);
  assert.equal(data.estimatedNetProfit, 18_000);
});

test("판매단가가 0원이면 계산하지 않는다", () => {
  const response = calculateSellerMargin({ ...baseInput, unitPrice: 0 });

  assertHasError(response, "unitPrice", "MUST_BE_POSITIVE");
});

test("금액 입력의 서비스 상한과 안전 정수 범위를 검증한다", () => {
  const maximumAmount = SELLER_MARGIN_SERVICE_LIMITS.maximumAmount;

  assert.equal(
    validateSellerMarginInput({ ...baseInput, unitPrice: maximumAmount }).length,
    0,
  );
  assertHasError(
    calculateSellerMargin({ ...baseInput, unitPrice: maximumAmount + 1 }),
    "unitPrice",
    "AMOUNT_EXCEEDS_LIMIT",
  );
  assertHasError(
    calculateSellerMargin({ ...baseInput, unitPrice: Number.MAX_SAFE_INTEGER + 1 }),
    "unitPrice",
    "MUST_BE_SAFE_INTEGER",
  );
  assertHasError(
    calculateSellerMargin({ ...baseInput, unitPrice: 999_999_999_999_999_999 }),
    "unitPrice",
    "MUST_BE_SAFE_INTEGER",
  );
});

test("범위 내 입력이라도 판매단가 또는 원가와 수량의 곱이 안전 정수를 넘으면 거부한다", () => {
  const safeRangeButUnsafeProduct = {
    ...baseInput,
    unitPrice: SELLER_MARGIN_SERVICE_LIMITS.maximumAmount,
    quantity: SELLER_MARGIN_SERVICE_LIMITS.maximumQuantity,
  };

  assertHasError(
    calculateSellerMargin(safeRangeButUnsafeProduct),
    "unitPrice",
    "CALCULATION_EXCEEDS_SAFE_RANGE",
  );
  assertHasError(
    calculateSellerMargin({
      ...safeRangeButUnsafeProduct,
      unitPrice: 1,
      unitProductCost: SELLER_MARGIN_SERVICE_LIMITS.maximumAmount,
    }),
    "unitProductCost",
    "CALCULATION_EXCEEDS_SAFE_RANGE",
  );
});

for (const field of [
  "unitPrice",
  "sellerDiscount",
  "customerShippingFee",
  "unitProductCost",
  "sellerShippingCost",
  "allocatedAdCost",
  "otherCost",
]) {
  test(`${field} 금액이 음수이면 거부한다`, () => {
    const response = calculateSellerMargin({ ...baseInput, [field]: -1 });
    const expectedCode =
      field === "unitPrice" ? "MUST_BE_POSITIVE" : "MUST_BE_NON_NEGATIVE";

    assertHasError(response, field, expectedCode);
  });
}

test("수수료율이 100%를 초과하면 거부한다", () => {
  assertHasError(
    calculateSellerMargin({ ...baseInput, platformFeeRate: 100.01 }),
    "platformFeeRate",
    "RATE_OUT_OF_RANGE",
  );
  assertHasError(
    calculateSellerMargin({ ...baseInput, paymentFeeRate: 101 }),
    "paymentFeeRate",
    "RATE_OUT_OF_RANGE",
  );
});

test("수수료율이 0% 미만이면 거부한다", () => {
  assertHasError(
    calculateSellerMargin({ ...baseInput, platformFeeRate: -0.01 }),
    "platformFeeRate",
    "RATE_OUT_OF_RANGE",
  );
  assertHasError(
    calculateSellerMargin({ ...baseInput, paymentFeeRate: -1 }),
    "paymentFeeRate",
    "RATE_OUT_OF_RANGE",
  );
});

test("판매자 부담 할인금액이 상품 판매금액보다 크면 거부한다", () => {
  assertHasError(
    calculateSellerMargin({
      ...baseInput,
      unitPrice: 10_000,
      quantity: 1,
      sellerDiscount: 10_001,
    }),
    "sellerDiscount",
    "DISCOUNT_EXCEEDS_PRODUCT_SALES",
  );
});

for (const invalidValue of [Number.NaN, Infinity, -Infinity]) {
  test(`${String(invalidValue)} 입력을 거부한다`, () => {
    assertHasError(
      calculateSellerMargin({ ...baseInput, unitProductCost: invalidValue }),
      "unitProductCost",
      "INVALID_NUMBER",
    );
  });
}

test("원 단위와 소수점 둘째 자리의 0.5 경계를 안정적으로 반올림한다", () => {
  assert.equal(roundToWon(10.5), 11);
  assert.equal(roundToWon(-10.5), -11);
  assert.equal(roundToDecimalPlaces(1.005, 2), 1.01);
  assert.equal(roundToDecimalPlaces(-1.005, 2), -1.01);

  const data = assertSuccess(
    calculateSellerMargin({
      ...baseInput,
      unitPrice: 1_050,
      quantity: 1,
      sellerDiscount: 0,
      customerShippingFee: 0,
      unitProductCost: 0,
      platformFeeRate: 1,
      paymentFeeRate: 0,
      sellerShippingCost: 0,
      allocatedAdCost: 0,
      otherCost: 0,
    }),
  );

  assert.equal(data.platformFee, 11);
});

test("결제금액이 0이면 비율 분모 오류를 반환한다", () => {
  assertHasError(
    calculateSellerMargin({
      ...baseInput,
      unitPrice: 10_000,
      quantity: 1,
      sellerDiscount: 10_000,
      customerShippingFee: 0,
    }),
    "paymentAmount",
    "ZERO_DENOMINATOR",
  );
});

test("계산 함수는 입력 객체를 변경하지 않는다", () => {
  const input = { ...baseInput };
  const snapshot = structuredClone(input);

  calculateSellerMargin(input);

  assert.deepEqual(input, snapshot);
});

test("판매수량이 소수이면 거부한다", () => {
  assertHasError(
    calculateSellerMargin({ ...baseInput, quantity: 1.5 }),
    "quantity",
    "MUST_BE_INTEGER",
  );
});

test("판매수량이 1 미만이면 거부한다", () => {
  assertHasError(
    calculateSellerMargin({ ...baseInput, quantity: 0 }),
    "quantity",
    "MUST_BE_POSITIVE",
  );
});

for (const invalidValue of ["10000", null, undefined]) {
  test(`런타임 숫자 아닌 값 ${String(invalidValue)}을 거부한다`, () => {
    assertHasError(
      calculateSellerMargin({ ...baseInput, unitPrice: invalidValue }),
      "unitPrice",
      "INVALID_NUMBER",
    );
  });
}

test("수수료율이 정확히 0%이면 유효하다", () => {
  const errors = validateSellerMarginInput({
    ...baseInput,
    platformFeeRate: 0,
    paymentFeeRate: 0,
  });

  assert.equal(errors.length, 0);
});

test("수수료율이 정확히 100%이면 유효하다", () => {
  const data = assertSuccess(
    calculateSellerMargin({
      ...baseInput,
      unitPrice: 10_000,
      quantity: 1,
      sellerDiscount: 0,
      customerShippingFee: 0,
      unitProductCost: 0,
      platformFeeRate: 100,
      paymentFeeRate: 100,
      sellerShippingCost: 0,
      allocatedAdCost: 0,
      otherCost: 0,
    }),
  );

  assert.equal(data.platformFee, 10_000);
  assert.equal(data.paymentFee, 10_000);
  assert.equal(data.totalFees, 20_000);
  assert.equal(data.totalFeeRate, 200);
});

test("여러 입력 오류를 한 번에 반환하고 부분 결과를 반환하지 않는다", () => {
  const response = calculateSellerMargin({
    ...baseInput,
    unitPrice: 0,
    quantity: 1.5,
    otherCost: -1,
    platformFeeRate: 101,
  });

  assert.equal(response.success, false);
  assert.ok(response.errors.length >= 4);
  assert.equal("data" in response, false);
});
