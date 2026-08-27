export const HOUSING_ACQUISITION_TAX_MAX_PRICE = 1_000_000_000_000;
export const HOUSING_ACQUISITION_TAX_POLICY_DATE = "2026-08-27";

export type ExistingHomeCount = "0" | "1" | "2" | "3-plus";
export type RegulatoryArea = "regulated" | "non-regulated";
export type HousingAcquisitionTaxInputField =
  | "acquisitionPrice"
  | "existingHomeCount"
  | "regulatoryArea"
  | "exceeds85SquareMeters";

export interface HousingAcquisitionTaxInput {
  acquisitionPrice: number;
  existingHomeCount: ExistingHomeCount;
  regulatoryArea: RegulatoryArea;
  exceeds85SquareMeters: boolean;
}

export interface HousingAcquisitionTaxValidationError {
  field: HousingAcquisitionTaxInputField;
  code: "REQUIRED" | "INVALID_NUMBER" | "MUST_BE_POSITIVE" | "MUST_BE_INTEGER" | "OUT_OF_RANGE" | "INVALID_OPTION";
}

export interface HousingAcquisitionTaxResult {
  taxableBase: number;
  acquisitionTaxRateUnits: number;
  acquisitionTaxRateLabel: string;
  acquisitionTax: number;
  localEducationTaxRateUnits: number;
  localEducationTax: number;
  ruralSpecialTaxRateUnits: number;
  ruralSpecialTax: number;
  reliefAmount: number;
  finalTotal: number;
  appliedRule: string;
  formulas: string[];
  warnings: string[];
}

export type HousingAcquisitionTaxResponse =
  | { success: true; data: HousingAcquisitionTaxResult }
  | { success: false; errors: HousingAcquisitionTaxValidationError[] };

// A rate unit is 0.0001 percentage point. 1% is 10,000 units.
const RATE_DIVISOR = 1_000_000;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function floorWon(base: number, rateUnits: number): number {
  // Split the multiplication so inputs up to 1조원 remain inside Number's
  // safe-integer range while preserving the statutory floor-to-won result.
  return (
    Math.floor(base / RATE_DIVISOR) * rateUnits +
    Math.floor(((base % RATE_DIVISOR) * rateUnits) / RATE_DIVISOR)
  );
}

function floorWonWithDivisor(
  base: number,
  multiplier: number,
  divisor: number,
): number {
  return (
    Math.floor(base / divisor) * multiplier +
    Math.floor(((base % divisor) * multiplier) / divisor)
  );
}

function formatRate(rateUnits: number): string {
  return `${(rateUnits / 10_000).toLocaleString("ko-KR", {
    minimumFractionDigits: rateUnits % 10_000 === 0 ? 0 : 4,
    maximumFractionDigits: 4,
  })}%`;
}

function getRegularRateUnits(price: number): number {
  if (price <= 600_000_000) return 10_000;
  if (price > 900_000_000) return 30_000;

  // 지방세법 제11조 제1항 제8호 나목의 6억 초과 9억 이하 산식.
  // 세율의 소수점 다섯째 자리에서 반올림해 넷째 자리까지 계산한다.
  const denominator = 300_000_000;
  const quotient = Math.floor(price / denominator);
  const remainder = price % denominator;
  return (
    quotient * 20_000 +
    Math.floor((remainder * 20_000 + denominator / 2) / denominator) -
    30_000
  );
}

function getRateProfile(input: HousingAcquisitionTaxInput) {
  const existingHomes = input.existingHomeCount;
  const isRegulated = input.regulatoryArea === "regulated";

  if (existingHomes === "3-plus") {
    return { acquisitionTaxRateUnits: 120_000, localEducationTaxRateUnits: 4_000, ruralSpecialTaxRateUnits: 10_000, appliedRule: "취득 전 3주택 이상: 4주택 이상 취득 중과 기준" };
  }

  if (existingHomes === "2") {
    if (isRegulated) {
      return { acquisitionTaxRateUnits: 120_000, localEducationTaxRateUnits: 4_000, ruralSpecialTaxRateUnits: 10_000, appliedRule: "조정대상지역에서 취득 전 2주택: 3주택 취득 중과 기준" };
    }
    return { acquisitionTaxRateUnits: 80_000, localEducationTaxRateUnits: 4_000, ruralSpecialTaxRateUnits: 6_000, appliedRule: "비조정대상지역에서 취득 전 2주택: 3주택 취득 중과 기준" };
  }

  if (existingHomes === "1" && isRegulated) {
    return { acquisitionTaxRateUnits: 80_000, localEducationTaxRateUnits: 4_000, ruralSpecialTaxRateUnits: 6_000, appliedRule: "조정대상지역에서 취득 전 1주택: 2주택 취득 중과 기준" };
  }

  const acquisitionTaxRateUnits = getRegularRateUnits(input.acquisitionPrice);
  return {
    acquisitionTaxRateUnits,
    localEducationTaxRateUnits: acquisitionTaxRateUnits / 10,
    ruralSpecialTaxRateUnits: 2_000,
    appliedRule: existingHomes === "0" ? "무주택자가 일반 유상 주택을 취득하는 기본세율 기준" : "비조정대상지역 2주택 취득의 기본세율 기준",
  };
}

export function validateHousingAcquisitionTaxInput(
  input: Partial<HousingAcquisitionTaxInput> | Record<string, unknown> | null,
): HousingAcquisitionTaxValidationError[] {
  const errors: HousingAcquisitionTaxValidationError[] = [];
  const value = input ?? {};

  if (typeof value.acquisitionPrice === "undefined" || value.acquisitionPrice === null) {
    errors.push({ field: "acquisitionPrice", code: "REQUIRED" });
  } else if (!isFiniteNumber(value.acquisitionPrice)) {
    errors.push({ field: "acquisitionPrice", code: "INVALID_NUMBER" });
  } else if (value.acquisitionPrice <= 0) {
    errors.push({ field: "acquisitionPrice", code: "MUST_BE_POSITIVE" });
  } else if (!Number.isInteger(value.acquisitionPrice)) {
    errors.push({ field: "acquisitionPrice", code: "MUST_BE_INTEGER" });
  } else if (value.acquisitionPrice > HOUSING_ACQUISITION_TAX_MAX_PRICE) {
    errors.push({ field: "acquisitionPrice", code: "OUT_OF_RANGE" });
  }

  if (!(["0", "1", "2", "3-plus"] as const).includes(value.existingHomeCount as ExistingHomeCount)) {
    errors.push({ field: "existingHomeCount", code: "INVALID_OPTION" });
  }
  if (!(["regulated", "non-regulated"] as const).includes(value.regulatoryArea as RegulatoryArea)) {
    errors.push({ field: "regulatoryArea", code: "INVALID_OPTION" });
  }
  if (typeof value.exceeds85SquareMeters !== "boolean") {
    errors.push({ field: "exceeds85SquareMeters", code: "INVALID_OPTION" });
  }

  return errors;
}

export function calculateHousingAcquisitionTax(
  input: HousingAcquisitionTaxInput,
): HousingAcquisitionTaxResponse {
  const errors = validateHousingAcquisitionTaxInput(input);
  if (errors.length > 0) return { success: false, errors };

  const rates = getRateProfile(input);
  const acquisitionTax = floorWon(input.acquisitionPrice, rates.acquisitionTaxRateUnits);
  const localEducationTax = rates.acquisitionTaxRateUnits < 80_000
    ? floorWonWithDivisor(
      input.acquisitionPrice,
      rates.acquisitionTaxRateUnits,
      10_000_000,
    )
    : floorWon(input.acquisitionPrice, rates.localEducationTaxRateUnits);
  const ruralSpecialTax = input.exceeds85SquareMeters
    ? floorWon(input.acquisitionPrice, rates.ruralSpecialTaxRateUnits)
    : 0;

  return {
    success: true,
    data: {
      taxableBase: input.acquisitionPrice,
      acquisitionTaxRateUnits: rates.acquisitionTaxRateUnits,
      acquisitionTaxRateLabel: formatRate(rates.acquisitionTaxRateUnits),
      acquisitionTax,
      localEducationTaxRateUnits: rates.localEducationTaxRateUnits,
      localEducationTax,
      ruralSpecialTaxRateUnits: input.exceeds85SquareMeters ? rates.ruralSpecialTaxRateUnits : 0,
      ruralSpecialTax,
      reliefAmount: 0,
      finalTotal: acquisitionTax + localEducationTax + ruralSpecialTax,
      appliedRule: rates.appliedRule,
      formulas: [
        `취득세 = 과세표준 × ${formatRate(rates.acquisitionTaxRateUnits)}`,
        rates.acquisitionTaxRateUnits < 80_000
          ? "지방교육세 = 과세표준 × 취득세율의 10%"
          : `지방교육세 = 과세표준 × ${formatRate(rates.localEducationTaxRateUnits)}`,
        input.exceeds85SquareMeters
          ? `농어촌특별세 = 과세표준 × ${formatRate(rates.ruralSpecialTaxRateUnits)}`
          : "전용면적 85㎡ 이하 입력: 농어촌특별세는 0원",
        "각 세목은 원 미만을 버림하여 표시",
      ],
      warnings: [
        "생애최초 취득세 감면, 일시적 2주택·중과 제외, 공동취득, 상속·증여, 분양권·입주권 등은 자동 판단하지 않습니다.",
        "조정대상지역 여부와 세대·주택 수는 취득일 기준으로 별도 확인해야 합니다.",
        "실제 신고 세액은 과세관청의 사실관계 판단, 감면 요건과 신고서 계산에 따라 달라질 수 있습니다.",
      ],
    },
  };
}
