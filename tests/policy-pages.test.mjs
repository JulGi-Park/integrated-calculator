import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import methodologyModule from "../app/methodology/page.tsx";
import updatesModule from "../app/updates/page.tsx";

const pages = [
  {
    file: "app/about/page.tsx",
    path: "/about/",
    h1: "계산박스 소개",
    title: "계산박스 소개 | 계산박스",
    description:
      "계산박스는 판매자 마진, 부가세, 연봉 실수령액, 4대보험, 주휴수당, 대출 이자, 퇴직금, 실업급여, 육아휴직급여, 전세·월세 비교 등 생활·금융·근로·사업·판매·주거 계산기를 제공하는 온라인 계산기 모음입니다.",
    canonical: "https://gyesanbox.kr/about/",
    required: [
      "생활·금융·근로·사업·판매·주거 계산기 모음 서비스",
      "판매자 마진 계산기",
      "연봉 실수령액 계산기",
      "대출 이자 계산기",
      "퇴직금 계산기",
      "실업급여 계산기",
      "2026 4대보험 계산기",
      "주휴수당 계산기",
      "부가세 계산기",
      "육아휴직급여 계산기",
      "전세 vs 월세 계산기",
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
      "제3자 광고 사업자",
      "맞춤 광고",
      "쿠키",
      "IP 주소",
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

test("소개 페이지는 공개 계산기 10개만 최신 URL로 안내한다", async () => {
  const source = await readFile("app/about/page.tsx", "utf8");
  const publicRoutes = [
    "/calculators/seller-margin/",
    "/calculators/salary/",
    "/calculators/loan/",
    "/calculators/severance/",
    "/calculators/unemployment/",
    "/calculators/social-insurance/",
    "/calculators/labor-pay/",
    "/calculators/vat-profit/",
    "/calculators/parental-leave/",
    "/calculators/rent-vs-jeonse/",
  ];
  assert.equal((source.match(/href="\/calculators\//g) ?? []).length, 10);
  for (const route of publicRoutes) assert.match(source, new RegExp(`href="${route}"`));
  for (const privateSlug of [
    "roas",
    "savings",
    "average-price",
    "card-installment",
    "brokerage-fee",
    "car-cost",
    "overtime-pay",
    "youth-future-savings",
    "dsr",
    "work-child-incentive",
  ]) {
    assert.doesNotMatch(source, new RegExp(`/calculators/${privateSlug}`));
  }
});

test("개인정보처리방침은 실제 분석·광고 목적을 구분하고 임시 표현과 중복 섹션을 사용하지 않는다", async () => {
  const source = await readFile("app/privacy-policy/page.tsx", "utf8");
  assert.match(source, /사이트 이용 현황을 파악하고 서비스를 개선하기 위해 Google/);
  assert.match(source, /Google AdSense는 페이지에 광고를 제공하고/);
  assert.doesNotMatch(source, /초기 MVP|Google Search Console|제3자 광고 및 쿠키/);
  assert.equal((source.match(/<h2>분석·광고와 쿠키<\/h2>/g) ?? []).length, 1);
  assert.doesNotMatch(source, /사용할 수 있습니다|향후 적용될 경우|광고 서비스가 적용될 경우/);
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

test("방법론·변경 이력 페이지는 공개 SEO와 JSON-LD를 갖는다", async () => {
  for (const [file, path, title, required] of [
    ["app/methodology/page.tsx", "/methodology/", "계산 방법론 | 계산박스", ["공식 출처 우선순위", "기준일은 자료를 확인한 날짜", "합계금액 10,000원", "하한 41만원", "14시간과 15시간", "NaN", "Infinity", "브라우저 중심", "개인별 세무·노무·금융 상담"]],
    ["app/updates/page.tsx", "/updates/", "계산기 변경 이력 | 계산박스", ["2026년 7월 10일", "2026년 7월 11일", "2026년 7월 12일", "상세 페이지 보기"]],
  ]) {
    const source = await readFile(file, "utf8");
    assert.equal((source.match(/<h1/g) ?? []).length, 0);
    assert.match(source, new RegExp(`const title = "${title}"`));
    assert.match(source, new RegExp(`canonical = "https://gyesanbox.kr${path}"`));
    assert.match(source, /description =/);
    assert.match(source, /openGraph:/);
    assert.match(source, /twitter:/);
    assert.match(source, /BreadcrumbList/);
    assert.match(source, /WebPage/);
    for (const text of required) assert.match(source, new RegExp(text));
  }
});

test("방법론은 실제 계산기 경계 사례를 설명하고 변경 이력은 방문자 언어를 사용한다", async () => {
  const [methodology, updates] = await Promise.all([
    readFile("app/methodology/page.tsx", "utf8"),
    readFile("app/updates/page.tsx", "utf8"),
  ]);

  for (const text of [
    "공급가액을 원 단위로 반올림",
    "회차 이자가 정확히 0.5원",
    "상한 초과 입력",
    "주휴시간이 8시간",
    "600개월",
    "재현 입력을 테스트에 남기고",
  ]) assert.match(methodology, new RegExp(text));

  assert.doesNotMatch(
    updates,
    /정적 검증 대상|정책 모듈|클라이언트 유틸리티|운영 canonical|about·contact/,
  );
});

test("신규 페이지는 H1 하나와 파싱 가능한 WebPage·BreadcrumbList JSON-LD를 렌더링한다", () => {
  for (const Page of [methodologyModule.default, updatesModule.default]) {
    const html = renderToStaticMarkup(React.createElement(Page));
    const scripts = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)]
      .map((match) => JSON.parse(match[1]));

    assert.equal((html.match(/<h1/g) ?? []).length, 1);
    assert.deepEqual(
      scripts.map((item) => item["@type"]),
      ["BreadcrumbList", "WebPage"],
    );
    assert.equal(scripts[0].itemListElement.length, 2);
    assert.equal(scripts[0].itemListElement[0].item, "https://gyesanbox.kr/");
    assert.match(scripts[1].url, /^https:\/\/gyesanbox\.kr\/(?:methodology|updates)\/$/);
  }
});

test("신규 핵심 본문은 기존 페이지와 35자 이상 완전 중복 문장을 사용하지 않는다", async () => {
  const calculatorDirs = await readdir("app/calculators", { withFileTypes: true });
  const calculatorPageFiles = calculatorDirs
    .filter((entry) => entry.isDirectory())
    .map((entry) => `app/calculators/${entry.name}/page.tsx`);
  const componentFiles = (await readdir("components/calculators"))
    .filter((name) => /Content\.tsx$/.test(name))
    .map((name) => `components/calculators/${name}`);
  const comparisonFiles = [
    "app/about/page.tsx",
    "app/disclaimer/page.tsx",
    ...calculatorPageFiles,
    ...componentFiles,
  ];

  const extractSentences = (source) => [...source.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/g)]
    .flatMap((match) => match[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/\{[\s\S]*?\}/g, " ")
      .split(/[.!?]/))
    .map((sentence) => sentence.replace(/\s+/g, ""))
    .filter((sentence) => sentence.length >= 35);

  const methodology = await readFile("app/methodology/page.tsx", "utf8");
  const methodologySentences = new Set(extractSentences(methodology));
  const existingSources = await Promise.all(comparisonFiles.map((file) => readFile(file, "utf8")));
  const existingSentences = new Set(existingSources.flatMap(extractSentences));

  for (const sentence of methodologySentences) {
    assert.equal(existingSentences.has(sentence), false, `중복 문장: ${sentence}`);
  }

  const updates = await readFile("app/updates/page.tsx", "utf8");
  const longLiterals = [...updates.matchAll(/"([^"\n]{35,})"/g)].map((match) => match[1]);
  assert.equal(new Set(longLiterals).size, longLiterals.length);
  assert.doesNotMatch(
    `${methodology}\n${updates}`,
    /정확한 정보를 제공합니다|공식 자료를 참고합니다|지속적으로 업데이트합니다|신뢰할 수 있는 결과를 제공합니다|사용자 편의를 위해 노력합니다|TODO|placeholder|lorem ipsum|준비 중|곧 공개|초기 MVP/i,
  );
});

test("소개·문의·홈은 방법론과 변경 이력을 연결하고 비공개 계산기를 노출하지 않는다", async () => {
  const sources = await Promise.all([
    readFile("app/page.tsx", "utf8"),
    readFile("app/about/page.tsx", "utf8"),
    readFile("app/contact/page.tsx", "utf8"),
  ]);
  assert.match(sources[0], /href="\/methodology\/"/);
  assert.match(sources[1], /href="\/methodology\/"/);
  assert.match(sources[1], /href="\/updates\/"/);
  assert.match(sources[2], /href="\/methodology\/"/);
  assert.doesNotMatch(sources.join("\n"), /\/calculators\/(?:roas|savings|average-price|card-installment|brokerage-fee|car-cost|overtime-pay|youth-future-savings|dsr|work-child-incentive)\//);
});
