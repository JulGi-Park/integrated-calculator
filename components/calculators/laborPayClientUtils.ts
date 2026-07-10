import type {
  LaborPayInput,
  LaborPayResult,
} from "@/lib/calculators/labor-pay/laborPay";

export interface LaborPayRawInputs {
  hourlyWage: string;
  weeklyScheduledHours: string;
  weeklyActualHours: string;
  isFullAttendance: "true" | "false" | "";
  averageWeeklyScheduledHours: string;
  weeklyWorkDays: string;
  includeMonthlyEstimate: boolean;
}

export const initialLaborPayInput: LaborPayRawInputs = {
  hourlyWage: "10320",
  weeklyScheduledHours: "40",
  weeklyActualHours: "40",
  isFullAttendance: "",
  averageWeeklyScheduledHours: "",
  weeklyWorkDays: "",
  includeMonthlyEstimate: false,
};

function parseNumber(value: string): number | undefined {
  const normalized = value.replaceAll(",", "").trim();
  return normalized === "" ? undefined : Number(normalized);
}

export function parseLaborPayInput(input: LaborPayRawInputs): Partial<LaborPayInput> {
  return {
    hourlyWage: parseNumber(input.hourlyWage),
    weeklyScheduledHours: parseNumber(input.weeklyScheduledHours),
    weeklyActualHours: parseNumber(input.weeklyActualHours),
    isFullAttendance:
      input.isFullAttendance === "" ? undefined : input.isFullAttendance === "true",
    averageWeeklyScheduledHours: parseNumber(input.averageWeeklyScheduledHours),
    weeklyWorkDays: parseNumber(input.weeklyWorkDays),
    includeMonthlyEstimate: input.includeMonthlyEstimate,
  };
}

export function formatLaborPayWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function formatLaborPayHours(value: number): string {
  return `${value.toLocaleString("ko-KR", {
    maximumFractionDigits: 2,
  })}시간`;
}

export function buildLaborPayResultText(
  input: LaborPayInput,
  result: LaborPayResult,
): string {
  const lines = [
    "주휴수당 계산 결과",
    `시급: ${formatLaborPayWon(input.hourlyWage)}`,
    `1주 소정근로시간: ${formatLaborPayHours(input.weeklyScheduledHours)}`,
    `지급 대상 여부: ${result.isEligible ? "대상" : "대상 아님"}`,
    `예상 주휴시간: ${formatLaborPayHours(result.weeklyHolidayHours)}`,
    `예상 주휴수당: ${formatLaborPayWon(result.weeklyHolidayPay)}`,
    `기본 근로수당: ${formatLaborPayWon(result.baseWeeklyPay)}`,
    `주휴 포함 예상 주급: ${formatLaborPayWon(
      result.weeklyPayIncludingHoliday,
    )}`,
  ];

  if (result.monthlyEstimate !== null) {
    lines.push(
      `참고용 월 환산액: ${formatLaborPayWon(result.monthlyEstimate)}`,
    );
  }

  if (result.reasons.length > 0) {
    lines.push(`비대상 사유: ${result.reasons.join(" / ")}`);
  }

  if (result.warnings.length > 0) {
    lines.push(`확인 필요: ${result.warnings.join(" / ")}`);
  }

  return lines.join("\n");
}
