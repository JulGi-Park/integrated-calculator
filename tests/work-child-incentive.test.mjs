import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  calculateWorkChildIncentive,
} from "../lib/calculators/work-child-incentive/index.ts";
import {
  workChildIncentiveFaqJsonLd,
  workChildIncentiveFaqs,
} from "../components/calculators/workChildIncentiveContentData.ts";

const baseInput = {
  applicationType: "both",
  householdType: "singleIncome",
  totalIncome: 28_000_000,
  totalSalary: 26_000_000,
  propertyAmount: 120_000_000,
  childCount: 1,
  childAgeEligible: true,
  spouseSalary: 0,
  filingType: "regular",
  hasTaxArrears: "no",
  hasChildTaxCredit: "no",
};

function calculate(input) {
  const response = calculateWorkChildIncentive({ ...baseInput, ...input });
  assert.equal(response.success, true);
  return response.data;
}

test("근로장려금 단독가구 소득 기준 통과와 초과를 판정한다", () => {
  const passed = calculate({
    applicationType: "work",
    householdType: "single",
    totalIncome: 18_000_000,
    totalSalary: 17_000_000,
    childCount: 0,
  });

  assert.equal(passed.work.eligible, true);
  assert.equal(passed.work.incomeLimit, 22_000_000);
  assert.ok(passed.work.estimatedAfterReduction > 0);

  const excluded = calculate({
    applicationType: "work",
    householdType: "single",
    totalIncome: 22_000_000,
    totalSalary: 22_000_000,
    childCount: 0,
  });

  assert.equal(excluded.work.eligible, false);
  assert.match(excluded.work.reason, /초과/);
});

test("홑벌이와 맞벌이 근로장려금 소득 기준 통과를 계산한다", () => {
  const singleIncome = calculate({
    applicationType: "work",
    householdType: "singleIncome",
    totalIncome: 30_000_000,
  });
  const dualIncome = calculate({
    applicationType: "work",
    householdType: "dualIncome",
    totalIncome: 40_000_000,
    spouseSalary: 4_000_000,
  });

  assert.equal(singleIncome.work.eligible, true);
  assert.equal(singleIncome.work.incomeLimit, 32_000_000);
  assert.equal(dualIncome.work.eligible, true);
  assert.equal(dualIncome.work.incomeLimit, 44_000_000);
});

test("재산 기준 통과, 50% 감액, 2.4억원 이상 제외를 반영한다", () => {
  const pass = calculate({ propertyAmount: 169_000_000 });
  const reduced = calculate({ propertyAmount: 170_000_000 });
  const excluded = calculate({ propertyAmount: 240_000_000 });

  assert.equal(pass.propertyStatus, "pass");
  assert.equal(reduced.propertyStatus, "reduced");
  assert.equal(
    reduced.work.estimatedAfterReduction,
    Math.round(reduced.work.estimatedBeforeReduction * 0.5),
  );
  assert.equal(excluded.propertyStatus, "excluded");
  assert.equal(excluded.work.estimatedAfterReduction, 0);
  assert.equal(excluded.child.estimatedAfterReduction, 0);
});

test("기한 후 신청은 95%를 반영한다", () => {
  const regular = calculate({ filingType: "regular" });
  const late = calculate({ filingType: "late" });

  assert.equal(
    late.work.estimatedAfterReduction,
    Math.round(regular.work.estimatedBeforeReduction * 0.95),
  );
  assert.match(late.reductionReasons.join(" "), /95%/);
});

test("자녀장려금 대표 케이스와 대상 제외 케이스를 계산한다", () => {
  const oneChild = calculate({ applicationType: "child", childCount: 1 });
  const twoChildren = calculate({ applicationType: "child", childCount: 2 });
  const dualIncome = calculate({
    applicationType: "child",
    householdType: "dualIncome",
    totalIncome: 52_000_000,
    totalSalary: 50_000_000,
    spouseSalary: 5_000_000,
    childCount: 1,
  });
  const incomeExcluded = calculate({
    applicationType: "child",
    totalIncome: 70_000_000,
    totalSalary: 70_000_000,
  });
  const singleExcluded = calculate({
    applicationType: "child",
    householdType: "single",
    totalIncome: 18_000_000,
    totalSalary: 18_000_000,
  });
  const noChild = calculate({ applicationType: "child", childCount: 0 });

  assert.equal(oneChild.child.eligible, true);
  assert.ok(twoChildren.child.estimatedAfterReduction > oneChild.child.estimatedAfterReduction);
  assert.equal(dualIncome.child.eligible, true);
  assert.equal(incomeExcluded.child.eligible, false);
  assert.equal(singleExcluded.child.eligible, false);
  assert.equal(noChild.child.eligible, false);
});

test("자녀세액공제 중복과 체납 충당 안내를 표시한다", () => {
  const result = calculate({
    applicationType: "child",
    hasChildTaxCredit: "yes",
    hasTaxArrears: "yes",
  });

  assert.match(result.reductionReasons.join(" "), /자녀세액공제/);
  assert.match(result.reductionReasons.join(" "), /체납액/);
  assert.match(result.child.notes.join(" "), /차감/);
});

test("NaN, Infinity, 0, 음수, 과도한 입력값을 방어한다", () => {
  const response = calculateWorkChildIncentive({
    ...baseInput,
    totalIncome: 0,
    totalSalary: Number.NaN,
    propertyAmount: Number.POSITIVE_INFINITY,
    childCount: -1,
    spouseSalary: 20_000_000_000,
  });

  assert.equal(response.success, false);

  if (!response.success) {
    assert.match(
      response.errors.map((error) => error.message).join(" "),
      /부부합산 총소득|총급여액|재산 합계액|부양자녀 수|배우자/,
    );
  }
});

test("배우자 급여 기준과 가구 유형 불일치를 방어한다", () => {
  const dualIncomeResponse = calculateWorkChildIncentive({
    ...baseInput,
    householdType: "dualIncome",
    spouseSalary: 2_999_999,
  });
  const singleIncomeResponse = calculateWorkChildIncentive({
    ...baseInput,
    householdType: "singleIncome",
    spouseSalary: 3_000_000,
  });

  assert.equal(dualIncomeResponse.success, false);
  assert.equal(singleIncomeResponse.success, false);

  if (!dualIncomeResponse.success && !singleIncomeResponse.success) {
    assert.match(
      dualIncomeResponse.errors.map((error) => error.message).join(" "),
      /300만원 이상/,
    );
    assert.match(
      singleIncomeResponse.errors.map((error) => error.message).join(" "),
      /맞벌이가구 기준/,
    );
  }
});

test("계산 결과는 음수가 되지 않는다", () => {
  const result = calculate({
    totalIncome: 69_900_000,
    totalSalary: 69_900_000,
    propertyAmount: 239_999_999,
    filingType: "late",
  });

  assert.ok(result.work.estimatedAfterReduction >= 0);
  assert.ok(result.child.estimatedAfterReduction >= 0);
  assert.ok(result.totalEstimatedAmount >= 0);
});

test("법정 구간 산식 대표 사례는 홑벌이 2,000만원·자녀 2명에 390만원을 계산한다", () => {
  const result = calculate({
    householdType: "singleIncome",
    totalIncome: 20_000_000,
    totalSalary: 20_000_000,
    childCount: 2,
  });

  assert.equal(result.work.estimatedBeforeReduction, 1_900_000);
  assert.equal(result.child.estimatedBeforeReduction, 2_000_000);
  assert.equal(result.totalEstimatedAmount, 3_900_000);
});

test("라우트는 canonical을 가진 공개 페이지다", async () => {
  const source = await readFile("app/calculators/work-child-incentive/page.tsx", "utf8");

  assert.match(source, /canonical/);
  assert.doesNotMatch(source, /isWorkChildIncentiveCalculatorEnabled|notFound\(\)|index:\s*false/);
});

test("FAQ 화면 데이터와 FAQPage JSON-LD 데이터가 일치한다", () => {
  assert.deepEqual(
    workChildIncentiveFaqJsonLd.mainEntity.map((item) => ({
      question: item.name,
      answer: item.acceptedAnswer.text,
    })),
    workChildIncentiveFaqs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
    })),
  );
});

test("sitemap, 목록, 홈에는 근로·자녀장려금 계산기를 노출한다", async () => {
  const files = [
    "app/sitemap.ts",
    "app/page.tsx",
    "app/calculators/page.tsx",
    "app/calculators/salary/page.tsx",
    "app/calculators/loan/page.tsx",
    "app/calculators/seller-margin/page.tsx",
    "app/calculators/severance/page.tsx",
    "app/calculators/unemployment/page.tsx",
  ];
  const sources = await Promise.all(files.map((file) => readFile(file, "utf8")));

  assert.match(sources[0], /\/calculators\/work-child-incentive/);
  assert.match(sources[1], /\/calculators\/work-child-incentive|근로·자녀장려금 계산기/);
  assert.match(sources[2], /\/calculators\/work-child-incentive|근로·자녀장려금 계산기/);
});

test("Cloudflare 검증은 신규 공개 산출물을 필수 대상으로 확인한다", async () => {
  const source = await readFile("scripts/verify-cloudflare-pages.mjs", "utf8");

  assert.match(source, /out\/calculators\/work-child-incentive/);
  assert.match(source, /work-child-incentive/);
  assert.match(source, /newlyPublicCalculatorPages/);
});

test("공식 출처와 기준일, 면책 문구를 콘텐츠에 포함한다", async () => {
  const [contentSource, constantsSource] = await Promise.all([
    readFile("components/calculators/workChildIncentiveContentData.ts", "utf8"),
    readFile("lib/calculators/work-child-incentive/constants.ts", "utf8"),
  ]);

  assert.match(constantsSource, /2026-08-09/);
  assert.match(contentSource, /국세청/);
  assert.match(contentSource, /실제 지급 여부와 지급액은 국세청 심사 결과에 따라 달라질 수 있습니다/);
});

test("확정성으로 오해될 수 있는 표현을 사용하지 않는다", async () => {
  const files = [
    "app/calculators/work-child-incentive/page.tsx",
    "components/calculators/WorkChildIncentiveCalculator.tsx",
    "components/calculators/WorkChildIncentiveContent.tsx",
    "components/calculators/workChildIncentiveContentData.ts",
    "lib/calculators/work-child-incentive/calculateWorkChildIncentive.ts",
  ];
  const source = (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");
  const forbiddenPatterns = [
    ["지급", "확정"].join("\\s*"),
    ["신청", "가능", "확정"].join("\\s*"),
    "무조건\\s*받을\\s*수\\s*있음",
    "받을\\s*수\\s*있습니다",
    ["확정", "지급액"].join("\\s*"),
    ["국세청", "지급액과", "동일"].join("\\s*"),
    ["심사", "통과"].join("\\s*"),
    "보" + "장",
  ];

  assert.doesNotMatch(
    source,
    new RegExp(forbiddenPatterns.join("|")),
  );
});
