import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { metadata } from "../app/calculators/vat-profit/page.tsx";
import {
  vatProfitFaqJsonLd,
  vatProfitFaqs,
  vatProfitOfficialSources,
} from "../components/calculators/vatProfitContentData.ts";

test("부가세 계산기 페이지는 공개 메타데이터와 canonical을 가진다", () => {
  assert.equal(
    metadata.title,
    "부가세 계산기 | 공급가액·합계금액 부가가치세 계산",
  );
  assert.equal(metadata.robots.index, true);
  assert.equal(metadata.robots.follow, true);
  assert.equal(
    metadata.alternates.canonical,
    "https://gyesanbox.kr/calculators/vat-profit/",
  );
});

test("페이지 소스가 제목, 기준일, 공개 JSON-LD를 포함한다", async () => {
  const source = await readFile("app/calculators/vat-profit/page.tsx", "utf8");

  assert.match(source, /<h1>부가세 계산기<\/h1>/);
  assert.match(source, /vatProfitBaseDate/);
  assert.match(source, /JsonLdScripts/);
  assert.doesNotMatch(source, /notFound\(\)|계산 기능 준비 중/);
});

test("콘텐츠 데이터에 기준일, 공식 출처, FAQ, 면책 문구가 준비되어 있다", async () => {
  const [dataSource, contentSource] = await Promise.all([
    readFile("components/calculators/vatProfitContentData.ts", "utf8"),
    readFile("components/calculators/VatProfitContent.tsx", "utf8"),
  ]);

  assert.match(dataSource, /2026-07-10/);
  assert.ok(vatProfitOfficialSources.length >= 2);
  for (const source of vatProfitOfficialSources) {
    assert.match(source.url, /^https:\/\//);
    assert.ok(source.supports.length > 0);
  }
  assert.ok(vatProfitFaqs.length >= 8);
  assert.match(contentSource, /공식 출처/);
  assert.match(contentSource, /target="_blank"/);
  assert.match(contentSource, /rel="noopener noreferrer"/);
  assert.match(contentSource, /자주 묻는 질문/);
  assert.match(contentSource, /관련 계산기/);
  assert.match(contentSource, /계산 결과는 입력값을 바탕으로 한 참고용 예상값/);
});

test("sitemap, 홈, 계산기 목록, 판매자 마진 관련 계산기에 vat-profit가 공개 노출된다", async () => {
  const files = [
    "app/sitemap.ts",
    "app/page.tsx",
    "app/calculators/page.tsx",
    "components/calculators/SellerMarginContent.tsx",
  ];
  const sources = await Promise.all(files.map((file) => readFile(file, "utf8")));

  for (const source of sources) {
    assert.match(source, /vat-profit|부가세 계산기/);
  }
});

test("FAQ JSON-LD는 JSON 직렬화와 파싱이 가능하다", () => {
  const parsed = JSON.parse(JSON.stringify(vatProfitFaqJsonLd));

  assert.equal(parsed["@type"], "FAQPage");
  assert.equal(parsed.mainEntity.length, vatProfitFaqs.length);
});
