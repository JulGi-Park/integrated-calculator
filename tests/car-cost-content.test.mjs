import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  carCostBreadcrumbJsonLd,
  carCostExampleResultItems,
  carCostFaqJsonLd,
  carCostFaqs,
  carCostSources,
  carCostWebApplicationJsonLd,
} from "../components/calculators/carCostContentData.ts";

test("자동차 유지비 콘텐츠는 FAQ와 JSON-LD를 같은 데이터로 관리한다", () => {
  assert.ok(carCostFaqs.length >= 6);
  assert.equal(carCostFaqJsonLd.mainEntity.length, carCostFaqs.length);

  for (let index = 0; index < carCostFaqs.length; index += 1) {
    assert.equal(carCostFaqJsonLd.mainEntity[index].name, carCostFaqs[index].question);
    assert.equal(
      carCostFaqJsonLd.mainEntity[index].acceptedAnswer.text,
      carCostFaqs[index].answer,
    );
  }
});

test("자동차 유지비 JSON-LD는 공개 라우트 페이지 정보를 담는다", () => {
  assert.equal(carCostWebApplicationJsonLd["@type"], "WebApplication");
  assert.equal(carCostBreadcrumbJsonLd["@type"], "BreadcrumbList");
  assert.equal(
    carCostBreadcrumbJsonLd.itemListElement.at(-1).item,
    "https://gyesanbox.kr/calculators/car-cost",
  );
});

test("자동차 유지비 예시와 출처 안내는 확정 평균값을 단정하지 않는다", () => {
  assert.ok(carCostExampleResultItems.some(({ label }) => label === "월 총 부담액"));
  assert.ok(carCostSources.some(({ organization }) => organization === "위택스"));
  assert.ok(
    carCostSources.some(({ organization }) =>
      organization.includes("한국석유공사"),
    ),
  );
});

test("자동차 유지비 페이지는 JSON-LD와 콘텐츠 컴포넌트를 사용한다", async () => {
  const source = await readFile("app/calculators/car-cost/page.tsx", "utf8");

  assert.match(source, /JsonLdScripts/);
  assert.match(source, /CarCostContent/);
  assert.match(source, /carCostFaqJsonLd/);
  assert.match(source, /canonical/);
  assert.doesNotMatch(source, /index:\s*false|notFound\(\)/);
});

test("자동차 유지비 콘텐츠에 관련 계산기 내부 링크를 추가하지 않는다", async () => {
  const source = await readFile("components/calculators/CarCostContent.tsx", "utf8");

  assert.doesNotMatch(source, /href="\/calculators\//);
  assert.doesNotMatch(source, /관련 계산기/);
});
