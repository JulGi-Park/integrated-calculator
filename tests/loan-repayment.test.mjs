import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  calculateBullet,
  calculateEqualPayment,
  calculateEqualPrincipal,
  calculateLoanRepaymentComparison,
  compareLoanRepayments,
  validateLoanRepaymentInput,
} from "../lib/calculators/loan/loan-repayment.ts";
import { LOAN_REPAYMENT_POLICY } from "../lib/calculators/loan/policy.ts";

const baseInput = {
  principal: 100_000_000,
  annualInterestRate: 4.5,
  termMonths: 360,
};

function assertSuccess(response) {
  assert.equal(response.success, true);
  return response.data;
}

function assertHasError(response, field, code) {
  assert.equal(response.success, false);
  assert.ok(
    response.errors.some(
      (error) => error.field === field && error.code === code,
    ),
    `${field} 필드에 ${code} 오류가 있어야 합니다.`,
  );
}

function assertScheduleInvariants(result, principal, termMonths) {
  assert.equal(result.schedule.length, termMonths);
  assert.equal(result.schedule[0].installmentNumber, 1);
  assert.equal(result.schedule.at(-1).installmentNumber, termMonths);
  assert.equal(result.schedule.at(-1).closingBalance, 0);

  let principalSum = 0;
  let interestSum = 0;
  let paymentSum = 0;

  for (const item of result.schedule) {
    assert.equal(
      item.monthlyPayment,
      item.principalPayment + item.interestPayment,
    );
    assert.equal(
      item.closingBalance,
      item.openingBalance - item.principalPayment,
    );
    assert.ok(item.principalPayment >= 0);
    assert.ok(item.interestPayment >= 0);
    assert.ok(item.openingBalance >= 0);
    assert.ok(item.closingBalance >= 0);
    principalSum += item.principalPayment;
    interestSum += item.interestPayment;
    paymentSum += item.monthlyPayment;
  }

  assert.equal(principalSum, principal);
  assert.equal(interestSum, result.totalInterest);
  assert.equal(paymentSum, result.totalPayment);
  assert.equal(result.totalPayment, principal + result.totalInterest);
}

test("공식 고정 사례 1: 1억원·연 4.5%·360개월의 세 방식 요약을 계산한다", () => {
  const data = assertSuccess(calculateLoanRepaymentComparison(baseInput));

  assert.deepEqual(
    {
      equalPayment: [
        data.equalPayment.totalInterest,
        data.equalPayment.totalPayment,
      ],
      equalPrincipal: [
        data.equalPrincipal.totalInterest,
        data.equalPrincipal.totalPayment,
      ],
      bullet: [data.bullet.totalInterest, data.bullet.totalPayment],
    },
    {
      equalPayment: [82_406_841, 182_406_841],
      equalPrincipal: [67_687_688, 167_687_688],
      bullet: [135_000_000, 235_000_000],
    },
  );
});

test("고정 사례 1의 원리금균등 첫 회차와 마지막 회차를 검증한다", () => {
  const result = calculateEqualPayment(baseInput);

  assert.equal(result.regularMonthlyPayment, 506_685);
  assert.deepEqual(result.schedule[0], {
    installmentNumber: 1,
    openingBalance: 100_000_000,
    principalPayment: 131_685,
    interestPayment: 375_000,
    monthlyPayment: 506_685,
    closingBalance: 99_868_315,
  });
  assert.deepEqual(result.schedule.at(-1), {
    installmentNumber: 360,
    openingBalance: 505_032,
    principalPayment: 505_032,
    interestPayment: 1_894,
    monthlyPayment: 506_926,
    closingBalance: 0,
  });
});

test("고정 사례 1의 원금균등 첫 회차와 마지막 회차를 검증한다", () => {
  const result = calculateEqualPrincipal(baseInput);

  assert.equal(result.baseMonthlyPrincipal, 277_777);
  assert.deepEqual(result.schedule[0], {
    installmentNumber: 1,
    openingBalance: 100_000_000,
    principalPayment: 277_777,
    interestPayment: 375_000,
    monthlyPayment: 652_777,
    closingBalance: 99_722_223,
  });
  assert.deepEqual(result.schedule.at(-1), {
    installmentNumber: 360,
    openingBalance: 278_057,
    principalPayment: 278_057,
    interestPayment: 1_043,
    monthlyPayment: 279_100,
    closingBalance: 0,
  });
});

test("고정 사례 1의 만기일시 첫 회차와 만기 회차를 검증한다", () => {
  const result = calculateBullet(baseInput);

  assert.equal(result.regularMonthlyInterest, 375_000);
  assert.deepEqual(result.schedule[0], {
    installmentNumber: 1,
    openingBalance: 100_000_000,
    principalPayment: 0,
    interestPayment: 375_000,
    monthlyPayment: 375_000,
    closingBalance: 100_000_000,
  });
  assert.deepEqual(result.schedule.at(-1), {
    installmentNumber: 360,
    openingBalance: 100_000_000,
    principalPayment: 100_000_000,
    interestPayment: 375_000,
    monthlyPayment: 100_375_000,
    closingBalance: 0,
  });
});

test("공식 고정 사례 2: 0% 금리는 세 방식 모두 총이자가 0원이다", () => {
  const data = assertSuccess(
    calculateLoanRepaymentComparison({
      principal: 10_000_000,
      annualInterestRate: 0,
      termMonths: 12,
    }),
  );

  assert.deepEqual(
    [
      data.equalPayment.totalInterest,
      data.equalPrincipal.totalInterest,
      data.bullet.totalInterest,
    ],
    [0, 0, 0],
  );
  assert.equal(data.equalPayment.schedule[0].principalPayment, 833_333);
  assert.equal(data.equalPayment.schedule.at(-1).principalPayment, 833_337);
  assert.equal(data.equalPrincipal.schedule.at(-1).principalPayment, 833_337);
  assert.equal(data.bullet.schedule.at(-1).monthlyPayment, 10_000_000);
});

test("공식 고정 사례 3: 나누어떨어지지 않는 원금의 반올림과 보정을 검증한다", () => {
  const data = assertSuccess(
    calculateLoanRepaymentComparison({
      principal: 1_000_001,
      annualInterestRate: 3.75,
      termMonths: 7,
    }),
  );

  assert.deepEqual(
    {
      equalPayment: [
        data.equalPayment.totalInterest,
        data.equalPayment.schedule[0].monthlyPayment,
        data.equalPayment.schedule.at(-1).monthlyPayment,
      ],
      equalPrincipal: [
        data.equalPrincipal.totalInterest,
        data.equalPrincipal.schedule[0].monthlyPayment,
        data.equalPrincipal.schedule.at(-1).monthlyPayment,
      ],
      bullet: [
        data.bullet.totalInterest,
        data.bullet.schedule[0].monthlyPayment,
        data.bullet.schedule.at(-1).monthlyPayment,
      ],
    },
    {
      equalPayment: [12_540, 144_649, 144_647],
      equalPrincipal: [12_500, 145_982, 143_305],
      bullet: [21_875, 3_125, 1_003_126],
    },
  );
});

test("빈 값과 숫자가 아닌 값을 필드별 구조화 오류로 반환한다", () => {
  for (const field of ["principal", "annualInterestRate", "termMonths"]) {
    assertHasError(
      calculateLoanRepaymentComparison({ ...baseInput, [field]: "" }),
      field,
      "REQUIRED",
    );
    assertHasError(
      calculateLoanRepaymentComparison({ ...baseInput, [field]: "1" }),
      field,
      "INVALID_NUMBER",
    );
  }
});

test("NaN과 Infinity를 모든 입력 필드에서 거부한다", () => {
  for (const field of ["principal", "annualInterestRate", "termMonths"]) {
    for (const value of [Number.NaN, Infinity, -Infinity]) {
      assertHasError(
        calculateLoanRepaymentComparison({ ...baseInput, [field]: value }),
        field,
        "INVALID_NUMBER",
      );
    }
  }
});

test("대출원금 0원·음수·소수·안전 정수 초과를 거부한다", () => {
  assertHasError(
    calculateLoanRepaymentComparison({ ...baseInput, principal: 0 }),
    "principal",
    "MUST_BE_POSITIVE",
  );
  assertHasError(
    calculateLoanRepaymentComparison({ ...baseInput, principal: -1 }),
    "principal",
    "MUST_BE_POSITIVE",
  );
  assertHasError(
    calculateLoanRepaymentComparison({ ...baseInput, principal: 1.5 }),
    "principal",
    "MUST_BE_INTEGER",
  );
  assertHasError(
    calculateLoanRepaymentComparison({
      ...baseInput,
      principal: Number.MAX_SAFE_INTEGER + 1,
    }),
    "principal",
    "MUST_BE_SAFE_INTEGER",
  );
});

test("대출원금 서비스 최대 경계를 허용하고 초과를 거부한다", () => {
  assert.equal(
    validateLoanRepaymentInput({
      ...baseInput,
      principal: LOAN_REPAYMENT_POLICY.maximumPrincipal,
    }).length,
    0,
  );
  assertHasError(
    calculateLoanRepaymentComparison({
      ...baseInput,
      principal: LOAN_REPAYMENT_POLICY.maximumPrincipal + 1,
    }),
    "principal",
    "PRINCIPAL_EXCEEDS_LIMIT",
  );
});

test("연이율 0%와 100% 경계를 허용한다", () => {
  assert.equal(
    validateLoanRepaymentInput({ ...baseInput, annualInterestRate: 0 }).length,
    0,
  );
  assert.equal(
    validateLoanRepaymentInput({ ...baseInput, annualInterestRate: 100 }).length,
    0,
  );
});

test("음수·최대 초과·지원 정밀도 초과 연이율을 거부한다", () => {
  assertHasError(
    calculateLoanRepaymentComparison({
      ...baseInput,
      annualInterestRate: -0.0001,
    }),
    "annualInterestRate",
    "MUST_BE_NON_NEGATIVE",
  );
  assertHasError(
    calculateLoanRepaymentComparison({
      ...baseInput,
      annualInterestRate: 100.0001,
    }),
    "annualInterestRate",
    "RATE_EXCEEDS_LIMIT",
  );
  assertHasError(
    calculateLoanRepaymentComparison({
      ...baseInput,
      annualInterestRate: 4.12345,
    }),
    "annualInterestRate",
    "RATE_PRECISION_EXCEEDED",
  );
});

test("기간 0개월·음수·소수·안전 정수 초과를 거부한다", () => {
  assertHasError(
    calculateLoanRepaymentComparison({ ...baseInput, termMonths: 0 }),
    "termMonths",
    "MUST_BE_POSITIVE",
  );
  assertHasError(
    calculateLoanRepaymentComparison({ ...baseInput, termMonths: -1 }),
    "termMonths",
    "MUST_BE_POSITIVE",
  );
  assertHasError(
    calculateLoanRepaymentComparison({ ...baseInput, termMonths: 1.5 }),
    "termMonths",
    "MUST_BE_INTEGER",
  );
  assertHasError(
    calculateLoanRepaymentComparison({
      ...baseInput,
      termMonths: Number.MAX_SAFE_INTEGER + 1,
    }),
    "termMonths",
    "MUST_BE_SAFE_INTEGER",
  );
});

test("기간 600개월 경계를 허용하고 초과를 거부한다", () => {
  assert.equal(
    validateLoanRepaymentInput({
      ...baseInput,
      termMonths: LOAN_REPAYMENT_POLICY.maximumTermMonths,
    }).length,
    0,
  );
  assertHasError(
    calculateLoanRepaymentComparison({
      ...baseInput,
      termMonths: LOAN_REPAYMENT_POLICY.maximumTermMonths + 1,
    }),
    "termMonths",
    "TERM_EXCEEDS_LIMIT",
  );
});

test("원리금균등의 정기 회차 납입액은 마지막 보정 전까지 일정하다", () => {
  const result = calculateEqualPayment(baseInput);

  for (const item of result.schedule.slice(0, -1)) {
    assert.equal(item.monthlyPayment, result.regularMonthlyPayment);
  }
  assert.equal(result.firstMonthPrincipal, 131_685);
  assert.equal(result.firstMonthInterest, 375_000);
  assert.equal(result.lastMonthPrincipal, 505_032);
  assert.equal(result.lastMonthInterest, 1_894);
  assert.equal(result.lastMonthPayment, 506_926);
});

test("원금균등의 납입액은 일반 금리에서 매월 증가하지 않는다", () => {
  const result = calculateEqualPrincipal(baseInput);

  for (let index = 1; index < result.schedule.length; index += 1) {
    assert.ok(
      result.schedule[index].monthlyPayment <=
        result.schedule[index - 1].monthlyPayment,
    );
  }
});

test("만기일시는 만기 전 원금 상환액이 모두 0원이다", () => {
  const result = calculateBullet(baseInput);

  for (const item of result.schedule.slice(0, -1)) {
    assert.equal(item.principalPayment, 0);
    assert.equal(item.openingBalance, baseInput.principal);
    assert.equal(item.closingBalance, baseInput.principal);
  }
  assert.equal(result.maturityMonthPrincipal, baseInput.principal);
  assert.equal(result.maturityMonthInterest, 375_000);
  assert.equal(result.maturityMonthPayment, 100_375_000);
});

test("1개월 대출은 첫 회차에서 세 방식 모두 원금 전액을 상환한다", () => {
  const data = assertSuccess(
    calculateLoanRepaymentComparison({
      principal: 1_000_000,
      annualInterestRate: 12,
      termMonths: 1,
    }),
  );

  for (const result of [
    data.equalPayment,
    data.equalPrincipal,
    data.bullet,
  ]) {
    assert.equal(result.schedule.length, 1);
    assert.equal(result.schedule[0].principalPayment, 1_000_000);
    assert.equal(result.schedule[0].interestPayment, 10_000);
    assert.equal(result.schedule[0].monthlyPayment, 1_010_000);
    assert.equal(result.schedule[0].closingBalance, 0);
  }
});

test("회차 이자의 정확한 0.5원 경계를 half-up으로 올림한다", () => {
  const data = compareLoanRepayments({
    principal: 6,
    annualInterestRate: 100,
    termMonths: 1,
  });

  assert.equal(data.equalPayment.schedule[0].interestPayment, 1);
  assert.equal(data.equalPrincipal.schedule[0].interestPayment, 1);
  assert.equal(data.bullet.schedule[0].interestPayment, 1);
});

test("세 방식의 공통 일정·합계 불변조건을 만족한다", () => {
  const data = compareLoanRepayments(baseInput);

  for (const result of [
    data.equalPayment,
    data.equalPrincipal,
    data.bullet,
  ]) {
    assertScheduleInvariants(
      result,
      baseInput.principal,
      baseInput.termMonths,
    );
  }
});

test("소액·고액·장기·소수점 금리에서도 공통 불변조건을 만족한다", () => {
  const inputs = [
    { principal: 1, annualInterestRate: 0.0001, termMonths: 1 },
    { principal: 10_000_000_000, annualInterestRate: 4.1234, termMonths: 12 },
    { principal: 50_000_000, annualInterestRate: 7.25, termMonths: 600 },
  ];

  for (const input of inputs) {
    const data = assertSuccess(calculateLoanRepaymentComparison(input));
    for (const result of [
      data.equalPayment,
      data.equalPrincipal,
      data.bullet,
    ]) {
      assertScheduleInvariants(result, input.principal, input.termMonths);
    }
  }
});

test("최대 원금·금리·기간 조합이 정상 종료한다", () => {
  const input = {
    principal: LOAN_REPAYMENT_POLICY.maximumPrincipal,
    annualInterestRate: LOAN_REPAYMENT_POLICY.maximumAnnualInterestRate,
    termMonths: LOAN_REPAYMENT_POLICY.maximumTermMonths,
  };
  const data = assertSuccess(calculateLoanRepaymentComparison(input));

  for (const result of [
    data.equalPayment,
    data.equalPrincipal,
    data.bullet,
  ]) {
    assertScheduleInvariants(result, input.principal, input.termMonths);
  }
});

test("총이자 최저·첫 달 부담 최저·일정 납입 방식을 분류한다", () => {
  const data = compareLoanRepayments(baseInput);

  assert.deepEqual(data.lowestTotalInterestTypes, ["equalPrincipal"]);
  assert.deepEqual(data.lowestFirstMonthPaymentTypes, ["bullet"]);
  assert.deepEqual(data.levelPaymentTypes, ["equalPayment"]);
});

test("0% 금리의 총이자 최저 동률을 세 방식 모두 반환한다", () => {
  const data = compareLoanRepayments({
    principal: 10_000_000,
    annualInterestRate: 0,
    termMonths: 12,
  });

  assert.deepEqual(data.lowestTotalInterestTypes, [
    "equalPayment",
    "equalPrincipal",
    "bullet",
  ]);
});

test("방식별 총이자 차이는 요약값의 절대 차이와 일치한다", () => {
  const data = compareLoanRepayments(baseInput);

  assert.deepEqual(data.totalInterestDifferences, {
    equalPaymentVsEqualPrincipal: 14_719_153,
    equalPaymentVsBullet: 52_593_159,
    equalPrincipalVsBullet: 67_312_312,
  });
});

test("계산 함수는 입력 객체를 변경하지 않는다", () => {
  const input = { ...baseInput };
  const snapshot = structuredClone(input);

  calculateLoanRepaymentComparison(input);

  assert.deepEqual(input, snapshot);
});

test("세 방식의 일정 배열과 회차 객체는 서로 공유되지 않는다", () => {
  const data = compareLoanRepayments(baseInput);

  assert.notStrictEqual(
    data.equalPayment.schedule,
    data.equalPrincipal.schedule,
  );
  assert.notStrictEqual(data.equalPayment.schedule, data.bullet.schedule);
  assert.notStrictEqual(
    data.equalPayment.schedule[0],
    data.equalPrincipal.schedule[0],
  );
});

test("호출 간 상태를 공유하지 않는다", () => {
  const first = compareLoanRepayments(baseInput);
  const second = compareLoanRepayments(baseInput);

  assert.notStrictEqual(first, second);
  assert.notStrictEqual(first.equalPayment.schedule, second.equalPayment.schedule);
  assert.deepEqual(first, second);
});

test("결과는 JSON 직렬화 가능하고 NaN·Infinity·BigInt를 포함하지 않는다", () => {
  const data = compareLoanRepayments(baseInput);
  const serialized = JSON.stringify(data);

  assert.doesNotThrow(() => JSON.parse(serialized));
  assert.doesNotMatch(serialized, /NaN|Infinity/);

  const visit = (value) => {
    assert.notEqual(typeof value, "bigint");
    if (typeof value === "number") {
      assert.ok(Number.isFinite(value));
    } else if (Array.isArray(value)) {
      value.forEach(visit);
    } else if (value && typeof value === "object") {
      Object.values(value).forEach(visit);
    }
  };
  visit(data);
});

test("검증 실패 시 부분 계산 결과를 반환하지 않는다", () => {
  const response = calculateLoanRepaymentComparison({
    principal: 0,
    annualInterestRate: -1,
    termMonths: 0,
  });

  assert.equal(response.success, false);
  assert.ok(response.errors.length >= 3);
  assert.equal("data" in response, false);
});

test("대출 엔진은 React와 브라우저 API에 의존하지 않는다", () => {
  const source = readFileSync(
    new URL(
      "../lib/calculators/loan/loan-repayment.ts",
      import.meta.url,
    ),
    "utf8",
  );

  assert.doesNotMatch(
    source,
    /\b(?:React|window|document|navigator|localStorage)\b/,
  );
});
