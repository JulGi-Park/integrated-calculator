import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("육아휴직급여 페이지는 기본 상태에서 notFound 보호를 사용한다", async () => {
  const [pageSource, visibilitySource] = await Promise.all([
    readFile("app/calculators/parental-leave/page.tsx", "utf8"),
    readFile(
      "lib/calculators/parental-leave/parentalLeaveVisibility.ts",
      "utf8",
    ),
  ]);
  const source = `${pageSource}\n${visibilitySource}`;

  assert.match(source, /isParentalLeaveCalculatorEnabled\(\)/);
  assert.match(source, /notFound\(\)/);
  assert.match(source, /NEXT_PUBLIC_ENABLE_PARENTAL_LEAVE_CALCULATOR/);
  assert.match(source, /<h1>육아휴직급여 계산기<\/h1>/);
  assert.match(source, /계산 기준일/);
  assert.match(source, /확정 지급액이 아닌 예상값/);
  assert.match(source, /JsonLdScripts/);
});

test("육아휴직급여 계산기는 공개 목록, sitemap, robots에 추가되지 않는다", async () => {
  const [home, list, sitemap, robots] = await Promise.all([
    readFile("app/page.tsx", "utf8"),
    readFile("app/calculators/page.tsx", "utf8"),
    readFile("app/sitemap.ts", "utf8"),
    readFile("app/robots.ts", "utf8"),
  ]);

  assert.doesNotMatch(home, /parental-leave|육아휴직급여 계산기/);
  assert.doesNotMatch(list, /parental-leave|육아휴직급여 계산기/);
  assert.doesNotMatch(sitemap, /parental-leave/);
  assert.doesNotMatch(robots, /parental-leave/);
});

test("육아휴직급여 페이지는 비공개 메타 정책을 유지한다", async () => {
  const source = await readFile("app/calculators/parental-leave/page.tsx", "utf8");

  assert.match(source, /index:\s*false/);
  assert.match(source, /follow:\s*false/);
  assert.doesNotMatch(source, /<Link/);
});
