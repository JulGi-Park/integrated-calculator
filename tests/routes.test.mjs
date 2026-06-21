import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routes = [
  ["app/page.tsx", "통합 계산기 서비스"],
  ["app/calculators/page.tsx", "전체 계산기 목록"],
  [
    "app/calculators/seller-margin/page.tsx",
    "온라인 판매자 마진·순이익 계산기 | 수수료·원가 계산",
  ],
  [
    "app/calculators/salary/page.tsx",
    "2026 연봉·월급 실수령액 계산기 | 4대보험·소득세 계산",
  ],
];

test("필수 페이지에 고유한 메타데이터 제목이 있다", async () => {
  for (const [file, title] of routes) {
    const source = await readFile(file, "utf8");
    assert.match(source, new RegExp(`title: "${title}"`));
  }
});

test("연봉 계산기 페이지와 목록 링크가 실제 UI를 제공한다", async () => {
  const [pageSource, listSource] = await Promise.all([
    readFile("app/calculators/salary/page.tsx", "utf8"),
    readFile("app/calculators/page.tsx", "utf8"),
  ]);

  assert.match(pageSource, /SalaryTakeHomeCalculator/);
  assert.match(pageSource, /연봉·월급/);
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
