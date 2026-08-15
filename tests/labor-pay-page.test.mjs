import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { metadata } from "../app/calculators/labor-pay/page.tsx";
import {
  laborPayFaqs,
  laborPayFaqJsonLd,
  laborPayOfficialSources,
} from "../components/calculators/laborPayContentData.ts";

test("주휴수당 계산기 페이지는 공개 메타데이터와 색인 허용 설정을 가진다", () => {
  assert.equal(
    metadata.title,
    "알바 주급·주휴수당 계산기 2026 | 시급·근무시간 기준",
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

  assert.match(source, /<CompactCalculatorHero/);
  assert.match(source, /title="주휴수당·알바 주급 계산기"/);
  assert.match(source, /laborPayBaseDate/);
  assert.match(source, /JsonLdScripts/);
  assert.doesNotMatch(source, /isLaborPayCalculatorEnabled|notFound\(\)/);
});

test("콘텐츠 데이터에 기준일, 공식 출처, FAQ, 면책 문구가 준비되어 있다", async () => {
  const [dataSource, contentSource] = await Promise.all([
    readFile("components/calculators/laborPayContentData.ts", "utf8"),
    readFile("components/calculators/LaborPayContent.tsx", "utf8"),
  ]);

  assert.match(dataSource, /2026-08-15/);
  assert.doesNotMatch(dataSource, /1주 소정근로시간 \/ 40 × 8/);
  assert.doesNotMatch(dataSource, /주휴시간을 최대 8시간으로 제한/);
  assert.doesNotMatch(contentSource, /40시간 기준 8시간에 비례/);
  assert.ok(laborPayOfficialSources.length >= 6);
  for (const source of laborPayOfficialSources) {
    assert.match(source.url, /^https:\/\//);
    assert.ok(source.supports.length > 0);
  }
  const laborContractSource = laborPayOfficialSources.find(
    (source) => source.title === "주휴수당 및 근로계약 안내",
  );
  assert.ok(laborContractSource);
  assert.equal(new URL(laborContractSource.url).hostname, "www.moel.go.kr");
  assert.equal(laborContractSource.url, "https://www.moel.go.kr/mainpop2.do");
  assert.notEqual(
    laborContractSource.url,
    "https://1350.moel.go.kr/rtmview.do?id=1000059852",
  );
  const supremeCourtSource = laborPayOfficialSources.find(
    (source) => source.title === "2022다291153 임금 판결",
  );
  assert.ok(supremeCourtSource);
  assert.equal(
    supremeCourtSource.url,
    "https://www.law.go.kr/LSW/precInfoP.do?mode=0&precSeq=608507",
  );
  assert.ok(
    laborPayOfficialSources.some(
      (source) => source.title.includes("제50조") && source.supports.includes("1주 40시간"),
    ),
  );
  assert.ok(laborPayFaqs.length >= 9);
  assert.ok(laborPayFaqs.some((faq) => faq.question === "알바 주급은 어떻게 계산하나요?"));
  assert.ok(laborPayFaqs.some((faq) => faq.question === "주 15시간 미만도 주휴수당을 받을 수 있나요?"));
  assert.equal(laborPayFaqs.at(-1).question, "한 달 주휴수당은 어떻게 계산하나요?");
  assert.ok(laborPayFaqs.some((faq) => faq.question === "주급에 주휴수당은 어떻게 포함되나요?"));
  assert.match(dataSource, /주급을 단순히 4배 또는 4\.345배로 자동 환산하지 않습니다/);
  assert.match(contentSource, /공식 출처/);
  assert.match(contentSource, /target="_blank"/);
  assert.match(contentSource, /rel="noopener noreferrer"/);
  assert.match(contentSource, /자주 묻는 질문/);
  assert.match(contentSource, /관련 계산기/);
  assert.match(contentSource, /계산 결과는 입력값을 바탕으로 한 참고용 예상값/);
});

test("주휴시간 FAQ와 FAQPage JSON-LD는 최신 계산 기준을 같은 문구로 제공한다", () => {
  const formulaFaq = laborPayFaqs.find(
    (faq) => faq.question === "주휴수당 계산식은 어떻게 되나요?",
  );
  assert.ok(formulaFaq);
  assert.match(formulaFaq.answer, /1주 소정근로일 수/);
  assert.match(formulaFaq.answer, /5일 기준으로 보정/);

  const formulaJsonLd = laborPayFaqJsonLd.mainEntity.find(
    (entry) => entry.name === formulaFaq.question,
  );
  assert.ok(formulaJsonLd);
  assert.equal(formulaJsonLd.acceptedAnswer.text, formulaFaq.answer);
});

test("GSC에서 확인한 한 달 주휴수당 질문에 계산 범위를 직접 답한다", () => {
  const monthlyFaq = laborPayFaqs.find(
    (faq) => faq.question === "한 달 주휴수당은 어떻게 계산하나요?",
  );
  assert.ok(monthlyFaq);
  assert.match(monthlyFaq.answer, /1주 단위/);
  assert.match(monthlyFaq.answer, /주별 금액을 합산/);
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
