import {
  calculateSellerMargin,
  type SellerMarginInput,
  type SellerMarginInputField,
  type SellerMarginResult,
} from "@/lib/calculators/seller-margin/seller-margin";

export type SellerMarginRawInputs = Record<SellerMarginInputField, string>;

export interface SellerMarginStoredInputsV1 {
  version: 1;
  inputs: SellerMarginRawInputs;
}

export const SELLER_MARGIN_STORAGE_KEY =
  "integrated-calculator:seller-margin:inputs";
export const SELLER_MARGIN_STORAGE_VERSION = 1;

export const sellerMarginInputFields: SellerMarginInputField[] = [
  "unitPrice",
  "quantity",
  "sellerDiscount",
  "customerShippingFee",
  "unitProductCost",
  "platformFeeRate",
  "paymentFeeRate",
  "sellerShippingCost",
  "allocatedAdCost",
  "otherCost",
];

export const initialSellerMarginInput: SellerMarginRawInputs = {
  unitPrice: "",
  quantity: "1",
  sellerDiscount: "0",
  customerShippingFee: "0",
  unitProductCost: "",
  platformFeeRate: "0",
  paymentFeeRate: "0",
  sellerShippingCost: "0",
  allocatedAdCost: "0",
  otherCost: "0",
};

const maximumStoredLength = 10_000;
const maximumFieldLength = 64;
const rawNumberPattern = /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

const wonFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 0,
});

const rateFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 2,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function formatSellerMarginWon(value: number) {
  return `${wonFormatter.format(value)}원`;
}

export function formatSellerMarginRate(value: number) {
  return `${rateFormatter.format(value)}%`;
}

export function serializeSellerMarginInputs(
  inputs: SellerMarginRawInputs,
): string {
  const storedValue: SellerMarginStoredInputsV1 = {
    version: SELLER_MARGIN_STORAGE_VERSION,
    inputs,
  };

  return JSON.stringify(storedValue);
}

export function parseSellerMarginStoredInputs(
  serializedValue: string,
): SellerMarginRawInputs | null {
  if (
    serializedValue.length === 0 ||
    serializedValue.length > maximumStoredLength
  ) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(serializedValue);
  } catch {
    return null;
  }

  if (!isRecord(parsed) || parsed.version !== SELLER_MARGIN_STORAGE_VERSION) {
    return null;
  }

  const storedInputs = parsed.inputs;

  if (!isRecord(storedInputs)) {
    return null;
  }

  const storedFields = Object.keys(storedInputs);

  if (
    storedFields.length !== sellerMarginInputFields.length ||
    !storedFields.every((field) =>
      sellerMarginInputFields.includes(field as SellerMarginInputField),
    )
  ) {
    return null;
  }

  for (const field of sellerMarginInputFields) {
    const value = storedInputs[field];

    if (
      typeof value !== "string" ||
      value.length > maximumFieldLength ||
      (value !== "" && !rawNumberPattern.test(value))
    ) {
      return null;
    }
  }

  return Object.fromEntries(
    sellerMarginInputFields.map((field) => [field, storedInputs[field]]),
  ) as SellerMarginRawInputs;
}

function getProductCostTotal(input: SellerMarginInput): number {
  const response = calculateSellerMargin({
    ...input,
    sellerShippingCost: 0,
    allocatedAdCost: 0,
    otherCost: 0,
  });

  if (!response.success) {
    throw new Error("A valid seller margin input is required.");
  }

  return response.data.totalCosts;
}

export function buildSellerMarginResultText(
  input: SellerMarginInput,
  result: SellerMarginResult,
): string {
  const productCostTotal = getProductCostTotal(input);

  return [
    "판매자 마진 계산 결과",
    "",
    "[입력 조건]",
    `상품 판매단가: ${formatSellerMarginWon(input.unitPrice)}`,
    `판매수량: ${wonFormatter.format(input.quantity)}개`,
    `개당 원가: ${formatSellerMarginWon(input.unitProductCost)}`,
    `플랫폼 수수료율: ${formatSellerMarginRate(input.platformFeeRate)}`,
    `결제 수수료율: ${formatSellerMarginRate(input.paymentFeeRate)}`,
    "",
    "[계산 결과]",
    `상품 판매금액: ${formatSellerMarginWon(result.productSalesAmount)}`,
    `결제금액: ${formatSellerMarginWon(result.paymentAmount)}`,
    `상품 원가 총액: ${formatSellerMarginWon(productCostTotal)}`,
    `총수수료: ${formatSellerMarginWon(result.totalFees)}`,
    `총비용: ${formatSellerMarginWon(result.totalCosts)}`,
    `예상 순이익: ${formatSellerMarginWon(result.estimatedNetProfit)}`,
    `순이익률: ${formatSellerMarginRate(result.netProfitMarginRate)}`,
  ].join("\n");
}
