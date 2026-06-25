import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("푸터에 저작권 문구와 정책 링크, 연락처가 함께 유지된다", async () => {
  const source = await readFile("components/common/SiteFooter.tsx", "utf8");

  assert.match(source, /© 2026 계산박스\. All rights reserved\./);
  for (const path of [
    "/about",
    "/contact",
    "/privacy-policy",
    "/terms",
    "/disclaimer",
  ]) {
    assert.match(source, new RegExp(`href: "${path}"`));
  }
  assert.match(source, /mailto:contact@gyesanbox\.kr/);
});

test("문의 페이지는 권리 침해 신고와 출처 수정 요청을 안내한다", async () => {
  const source = await readFile("app/contact/page.tsx", "utf8");

  assert.match(source, /저작권 침해 또는 권리 침해 신고/);
  assert.match(source, /출처 오류 또는 인용 정보 수정 요청/);
  assert.match(source, /mailto:contact@gyesanbox\.kr/);
});

test("이용약관은 저작권과 콘텐츠 이용 제한을 명확히 안내한다", async () => {
  const source = await readFile("app/terms/page.tsx", "utf8");

  for (const text of [
    "저작권과 콘텐츠 이용 제한",
    "저작권은 계산박스 또는 정당한 권리자",
    "개인적인 참고 목적",
    "무단 복제, 배포, 전재, 재가공, 크롤링",
    "상업적으로 이용해서는 안 됩니다",
    "외부 자료를 참고하는 경우 각 계산기 페이지에 출처와 기준일",
    "저작권 침해 또는 권리 침해 신고",
  ]) {
    assert.match(source, new RegExp(text));
  }
});

test("면책문구는 권리 침해 신고 안내를 포함한다", async () => {
  const source = await readFile("app/disclaimer/page.tsx", "utf8");

  assert.match(source, /공식 기준과 출처를 확인해 콘텐츠를 작성/);
  assert.match(source, /저작권 또는 권리 침해 소지/);
  assert.match(source, /확인 후 조치/);
  assert.match(source, /mailto:contact@gyesanbox\.kr/);
});
