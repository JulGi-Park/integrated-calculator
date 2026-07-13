import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { metadata } from "../app/calculators/labor-pay/page.tsx";
import {
  laborPayFaqs,
  laborPayOfficialSources,
} from "../components/calculators/laborPayContentData.ts";

test("주휴수당 계산기 페이지는 공개 메타데이터와 색인 허용 설정을 가진다", () => {
  assert.equal(
    metadata.title,
    "주휴수당 계산기 2026 | 알바 주휴수당과 주급 계산",
  );
  assert.equal(metadata.robots.index, true);
  assert.equal(metadata.robots.follow, true);
  assert.equal(
    metadata.alternates.canonical,
    "https://gyesanbox.kr/calculators/labor-pay/",
  );
});

test("페이지 소스가 제목, 기준일, 공개 JSON-LD를 포함한다", async () => {
  const source = await readFile("app/calculators/labor-pay/page.tsx", "utf8");

  assert.match(source, /<h1>주휴수당 계산기<\/h1>/);
  assert.match(source, /laborPayBaseDate/);
  assert.match(source, /JsonLdScripts/);
  assert.doesNotMatch(source, /isLaborPayCalculatorEnabled|notFound\(\)/);
});

test("콘텐츠 데이터에 기준일, 공식 출처, FAQ, 면책 문구가 준비되어 있다", async () => {
  const [dataSource, contentSource] = await Promise.all([
    readFile("components/calculators/laborPayContentData.ts", "utf8"),
    readFile("components/calculators/LaborPayContent.tsx", "utf8"),
  ]);

  assert.match(dataSource, /2026-07-10/);
  assert.ok(laborPayOfficialSources.length >= 5);
  for (const source of laborPayOfficialSources) {
    assert.match(source.url, /^https:\/\//);
    assert.ok(source.supports.length > 0);
  }
  assert.ok(laborPayFaqs.length >= 9);
  assert.match(contentSource, /공식 출처/);
  assert.match(contentSource, /target="_blank"/);
  assert.match(contentSource, /rel="noopener noreferrer"/);
  assert.match(contentSource, /자주 묻는 질문/);
  assert.match(contentSource, /관련 계산기/);
  assert.match(contentSource, /계산 결과는 입력값을 바탕으로 한 참고용 예상값/);
});

test("sitemap, 메인, 계산기 목록, 연봉 관련 계산기에 labor-pay가 공개 노출된다", async () => {
  const files = [
    "app/sitemap.ts",
    "app/page.tsx",
    "app/calculators/page.tsx",
    "components/calculators/SalaryTakeHomeContent.tsx",
  ];
  const sources = await Promise.all(files.map((file) => readFile(file, "utf8")));

  for (const source of sources) {
    assert.match(source, /labor-pay|주휴수당 계산기/);
  }
});

test("robots 설정과 광고/분석 파일은 주휴수당 계산기 공개에 관여하지 않는다", async () => {
  const files = [
    "app/robots.ts",
    "components/ads/AdSenseScript.tsx",
    "components/analytics/GoogleTag.tsx",
    "public/ads.txt",
  ];
  const sources = await Promise.all(files.map((file) => readFile(file, "utf8")));

  for (const source of sources) {
    assert.doesNotMatch(source, /labor-pay|NEXT_PUBLIC_ENABLE_LABOR_PAY/);
  }
});
