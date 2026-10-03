import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { knowledgeSeo, knowledgeDetailPath, knowledgeCanonical, knowledgeSeoDescription,
  knowledgeSeoRobots, escapeKnowledgeSeoHtml } from "../lib/knowledge/seo.ts";
import { buildSeoMapping } from "../scripts/knowledge/seo-mapping.mjs";

const id = "d2f1e94b-7c80-454b-9acb-6dd66c9e29d4";
const another = "18d0e041-1c43-48f8-91a8-2bf2725bb15b";

test("UUID URL contract is lowercase, stable, title-independent and slash terminated", () => {
  assert.equal(knowledgeDetailPath(id.toUpperCase()), `/knowledge/${id}/`);
  assert.equal(knowledgeCanonical(id), `https://gyesanbox.kr/knowledge/${id}/`);
  const first = knowledgeSeo({ id, title: "원래 제목", body: "내용" });
  assert.deepEqual(first, knowledgeSeo({ id, title: "원래 제목", body: "내용" }));
  assert.equal(first.detailPath, knowledgeSeo({ id, title: "새 제목", body: "내용" }).detailPath);
  assert.notEqual(first.detailPath, knowledgeSeo({ id: another, title: "원래 제목", body: "내용" }).detailPath);
  assert.equal(first.title, "원래 제목 | 계산박스 지식센터");
});

test("malformed UUIDs, traversal, whitespace, query, fragment and HTML fail closed", () => {
  for (const value of ["", "../test", `${id}/`, `${id}?x`, `${id}#x`, `<b>${id}</b>`,
    ` ${id}`, `${id}\n`, id.replace("454b", "054b"), null, 12]) {
    assert.throws(() => knowledgeDetailPath(value), /INVALID_KNOWLEDGE_QUESTION_ID/);
  }
});

test("description whitespace and Unicode code point boundary are deterministic", () => {
  assert.equal(knowledgeSeoDescription("  질문\n\t 내용\u00a0  확인  "), "질문 내용 확인");
  assert.equal(knowledgeSeoDescription("😀".repeat(160)), "😀".repeat(160));
  const truncated = knowledgeSeoDescription("😀".repeat(161));
  assert.equal(Array.from(truncated).length, 160);
  assert.equal(truncated, `${"😀".repeat(159)}…`);
  assert.equal(knowledgeSeoDescription(""), "");
});

test("raw metadata is safe through React escaping, string renderer has explicit escape helper", () => {
  const malicious = `</title><script>alert("x")</script>&'`;
  const seo = knowledgeSeo({ id, title: malicious, body: malicious });
  assert.equal(seo.title, `${malicious} | 계산박스 지식센터`);
  const html = renderToStaticMarkup(React.createElement(React.Fragment, null,
    React.createElement("title", null, seo.title),
    React.createElement("meta", { name: "description", content: seo.description })));
  const document = new JSDOM(html).window.document;
  assert.equal(document.querySelectorAll("script").length, 0);
  assert.equal(document.querySelector("title").textContent, seo.title);
  assert.equal(document.querySelector("meta").getAttribute("content"), seo.description);
  const escaped = escapeKnowledgeSeoHtml(seo.description);
  assert.ok(!/[<>"']/.test(escaped));
  assert.equal(new JSDOM(`<meta name="description" content="${escaped}">`).window.document
    .querySelector("meta").getAttribute("content"), seo.description);
});

test("robots defaults gate off; Preview and nonpublished cannot be indexed", () => {
  for (const environment of ["preview", "production"]) {
    for (const status of ["draft", "published", "hidden"]) {
      assert.deepEqual(knowledgeSeoRobots({ environment, status }), { index: false, follow: false });
      if (environment === "preview" || status !== "published") {
        assert.equal(knowledgeSeoRobots({ environment, status, productionIndexEnabled: true }).index, false);
      }
    }
  }
  assert.equal(knowledgeSeoRobots({ environment: "production", status: "published", productionIndexEnabled: true }).index, true);
});

function fixture() {
  const source = Array.from({ length: 200 }, (_, index) => ({ source_index: index + 1,
    title: "같은 제목", question_body: "질문 내용", answer_body: "답변", category: "근로·고용",
    related_calculator_slug: index % 2 ? "labor-pay" : null }));
  const rows = source.map((record) => ({ source_key: `kin-261001-${String(record.source_index).padStart(3, "0")}`,
    question_id: `${record.source_index.toString(16).padStart(8, "0")}-1234-4567-89ab-123456789abc`,
    title: record.title, body: record.question_body, answer_body: record.answer_body,
    category: record.category, status: "published", service_slugs: JSON.stringify(record.related_calculator_slug ? [record.related_calculator_slug] : []) }));
  return { source, rows };
}

test("200 sourceKey-based mappings are unique, deterministic and inputs unchanged", () => {
  const { source, rows } = fixture();
  const original = JSON.stringify({ source, rows });
  const mapping = buildSeoMapping(source, [...rows].reverse(), "source-hash");
  assert.equal(mapping.length, 200);
  assert.equal(new Set(mapping.map((row) => row.future_detail_path)).size, 200);
  assert.equal(mapping[0].sourceKey, "kin-261001-001");
  assert.equal(mapping[199].sourceKey, "kin-261001-200");
  assert.deepEqual(mapping, buildSeoMapping(source, rows, "source-hash"));
  assert.equal(JSON.stringify({ source, rows }), original);
  assert.match(mapping[0].content_fingerprint, /^[a-f0-9]{64}$/);
});

test("mapping fails on missing/duplicate/invalid/mismatched data instead of title matching", () => {
  const { source, rows } = fixture();
  assert.throws(() => buildSeoMapping(source, rows.slice(1), "hash"), /MISSING_IMPORT/);
  assert.throws(() => buildSeoMapping([...source, source[0]], rows, "hash"), /DUPLICATE_SOURCE_KEY/);
  assert.throws(() => buildSeoMapping(source, [...rows, rows[0]], "hash"), /DUPLICATE_SOURCE_KEY/);
  const changed = structuredClone(rows);
  changed[1].question_id = changed[0].question_id.toUpperCase();
  assert.throws(() => buildSeoMapping(source, changed, "hash"), /DUPLICATE_QUESTION_ID/);
  for (const field of ["title", "body", "answer_body", "category", "status", "service_slugs"]) {
    const mismatch = structuredClone(rows);
    mismatch[0][field] = field === "service_slugs" ? '["unknown"]' : "변경";
    assert.throws(() => buildSeoMapping(source, mismatch, "hash"), /CONTENT_OR_RELATION_MISMATCH/);
  }
  const invalid = structuredClone(source);
  invalid[0].source_index = "001";
  assert.throws(() => buildSeoMapping(invalid, rows, "hash"), /INVALID_SOURCE_INDEX/);
});
