export interface SeveranceInput {
  /** 근로를 시작한 날 (YYYY-MM-DD, 포함) */
  employmentStartDate: string;
  /** 마지막 근무일의 다음 날 (YYYY-MM-DD, 제외) */
  retirementDate: string;
  /** 평균임금 산정기간에 지급된 임금총액 (원) */
  wagesForAveragePeriod: number;
  /** 퇴직 전 1년간 지급된 상여금 총액 (원) */
  annualBonusTotal: number;
  /** 평균임금에 반영할 전년도 연차수당 총액 (원) */
  annualLeaveAllowanceTotal: number;
  /** 1일 통상임금 (원), 입력하지 않으면 null */
  ordinaryDailyWage: number | null;
  /** 퇴직 전 4주 평균 1주 소정근로시간 */
  averageWeeklyContractHours: number;
}

export type SeveranceIneligibilityReasonCode =
  | "CONTINUOUS_SERVICE_UNDER_ONE_YEAR"
  | "WEEKLY_HOURS_UNDER_15"
  | "BOTH_REQUIREMENTS_NOT_MET";

export type AppliedDailyWageReason =
  | "AVERAGE_WAGE_USED_NO_ORDINARY_WAGE"
  | "AVERAGE_WAGE_HIGHER_OR_EQUAL"
  | "ORDINARY_WAGE_HIGHER";

export interface SeveranceResult {
  totalServiceDays: number;
  averageWagePeriodStartDate: string;
  averageWagePeriodEndDate: string;
  averageWagePeriodDays: number;
  wagesForAveragePeriod: number;
  reflectedBonusAmount: number;
  reflectedAnnualLeaveAllowanceAmount: number;
  totalWagesForAverageWage: number;
  averageDailyWage: number;
  ordinaryDailyWage: number | null;
  appliedDailyWage: number;
  ordinaryWageSubstituted: boolean;
  appliedDailyWageReason: AppliedDailyWageReason;
  estimatedSeverance: number;
  meetsContinuousServiceRequirement: boolean;
  meetsWeeklyHoursRequirement: boolean;
  isBasicallyEligible: boolean;
  ineligibilityReasonCode: SeveranceIneligibilityReasonCode | null;
  policyVerifiedAt: string;
}

export type SeveranceInputField = keyof SeveranceInput;

export type SeveranceValidationErrorCode =
  | "REQUIRED"
  | "INVALID_NUMBER"
  | "MUST_BE_INTEGER"
  | "MUST_BE_SAFE_INTEGER"
  | "MUST_BE_POSITIVE"
  | "MUST_BE_NON_NEGATIVE"
  | "AMOUNT_EXCEEDS_LIMIT"
  | "INVALID_DATE_FORMAT"
  | "INVALID_DATE"
  | "RETIREMENT_BEFORE_START"
  | "RETIREMENT_SAME_AS_START"
  | "HOURS_EXCEED_LIMIT"
  | "HOURS_PRECISION_EXCEEDED";

export interface SeveranceValidationError {
  field: SeveranceInputField;
  code: SeveranceValidationErrorCode;
  message: string;
}

export type SeveranceCalculationResponse =
  | {
      success: true;
      data: SeveranceResult;
    }
  | {
      success: false;
      errors: SeveranceValidationError[];
    };
