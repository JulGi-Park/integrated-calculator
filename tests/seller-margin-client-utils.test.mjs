import assert from "node:assert/strict";
import test from "node:test";
import { calculateSellerMargin } from "../lib/calculators/seller-margin/seller-margin.ts";
import {
  buildSellerMarginResultText,
  initialSellerMarginInput,
  parseSellerMarginStoredInputs,
  SELLER_MARGIN_STORAGE_KEY,
  serializeSellerMarginInputs,
} from "../components/calculators/sellerMarginClientUtils.ts";

const verifiedInput = {
  unitPrice: 100_000,
  quantity: 5,
  sellerDiscount: 0,
  customerShippingFee: 1_000,
  unitProductCost: 30_000,
  platformFeeRate: 3,
  paymentFeeRate: 1,
  sellerShippingCost: 3_000,
  allocatedAdCost: 1_000,
  otherCost: 500,
};

const verifiedResult = calculateSellerMargin(verifiedInput);

assert.equal(verifiedResult.success, true);

test("복사 문자열을 고정 형식과 한국어 금액으로 생성한다", () => {
  if (!verifiedResult.success) {
    assert.fail("회귀 계산 결과가 유효해야 합니다.");
  }

  const text = buildSellerMarginResultText(
    verifiedInput,
    verifiedResult.data,
  );

  assert.equal(
    text,
    [
      "판매자 마진 계산 결과",
      "",
      "[입력 조건]",
      "상품 판매단가: 100,000원",
      "판매수량: 5개",
      "할인금액: 0원",
      "고객 배송비: 1,000원",
      "개당 원가: 30,000원",
      "플랫폼 수수료율: 3%",
      "결제 수수료율: 1%",
      "판매자 배송비: 3,000원",
      "광고비: 1,000원",
      "기타 비용: 500원",
      "",
      "[계산 결과]",
      "상품 판매금액: 500,000원",
      "결제금액: 501,000원",
      "상품 원가 총액: 150,000원",
      "총수수료: 20,010원",
      "총비용: 154,500원",
      "예상 순이익: 326,490원",
      "순이익률: 65.17%",
    ].join("\n"),
  );
});

test("정상 fixture 복사 문자열은 비용 5개와 0원 항목을 모두 포함한다", () => {
  const input = {
    unitPrice: 5_000,
    quantity: 100,
    sellerDiscount: 2_000,
    customerShippingFee: 3_000,
    unitProductCost: 1_500,
    platformFeeRate: 3,
    paymentFeeRate: 1,
    sellerShippingCost: 4_500,
    allocatedAdCost: 0,
    otherCost: 0,
  };
  const response = calculateSellerMargin(input);

  assert.equal(response.success, true);
  if (!response.success) return;

  const text = buildSellerMarginResultText(input, response.data);

  for (const line of [
    "할인금액: 2,000원",
    "고객 배송비: 3,000원",
    "판매자 배송비: 4,500원",
    "광고비: 0원",
    "기타 비용: 0원",
    "예상 순이익: 326,490원",
    "순이익률: 65.17%",
  ]) {
    assert.ok(text.includes(line), `${line}이 복사 문자열에 있어야 합니다.`);
  }
});

test("손실과 수수료 0% 사례도 비용과 금액 형식을 유지한다", () => {
  const lossInput = {
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
  };
  const zeroFeeInput = { ...lossInput, unitProductCost: 4_000 };
  const loss = calculateSellerMargin(lossInput);
  const zeroFee = calculateSellerMargin(zeroFeeInput);

  assert.equal(loss.success, true);
  assert.equal(zeroFee.success, true);
  if (!loss.success || !zeroFee.success) return;

  const lossText = buildSellerMarginResultText(lossInput, loss.data);
  const zeroFeeText = buildSellerMarginResultText(zeroFeeInput, zeroFee.data);

  assert.ok(lossText.includes("예상 순이익: -2,000원"));
  assert.ok(zeroFeeText.includes("총수수료: 0원"));
  assert.ok(zeroFeeText.includes("예상 순이익: 6,000원"));
  assert.ok(zeroFeeText.includes("순이익률: 60%"));
  assert.ok(zeroFeeText.includes("광고비: 0원"));
  assert.ok(zeroFeeText.includes("기타 비용: 0원"));
});

test("검증된 기존 계산 결과를 유지한다", () => {
  if (!verifiedResult.success) {
    assert.fail("회귀 계산 결과가 유효해야 합니다.");
  }

  assert.deepEqual(verifiedResult.data, {
    productSalesAmount: 500_000,
    paymentAmount: 501_000,
    platformFee: 15_000,
    paymentFee: 5_010,
    totalFees: 20_010,
    estimatedSettlement: 480_990,
    totalCosts: 154_500,
    estimatedNetProfit: 326_490,
    netProfitMarginRate: 65.17,
    productCostRate: 30,
    totalFeeRate: 3.99,
  });
});

test("입력값을 버전 1 저장 형식으로 직렬화하고 복원한다", () => {
  const inputs = { ...initialSellerMarginInput, unitPrice: "100000" };
  const serialized = serializeSellerMarginInputs(inputs);

  assert.equal(SELLER_MARGIN_STORAGE_KEY, "integrated-calculator:seller-margin:inputs");
  assert.deepEqual(JSON.parse(serialized), { version: 1, inputs });
  assert.deepEqual(parseSellerMarginStoredInputs(serialized), inputs);
});

for (const [name, value] of [
  ["손상된 JSON", "{"],
  ["원시 값", JSON.stringify("invalid")],
  ["지원하지 않는 버전", JSON.stringify({ version: 2, inputs: initialSellerMarginInput })],
  ["inputs 누락", JSON.stringify({ version: 1 })],
  [
    "필드 누락",
    JSON.stringify({
      version: 1,
      inputs: { ...initialSellerMarginInput, unitPrice: undefined },
    }),
  ],
  [
    "잘못된 필드 타입",
    JSON.stringify({
      version: 1,
      inputs: { ...initialSellerMarginInput, unitPrice: null },
    }),
  ],
  [
    "이전 입력 구조",
    JSON.stringify({
      version: 1,
      inputs: {
        ...initialSellerMarginInput,
        unitProductCost: undefined,
        totalProductCost: "30000",
      },
    }),
  ],
  ["비정상적으로 큰 문자열", "0".repeat(10_001)],
]) {
  test(`${name} 저장 데이터는 거부한다`, () => {
    assert.equal(parseSellerMarginStoredInputs(value), null);
  });
}
