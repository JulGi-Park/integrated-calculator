import type {
  BrokerageFeeInput,
  BrokerageFeeResult,
} from "@/lib/calculators/brokerage-fee/types";

export interface BrokerageFeeRawInputs {
  transactionType: "sale" | "jeonse" | "monthlyRent";
  transactionAmount: string;
  jeonseDeposit: string;
  monthlyRentDeposit: string;
  monthlyRent: string;
  negotiatedRatePercent: string;
}

export const BROKERAGE_FEE_STORAGE_KEY = "gyesanbox.brokerage-fee.inputs";

export const initialBrokerageFeeInput: BrokerageFeeRawInputs = {
  transactionType: "sale",
  transactionAmount: "",
  jeonseDeposit: "",
  monthlyRentDeposit: "",
  monthlyRent: "",
  negotiatedRatePercent: "",
};

export function formatBrokerageWon(value: number): string {
  return `${new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 0,
  }).format(value)}원`;
}

export function formatBrokerageRate(value: number): string {
  return `${new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 3,
  }).format(value)}%`;
}

export function getBrokerageTransactionLabel(
  transactionType: BrokerageFeeRawInputs["transactionType"],
) {
  switch (transactionType) {
    case "sale":
      return "매매·교환";
    case "jeonse":
      return "전세";
    case "monthlyRent":
      return "월세";
  }
}

export function serializeBrokerageFeeInputs(
  input: BrokerageFeeRawInputs,
): string {
  return JSON.stringify(input);
}

export function parseBrokerageFeeStoredInputs(
  value: string,
): BrokerageFeeRawInputs | null {
  try {
    const parsed = JSON.parse(value) as Partial<BrokerageFeeRawInputs>;
    const nextInput = { ...initialBrokerageFeeInput };

    for (const key of Object.keys(nextInput) as Array<keyof BrokerageFeeRawInputs>) {
      if (typeof parsed[key] !== "string") {
        return null;
      }

      nextInput[key] = parsed[key] as never;
    }

    if (!["sale", "jeonse", "monthlyRent"].includes(nextInput.transactionType)) {
      return null;
    }

    return nextInput;
  } catch {
    return null;
  }
}

export function buildBrokerageFeeResultText(
  input: BrokerageFeeInput,
  result: BrokerageFeeResult,
): string {
  const lines = [
    "부동산 중개보수 계산 결과",
    `거래유형: ${getBrokerageTransactionLabel(result.transactionType)}`,
    `적용 거래금액: ${formatBrokerageWon(result.appliedTransactionAmount)}`,
    `적용 구간: ${result.rateBand.label}`,
    `상한요율: ${formatBrokerageRate(result.maxRatePercent)}`,
    `부가세 별도 상한보수: ${formatBrokerageWon(result.baseFee)}`,
    `부가세 포함 예상 금액: ${formatBrokerageWon(result.vatIncludedFee)}`,
  ];

  if (result.transactionType === "monthlyRent") {
    lines.push(
      `월세 보증금: ${formatBrokerageWon(input.monthlyRentDeposit ?? 0)}`,
      `월세: ${formatBrokerageWon(input.monthlyRent ?? 0)}`,
      `1차 환산 거래금액: ${formatBrokerageWon(
        result.firstMonthlyRentConvertedAmount ?? 0,
      )}`,
      `5천만원 미만 재계산: ${result.monthlyRentRecalculated ? "적용" : "미적용"}`,
    );
  }

  if (
    result.negotiatedRatePercent !== null &&
    result.negotiatedFee !== null &&
    result.negotiatedVatIncludedFee !== null
  ) {
    lines.push(
      `협의요율: ${formatBrokerageRate(result.negotiatedRatePercent)}`,
      `협의보수: ${formatBrokerageWon(result.negotiatedFee)}`,
      `부가세 포함 협의보수: ${formatBrokerageWon(
        result.negotiatedVatIncludedFee,
      )}`,
    );
  }

  lines.push("결과는 확정 청구액이 아니라 입력값 기준 참고 계산입니다.");

  return lines.join("\n");
}
