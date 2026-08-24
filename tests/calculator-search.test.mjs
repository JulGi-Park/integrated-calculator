import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { CALCULATOR_REGISTRY } from "../lib/calculatorRegistry.ts";
import { searchCalculators } from "../lib/calculatorSearch.ts";
import { PUBLIC_CALCULATOR_PATHS } from "../lib/site/publicRoutes.ts";

const expected = new Map([
  ["연봉", ["salary"]],
  ["월급", ["salary"]],
  ["4대보험", ["social-insurance"]],
  ["보험", ["social-insurance"]],
  ["퇴사", ["severance", "unemployment"]],
  ["알바", ["labor-pay", "overtime-pay"]],
  ["대출", ["loan", "dsr"]],
  ["적금", ["savings", "youth-future-savings"]],
  ["전세", ["rent-vs-jeonse", "brokerage-fee"]],
]);

test("Registry는 공개 계산기 21개와 같은 canonical path를 단일 검색 원본으로 유지한다", () => {
  assert.equal(CALCULATOR_REGISTRY.length, 21);
  assert.deepEqual(
    new Set(CALCULATOR_REGISTRY.map((calculator) => calculator.path)),
    new Set(PUBLIC_CALCULATOR_PATHS),
  );
  assert.equal(new Set(CALCULATOR_REGISTRY.map((calculator) => calculator.id)).size, 21);
  assert.ok(CALCULATOR_REGISTRY.every((calculator) => calculator.searchAliases.length >= 2));
  assert.ok(CALCULATOR_REGISTRY.every((calculator) => calculator.searchIntents.length >= 2));
});

for (const [query, expectedIds] of expected) {
  test(`사용자 표현 '${query}'은 의도에 맞는 계산기를 우선한다`, () => {
    const ids = searchCalculators(CALCULATOR_REGISTRY, query).map(({ calculator }) => calculator.id);
    for (const [index, id] of expectedIds.entries()) {
      assert.equal(ids[index], id);
    }
  });
}

test("정확한 제목, 빈 검색과 결과 없음 상태를 결정적으로 처리한다", () => {
  assert.equal(searchCalculators(CALCULATOR_REGISTRY, "DSR 계산기")[0].calculator.id, "dsr");
  assert.equal(searchCalculators(CALCULATOR_REGISTRY, "").length, 21);
  assert.equal(searchCalculators(CALCULATOR_REGISTRY, "존재하지 않는 검색어").length, 0);
});

test("검색은 URL을 오염시키지 않고 raw 검색어를 GA4 event parameter로 전송하지 않는다", async () => {
  const source = await readFile("components/calculators/CalculatorCategoryFilter.tsx", "utf8");
  assert.doesNotMatch(source, /useRouter|useSearchParams|history\.|location\.(search|hash)|URLSearchParams/);
  assert.doesNotMatch(source, /search_term\s*:|raw_search|query\s*:/);
  assert.match(source, /result_count:/);
  assert.match(source, /selected_calculator_id:/);
  assert.match(source, /predefined_search_id:/);
});

test("Flagship 8개와 21개 가치 등급이 Registry에 명시되어 있다", () => {
  assert.equal(CALCULATOR_REGISTRY.filter((calculator) => calculator.flagship).length, 8);
  assert.equal(CALCULATOR_REGISTRY.filter((calculator) => calculator.valueGrade === "A").length, 15);
  assert.equal(CALCULATOR_REGISTRY.filter((calculator) => calculator.valueGrade === "B").length, 5);
  assert.deepEqual(
    CALCULATOR_REGISTRY.filter((calculator) => calculator.valueGrade === "C").map((calculator) => calculator.id),
    ["average-price"],
  );
});

test("Flagship 8개는 엔진 결과와 연결된 판단 레이어를 렌더링한다", async () => {
  const files = [
    "SalaryTakeHomeCalculator.tsx",
    "SocialInsuranceCalculator.tsx",
    "LoanInterestCalculator.tsx",
    "DsrCalculator.tsx",
    "SavingsCalculator.tsx",
    "SeveranceCalculator.tsx",
    "UnemploymentCalculator.tsx",
    "WorkChildIncentiveCalculator.tsx",
  ];
  const sources = await Promise.all(
    files.map((file) => readFile(`components/calculators/${file}`, "utf8")),
  );
  for (const source of sources) {
    assert.match(source, /<ResultDecisionLayer/);
    assert.match(source, /meaning=/);
    assert.match(source, /appliedRules=/);
    assert.match(source, /drivers=/);
    assert.match(source, /verificationHints=/);
    assert.match(source, /differenceReasons=/);
  }
  assert.equal(new Set(sources).size, files.length);
});
