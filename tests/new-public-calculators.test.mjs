import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import sitemapModule from "../app/sitemap.ts";

const calculators = [
  ["roas", "ROAS 계산기"],
  ["savings", "예금 적금 계산기"],
  ["average-price", "물타기 계산기"],
  ["card-installment", "카드 할부 계산기"],
  ["brokerage-fee", "부동산 중개보수 계산기"],
  ["car-cost", "자동차 유지비 계산기"],
  ["overtime-pay", "연장·야간·휴일근로수당 계산기"],
  ["youth-future-savings", "청년미래적금 계산기"],
  ["dsr", "DSR 계산기"],
  ["work-child-incentive", "근로·자녀장려금 계산기"],
];

test("신규 공개 계산기 10개는 고유 SEO와 canonical을 제공한다", async () => {
  const titles = new Set();
  const descriptions = new Set();

  for (const [slug] of calculators) {
    const pageModule = await import(`../app/calculators/${slug}/page.tsx`);
    const { metadata } = pageModule;
    assert.equal(typeof metadata.title, "string");
    assert.equal(typeof metadata.description, "string");
    assert.equal(metadata.alternates.canonical, `https://gyesanbox.kr/calculators/${slug}/`);
    assert.notDeepEqual(metadata.robots, { index: false, follow: false });
    titles.add(metadata.title);
    descriptions.add(metadata.description);
  }

  assert.equal(titles.size, calculators.length);
  assert.equal(descriptions.size, calculators.length);
});

test("신규 공개 계산기 10개는 비공개 가드 없이 H1·계산기·콘텐츠를 렌더링한다", async () => {
  for (const [slug, heading] of calculators) {
    const source = await readFile(`app/calculators/${slug}/page.tsx`, "utf8");
    assert.equal((source.match(/<h1\b/g) ?? []).length, 1);
    assert.match(source, new RegExp(heading));
    assert.match(source, /Calculator/);
    assert.match(source, /Content/);
    assert.doesNotMatch(source, /notFound\(|NEXT_PUBLIC_ENABLE_|index:\s*false|follow:\s*false/);
  }
});

test("신규 공개 계산기 10개는 sitemap·홈·목록에서 발견할 수 있다", async () => {
  const [home, list] = await Promise.all([
    readFile("app/page.tsx", "utf8"),
    readFile("app/calculators/page.tsx", "utf8"),
  ]);
  const sitemapUrls = sitemapModule.default().map((entry) => entry.url);

  for (const [slug] of calculators) {
    const path = `/calculators/${slug}/`;
    assert.match(home, new RegExp(path));
    assert.match(list, new RegExp(path));
    assert.ok(sitemapUrls.includes(`https://gyesanbox.kr${path}`));
  }
});
