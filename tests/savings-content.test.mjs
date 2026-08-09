import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  savingsBreadcrumbJsonLd,
  savingsCriterionDateLabel,
  savingsExampleResultItems,
  savingsFaqJsonLd,
  savingsFaqs,
  savingsSources,
  savingsWebApplicationJsonLd,
} from "../components/calculators/savingsContentData.ts";

const forbiddenPhrases = [
  "정확한 만기 수령액을 보장합니다",
  "은행과 100% 동일합니다",
  "최고 수익 상품을 찾아줍니다",
  "세금이 반드시 이 금액입니다",
  "무조건 이자를 더 받을 수 있습니다",
  "가입하면 더 이득입니다",
  "특정 은행 상품을 추천합니다",
];

test("예금 적금 콘텐츠는 FAQ와 JSON-LD를 같은 데이터로 관리한다", () => {
  assert.ok(savingsFaqs.length >= 6);
  assert.equal(savingsFaqJsonLd.mainEntity.length, savingsFaqs.length);

  for (let index = 0; index < savingsFaqs.length; index += 1) {
    assert.equal(
      savingsFaqJsonLd.mainEntity[index].name,
      savingsFaqs[index].question,
    );
    assert.equal(
      savingsFaqJsonLd.mainEntity[index].acceptedAnswer.text,
      savingsFaqs[index].answer,
    );
  }
});

test("예금 적금 JSON-LD는 공개 라우트 페이지 정보를 담는다", () => {
  assert.equal(savingsWebApplicationJsonLd["@type"], "WebApplication");
  assert.equal(savingsBreadcrumbJsonLd["@type"], "BreadcrumbList");
  assert.equal(
    savingsBreadcrumbJsonLd.itemListElement.at(-1).item,
    "https://gyesanbox.kr/calculators/savings",
  );
});

test("예금 적금 콘텐츠에는 기준일과 공식 출처가 있다", () => {
  assert.equal(savingsCriterionDateLabel, "2026년 8월 9일");
  assert.ok(savingsExampleResultItems.some(({ label }) => label === "만기 수령액"));
  assert.ok(
    savingsSources.some(({ organization, title }) =>
      `${organization} ${title}`.includes("법제처"),
    ),
  );
  assert.ok(
    savingsSources.some(({ organization, criterion }) =>
      `${organization} ${criterion}`.includes("국세청"),
    ),
  );
});

test("예금 적금 페이지는 JSON-LD와 콘텐츠 컴포넌트를 사용한다", async () => {
  const source = await readFile("app/calculators/savings/page.tsx", "utf8");

  assert.match(source, /JsonLdScripts/);
  assert.match(source, /SavingsContent/);
  assert.match(source, /savingsFaqJsonLd/);
  assert.match(source, /canonical/);
  assert.doesNotMatch(source, /index:\s*false|notFound\(\)/);
});

test("예금 적금 콘텐츠에 금지 표현과 관련 계산기 내부 링크를 추가하지 않는다", async () => {
  const sources = await Promise.all([
    readFile("components/calculators/SavingsContent.tsx", "utf8"),
    readFile("components/calculators/savingsContentData.ts", "utf8"),
    readFile("components/calculators/SavingsCalculator.tsx", "utf8"),
    readFile("app/calculators/savings/page.tsx", "utf8"),
  ]);
  const combinedSource = sources.join("\n");

  for (const phrase of forbiddenPhrases) {
    assert.doesNotMatch(combinedSource, new RegExp(phrase));
  }

  assert.doesNotMatch(sources[0], /href="\/calculators\//);
  assert.doesNotMatch(sources[0], /관련 계산기/);
});
