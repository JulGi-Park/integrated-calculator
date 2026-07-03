export const AVERAGE_PRICE_CALCULATOR_FLAG =
  "NEXT_PUBLIC_ENABLE_AVERAGE_PRICE_CALCULATOR";

export function isAveragePriceCalculatorEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env[AVERAGE_PRICE_CALCULATOR_FLAG] === "true";
}
