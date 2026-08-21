export const WITHHOLDING_TAX_PUBLICATION = {
  environmentVariable: "NEXT_PUBLIC_ENABLE_WITHHOLDING_TAX_CALCULATOR",
  slug: "withholding-tax",
  path: "/calculators/withholding-tax/",
  url: "https://gyesanbox.kr/calculators/withholding-tax/",
} as const;

export function isWithholdingTaxCalculatorEnabled(
  value: string | undefined = process.env.NEXT_PUBLIC_ENABLE_WITHHOLDING_TAX_CALCULATOR,
): boolean {
  return value === "true";
}
