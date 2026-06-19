import { MONTHLY_INCOME_TAX_TABLE_2026 } from "./income-tax-table";
import { SALARY_TAKE_HOME_POLICY_2026 } from "./policy";
import type {
  SalaryTakeHomeCalculationResponse,
  SalaryTakeHomeInput,
  SalaryTakeHomeInputField,
  SalaryTakeHomeValidationError,
  SalaryTakeHomeValidationErrorCode,
} from "./types";

const inputFields: SalaryTakeHomeInputField[] = [
  "annualSalary",
  "monthlyNonTaxableAmount",
  "dependentCount",
  "childCount",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isEmpty(value: unknown): boolean {
  return value === "" || value === null || value === undefined;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function hasValidNumericFields(
  input: Record<string, unknown>,
): input is Record<string, unknown> & SalaryTakeHomeInput {
  return inputFields.every(
    (field) =>
      isFiniteNumber(input[field]) && Number.isSafeInteger(input[field]),
  );
}

function addError(
  errors: SalaryTakeHomeValidationError[],
  field: SalaryTakeHomeInputField,
  code: SalaryTakeHomeValidationErrorCode,
  message: string,
) {
  errors.push({ field, code, message });
}

function floorToUnit(value: number, unit: number): number {
  return Math.floor(value / unit) * unit;
}

function multiplyAndFloor(
  amount: number,
  numerator: number,
  denominator: number,
): number {
  return Math.floor((amount * numerator) / denominator);
}

function getChildTaxCredit(childCount: number): number {
  if (childCount <= 0) {
    return 0;
  }

  if (childCount === 1) {
    return 20_830;
  }

  if (childCount === 2) {
    return 45_830;
  }

  return 45_830 + (childCount - 2) * 33_330;
}

function getTaxForDependentCount(
  taxesForOneToElevenDependents: readonly number[],
  dependentCount: number,
): number {
  if (dependentCount <= 11) {
    return taxesForOneToElevenDependents[dependentCount - 1] ?? 0;
  }

  const taxForTen = taxesForOneToElevenDependents[9] ?? 0;
  const taxForEleven = taxesForOneToElevenDependents[10] ?? 0;
  const reductionPerAdditionalDependent = taxForTen - taxForEleven;

  return Math.max(
    0,
    taxForEleven -
      reductionPerAdditionalDependent * (dependentCount - 11),
  );
}

function calculateHighIncomeBaseTax(
  monthlyTaxableSalary: number,
  dependentCount: number,
): number {
  const taxesAtTenMillion = [
    1_507_400, 1_431_570, 1_200_840, 1_170_840, 1_140_840, 1_110_840,
    1_080_840, 1_050_840, 1_020_840, 990_840, 960_840,
  ] as const;
  const baseTax = getTaxForDependentCount(
    taxesAtTenMillion,
    dependentCount,
  );
  const excess = monthlyTaxableSalary - 10_000_000;

  if (excess === 0) {
    return baseTax;
  }

  if (monthlyTaxableSalary <= 14_000_000) {
    return baseTax + Math.floor((excess * 98 * 35) / 10_000) + 25_000;
  }

  if (monthlyTaxableSalary <= 28_000_000) {
    return (
      baseTax +
      1_397_000 +
      Math.floor(((monthlyTaxableSalary - 14_000_000) * 98 * 38) / 10_000)
    );
  }

  if (monthlyTaxableSalary <= 30_000_000) {
    return (
      baseTax +
      6_610_600 +
      Math.floor(((monthlyTaxableSalary - 28_000_000) * 98 * 40) / 10_000)
    );
  }

  if (monthlyTaxableSalary <= 45_000_000) {
    return (
      baseTax +
      7_394_600 +
      Math.floor(((monthlyTaxableSalary - 30_000_000) * 40) / 100)
    );
  }

  if (monthlyTaxableSalary <= 87_000_000) {
    return (
      baseTax +
      13_394_600 +
      Math.floor(((monthlyTaxableSalary - 45_000_000) * 42) / 100)
    );
  }

  return (
    baseTax +
    31_034_600 +
    Math.floor(((monthlyTaxableSalary - 87_000_000) * 45) / 100)
  );
}

export function calculateMonthlyIncomeTax(
  monthlyTaxableSalary: number,
  dependentCount: number,
  childCount: number,
): number {
  if (monthlyTaxableSalary < 770_000) {
    return 0;
  }

  let baseTax: number;

  if (
    monthlyTaxableSalary >=
    SALARY_TAKE_HOME_POLICY_2026.incomeTax.highIncomeThreshold
  ) {
    baseTax = calculateHighIncomeBaseTax(
      monthlyTaxableSalary,
      dependentCount,
    );
  } else {
    const salaryInThousands = Math.floor(monthlyTaxableSalary / 1_000);
    const row = MONTHLY_INCOME_TAX_TABLE_2026.find(
      ([minimum, maximum]) =>
        salaryInThousands >= minimum && salaryInThousands < maximum,
    );

    baseTax = row
      ? getTaxForDependentCount(row.slice(2), dependentCount)
      : 0;
  }

  return floorToUnit(
    Math.max(0, baseTax - getChildTaxCredit(childCount)),
    SALARY_TAKE_HOME_POLICY_2026.incomeTax.truncationUnit,
  );
}

export function validateSalaryTakeHomeInput(
  input: unknown,
): SalaryTakeHomeValidationError[] {
  const errors: SalaryTakeHomeValidationError[] = [];

  if (!isRecord(input)) {
    return inputFields.map((field) => ({
      field,
      code: field === "annualSalary" ? "REQUIRED" : "INVALID_NUMBER",
      message: `${field} 값을 확인해 주세요.`,
    }));
  }

  for (const field of inputFields) {
    const value = input[field];

    if (field === "annualSalary" && isEmpty(value)) {
      addError(errors, field, "REQUIRED", "연봉을 입력해 주세요.");
      continue;
    }

    if (!isFiniteNumber(value)) {
      addError(
        errors,
        field,
        "INVALID_NUMBER",
        `${field} 값은 유한한 숫자여야 합니다.`,
      );
      continue;
    }

    if (!Number.isInteger(value)) {
      addError(
        errors,
        field,
        "MUST_BE_INTEGER",
        `${field} 값은 원 단위 정수여야 합니다.`,
      );
    } else if (!Number.isSafeInteger(value)) {
      addError(
        errors,
        field,
        "MUST_BE_SAFE_INTEGER",
        `${field} 값은 안전한 정수 범위의 원 단위 값이어야 합니다.`,
      );
    }
  }

  if (isFiniteNumber(input.annualSalary)) {
    if (input.annualSalary <= 0) {
      addError(
        errors,
        "annualSalary",
        "MUST_BE_POSITIVE",
        "연봉은 0원보다 커야 합니다.",
      );
    }

    if (
      input.annualSalary >
      SALARY_TAKE_HOME_POLICY_2026.maximumAnnualSalary
    ) {
      addError(
        errors,
        "annualSalary",
        "ANNUAL_SALARY_EXCEEDS_LIMIT",
        `연봉은 ${SALARY_TAKE_HOME_POLICY_2026.maximumAnnualSalary.toLocaleString("ko-KR")}원 이하여야 합니다.`,
      );
    }
  }

  if (
    isFiniteNumber(input.monthlyNonTaxableAmount) &&
    input.monthlyNonTaxableAmount < 0
  ) {
    addError(
      errors,
      "monthlyNonTaxableAmount",
      "MUST_BE_NON_NEGATIVE",
      "월 비과세액은 0원 이상이어야 합니다.",
    );
  }

  if (isFiniteNumber(input.dependentCount) && input.dependentCount <= 0) {
    addError(
      errors,
      "dependentCount",
      "MUST_BE_POSITIVE",
      "공제대상가족 수는 본인을 포함해 1명 이상이어야 합니다.",
    );
  }

  if (isFiniteNumber(input.childCount) && input.childCount < 0) {
    addError(
      errors,
      "childCount",
      "MUST_BE_NON_NEGATIVE",
      "자녀 수는 0명 이상이어야 합니다.",
    );
  }

  if (
    isFiniteNumber(input.annualSalary) &&
    Number.isSafeInteger(input.annualSalary) &&
    input.annualSalary > 0 &&
    isFiniteNumber(input.monthlyNonTaxableAmount)
  ) {
    const monthlyGrossSalary = Math.floor(input.annualSalary / 12);

    if (input.monthlyNonTaxableAmount > monthlyGrossSalary) {
      addError(
        errors,
        "monthlyNonTaxableAmount",
        "NON_TAXABLE_EXCEEDS_MONTHLY_SALARY",
        "월 비과세액은 월 급여보다 클 수 없습니다.",
      );
    }
  }

  if (
    isFiniteNumber(input.dependentCount) &&
    isFiniteNumber(input.childCount) &&
    input.childCount > input.dependentCount
  ) {
    addError(
      errors,
      "childCount",
      "CHILD_COUNT_EXCEEDS_DEPENDENT_COUNT",
      "자녀 수는 공제대상가족 수보다 많을 수 없습니다.",
    );
  }

  return errors;
}

export function calculateSalaryTakeHome(
  input: unknown,
): SalaryTakeHomeCalculationResponse {
  const errors = validateSalaryTakeHomeInput(input);

  if (
    errors.length > 0 ||
    !isRecord(input) ||
    !hasValidNumericFields(input)
  ) {
    return { success: false, errors };
  }

  const policy = SALARY_TAKE_HOME_POLICY_2026;
  const monthlyGrossSalary = Math.floor(input.annualSalary / 12);
  const monthlyTaxableSalary =
    monthlyGrossSalary - input.monthlyNonTaxableAmount;
  const pensionStandardMonthlyIncome = Math.min(
    policy.nationalPension.standardMonthlyIncomeMaximum,
    Math.max(
      policy.nationalPension.standardMonthlyIncomeMinimum,
      floorToUnit(
        monthlyTaxableSalary,
        policy.nationalPension.standardMonthlyIncomeUnit,
      ),
    ),
  );
  const nationalPension = floorToUnit(
    multiplyAndFloor(
      pensionStandardMonthlyIncome,
      policy.nationalPension.employeeRateBasisPoints,
      10_000,
    ),
    policy.nationalPension.contributionTruncationUnit,
  );
  const healthInsurance = Math.min(
    multiplyAndFloor(
      monthlyTaxableSalary,
      policy.healthInsurance.totalRateBasisPoints,
      10_000 * policy.healthInsurance.employeeShareDenominator,
    ),
    Math.floor(
      policy.healthInsurance.maximumTotalMonthlyPremium /
        policy.healthInsurance.employeeShareDenominator,
    ),
  );
  const longTermCareInsurance = multiplyAndFloor(
    healthInsurance,
    policy.longTermCareInsurance.incomeRatePartsPerMillion,
    policy.longTermCareInsurance.healthInsuranceRatePartsPerMillion,
  );
  const employmentInsurance = multiplyAndFloor(
    monthlyTaxableSalary,
    policy.employmentInsurance.employeeRateBasisPoints,
    10_000,
  );
  const incomeTax = calculateMonthlyIncomeTax(
    monthlyTaxableSalary,
    input.dependentCount,
    input.childCount,
  );
  const localIncomeTax = floorToUnit(
    multiplyAndFloor(
      incomeTax,
      policy.localIncomeTax.percentageOfIncomeTax,
      100,
    ),
    policy.localIncomeTax.truncationUnit,
  );
  const totalMonthlyDeductions =
    nationalPension +
    healthInsurance +
    longTermCareInsurance +
    employmentInsurance +
    incomeTax +
    localIncomeTax;
  const estimatedMonthlyTakeHome = Math.max(
    0,
    monthlyGrossSalary - totalMonthlyDeductions,
  );

  return {
    success: true,
    data: {
      monthlyGrossSalary,
      monthlyTaxableSalary,
      nationalPension,
      healthInsurance,
      longTermCareInsurance,
      employmentInsurance,
      incomeTax,
      localIncomeTax,
      totalMonthlyDeductions,
      estimatedMonthlyTakeHome,
      estimatedAnnualTakeHome: estimatedMonthlyTakeHome * 12,
      policyYear: policy.year,
      policyVerifiedAt: policy.verifiedAt,
    },
  };
}
