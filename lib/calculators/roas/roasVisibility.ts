export const ROAS_CALCULATOR_FLAG = "NEXT_PUBLIC_ENABLE_ROAS_CALCULATOR";

export function isRoasCalculatorEnabled(
  value = process.env[ROAS_CALCULATOR_FLAG],
): boolean {
  return value === "true";
}
