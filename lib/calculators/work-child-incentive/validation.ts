import { WORK_CHILD_INCENTIVE_POLICY } from "./constants";
import type {
  FilingType,
  HouseholdType,
  IncentiveApplicationType,
  WorkChildIncentiveInput,
  WorkChildIncentiveValidationError,
} from "./types";

const applicationTypes: IncentiveApplicationType[] = ["work", "child", "both"];
const householdTypes: HouseholdType[] = ["single", "singleIncome", "dualIncome"];
const filingTypes: FilingType[] = ["regular", "late", "halfYear"];

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function validateWorkChildIncentiveInput(
  input: WorkChildIncentiveInput,
): WorkChildIncentiveValidationError[] {
  const errors: WorkChildIncentiveValidationError[] = [];
  const maximum = WORK_CHILD_INCENTIVE_POLICY.maximumInputAmount;

  if (!applicationTypes.includes(input.applicationType)) {
    errors.push({ field: "applicationType", message: "신청 유형을 선택해 주세요." });
  }

  if (!householdTypes.includes(input.householdType)) {
    errors.push({ field: "householdType", message: "가구 유형을 선택해 주세요." });
  }

  if (!filingTypes.includes(input.filingType)) {
    errors.push({ field: "filingType", message: "신청 구분을 선택해 주세요." });
  }

  if (!isFiniteNumber(input.totalIncome) || input.totalIncome <= 0) {
    errors.push({
      field: "totalIncome",
      message: "부부합산 총소득을 0보다 큰 금액으로 입력해 주세요.",
    });
  } else if (input.totalIncome > maximum) {
    errors.push({
      field: "totalIncome",
      message: "부부합산 총소득이 계산 가능한 범위를 벗어났습니다.",
    });
  }

  if (!isFiniteNumber(input.totalSalary) || input.totalSalary < 0) {
    errors.push({
      field: "totalSalary",
      message: "총급여액 등은 0 이상 금액으로 입력해 주세요.",
    });
  } else if (input.totalSalary > maximum) {
    errors.push({
      field: "totalSalary",
      message: "총급여액 등이 계산 가능한 범위를 벗어났습니다.",
    });
  }

  if (!isFiniteNumber(input.propertyAmount) || input.propertyAmount < 0) {
    errors.push({
      field: "propertyAmount",
      message: "재산 합계액은 0 이상 금액으로 입력해 주세요.",
    });
  } else if (input.propertyAmount > maximum) {
    errors.push({
      field: "propertyAmount",
      message: "재산 합계액이 계산 가능한 범위를 벗어났습니다.",
    });
  }

  if (
    !isFiniteNumber(input.childCount) ||
    !Number.isInteger(input.childCount) ||
    input.childCount < 0 ||
    input.childCount > WORK_CHILD_INCENTIVE_POLICY.maximumChildCount
  ) {
    errors.push({
      field: "childCount",
      message: "부양자녀 수를 0명 이상 정수로 입력해 주세요.",
    });
  }

  if (!isFiniteNumber(input.spouseSalary) || input.spouseSalary < 0) {
    errors.push({
      field: "spouseSalary",
      message: "배우자 총급여액 등은 0 이상 금액으로 입력해 주세요.",
    });
  } else if (input.spouseSalary > maximum) {
    errors.push({
      field: "spouseSalary",
      message: "배우자 총급여액 등이 계산 가능한 범위를 벗어났습니다.",
    });
  }

  if (
    input.householdType === "dualIncome" &&
    isFiniteNumber(input.spouseSalary) &&
    input.spouseSalary < 3_000_000
  ) {
    errors.push({
      field: "spouseSalary",
      message: "맞벌이가구는 배우자 총급여액 등 300만원 이상 기준을 확인해 주세요.",
    });
  }

  if (
    input.householdType === "singleIncome" &&
    isFiniteNumber(input.spouseSalary) &&
    input.spouseSalary >= 3_000_000
  ) {
    errors.push({
      field: "spouseSalary",
      message: "배우자 총급여액 등 300만원 이상이면 맞벌이가구 기준을 확인해 주세요.",
    });
  }

  return errors;
}
