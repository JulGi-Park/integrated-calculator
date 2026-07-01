export function isParentalLeaveCalculatorEnabled(
  value = process.env.NEXT_PUBLIC_ENABLE_PARENTAL_LEAVE_CALCULATOR,
): boolean {
  return value === "true";
}
