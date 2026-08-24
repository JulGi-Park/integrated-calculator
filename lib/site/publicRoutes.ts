export const PUBLIC_CALCULATOR_PATHS = [
  "/calculators/seller-margin/",
  "/calculators/vat-profit/",
  "/calculators/salary/",
  "/calculators/social-insurance/",
  "/calculators/labor-pay/",
  "/calculators/loan/",
  "/calculators/severance/",
  "/calculators/unemployment/",
  "/calculators/parental-leave/",
  "/calculators/rent-vs-jeonse/",
  "/calculators/roas/",
  "/calculators/savings/",
  "/calculators/average-price/",
  "/calculators/card-installment/",
  "/calculators/brokerage-fee/",
  "/calculators/car-cost/",
  "/calculators/overtime-pay/",
  "/calculators/youth-future-savings/",
  "/calculators/dsr/",
  "/calculators/work-child-incentive/",
  "/calculators/training-certificate-cost/",
] as const;

export const PUBLISHER_PATHS = [
  "/about/",
  "/methodology/",
  "/updates/",
  "/contact/",
  "/privacy-policy/",
  "/terms/",
  "/disclaimer/",
] as const;

export const INDEXABLE_PATHS = [
  "/",
  "/calculators/",
  ...PUBLIC_CALCULATOR_PATHS,
  ...PUBLISHER_PATHS,
] as const;

const adsenseEligiblePaths = new Set<string>([
  "/",
  ...PUBLIC_CALCULATOR_PATHS,
]);

export function normalizePublicPath(pathname: string): string {
  if (pathname === "/") return pathname;
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

export function isAdSenseEligiblePath(pathname: string | null): boolean {
  if (!pathname) return false;
  return adsenseEligiblePaths.has(normalizePublicPath(pathname));
}
