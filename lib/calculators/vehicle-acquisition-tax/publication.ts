export const VEHICLE_ACQUISITION_TAX_PATH = "/calculators/vehicle-acquisition-tax/";
export function isVehicleAcquisitionTaxCalculatorEnabled(value: string | undefined = process.env.NEXT_PUBLIC_ENABLE_VEHICLE_ACQUISITION_TAX_CALCULATOR) { return value === "true"; }
