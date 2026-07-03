export const BROKERAGE_FEE_CALCULATOR_FLAG =
  "NEXT_PUBLIC_ENABLE_BROKERAGE_FEE_CALCULATOR";

export function isBrokerageFeeCalculatorEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env[BROKERAGE_FEE_CALCULATOR_FLAG] === "true";
}
