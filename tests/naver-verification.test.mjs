import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const verificationName = "naver-site-verification";
const verificationContent = "76f6c949e0161b082d322460a1b7a9883fa21c73";

test("네이버 소유확인 메타태그를 공통 metadata에 1회만 선언한다", async () => {
  const source = await readFile("app/layout.tsx", "utf8");

  assert.equal((source.match(new RegExp(verificationName, "g")) ?? []).length, 1);
  assert.equal(
    (source.match(new RegExp(verificationContent, "g")) ?? []).length,
    1,
  );
  assert.match(source, /other:\s*{/);
  assert.doesNotMatch(source, /<meta\s+name="naver-site-verification"/);
});
