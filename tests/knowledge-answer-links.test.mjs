import assert from "node:assert/strict";
import { test } from "node:test";
import { splitKnowledgeAnswerLinks } from "../lib/knowledge/answer-links.ts";

const approved = "https://www.kakaobank.com/products/youthFutureSavings";
const links = (value) => splitKnowledgeAnswerLinks(value).filter((part) => typeof part !== "string");

test("only the exact approved KakaoBank product URL becomes a link", () => {
  assert.deepEqual(links(approved), [{ label: approved, href: approved }]);
  assert.deepEqual(links(`${approved}.`), [{ label: approved, href: approved }]);
});

test("KakaoBank URL variants outside the exact approval remain plain text", () => {
  const rejected = [
    "http://www.kakaobank.com/products/youthFutureSavings",
    "https://kakaobank.com/products/youthFutureSavings",
    "https://sub.www.kakaobank.com/products/youthFutureSavings",
    "https://www.kakaobank.com.evil.test/products/youthFutureSavings",
    "https://www.kakaobank.com/products/other",
    "https://www.kakaobank.com/products/youthFutureSavings/extra",
    "https://www.kakaobank.com/products/youthFutureSavings?ref=test",
    "https://www.kakaobank.com/products/youthFutureSavings#section",
    "https://user:pass@www.kakaobank.com/products/youthFutureSavings",
    "https://www.kakaobank.com:8443/products/youthFutureSavings",
    "https://www.kakaobank.com:443/products/youthFutureSavings",
    "https://www.kakaobank.com/products/%79outhFutureSavings",
    "https://www.kakaobank.com/products/youthFutureSavings%2f..%2fother",
    "https://www.kakaobank.com//products/youthFutureSavings",
    "javascript:alert(1)",
    "data:text/html,hello",
  ];

  for (const candidate of rejected) {
    assert.deepEqual(links(candidate), [], candidate);
  }
});

test("previously approved external and calculator links remain available", () => {
  const existing = [
    "https://www.fsc.go.kr/po010101/87158",
    "https://www.law.go.kr/법령/근로기준법",
    "https://www.moel.go.kr/",
    "https://www.kbcard.com/",
    "https://gyesanbox.kr/calculators/youth-future-savings/",
  ];

  for (const url of existing) {
    assert.equal(links(url).length, 1, url);
  }
  assert.deepEqual(links("https://www.unapproved-example.test/path"), []);
});
