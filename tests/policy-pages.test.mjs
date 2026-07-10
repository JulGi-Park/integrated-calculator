import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pages = [
  {
    file: "app/about/page.tsx",
    path: "/about/",
    h1: "계산박스 소개",
    title: "계산박스 소개 | 계산박스",
    description:
      "계산박스는 판매자 마진, 연봉 실수령액, 4대보험, 주휴수당, 대출 이자, 퇴직금, 실업급여 등 생활·금융·근로 계산기를 제공하는 온라인 계산기 모음입니다.",
    canonical: "https://gyesanbox.kr/about/",
    required: [
      "생활·금융·근로 계산기 모음 서비스",
      "판매자 마진 계산기",
      "연봉 실수령액 계산기",
      "4대보험 계산기",
      "주휴수당 계산기",
      "대출 이자 계산기",
      "퇴직금 계산기",
      "실업급여 계산기",
      "계산 결과는 참고용",
    ],
  },
  {
    file: "app/contact/page.tsx",
    path: "/contact/",
    h1: "문의",
    title: "문의 | 계산박스",
    description:
      "계산박스 이용 중 계산 오류, 기준 정보, 사이트 이용 관련 문의 방법을 안내합니다.",
    canonical: "https://gyesanbox.kr/contact/",
    required: [
      "계산 오류 제보",
      "기준일 또는 공식 출처 오류 제보",
      "사이트 이용 관련 문의",
      "광고·제휴 관련 문의",
    ],
  },
  {
    file: "app/privacy-policy/page.tsx",
    path: "/privacy-policy/",
    h1: "개인정보처리방침",
    title: "개인정보처리방침 | 계산박스",
    description:
      "계산박스의 개인정보 처리, 쿠키, 광고, 분석 도구 사용 가능성 및 문의 방법을 안내합니다.",
    canonical: "https://gyesanbox.kr/privacy-policy/",
    required: [
      "로그인, 회원가입, 결제, 운영 DB 저장 기능",
      "서버에 저장하지 않습니다",
      "localStorage",
      "Google AdSense",
      "Google Analytics 4",
      "Google Search Console",
      "제3자 광고 사업자",
      "사용자의 이전 방문",
      "방문한 이력을 바탕으로 광고",
      "맞춤 광고",
      "개인 맞춤 광고를 관리",
      "쿠키",
      "웹 비콘",
      "IP 주소",
      "제3자 광고 및 쿠키",
      "Google AdSense 등 제3자 광고 서비스를 사용할 수",
      "유사 기술",
      "브라우저 설정",
      "Google 광고 설정",
      "계산 결과는 참고용",
      "상황, 법령",
      "시행일: 2026년 6월 25일",
    ],
  },
  {
    file: "app/terms/page.tsx",
    path: "/terms/",
    h1: "이용약관",
    title: "이용약관 | 계산박스",
    description:
      "계산박스 서비스 이용 조건, 계산 결과 이용 범위, 콘텐츠 이용 제한 및 문의 방법을 안내합니다.",
    canonical: "https://gyesanbox.kr/terms/",
    required: [
      "계산 결과는 입력값과 표시된 기준에 따른 참고용",
      "참고자료로만 활용",
      "사전 고지 없이 서비스의 일부를 변경하거나 중단",
      "부정 사용",
      "자동화된 과도한 요청",
      "텍스트, 계산기 구성, 화면 구성, 설명 콘텐츠",
      "저작권은 계산박스 또는 정당한 권리자",
      "개인적인 참고 목적",
      "무단 복제, 배포, 전재, 재가공, 크롤링",
      "상업적으로 이용해서는 안 됩니다",
      "외부 자료를 참고하는 경우 각 계산기 페이지에 출처와 기준일",
      "저작권 침해 또는 권리 침해 신고",
      "시행일: 2026년 6월 25일",
    ],
  },
  {
    file: "app/disclaimer/page.tsx",
    path: "/disclaimer/",
    h1: "면책문구",
    title: "면책문구 | 계산박스",
    description:
      "계산박스 계산 결과의 참고용 성격, 실제 적용 기준 차이, 공식 기관 확인 필요성을 안내합니다.",
    canonical: "https://gyesanbox.kr/disclaimer/",
    required: [
      "모든 계산 결과는 참고용",
      "개인 상황, 법령, 기관 기준",
      "금융기관 조건",
      "관련 기관",
      "세무사",
      "노무사",
      "계산식과 기준일은 각 계산기 페이지",
      "법적 책임을 보장하지 않습니다",
      "공식 기준과 출처를 확인해 콘텐츠를 작성",
      "저작권 또는 권리 침해 소지",
      "확인 후 조치",
      "시행일: 2026년 6월 25일",
    ],
  },
];

test("정책 페이지는 H1, SEO metadata, canonical과 연락처를 가진다", async () => {
  for (const page of pages) {
    const source = await readFile(page.file, "utf8");

    assert.equal((source.match(/<h1/g) ?? []).length, 0);
    assert.match(source, new RegExp(`title="${page.h1}"`));
    assert.match(source, new RegExp(`title:\\s*"${page.title}"`));
    assert.match(source, new RegExp(page.description.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(source, new RegExp(page.canonical.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(source, /ContactEmail/);

    for (const text of page.required) {
      assert.match(source, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
  }
});

test("정책 페이지는 Cloudflare 이메일 보호 대상 mailto 링크를 사용하지 않는다", async () => {
  for (const page of pages) {
    const source = await readFile(page.file, "utf8");

    assert.doesNotMatch(source, /mailto:contact@gyesanbox\.kr|contact@gyesanbox\.kr/);
  }
});

test("푸터에 정책 페이지 링크와 기존 연락처가 있다", async () => {
  const source = await readFile("components/common/SiteFooter.tsx", "utf8");

  for (const page of pages) {
    assert.match(source, new RegExp(`href: "${page.path}"`));
  }
  assert.match(source, /href="\/contact\/"/);
  assert.match(source, /<ContactEmail \/>/);
  assert.match(source, /© 2026 계산박스\. All rights reserved\./);
  assert.match(source, /계산 결과는 참고용입니다/);
});

test("헤더에서 주요 탐색과 신뢰성 페이지로 이동할 수 있다", async () => {
  const source = await readFile("components/common/SiteHeader.tsx", "utf8");

  assert.match(source, /href="\/calculators\/"/);
  assert.match(source, /href="\/about\/"/);
  assert.match(source, /href="\/contact\/"/);
  assert.match(source, /aria-label="주요 메뉴"/);
});

test("홈 JSON-LD ItemList는 공개 계산기만 유지한다", async () => {
  const source = await readFile("app/page.tsx", "utf8");

  for (const page of pages) {
    assert.doesNotMatch(source, new RegExp(page.path));
  }
  assert.match(source, /calculators\.map/);
});
