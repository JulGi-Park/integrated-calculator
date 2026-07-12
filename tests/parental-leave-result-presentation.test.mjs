import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildParentalLeaveResultPresentation } from "../lib/calculators/parental-leave/parentalLeaveResultPresentation.ts";
import { calculateParentalLeaveWithSpecialPolicy } from "../lib/calculators/parental-leave/parentalLeaveSpecialRules.ts";

function assertSuccess(response) {
  assert.equal(response.success, true);
  return response.data;
}

function buildPresentation(input) {
  return buildParentalLeaveResultPresentation(
    assertSuccess(calculateParentalLeaveWithSpecialPolicy(input)),
  );
}

function assertNoFinalityPhrase(presentation) {
  const serialized = JSON.stringify(presentation);

  assert.doesNotMatch(
    serialized,
    /지급됩니다|확정 금액입니다|반드시 받을 수 있습니다|승인됩니다/,
  );
  assert.match(serialized, /예상|입력값 기준|참고값|고용센터/);
}

test("일반 계산 결과 카드는 예상 계산과 특례 미선택 안내를 분리한다", () => {
  const presentation = buildPresentation({
    monthlyOrdinaryWage: 3_000_000,
    leaveMonths: 6,
  });

  assert.equal(presentation.status, "general");
  assert.equal(presentation.title, "일반 육아휴직급여 예상 계산");
  assert.equal(presentation.appliedPolicyLabel, "일반 육아휴직급여");
  assert.deepEqual(presentation.notAppliedPolicyLabels, []);
  assert.match(presentation.primaryNotice, /특례 조건을 선택하지 않았거나 입력되지 않았습니다/);
  assert.equal(presentation.monthlyRows.length, 6);
  assert.equal(presentation.fallbackRanges.length, 0);
  assert.equal(presentation.policyDate, "2026-07-01");
  assert.ok(presentation.sourceNames.some((source) => source.includes("고용24")));
  assert.match(presentation.disclaimer, /고용센터 심사/);
  assertNoFinalityPhrase(presentation);
});

test("6+6 특례 적용 결과 카드는 특례 적용 방식과 7개월차 일반 fallback을 분리한다", () => {
  const presentation = buildPresentation({
    monthlyOrdinaryWage: 5_000_000,
    leaveMonths: 7,
    specialPolicy: "parentsTogetherSixPlusSix",
    childAgeMonths: 18,
    partnerUsedParentalLeave: true,
    partnerLeaveMonths: 6,
    sameChild: true,
  });

  assert.equal(presentation.status, "specialApplied");
  assert.equal(presentation.appliedPolicyLabel, "부모 함께 육아휴직제 6+6 특례");
  assert.equal(presentation.monthlyRows[0].policyLabel, "부모 함께 육아휴직제 6+6 특례");
  assert.equal(presentation.monthlyRows[6].policyLabel, "일반 육아휴직급여");
  assert.equal(presentation.monthlyRows[6].isFallback, true);
  assert.deepEqual(presentation.fallbackRanges, [
    {
      fromMonth: 7,
      toMonth: 7,
      policyLabel: "일반 육아휴직급여",
      message: "7개월차는 일반 육아휴직급여 기준 예상액으로 표시합니다.",
    },
  ]);
  assert.match(presentation.primaryNotice, /입력값 기준/);
  assert.match(presentation.warningMessages.join(" "), /일반 육아휴직급여/);
  assertNoFinalityPhrase(presentation);
});

test("6+6 특례 입력 부족 결과 카드는 금액보다 보완 입력 안내를 우선한다", () => {
  const presentation = buildPresentation({
    monthlyOrdinaryWage: 3_000_000,
    leaveMonths: 6,
    specialPolicy: "parentsTogetherSixPlusSix",
    partnerUsedParentalLeave: "unknown",
  });

  assert.equal(presentation.status, "needsInput");
  assert.equal(presentation.appliedPolicyLabel, "일반 육아휴직급여");
  assert.deepEqual(presentation.notAppliedPolicyLabels, [
    "부모 함께 육아휴직제 6+6 특례",
  ]);
  assert.match(presentation.primaryNotice, /보완해야 할 입력값/);
  assert.ok(presentation.missingInputMessages.includes("자녀 월령"));
  assert.ok(presentation.missingInputMessages.includes("배우자 육아휴직 사용 개월 수"));
  assert.ok(presentation.missingInputMessages.includes("배우자 육아휴직 사용 여부"));
  assert.ok(presentation.missingInputMessages.includes("같은 자녀 기준 여부"));
  assert.match(presentation.reasonMessages.join(" "), /특례 판단에 필요한 입력값/);
  assertNoFinalityPhrase(presentation);
});

test("6+6 특례 적용 불가 결과 카드는 적용되지 않은 계산 방식과 사유를 표시한다", () => {
  const presentation = buildPresentation({
    monthlyOrdinaryWage: 3_000_000,
    leaveMonths: 6,
    specialPolicy: "parentsTogetherSixPlusSix",
    childAgeMonths: 19,
    partnerUsedParentalLeave: false,
    partnerLeaveMonths: 6,
    sameChild: false,
  });

  assert.equal(presentation.status, "notApplicable");
  assert.deepEqual(presentation.notAppliedPolicyLabels, [
    "부모 함께 육아휴직제 6+6 특례",
  ]);
  assert.match(presentation.primaryNotice, /일반 육아휴직급여 기준의 참고값/);
  assert.match(presentation.reasonMessages.join(" "), /18개월을 초과/);
  assert.match(presentation.reasonMessages.join(" "), /배우자 육아휴직 사용/);
  assert.match(presentation.reasonMessages.join(" "), /같은 자녀 기준/);
  assertNoFinalityPhrase(presentation);
});

test("한부모 특례 결과 카드는 1~3개월 특례와 4개월 이후 fallback을 분리한다", () => {
  const presentation = buildPresentation({
    monthlyOrdinaryWage: 4_000_000,
    leaveMonths: 4,
    specialPolicy: "singleParent",
    isSingleParent: true,
  });

  assert.equal(presentation.status, "specialApplied");
  assert.equal(presentation.appliedPolicyLabel, "한부모 육아휴직 특례");
  assert.equal(presentation.monthlyRows[0].policyLabel, "한부모 육아휴직 특례");
  assert.equal(presentation.monthlyRows[3].policyLabel, "일반 육아휴직급여");
  assert.deepEqual(presentation.fallbackRanges, [
    {
      fromMonth: 4,
      toMonth: 4,
      policyLabel: "일반 육아휴직급여",
      message: "4개월차는 일반 육아휴직급여 기준 예상액으로 표시합니다.",
    },
  ]);
  assert.match(presentation.primaryNotice, /한부모 특례 예상 급여/);
  assertNoFinalityPhrase(presentation);
});

test("한부모 특례 입력 부족과 적용 불가 결과 카드는 판단값을 구조화한다", () => {
  const missing = buildPresentation({
    monthlyOrdinaryWage: 4_000_000,
    leaveMonths: 3,
    specialPolicy: "singleParent",
  });
  const notApplicable = buildPresentation({
    monthlyOrdinaryWage: 4_000_000,
    leaveMonths: 3,
    specialPolicy: "singleParent",
    isSingleParent: false,
  });

  assert.equal(missing.status, "needsInput");
  assert.ok(missing.missingInputMessages.includes("한부모 해당 여부"));
  assert.match(missing.reasonMessages.join(" "), /한부모 해당 여부 입력/);
  assert.equal(notApplicable.status, "notApplicable");
  assert.match(notApplicable.reasonMessages.join(" "), /한부모 특례 대상이 아닌/);
  assert.deepEqual(notApplicable.notAppliedPolicyLabels, ["한부모 육아휴직 특례"]);
  assertNoFinalityPhrase(missing);
  assertNoFinalityPhrase(notApplicable);
});

test("동시 선택 결과 카드는 자동 우선순위 없이 고용센터 확인 안내를 표시한다", () => {
  const presentation = buildPresentation({
    monthlyOrdinaryWage: 5_000_000,
    leaveMonths: 6,
    selectedSpecialPolicies: ["parentsTogetherSixPlusSix", "singleParent"],
    childAgeMonths: 18,
    partnerUsedParentalLeave: true,
    partnerLeaveMonths: 6,
    sameChild: true,
    isSingleParent: true,
  });

  assert.equal(presentation.status, "needsReview");
  assert.equal(presentation.appliedPolicyLabel, "일반 육아휴직급여");
  assert.deepEqual(presentation.notAppliedPolicyLabels, [
    "부모 함께 육아휴직제 6+6 특례",
    "한부모 육아휴직 특례",
  ]);
  assert.match(presentation.primaryNotice, /두 특례를 동시에 선택/);
  assert.match(presentation.primaryNotice, /자동 적용하지 않고/);
  assert.match(presentation.reasonMessages.join(" "), /고용센터 확인/);
  assertNoFinalityPhrase(presentation);
});

test("표시용 mapper는 React와 브라우저 API에 의존하지 않는다", () => {
  const source = readFileSync(
    new URL(
      "../lib/calculators/parental-leave/parentalLeaveResultPresentation.ts",
      import.meta.url,
    ),
    "utf8",
  );

  assert.doesNotMatch(
    source,
    /\b(?:React|window|document|navigator|localStorage)\b/,
  );
});
