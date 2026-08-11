import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile("components/common/FavoritesHeader.tsx", "utf8");

test("즐겨찾기 버튼은 저장과 목록 역할을 구분한다", () => {
  assert.equal((source.match(/\? "즐겨찾기 해제"\s*:\s*"즐겨찾기 추가"/g) ?? []).length, 2);
  assert.match(source, /<span>즐겨찾기 목록\{items\.length/);
  assert.match(source, /aria-label="즐겨찾기 목록 열기"/);
  assert.doesNotMatch(source, /<span>즐겨찾기<\/span>/);
});
