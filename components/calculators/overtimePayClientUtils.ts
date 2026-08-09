import type {
  OvertimePayInput,
  OvertimePayResult,
} from "@/lib/calculators/overtime-pay/types";
import { formatHours, formatWon } from "@/lib/calculators/overtime-pay/format";

export type OvertimePayRawInputs = Record<
  keyof Omit<OvertimePayInput, "rounding">,
  string
>;

export const OVERTIME_PAY_STORAGE_KEY = "gyesanbox:overtime-pay:v1";

export const initialOvertimePayInputs: OvertimePayRawInputs = {
  hourlyWage: "",
  baseHours: "0",
  overtimeHours: "0",
  nightHours: "0",
  holidayHoursWithin8: "0",
  holidayHoursOver8: "0",
};

export function formatOvertimePayNumberInput(value: string): string {
  return value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
}

export function serializeOvertimePayInputs(
  input: OvertimePayRawInputs,
): string {
  return JSON.stringify(input);
}

export function parseOvertimePayStoredInputs(
  value: string,
): OvertimePayRawInputs | null {
  try {
    const parsed = JSON.parse(value) as Partial<OvertimePayRawInputs>;
    const keys = Object.keys(initialOvertimePayInputs) as Array<
      keyof OvertimePayRawInputs
    >;

    if (keys.every((key) => typeof parsed[key] === "string")) {
      return parsed as OvertimePayRawInputs;
    }
  } catch {
    return null;
  }

  return null;
}

export function buildOvertimePayResultText(
  input: OvertimePayInput,
  result: OvertimePayResult,
): string {
  return [
    "연장·야간·휴일근로수당 계산 결과",
    `시급: ${formatWon(input.hourlyWage)}`,
    `기본근로 시간: ${formatHours(input.baseHours)}`,
    `연장근로 시간: ${formatHours(input.overtimeHours)}`,
    `야간근로 시간: ${formatHours(input.nightHours)}`,
    `휴일근로 8시간 이내: ${formatHours(input.holidayHoursWithin8)}`,
    `휴일근로 8시간 초과: ${formatHours(input.holidayHoursOver8)}`,
    `기본근로 금액: ${formatWon(result.basePay)}`,
    `연장근로수당: ${formatWon(result.overtimePay)}`,
    `야간근로 가산수당: ${formatWon(result.nightPremiumPay)}`,
    `휴일근로 8시간 이내 수당: ${formatWon(result.holidayPayWithin8)}`,
    `휴일근로 8시간 초과 수당: ${formatWon(result.holidayPayOver8)}`,
    `총 예상 지급액: ${formatWon(result.totalExpectedPay)}`,
    `가산수당 합계: ${formatWon(result.additionalAllowanceTotal)}`,
    `일반 근로 대비 추가 금액: ${formatWon(result.extraComparedWithRegularPay)}`,
    "기준: 2026년 8월 9일, 근로기준법 제56조 참고",
  ].join("\n");
}
