import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [header, styles, top] = await Promise.all([
  readFile("components/common/SiteHeader.tsx", "utf8"),
  readFile("app/globals.css", "utf8"),
  readFile("components/common/BackToTop.tsx", "utf8"),
]);

test("헤더 메뉴는 접근 가능한 토글과 전체 글로벌 링크를 제공한다", () => {
  for (const href of ["/calculators/", "/about/", "/methodology/", "/updates/", "/contact/", "https://blog.gyesanbox.kr/"]) {
    assert.match(header, new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(header, /event\.key === "Escape"/);
  assert.match(header, /pointerdown/);
  assert.match(header, /showList=\{false\}/);
  assert.match(header, /showCurrent=\{false\}/);
});

test("모바일 헤더는 sticky이고 PC에는 TOP 이동 버튼이 있다", () => {
  assert.match(styles, /@media \(max-width: 800px\)[\s\S]*?\.site-header \{ position: sticky; top: 0; \}/);
  assert.match(styles, /\.back-to-top/);
  assert.match(top, /window\.scrollY > 360/);
  assert.match(top, /window\.scrollTo\(\{ top: 0, behavior: "smooth" \}\)/);
});
