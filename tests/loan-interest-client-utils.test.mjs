import assert from "node:assert/strict";
import test from "node:test";

const {
  LOAN_INTEREST_STORAGE_KEY,
  LOAN_INTEREST_STORAGE_VERSION,
  buildLoanInterestResultText,
  parseLoanInterestStoredInputs,
  serializeLoanInterestInputs,
} = await import("../components/calculators/loanInterestClientUtils.ts");
const {
  calculateLoanRepaymentComparison,
} = await import("../lib/calculators/loan/loan-repayment.ts");

test("대출 저장 키와 버전은 다른 계산기와 겹치지 않는다", () => {
  assert.equal(
    LOAN_INTEREST_STORAGE_KEY,
    "integrated-calculator:loan-interest:inputs",
  );
  assert.equal(LOAN_INTEREST_STORAGE_VERSION, 1);
});

test("대출 입력은 버전과 세 필드만 직렬화한다", () => {
  const serialized = serializeLoanInterestInputs({
    principal: "100,000,000",
    annualInterestRate: "4.5",
    termMonths: "360",
  });

  assert.deepEqual(JSON.parse(serialized), {
    version: 1,
    inputs: {
      principal: "100000000",
      annualInterestRate: "4.5",
      termMonths: "360",
    },
  });
});

test("정상 저장 데이터는 대출금액 천 단위 형식으로 복원한다", () => {
  const restored = parseLoanInterestStoredInputs(
    JSON.stringify({
      version: 1,
      inputs: {
        principal: "100000000",
        annualInterestRate: "4.5",
        termMonths: "360",
      },
    }),
  );

  assert.deepEqual(restored, {
    principal: "100,000,000",
    annualInterestRate: "4.5",
    termMonths: "360",
  });
});

for (const [name, value] of [
  ["손상된 JSON", "{"],
  ["객체 아님", "null"],
  ["배열", "[]"],
  ["버전 불일치", JSON.stringify({ version: 2, inputs: {} })],
  [
    "필드 누락",
    JSON.stringify({
      version: 1,
      inputs: { principal: "1", annualInterestRate: "1" },
    }),
  ],
  [
    "잘못된 타입",
    JSON.stringify({
      version: 1,
      inputs: { principal: 1, annualInterestRate: "1", termMonths: "1" },
    }),
  ],
  [
    "범위 초과",
    JSON.stringify({
      version: 1,
      inputs: {
        principal: "10000000001",
        annualInterestRate: "4.5",
        termMonths: "360",
      },
    }),
  ],
  [
    "금리 소수점 초과",
    JSON.stringify({
      version: 1,
      inputs: {
        principal: "100000000",
        annualInterestRate: "4.12345",
        termMonths: "360",
      },
    }),
  ],
  [
    "기간 소수",
    JSON.stringify({
      version: 1,
      inputs: {
        principal: "100000000",
        annualInterestRate: "4.5",
        termMonths: "360.5",
      },
    }),
  ],
]) {
  test(`${name} 저장 데이터는 폐기한다`, () => {
    assert.equal(parseLoanInterestStoredInputs(value), null);
  });
}

test("복사 텍스트는 세 상환방식과 비교 결과만 포함하고 일정 전체는 제외한다", () => {
  const response = calculateLoanRepaymentComparison({
    principal: 100000000,
    annualInterestRate: 4.5,
    termMonths: 360,
  });
  assert.equal(response.success, true);

  const text = buildLoanInterestResultText(
    {
      principal: 100000000,
      annualInterestRate: 4.5,
      termMonths: 360,
    },
    response.data,
  );

  assert.match(text, /^대출 이자 계산 결과/);
  assert.match(text, /대출금액: 100,000,000원/);
  assert.match(text, /연이율: 4.5%/);
  assert.match(text, /대출기간: 360개월/);
  assert.match(text, /\[원리금균등상환\]/);
  assert.match(text, /\[원금균등상환\]/);
  assert.match(text, /\[만기일시상환\]/);
  assert.match(text, /총이자가 가장 적은 방식: 원금균등상환/);
  assert.match(text, /첫 달 부담이 가장 적은 방식: 만기일시상환/);
  assert.match(text, /동률 결과:/);
  assert.equal(text.includes("600회차"), false);
  assert.equal(text.includes("NaN"), false);
  assert.equal(text.includes("Infinity"), false);
});
