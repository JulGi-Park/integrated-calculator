export const VEHICLE_ACQUISITION_TAX_POLICY = {
  checkedAt: "2026-08-21", maximumAmount: 1_000_000_000_000,
  rates: { passenger: 0.07, lightPassenger: 0.04, other: 0.05, lightOther: 0.04, business: 0.04 },
  reliefs: { electric: { limit: 1_400_000, expiresAt: "2026-12-31" }, hydrogen: { limit: 1_400_000, expiresAt: "2027-12-31" }, lightPassenger: { limit: 750_000, expiresAt: "2027-12-31" }, lightOther: { limit: Infinity, expiresAt: "2027-12-31" } },
} as const;
export type VehicleType = keyof typeof VEHICLE_ACQUISITION_TAX_POLICY.rates;
export type AcquisitionMode = "new" | "used";
export type EcoType = "none" | "electric" | "hydrogen";
export type VehicleTaxInput = { acquisitionMode: AcquisitionMode; vehicleType: VehicleType; ecoType: EcoType; taxableBaseInput: number; standardValue?: number };
export type ReliefType = "none" | "electric" | "hydrogen" | "lightPassenger" | "lightOther";
export type VehicleTaxResult = { taxableBase: number; rate: number; grossTax: number; reliefType: ReliefType; reliefAmount: number; finalTax: number; actualPrice?: number; standardValue?: number };
export type VehicleTaxError = { field: string; message: string };
const labels: Record<VehicleType, string> = { passenger: "비영업용 일반 승용차", lightPassenger: "비영업용 경형 승용차", other: "비영업용 승합·화물 등", lightOther: "비영업용 경형 승합·화물", business: "영업용 자동차" };
export const vehicleTypes = Object.entries(labels) as [VehicleType, string][];
function isAmount(value: unknown) { return typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value <= VEHICLE_ACQUISITION_TAX_POLICY.maximumAmount; }
export function validateVehicleTaxInput(input: Partial<VehicleTaxInput>): VehicleTaxError[] {
  const errors: VehicleTaxError[] = [];
  if (!input.acquisitionMode || !["new", "used"].includes(input.acquisitionMode)) errors.push({ field: "acquisitionMode", message: "취득 방식을 선택해 주세요." });
  if (!input.vehicleType || !(input.vehicleType in VEHICLE_ACQUISITION_TAX_POLICY.rates)) errors.push({ field: "vehicleType", message: "차량 유형을 선택해 주세요." });
  if (!input.ecoType || !["none", "electric", "hydrogen"].includes(input.ecoType)) errors.push({ field: "ecoType", message: "친환경 유형을 선택해 주세요." });
  if (!isAmount(input.taxableBaseInput)) errors.push({ field: "taxableBaseInput", message: `금액은 1원 이상 ${VEHICLE_ACQUISITION_TAX_POLICY.maximumAmount.toLocaleString("ko-KR")}원 이하의 정수여야 합니다.` });
  if (input.acquisitionMode === "used" && !isAmount(input.standardValue)) errors.push({ field: "standardValue", message: "중고차 시가표준액을 원 단위 정수로 입력해 주세요." });
  return errors;
}
export function resolveTaxableBase(input: Pick<VehicleTaxInput, "acquisitionMode" | "taxableBaseInput" | "standardValue">) { return input.acquisitionMode === "used" ? Math.max(input.taxableBaseInput, input.standardValue ?? 0) : input.taxableBaseInput; }
function pickRelief(type: VehicleType, eco: EcoType, grossTax: number): { type: ReliefType; amount: number } {
  const candidates: { type: ReliefType; amount: number }[] = [{ type: "none", amount: 0 }];
  if (eco === "electric") candidates.push({ type: "electric", amount: Math.min(grossTax, VEHICLE_ACQUISITION_TAX_POLICY.reliefs.electric.limit) });
  if (eco === "hydrogen") candidates.push({ type: "hydrogen", amount: Math.min(grossTax, VEHICLE_ACQUISITION_TAX_POLICY.reliefs.hydrogen.limit) });
  if (type === "lightPassenger") candidates.push({ type: "lightPassenger", amount: Math.min(grossTax, VEHICLE_ACQUISITION_TAX_POLICY.reliefs.lightPassenger.limit) });
  if (type === "lightOther") candidates.push({ type: "lightOther", amount: grossTax });
  return candidates.reduce((best, candidate) => candidate.amount > best.amount ? candidate : best);
}
export function calculateVehicleAcquisitionTax(input: VehicleTaxInput): VehicleTaxResult {
  const errors = validateVehicleTaxInput(input); if (errors.length) throw new Error(errors[0].message);
  const taxableBase = resolveTaxableBase(input); const rate = VEHICLE_ACQUISITION_TAX_POLICY.rates[input.vehicleType]; const grossTax = taxableBase * Math.round(rate * 100) / 100;
  const relief = pickRelief(input.vehicleType, input.ecoType, grossTax);
  return { taxableBase, rate, grossTax, reliefType: relief.type, reliefAmount: relief.amount, finalTax: grossTax - relief.amount, ...(input.acquisitionMode === "used" ? { actualPrice: input.taxableBaseInput, standardValue: input.standardValue } : {}) };
}
export function calculateVehicleAcquisitionTaxFromUnknown(value: Partial<VehicleTaxInput>) { const errors = validateVehicleTaxInput(value); return errors.length ? { success: false as const, errors } : { success: true as const, data: calculateVehicleAcquisitionTax(value as VehicleTaxInput) }; }
