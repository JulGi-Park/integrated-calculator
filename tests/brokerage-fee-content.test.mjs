import assert from "node:assert/strict";
import test from "node:test";
import {
  brokerageFeeFaqJsonLd,
  brokerageFeeFaqs,
  brokerageFeePolicySources,
} from "../lib/calculators/brokerage-fee/content.ts";

test("중개보수 공식 출처는 클릭 가능한 공식 기관 링크를 제공한다", () => {
  assert.ok(brokerageFeePolicySources.length >= 4);

  for (const source of brokerageFeePolicySources) {
    assert.match(source.href, /^https:\/\//);
    assert.match(source.href, /(?:law\.go\.kr|seoul\.go\.kr|gb\.go\.kr)/);
    assert.match(source.verifiedAt, /^2026-08-09$/);
  }
});

test("화면 FAQ와 FAQPage 구조화 데이터는 같은 질문·답변을 사용한다", () => {
  assert.equal(brokerageFeeFaqJsonLd.mainEntity.length, brokerageFeeFaqs.length);

  for (const [index, faq] of brokerageFeeFaqs.entries()) {
    const item = brokerageFeeFaqJsonLd.mainEntity[index];
    assert.equal(item.name, faq.question);
    assert.equal(item.acceptedAnswer.text, faq.answer);
  }
});

test("전국 적용 FAQ는 중개사무소 소재지와 최신 조례 확인 조건을 안내한다", () => {
  const nationwideFaq = brokerageFeeFaqs.find(
    ({ question }) => question === "전국 어디서나 같은가요?",
  );

  assert.ok(nationwideFaq);
  assert.match(nationwideFaq.answer, /중개사무소 소재지/);
  assert.match(nationwideFaq.answer, /최신 안내/);
});
