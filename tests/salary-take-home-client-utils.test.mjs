import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSalaryTakeHomeResultText,
  initialSalaryTakeHomeInputs,
  parseSalaryTakeHomeStoredInputs,
  SALARY_TAKE_HOME_STORAGE_KEY,
  SALARY_TAKE_HOME_STORAGE_VERSION,
  serializeSalaryTakeHomeInputs,
} from "../components/calculators/salaryTakeHomeClientUtils.ts";

const verifiedInput = {
  annualSalary: 36_000_000,
  monthlyNonTaxableAmount: 0,
  dependentCount: 1,
  childCount: 0,
};

const verifiedResult = {
  monthlyGrossSalary: 3_000_000,
  monthlyTaxableSalary: 3_000_000,
  nationalPension: 142_500,
  healthInsurance: 107_850,
  longTermCareInsurance: 14_172,
  employmentInsurance: 27_000,
  incomeTax: 74_350,
  localIncomeTax: 7_430,
  totalMonthlyDeductions: 373_302,
  estimatedMonthlyTakeHome: 2_626_698,
  estimatedAnnualTakeHome: 31_520_376,
  policyYear: 2026,
  policyVerifiedAt: "2026-06-19",
};

test("연봉 계산기 전용 키와 버전 1 형식으로 네 입력값을 직렬화한다", () => {
  const inputs = {
    ...initialSalaryTakeHomeInputs,
    annualSalary: "50000000",
    monthlyNonTaxableAmount: "200000",
  };
  const serialized = serializeSalaryTakeHomeInputs(inputs);

  assert.equal(
    SALARY_TAKE_HOME_STORAGE_KEY,
    "integrated-calculator:salary-take-home:inputs",
  );
  assert.equal(SALARY_TAKE_HOME_STORAGE_VERSION, 1);
  assert.deepEqual(JSON.parse(serialized), {
    version: 1,
    inputs,
  });
  assert.deepEqual(parseSalaryTakeHomeStoredInputs(serialized), inputs);
  assert.equal("result" in JSON.parse(serialized), false);
});

for (const [name, value] of [
  ["손상된 JSON", "{"],
  ["null", "null"],
  ["배열", "[]"],
  ["문자열", JSON.stringify("invalid")],
  ["숫자", JSON.stringify(123)],
  ["이전 버전", JSON.stringify({ version: 0, inputs: initialSalaryTakeHomeInputs })],
  ["알 수 없는 버전", JSON.stringify({ version: 2, inputs: initialSalaryTakeHomeInputs })],
  ["inputs 누락", JSON.stringify({ version: 1 })],
  [
    "필드 누락",
    JSON.stringify({
      version: 1,
      inputs: {
        annualSalary: "",
        monthlyNonTaxableAmount: "0",
        dependentCount: "1",
      },
    }),
  ],
  [
    "추가 필드",
    JSON.stringify({
      version: 1,
      inputs: { ...initialSalaryTakeHomeInputs, unexpected: "1" },
    }),
  ],
  [
    "잘못된 필드 타입",
    JSON.stringify({
      version: 1,
      inputs: { ...initialSalaryTakeHomeInputs, annualSalary: 50_000_000 },
    }),
  ],
  [
    "안전하지 않은 문자열",
    JSON.stringify({
      version: 1,
      inputs: { ...initialSalaryTakeHomeInputs, annualSalary: "abc" },
    }),
  ],
  [
    "잘못된 쉼표 문자열",
    JSON.stringify({
      version: 1,
      inputs: { ...initialSalaryTakeHomeInputs, annualSalary: "36,,000" },
    }),
  ],
  ["과도하게 긴 데이터", "0".repeat(2_001)],
]) {
  test(`${name} 저장 데이터는 거부한다`, () => {
    assert.equal(parseSalaryTakeHomeStoredInputs(value), null);
  });
}

test("복사·공유 텍스트를 화면 결과와 같은 고정 형식으로 생성한다", () => {
  assert.equal(
    buildSalaryTakeHomeResultText(verifiedInput, verifiedResult),
    [
      "연봉 실수령액 계산 결과",
      "",
      "[입력 및 계산 기준]",
      "연봉: 36,000,000원",
      "월 급여: 3,000,000원",
      "월 비과세액: 0원",
      "월 과세 급여: 3,000,000원",
      "",
      "[상세 공제]",
      "국민연금: 142,500원",
      "건강보험: 107,850원",
      "장기요양보험: 14,172원",
      "고용보험: 27,000원",
      "소득세: 74,350원",
      "지방소득세: 7,430원",
      "",
      "[결과]",
      "월 공제 합계: 373,302원",
      "월 예상 실수령액: 2,626,698원",
      "연간 예상 실수령액: 31,520,376원",
      "적용 정책: 2026년",
      "기준 확인일: 2026년 6월 19일",
      "",
      "입력값과 적용 정책에 따른 예상 결과이며 실제 급여명세서와 차이가 날 수 있습니다.",
    ].join("\n"),
  );
});

test("비정상 결과값을 복사 텍스트로 직렬화하지 않는다", () => {
  assert.throws(
    () =>
      buildSalaryTakeHomeResultText(verifiedInput, {
        ...verifiedResult,
        incomeTax: Number.NaN,
      }),
    TypeError,
  );
  assert.throws(
    () =>
      buildSalaryTakeHomeResultText(verifiedInput, {
        ...verifiedResult,
        estimatedMonthlyTakeHome: Infinity,
      }),
    TypeError,
  );
});
