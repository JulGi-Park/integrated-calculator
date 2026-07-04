import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { metadata } from "../app/calculators/seller-margin/page.tsx";
import { serializeJsonLd } from "../components/common/JsonLdScripts.tsx";
import {
  sellerMarginBreadcrumbJsonLd,
  sellerMarginExampleInput,
  sellerMarginExampleResult,
  sellerMarginExclusions,
  sellerMarginFaqJsonLd,
  sellerMarginFaqs,
  sellerMarginFormulas,
  sellerMarginWebApplicationJsonLd,
} from "../components/calculators/sellerMarginContentData.ts";
import { calculateSellerMargin } from "../lib/calculators/seller-margin/seller-margin.ts";

const pageSource = await readFile(
  "app/calculators/seller-margin/page.tsx",
  "utf8",
);
const contentSource = await readFile(
  "components/calculators/SellerMarginContent.tsx",
  "utf8",
);
const jsonLdSource = await readFile(
  "components/common/JsonLdScripts.tsx",
  "utf8",
);
const source = `${pageSource}\n${contentSource}\n${jsonLdSource}`;

test("페이지 상단에 고유 H1, 설명, 기준일과 예상값 안내가 있다", () => {
  assert.equal((pageSource.match(/<h1/g) ?? []).length, 1);
  assert.match(pageSource, /판매자 마진 계산기/);
  assert.match(
    pageSource,
    /판매단가, 수량, 원가, 수수료와 비용을 입력해 주문 기준 예상/,
  );
  assert.match(pageSource, /계산 기준일: 2026년 6월 18일/);
  assert.match(pageSource, /세전 예상값이며 실제 플랫폼/);
});

test("실제 엔진과 일치하는 12개 계산식을 모두 표시한다", () => {
  assert.equal(sellerMarginFormulas.length, 12);

  for (const { title, formula } of sellerMarginFormulas) {
    assert.ok(title.length > 0);
    assert.ok(formula.length > 0);
  }

  assert.match(contentSource, /sellerMarginFormulas\.map/);
  assert.match(contentSource, /각 수수료를 원 단위로 반올림/);
  assert.match(contentSource, /비율은 소수점 둘째 자리까지/);
});

test("고정 계산 예시 입력과 결과를 화면에 정확히 표시한다", () => {
  assert.equal(sellerMarginExampleInput.length, 10);
  assert.equal(sellerMarginExampleResult.length, 12);

  for (const { label, value } of [
    ...sellerMarginExampleInput,
    ...sellerMarginExampleResult,
  ]) {
    assert.ok(label.length > 0);
    assert.ok(value.length > 0);
  }

  assert.match(contentSource, /sellerMarginExampleInput\.map/);
  assert.match(contentSource, /sellerMarginExampleResult\.map/);
});

test("고정 계산 예시가 실제 계산 엔진 결과와 일치한다", () => {
  const response = calculateSellerMargin({
    unitPrice: 5_000,
    quantity: 100,
    sellerDiscount: 2_000,
    customerShippingFee: 3_000,
    unitProductCost: 1_500,
    platformFeeRate: 3,
    paymentFeeRate: 1,
    sellerShippingCost: 4_500,
    allocatedAdCost: 0,
    otherCost: 0,
  });

  assert.deepEqual(response, {
    success: true,
    data: {
      productSalesAmount: 500_000,
      paymentAmount: 501_000,
      platformFee: 15_000,
      paymentFee: 5_010,
      totalFees: 20_010,
      estimatedSettlement: 480_990,
      totalCosts: 154_500,
      estimatedNetProfit: 326_490,
      netProfitMarginRate: 65.17,
      productCostRate: 30,
      totalFeeRate: 3.99,
    },
  });
});

test("결과 해석, 제외 항목과 면책 문구를 정적으로 표시한다", () => {
  for (const text of ["순이익률", "원가율", "총수수료율"]) {
    assert.match(contentSource, new RegExp(text));
  }

  assert.equal(sellerMarginExclusions.length, 15);
  for (const item of sellerMarginExclusions) {
    assert.ok(item.length > 0);
  }

  assert.match(contentSource, /sellerMarginExclusions\.map/);
  assert.match(contentSource, /세무 신고나 회계 판단을 위한 확정 자료가/);
});

test("화면에 FAQ 8개와 동일한 질문·답변을 표시한다", () => {
  assert.equal(sellerMarginFaqs.length, 8);
  assert.match(contentSource, /sellerMarginFaqs\.map/);
  assert.match(contentSource, /<details/);

  for (const { question, answer } of sellerMarginFaqs) {
    assert.ok(question.length > 0);
    assert.ok(answer.length > 0);
  }
});

test("관련 계산기에서 실제 내부 라우트만 링크한다", () => {
  assert.match(contentSource, /href="\/calculators\/"/);
  assert.match(contentSource, /href="\/calculators\/loan\/"/);
  assert.match(contentSource, /href="\/calculators\/salary\/"/);
  assert.doesNotMatch(contentSource, /href="#"/);
  assert.doesNotMatch(contentSource, /준비 중|comingSoon/);
});

test("seller-margin 전용 메타데이터에 가짜 URL 없이 SEO 정보를 설정한다", () => {
  assert.equal(
    metadata.title,
    "판매자 마진 계산기 | 수수료·원가·순이익 계산",
  );
  assert.equal(
    metadata.description,
    "판매단가, 수량, 개당 원가, 할인, 배송비, 플랫폼·결제 수수료와 광고비를 입력해 예상 정산금액과 세전 순이익을 계산합니다.",
  );
  assert.deepEqual(metadata.robots, { index: true, follow: true });
  assert.deepEqual(metadata.alternates, {
    canonical: "https://gyesanbox.kr/calculators/seller-margin/",
  });
  assert.equal(metadata.openGraph.url, "https://gyesanbox.kr/calculators/seller-margin/");
  assert.equal(metadata.openGraph.type, "website");

  const metadataText = JSON.stringify(metadata);
  assert.doesNotMatch(metadataText, /localhost|127\.0\.0\.1|pages\.dev|www\.gyesanbox\.kr/);
});

test("WebApplication, BreadcrumbList와 FAQPage JSON-LD가 유효하다", () => {
  const jsonLdItems = [
    sellerMarginWebApplicationJsonLd,
    sellerMarginBreadcrumbJsonLd,
    sellerMarginFaqJsonLd,
  ];

  assert.deepEqual(
    jsonLdItems.map((item) => item["@type"]),
    ["WebApplication", "BreadcrumbList", "FAQPage"],
  );
  assert.equal(sellerMarginWebApplicationJsonLd.name, "판매자 마진 계산기");
  assert.deepEqual(
    sellerMarginBreadcrumbJsonLd.itemListElement.map((item) => item.name),
    ["홈", "계산기 목록", "판매자 마진 계산기"],
  );
  assert.deepEqual(
    sellerMarginBreadcrumbJsonLd.itemListElement.map((item) => item.item),
    [
      "https://gyesanbox.kr/",
      "https://gyesanbox.kr/calculators/",
      "https://gyesanbox.kr/calculators/seller-margin/",
    ],
  );

  for (const item of jsonLdItems) {
    const serialized = serializeJsonLd(item);
    assert.deepEqual(JSON.parse(serialized), item);
    assert.doesNotMatch(
      serialized,
      /aggregateRating|review|offers|NaN|Infinity|undefined|localhost|127\.0\.0\.1/,
    );
  }
});

test("FAQPage JSON-LD가 화면 FAQ와 동일한 데이터 원본을 사용한다", () => {
  assert.equal(sellerMarginFaqJsonLd.mainEntity.length, sellerMarginFaqs.length);

  for (const [index, faq] of sellerMarginFaqs.entries()) {
    assert.equal(sellerMarginFaqJsonLd.mainEntity[index].name, faq.question);
    assert.equal(
      sellerMarginFaqJsonLd.mainEntity[index].acceptedAnswer.text,
      faq.answer,
    );
  }
});

test("JSON-LD 직렬화가 script 종료 문자를 안전하게 이스케이프한다", () => {
  const serialized = serializeJsonLd({ text: "</script><script>" });

  assert.equal(serialized.includes("<"), false);
  assert.equal(serialized, '{"text":"\\u003c/script>\\u003cscript>"}');
});

test("공통 JSON-LD 직렬화가 비정상 값을 거부한다", () => {
  assert.throws(() => serializeJsonLd({ value: Number.NaN }), TypeError);
  assert.throws(() => serializeJsonLd({ value: Infinity }), TypeError);
  assert.throws(() => serializeJsonLd({ value: undefined }), TypeError);
});

test("페이지가 세 JSON-LD script를 정적으로 출력한다", async () => {
  assert.match(pageSource, /<JsonLdScripts items=\{jsonLdItems\}/);
  assert.match(source, /items\.map/);
  assert.match(source, /type="application\/ld\+json"/);
  assert.match(source, /serializeJsonLd/);
  assert.match(source, /dangerouslySetInnerHTML/);
});
