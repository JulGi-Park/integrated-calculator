import type {
  VatProfitInput,
  VatProfitResult,
} from "@/lib/calculators/vat-profit/vatProfit";

export interface VatProfitRawInputs {
  amountMode: "supply" | "total";
  salesAmount: string;
  purchaseVat: string;
}

export const initialVatProfitInput: VatProfitRawInputs = {
  amountMode: "supply",
  salesAmount: "1000000",
  purchaseVat: "30000",
};

function parseNumber(value: string): number | undefined {
  const normalized = value.replaceAll(",", "").trim();
  return normalized === "" ? undefined : Number(normalized);
}

export function parseVatProfitInput(
  input: VatProfitRawInputs,
): Partial<VatProfitInput> {
  return {
    amountMode: input.amountMode,
    salesAmount: parseNumber(input.salesAmount),
    purchaseVat: parseNumber(input.purchaseVat),
  };
}

export function formatVatProfitWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function formatVatProfitRate(value: number): string {
  return `${(value * 100).toLocaleString("ko-KR", {
    maximumFractionDigits: 2,
  })}%`;
}

export function buildVatProfitResultText(
  input: VatProfitInput,
  result: VatProfitResult,
): string {
  return [
    "부가세 계산 결과",
    `입력 기준: ${input.amountMode === "supply" ? "공급가액" : "합계금액"}`,
    `입력 금액: ${formatVatProfitWon(input.salesAmount)}`,
    `공급가액: ${formatVatProfitWon(result.supplyAmount)}`,
    `매출세액: ${formatVatProfitWon(result.outputVat)}`,
    `합계금액: ${formatVatProfitWon(result.totalAmount)}`,
    `입력 매입세액: ${formatVatProfitWon(result.purchaseVat)}`,
    `예상 납부세액: ${formatVatProfitWon(result.expectedPayableVat)}`,
  ].join("\n");
}
