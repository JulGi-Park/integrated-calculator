import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("육아휴직급여 페이지는 공개 계산기 UI와 구조화 데이터를 제공한다", async () => {
  const source = await readFile("app/calculators/parental-leave/page.tsx", "utf8");

  assert.doesNotMatch(source, /isParentalLeaveCalculatorEnabled|notFound\(\)/);
  assert.match(source, /<h1>육아휴직급여 계산기<\/h1>/);
  assert.match(source, /계산 기준일/);
  assert.match(source, /확정 지급액이 아닌 예상값/);
  assert.match(source, /JsonLdScripts/);
});

test("육아휴직급여 계산기는 홈, 목록, sitemap에 공개되고 robots는 그대로 유지된다", async () => {
  const [home, list, sitemap, robots] = await Promise.all([
    readFile("app/page.tsx", "utf8"),
    readFile("app/calculators/page.tsx", "utf8"),
    readFile("app/sitemap.ts", "utf8"),
    readFile("app/robots.ts", "utf8"),
  ]);

  assert.match(home, /\/calculators\/parental-leave\//);
  assert.match(list, /\/calculators\/parental-leave\//);
  assert.match(sitemap, /\/calculators\/parental-leave\//);
  assert.doesNotMatch(robots, /parental-leave/);
});

test("육아휴직급여 페이지는 공개 canonical과 공유 메타데이터를 제공한다", async () => {
  const source = await readFile("app/calculators/parental-leave/page.tsx", "utf8");

  assert.match(source, /https:\/\/gyesanbox\.kr\/calculators\/parental-leave\//);
  assert.match(source, /summary_large_image/);
  assert.doesNotMatch(source, /index:\s*false|follow:\s*false/);
  assert.doesNotMatch(source, /<Link/);
});
