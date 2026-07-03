import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  BROKERAGE_FEE_CALCULATOR_FLAG,
  isBrokerageFeeCalculatorEnabled,
} from "../lib/calculators/brokerage-fee/visibility.ts";

const routes = [
  ["app/page.tsx", "계산박스 | 생활·금융·근로 계산기 모음"],
  ["app/calculators/page.tsx", "계산박스 계산기 목록"],
  [
    "app/calculators/seller-margin/page.tsx",
    "판매자 마진 계산기 | 수수료·원가·순이익 계산",
  ],
  [
    "app/calculators/salary/page.tsx",
    "2026 연봉 실수령액 계산기 | 월급·4대보험·소득세 계산",
  ],
  [
    "app/calculators/loan/page.tsx",
    "대출 이자 계산기 | 원리금균등·원금균등·만기일시상환 비교",
  ],
  [
    "app/calculators/severance/page.tsx",
    "퇴직금 계산기 | 평균임금·통상임금 기준 예상 퇴직금 계산",
  ],
  [
    "app/calculators/unemployment/page.tsx",
    "실업급여 계산기 2026 | 구직급여 상한액·하한액·수급기간 예상",
  ],
  ["app/about/page.tsx", "계산박스 소개 | 계산박스"],
  ["app/contact/page.tsx", "문의 | 계산박스"],
  ["app/privacy-policy/page.tsx", "개인정보처리방침 | 계산박스"],
  ["app/terms/page.tsx", "이용약관 | 계산박스"],
  ["app/disclaimer/page.tsx", "면책문구 | 계산박스"],
];

test("필수 페이지에 고유한 메타데이터 제목이 있다", async () => {
  for (const [file, title] of routes) {
    const source = await readFile(file, "utf8");
    assert.match(
      source,
      new RegExp(`(?:title:\\s*"${title}"|const\\s+title\\s*=\\s*"${title}")`),
    );
  }
});

test("연봉 계산기 페이지와 목록 링크가 실제 UI를 제공한다", async () => {
  const [pageSource, listSource] = await Promise.all([
    readFile("app/calculators/salary/page.tsx", "utf8"),
    readFile("app/calculators/page.tsx", "utf8"),
  ]);

  assert.match(pageSource, /SalaryTakeHomeCalculator/);
  assert.match(pageSource, /<h1>연봉 실수령액 계산기<\/h1>/);
  assert.doesNotMatch(pageSource, /계산 기능 준비 중/);
  assert.match(listSource, /href="\/calculators\/salary"/);
});

test("판매자 마진 페이지는 계산기 UI를 제공한다", async () => {
  const source = await readFile(
    "app/calculators/seller-margin/page.tsx",
    "utf8",
  );

  assert.match(source, /SellerMarginCalculator/);
  assert.doesNotMatch(source, /계산 기능 준비 중/);
});

test("대출 이자 계산기 페이지와 목록 링크가 실제 UI를 제공한다", async () => {
  const [pageSource, listSource] = await Promise.all([
    readFile("app/calculators/loan/page.tsx", "utf8"),
    readFile("app/calculators/page.tsx", "utf8"),
  ]);

  assert.match(pageSource, /LoanInterestCalculator/);
  assert.match(pageSource, /<h1>대출 이자 계산기<\/h1>/);
  assert.doesNotMatch(pageSource, /계산 기능 준비 중/);
  assert.match(listSource, /href="\/calculators\/loan"/);
  assert.match(listSource, /대출 이자 계산기/);
});

test("실업급여 계산기 페이지와 목록 링크가 실제 UI를 제공한다", async () => {
  const [pageSource, listSource] = await Promise.all([
    readFile("app/calculators/unemployment/page.tsx", "utf8"),
    readFile("app/calculators/page.tsx", "utf8"),
  ]);

  assert.match(pageSource, /UnemploymentCalculator/);
  assert.match(pageSource, /<h1>실업급여 계산기<\/h1>/);
  assert.match(pageSource, /JsonLdScripts/);
  assert.doesNotMatch(pageSource, /계산 기능 준비 중/);
  assert.match(listSource, /href="\/calculators\/unemployment"/);
  assert.match(listSource, /실업급여 계산기/);
});

test("퇴직금 계산기 페이지와 목록 링크가 실제 UI를 제공한다", async () => {
  const [pageSource, listSource] = await Promise.all([
    readFile("app/calculators/severance/page.tsx", "utf8"),
    readFile("app/calculators/page.tsx", "utf8"),
  ]);

  assert.match(pageSource, /SeveranceCalculator/);
  assert.match(pageSource, /<h1>퇴직금 계산기<\/h1>/);
  assert.match(pageSource, /JsonLdScripts/);
  assert.doesNotMatch(pageSource, /계산 기능 준비 중/);
  assert.match(listSource, /href="\/calculators\/severance"/);
  assert.match(listSource, /퇴직금 계산기/);
});

test("Next.js가 Cloudflare Pages용 정적 내보내기로 설정되어 있다", async () => {
  const source = await readFile("next.config.ts", "utf8");

  assert.match(source, /output:\s*"export"/);
  assert.match(source, /trailingSlash:\s*true/);
});

test("현재 페이지는 서버 전용 Next.js API에 의존하지 않는다", async () => {
  const sources = await Promise.all(
    routes.map(([file]) => readFile(file, "utf8")),
  );
  const combinedSource = sources.join("\n");

  assert.doesNotMatch(
    combinedSource,
    /["']use server["']|cookies\(|headers\(|draftMode\(|next\/server/,
  );
});

test("프로덕션 빌드는 Cloudflare Pages 검증을 반드시 실행한다", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));

  assert.match(packageJson.scripts.build, /verify:cloudflare/);
  assert.equal(
    packageJson.scripts["verify:cloudflare"],
    "node scripts/verify-cloudflare-pages.mjs",
  );
});

test("부동산 중개보수 계산기는 정확히 true 플래그일 때만 공개된다", () => {
  const privateValues = [undefined, "false", "0", "1", "TRUE", "yes", ""];

  for (const value of privateValues) {
    const env =
      typeof value === "undefined"
        ? {}
        : { [BROKERAGE_FEE_CALCULATOR_FLAG]: value };

    assert.equal(isBrokerageFeeCalculatorEnabled(env), false);
  }

  assert.equal(
    isBrokerageFeeCalculatorEnabled({
      [BROKERAGE_FEE_CALCULATOR_FLAG]: "true",
    }),
    true,
  );
});

test("부동산 중개보수 계산기 페이지는 비공개 플래그와 notFound 보호를 사용한다", async () => {
  const source = await readFile(
    "app/calculators/brokerage-fee/page.tsx",
    "utf8",
  );

  assert.match(source, /isBrokerageFeeCalculatorEnabled\(\)/);
  assert.match(source, /notFound\(\)/);
  assert.match(source, /robots:\s*{\s*index:\s*false,\s*follow:\s*false/s);
});

test("프로덕션 빌드는 비공개 중개보수 계산기 산출물을 pruning 후 검증한다", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  const pruneSource = await readFile("scripts/prune-private-routes.mjs", "utf8");

  assert.match(packageJson.scripts.build, /prune:private-routes/);
  assert.match(packageJson.scripts.build, /verify:cloudflare/);
  assert.equal(
    packageJson.scripts["prune:private-routes"],
    "tsx scripts/prune-private-routes.mjs",
  );
  assert.match(pruneSource, /out\/calculators\/brokerage-fee/);
  assert.match(pruneSource, /out\/calculators\/average-price/);
  assert.match(pruneSource, /isBrokerageFeeCalculatorEnabled\(\)/);
});

test("공개 목록과 sitemap 소스에는 중개보수 계산기 링크를 노출하지 않는다", async () => {
  const [homeSource, listSource, sitemapSource] = await Promise.all([
    readFile("app/page.tsx", "utf8"),
    readFile("app/calculators/page.tsx", "utf8"),
    readFile("app/sitemap.ts", "utf8"),
  ]);

  const combinedSource = [homeSource, listSource, sitemapSource].join("\n");

  assert.doesNotMatch(combinedSource, /brokerage-fee|부동산 중개보수 계산기/);
});
