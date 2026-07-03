import type {
  AveragePriceInput,
  AveragePriceResult,
} from "@/lib/calculators/average-price/types";

export interface AveragePriceRawInputs {
  currentQuantity: string;
  currentAveragePrice: string;
  additionalQuantity: string;
  additionalPrice: string;
  targetPrice: string;
}

export const AVERAGE_PRICE_STORAGE_KEY = "gyesanbox.average-price.inputs";

export const initialAveragePriceInput: AveragePriceRawInputs = {
  currentQuantity: "",
  currentAveragePrice: "",
  additionalQuantity: "",
  additionalPrice: "",
  targetPrice: "",
};

export function formatAveragePriceWon(value: number): string {
  return `${new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 2,
  }).format(value)}원`;
}

export function formatAveragePriceQuantity(value: number): string {
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 8,
  }).format(value);
}

export function formatAveragePriceRate(value: number): string {
  return `${new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 2,
  }).format(value)}%`;
}

export function serializeAveragePriceInputs(input: AveragePriceRawInputs): string {
  return JSON.stringify(input);
}

export function parseAveragePriceStoredInputs(
  value: string,
): AveragePriceRawInputs | null {
  try {
    const parsed = JSON.parse(value) as Partial<AveragePriceRawInputs>;
    const nextInput = { ...initialAveragePriceInput };

    for (const key of Object.keys(nextInput) as Array<keyof AveragePriceRawInputs>) {
      if (typeof parsed[key] !== "string") {
        return null;
      }

      nextInput[key] = parsed[key];
    }

    return nextInput;
  } catch {
    return null;
  }
}

export function buildAveragePriceResultText(
  input: AveragePriceInput,
  result: AveragePriceResult,
): string {
  const lines = [
    "물타기 계산 결과",
    `현재 보유 수량: ${formatAveragePriceQuantity(input.currentQuantity)}`,
    `현재 평균 단가: ${formatAveragePriceWon(input.currentAveragePrice)}`,
    `추가 매수 수량: ${formatAveragePriceQuantity(input.additionalQuantity)}`,
    `추가 매수 단가: ${formatAveragePriceWon(input.additionalPrice)}`,
    `기존 투자금액: ${formatAveragePriceWon(result.existingInvestmentAmount)}`,
    `추가 투자금액: ${formatAveragePriceWon(result.additionalInvestmentAmount)}`,
    `총 보유 수량: ${formatAveragePriceQuantity(result.totalQuantity)}`,
    `총 투자금액: ${formatAveragePriceWon(result.totalInvestmentAmount)}`,
    `신규 평균 단가: ${formatAveragePriceWon(result.newAveragePrice)}`,
  ];

  if (typeof input.targetPrice === "number") {
    lines.push(`현재가 또는 목표 매도가: ${formatAveragePriceWon(input.targetPrice)}`);
  }

  if (
    result.expectedValuationAmount !== null &&
    result.expectedProfitLoss !== null &&
    result.expectedProfitRate !== null
  ) {
    lines.push(
      `예상 평가금액: ${formatAveragePriceWon(result.expectedValuationAmount)}`,
      `예상 손익: ${formatAveragePriceWon(result.expectedProfitLoss)}`,
      `예상 수익률: ${formatAveragePriceRate(result.expectedProfitRate)}`,
    );
  }

  lines.push("수수료, 세금, 환율 등은 반영하지 않은 단순 계산값입니다.");

  return lines.join("\n");
}
