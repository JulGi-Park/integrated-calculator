import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import calculatorsModule from "../app/calculators/page.tsx";

const CalculatorsPage = calculatorsModule.default;

const publicCalculatorPaths = [
  "/calculators/loan/",
  "/calculators/rent-vs-jeonse/",
  "/calculators/salary/",
  "/calculators/social-insurance/",
  "/calculators/seller-margin/",
  "/calculators/vat-profit/",
  "/calculators/labor-pay/",
  "/calculators/severance/",
  "/calculators/unemployment/",
  "/calculators/parental-leave/",
  "/calculators/roas/",
  "/calculators/savings/",
  "/calculators/average-price/",
  "/calculators/card-installment/",
  "/calculators/brokerage-fee/",
  "/calculators/car-cost/",
  "/calculators/overtime-pay/",
  "/calculators/youth-future-savings/",
  "/calculators/dsr/",
  "/calculators/work-child-incentive/",
];

test("계산기 목록은 Registry 카드 전체를 정적 HTML에 유지한다", () => {
  const html = renderToStaticMarkup(React.createElement(CalculatorsPage));

  for (const path of publicCalculatorPaths) {
    assert.match(html, new RegExp(`href="${path.replaceAll("/", "\\/")}"`));
  }
  assert.equal((html.match(/class="calculator-card"/g) ?? []).length, 20);
  assert.match(html, /계산기 카테고리 선택/);
  assert.match(html, /aria-pressed="true"/);
  for (const category of ["전체", "급여", "금융", "주거", "사업", "투자", "생활"]) {
    assert.match(html, new RegExp(`>${category}<`));
  }
  for (const category of ["급여", "금융", "주거", "사업", "투자", "생활"]) {
    assert.match(html, new RegExp(`<h2>${category}</h2>`));
  }
  assert.doesNotMatch(html, /<h2>급여·근로<\/h2>|<h2>사업·판매<\/h2>/);
});

test("카테고리 필터는 접근 가능한 버튼과 비동기 없는 상태 전환 구조를 사용한다", async () => {
  const source = await (await import("node:fs/promises")).readFile(
    "components/calculators/CalculatorCategoryFilter.tsx",
    "utf8",
  );

  assert.match(source, /"use client"/);
  assert.match(source, /type="button"/);
  assert.match(source, /aria-pressed=/);
  assert.match(source, /setSelectedCategory\(category\)/);
  assert.match(source, /hidden: isHidden/);
  assert.match(source, /role="status"/);
  assert.doesNotMatch(source, /localStorage|location\.search|router\./);
});
