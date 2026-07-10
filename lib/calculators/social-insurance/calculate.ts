import { SOCIAL_INSURANCE_POLICY_2026 } from "./constants";
import type {
  SocialInsuranceCalculationResponse,
  SocialInsuranceInput,
  SocialInsuranceInputField,
  SocialInsuranceValidationError,
  SocialInsuranceValidationErrorCode,
} from "./types";

const inputFields: SocialInsuranceInputField[] = [
  "monthlySalary",
  "nonTaxableAmount",
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
): input is Record<string, unknown> & SocialInsuranceInput {
  return inputFields.every(
    (field) =>
      isFiniteNumber(input[field]) && Number.isSafeInteger(input[field]),
  );
}

function addError(
  errors: SocialInsuranceValidationError[],
  field: SocialInsuranceInputField,
  code: SocialInsuranceValidationErrorCode,
  message: string,
) {
  errors.push({ field, code, message });
}

function calculatePensionBaseStatus(
  taxableMonthlyPay: number,
): "minimum" | "maximum" | "within" {
  const { standardMonthlyIncomeMinimum, standardMonthlyIncomeMaximum } =
    SOCIAL_INSURANCE_POLICY_2026.nationalPension;

  if (taxableMonthlyPay < standardMonthlyIncomeMinimum) {
    return "minimum";
  }

  if (taxableMonthlyPay > standardMonthlyIncomeMaximum) {
    return "maximum";
  }

  return "within";
}

function roundWon(value: number): number {
  return Math.round(value);
}

export function validateSocialInsuranceInput(
  input: unknown,
): SocialInsuranceValidationError[] {
  const errors: SocialInsuranceValidationError[] = [];
  const maximumInputAmount = SOCIAL_INSURANCE_POLICY_2026.maximumInputAmount;

  if (!isRecord(input)) {
    return [
      {
        field: "monthlySalary",
        code: "REQUIRED",
        message: "월 급여를 입력해 주세요.",
      },
      {
        field: "nonTaxableAmount",
        code: "INVALID_NUMBER",
        message: "비과세 금액을 숫자로 입력해 주세요.",
      },
    ];
  }

  for (const field of inputFields) {
    const value = input[field];

    if (field === "monthlySalary" && isEmpty(value)) {
      addError(errors, field, "REQUIRED", "월 급여를 입력해 주세요.");
      continue;
    }

    if (field === "nonTaxableAmount" && isEmpty(value)) {
      continue;
    }

    if (!isFiniteNumber(value)) {
      addError(errors, field, "INVALID_NUMBER", "숫자로 입력해 주세요.");
      continue;
    }

    if (!Number.isInteger(value)) {
      addError(errors, field, "MUST_BE_INTEGER", "원 단위 정수로 입력해 주세요.");
    } else if (!Number.isSafeInteger(value)) {
      addError(
        errors,
        field,
        "MUST_BE_SAFE_INTEGER",
        "허용 범위를 벗어난 금액입니다.",
      );
    }
  }

  if (isFiniteNumber(input.monthlySalary)) {
    if (input.monthlySalary <= 0) {
      addError(
        errors,
        "monthlySalary",
        "MUST_BE_POSITIVE",
        "월 급여는 0원보다 커야 합니다.",
      );
    }

    if (input.monthlySalary > maximumInputAmount) {
      addError(
        errors,
        "monthlySalary",
        "AMOUNT_EXCEEDS_LIMIT",
        "월 급여가 허용 범위를 초과했습니다.",
      );
    }
  }

  if (isFiniteNumber(input.nonTaxableAmount)) {
    if (input.nonTaxableAmount < 0) {
      addError(
        errors,
        "nonTaxableAmount",
        "MUST_BE_NON_NEGATIVE",
        "비과세 금액은 0원 이상이어야 합니다.",
      );
    }

    if (input.nonTaxableAmount > maximumInputAmount) {
      addError(
        errors,
        "nonTaxableAmount",
        "AMOUNT_EXCEEDS_LIMIT",
        "비과세 금액이 허용 범위를 초과했습니다.",
      );
    }
  }

  if (
    isFiniteNumber(input.monthlySalary) &&
    isFiniteNumber(input.nonTaxableAmount) &&
    Number.isSafeInteger(input.monthlySalary) &&
    Number.isSafeInteger(input.nonTaxableAmount)
  ) {
    if (input.nonTaxableAmount > input.monthlySalary) {
      addError(
        errors,
        "nonTaxableAmount",
        "NON_TAXABLE_EXCEEDS_MONTHLY_SALARY",
        "비과세 금액은 월 급여보다 클 수 없습니다.",
      );
    } else if (input.nonTaxableAmount === input.monthlySalary) {
      addError(
        errors,
        "nonTaxableAmount",
        "TAXABLE_PAY_MUST_BE_POSITIVE",
        "과세기준급여는 0원보다 커야 합니다.",
      );
    }
  }

  return errors;
}

export function calculateSocialInsurance(
  input: unknown,
): SocialInsuranceCalculationResponse {
  const normalizedInput =
    isRecord(input) && isEmpty(input.nonTaxableAmount)
      ? { ...input, nonTaxableAmount: 0 }
      : input;
  const errors = validateSocialInsuranceInput(normalizedInput);

  if (
    errors.length > 0 ||
    !isRecord(normalizedInput) ||
    !hasValidNumericFields(normalizedInput)
  ) {
    return { success: false, errors };
  }

  const policy = SOCIAL_INSURANCE_POLICY_2026;
  const taxableMonthlyPay =
    normalizedInput.monthlySalary - normalizedInput.nonTaxableAmount;
  const pensionBase = Math.min(
    policy.nationalPension.standardMonthlyIncomeMaximum,
    Math.max(
      policy.nationalPension.standardMonthlyIncomeMinimum,
      taxableMonthlyPay,
    ),
  );
  const employeePension = roundWon(
    pensionBase * policy.nationalPension.employeeRate,
  );
  const employeeHealthInsurance = roundWon(
    taxableMonthlyPay * policy.healthInsurance.employeeRate,
  );
  const employeeLongTermCare = roundWon(
    employeeHealthInsurance *
      policy.longTermCareInsurance.healthInsuranceRate,
  );
  const employeeEmploymentInsurance = roundWon(
    taxableMonthlyPay *
      policy.employmentInsurance.unemploymentBenefitEmployeeRate,
  );
  const totalEmployeeContribution =
    employeePension +
    employeeHealthInsurance +
    employeeLongTermCare +
    employeeEmploymentInsurance;
  const afterContributionAmount =
    normalizedInput.monthlySalary - totalEmployeeContribution;

  const resultValues = [
    taxableMonthlyPay,
    pensionBase,
    employeePension,
    employeeHealthInsurance,
    employeeLongTermCare,
    employeeEmploymentInsurance,
    totalEmployeeContribution,
    afterContributionAmount,
  ];

  if (!resultValues.every(Number.isFinite)) {
    return {
      success: false,
      errors: [
        {
          field: "monthlySalary",
          code: "NON_FINITE_RESULT",
          message: "계산 결과를 확인할 수 없습니다.",
        },
      ],
    };
  }

  return {
    success: true,
    data: {
      monthlySalary: normalizedInput.monthlySalary,
      nonTaxableAmount: normalizedInput.nonTaxableAmount,
      taxableMonthlyPay,
      pensionBase,
      pensionBaseStatus: calculatePensionBaseStatus(taxableMonthlyPay),
      employeePension,
      employeeHealthInsurance,
      employeeLongTermCare,
      employeeEmploymentInsurance,
      totalEmployeeContribution,
      afterContributionAmount,
      policyYear: policy.year,
      policyVerifiedAt: policy.verifiedAt,
    },
  };
}
