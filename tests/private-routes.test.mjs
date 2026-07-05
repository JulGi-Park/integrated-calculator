import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("연장 야간 휴일근로수당 계산기는 true 문자열에서만 접근을 허용한다", async () => {
  const source = await readFile("app/calculators/overtime-pay/page.tsx", "utf8");

  assert.match(
    source,
    /NEXT_PUBLIC_ENABLE_OVERTIME_PAY_CALCULATOR\s*===\s*"true"/,
  );
  assert.match(source, /notFound\(\)/);
});

test("비공개 pruning 스크립트에 overtime-pay 라우트가 등록되어 있다", async () => {
  const source = await readFile("scripts/prune-private-routes.mjs", "utf8");

  assert.match(source, /calculators\/overtime-pay/);
  assert.match(source, /NEXT_PUBLIC_ENABLE_OVERTIME_PAY_CALCULATOR/);
});

test("공개 목록과 sitemap에는 overtime-pay가 노출되지 않는다", async () => {
  const [listSource, sitemapSource, homeSource] = await Promise.all([
    readFile("app/calculators/page.tsx", "utf8"),
    readFile("app/sitemap.ts", "utf8"),
    readFile("app/page.tsx", "utf8"),
  ]);

  assert.doesNotMatch(listSource, /overtime-pay/);
  assert.doesNotMatch(sitemapSource, /overtime-pay/);
  assert.doesNotMatch(homeSource, /overtime-pay/);
});

test("FAQPage JSON-LD는 화면 FAQ 원본과 같은 배열을 사용한다", async () => {
  const source = await readFile(
    "components/calculators/OvertimePayContent.tsx",
    "utf8",
  );

  assert.match(source, /export const overtimePayFaqs/);
  assert.match(source, /mainEntity: overtimePayFaqs\.map/);
  assert.match(source, /overtimePayFaqs\.map\(\(\{ question, answer \}\)/);
});
