import assert from "node:assert/strict";
import test from "node:test";
import {
  BOOKMARKABLE_PAGES,
  FAVORITES_STORAGE_KEY,
  MAX_FAVORITES,
  normalizeFavoritePath,
  parseFavorites,
  serializeFavorites,
} from "../lib/favorites.ts";

test("즐겨찾기 레지스트리는 공개 계산기와 반복 방문 허브만 포함한다", () => {
  assert.equal(FAVORITES_STORAGE_KEY, "gyesanbox:favorites:v1");
  assert.equal(BOOKMARKABLE_PAGES.filter((page) => page.type === "calculator").length, 20);
  assert.ok(BOOKMARKABLE_PAGES.some((page) => page.path === "/calculators/"));
  assert.equal(BOOKMARKABLE_PAGES.some((page) => page.path === "/privacy-policy/"), false);
});

test("즐겨찾기 경로는 내부 canonical path로 정규화한다", () => {
  assert.equal(normalizeFavoritePath("/calculators/loan?source=search#result"), "/calculators/loan/");
  assert.equal(normalizeFavoritePath("https://gyesanbox.kr/calculators/loan/"), "/calculators/loan/");
  assert.equal(normalizeFavoritePath("https://example.com/calculators/loan/"), null);
  assert.equal(normalizeFavoritePath("/calculators/loan/private/"), null);
});

test("손상된 데이터, 중복 경로와 비대상 경로를 복구한다", () => {
  assert.deepEqual(parseFavorites("{"), []);
  const parsed = parseFavorites(JSON.stringify([
    { path: "/calculators/loan?x=1", addedAt: 20 },
    { path: "/calculators/loan/", addedAt: 10 },
    { path: "/privacy-policy/", addedAt: 1 },
    { path: "/calculators/salary/", addedAt: 0 },
  ]));
  assert.equal(parsed.length, 2);
  assert.deepEqual(parsed[0], { path: "/calculators/loan/", addedAt: 20 });
  assert.equal(parsed[1].path, "/calculators/salary/");
  assert.equal(typeof parsed[1].addedAt, "number");
});

test("직렬화는 최대 저장 개수를 지키고 입력값을 저장하지 않는다", () => {
  const items = Array.from({ length: MAX_FAVORITES + 2 }, (_, index) => ({
    path: "/calculators/loan/",
    addedAt: index,
  }));
  const parsed = JSON.parse(serializeFavorites(items));
  assert.equal(parsed.length, MAX_FAVORITES);
  assert.equal("input" in parsed[0], false);
  assert.equal("result" in parsed[0], false);
});
