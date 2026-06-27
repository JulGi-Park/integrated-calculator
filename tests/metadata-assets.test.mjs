import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const layoutSource = await readFile("app/layout.tsx", "utf8");

function readPngDimensions(buffer) {
  assert.equal(buffer.readUInt32BE(0), 0x89504e47);
  assert.equal(buffer.readUInt32BE(4), 0x0d0a1a0a);
  assert.equal(buffer.toString("ascii", 12, 16), "IHDR");
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test("루트 layout metadata에 아이콘과 기본 공유 이미지가 연결되어 있다", () => {
  assert.match(layoutSource, /icons:\s*\{\s*icon:\s*"\/icon\.png",\s*apple:\s*"\/apple-icon\.png"/s);
  assert.match(layoutSource, /openGraph:\s*\{\s*images:\s*\[\s*\{\s*url:\s*"\/og-default\.png"/s);
  assert.match(layoutSource, /card:\s*"summary_large_image"/);
  assert.match(layoutSource, /images:\s*\["\/og-default\.png"\]/);
});

test("아이콘과 OG 이미지는 정적 파일로 존재하고 권장 크기를 따른다", async () => {
  const [icon, appleIcon, ogImage] = await Promise.all([
    readFile("app/icon.png"),
    readFile("app/apple-icon.png"),
    readFile("public/og-default.png"),
  ]);

  assert.deepEqual(readPngDimensions(icon), {
    width: 512,
    height: 512,
  });
  assert.deepEqual(readPngDimensions(appleIcon), {
    width: 180,
    height: 180,
  });
  assert.deepEqual(readPngDimensions(ogImage), {
    width: 1200,
    height: 630,
  });
});
