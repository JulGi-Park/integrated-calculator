import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { onRequestGet as sitemapRoute } from "../functions/sitemap-knowledge.xml.ts";
import { fetchRelatedKnowledgeQuestions, renderKnowledgeQuestion } from "../pages-functions/knowledge-seo.ts";

const env = { NEXT_PUBLIC_ENABLE_KNOWLEDGE_PREVIEW: "true",
  KNOWLEDGE_SERVICE: { fetch: request => globalThis.fetch(request.url, { redirect: request.redirect }) } };
const preview = "https://know-02-preview.integrated-calculator.pages.dev";
const id = (number) => `00000000-0000-4000-8000-${String(number).padStart(12, "0")}`;
const json = (data) => Response.json({ ok: true, data });
const page = (items, number, total) => ({ items, page: number, page_size: 10, total, total_pages: Math.max(1, Math.ceil(total / 10)) });
const context = (url = `${preview}/sitemap-knowledge.xml`, runtimeEnv = env) => ({ request: new Request(url), env: runtimeEnv, params: {} });

test("knowledge sitemap traverses all 20 published pages without lastmod or query URLs", async () => {
  const original = globalThis.fetch;
  const requested = [];
  globalThis.fetch = async (input, options) => {
    const url = new URL(String(input));
    const number = Number(url.searchParams.get("page"));
    requested.push(number);
    assert.equal(url.pathname, "/api/knowledge/v1/questions");
    assert.equal(url.searchParams.get("limit"), "10");
    assert.equal(url.searchParams.has("q"), false);
    assert.equal(url.searchParams.has("category"), false);
    assert.equal(options.redirect, "manual");
    return json(page(Array.from({ length: 10 }, (_, offset) => ({ id: id((number - 1) * 10 + offset + 1),
      title: "질문", category: "근로·고용" })), number, 200));
  };
  try {
    const response = await sitemapRoute(context());
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /^application\/xml/u);
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow, noarchive");
    assert.equal(response.headers.get("cache-control"), "no-store");
    const source = await response.text();
    const dom = new JSDOM(source, { contentType: "text/xml" });
    assert.equal(dom.window.document.querySelector("parsererror"), null);
    const locs = [...dom.window.document.querySelectorAll("loc")].map((node) => node.textContent);
    assert.equal(locs.length, 200);
    assert.equal(new Set(locs).size, 200);
    assert.ok(locs.includes(`https://gyesanbox.kr/knowledge/${id(1)}/`));
    assert.ok(locs.includes(`https://gyesanbox.kr/knowledge/${id(200)}/`));
    assert.ok(locs.every((loc) => !loc.includes("?")));
    assert.equal(dom.window.document.querySelectorAll("lastmod").length, 0);
    assert.deepEqual(requested.toSorted((a, b) => a - b), Array.from({ length: 20 }, (_, index) => index + 1));
  } finally { globalThis.fetch = original; }
});

test("Production index gate exposes a unique canonical URL for each of 200 published questions", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    const number = Number(url.searchParams.get("page"));
    return json(page(Array.from({ length: 10 }, (_, offset) => ({
      id: id((number - 1) * 10 + offset + 1),
      title: `질문 ${(number - 1) * 10 + offset + 1}`,
      category: "근로·고용",
      status: "published",
    })), number, 200));
  };
  try {
    const productionEnv = {
      KNOWLEDGE_ENV: "production",
      KNOWLEDGE_PUBLIC_ENABLED: "true",
      KNOWLEDGE_INDEX_ENABLED: "true",
      KNOWLEDGE_SERVICE: { fetch: (request) => globalThis.fetch(request.url) },
    };
    const response = await sitemapRoute(context("https://gyesanbox.kr/sitemap-knowledge.xml", productionEnv));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-robots-tag"), null);
    const dom = new JSDOM(await response.text(), { contentType: "text/xml" });
    assert.equal(dom.window.document.querySelector("parsererror"), null);
    const locs = [...dom.window.document.querySelectorAll("loc")].map((node) => node.textContent);
    assert.equal(locs.length, 200);
    assert.equal(new Set(locs).size, 200);
    assert.equal(locs[0], `https://gyesanbox.kr/knowledge/${id(1)}/`);
    assert.equal(locs.at(-1), `https://gyesanbox.kr/knowledge/${id(200)}/`);
    assert.ok(locs.every((loc) => /^https:\/\/gyesanbox\.kr\/knowledge\/[0-9a-f-]+\/$/u.test(loc)));
    dom.window.close();
  } finally { globalThis.fetch = original; }
});

test("sitemap gate fails closed and rejects nonpublished or incomplete API pages", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return json(page([{ id: id(1), title: "숨김", category: "근로·고용", status: "hidden" }], 1, 1)); };
  try {
    assert.equal((await sitemapRoute(context("https://gyesanbox.kr/sitemap-knowledge.xml"))).status, 404);
    assert.equal((await sitemapRoute(context(undefined, { ...env, NEXT_PUBLIC_ENABLE_KNOWLEDGE_PREVIEW: "false" }))).status, 404);
    assert.equal(calls, 0);
    assert.equal((await sitemapRoute(context())).status, 503);
    globalThis.fetch = async () => json(page([{ id: id(1), title: "하나", category: "근로·고용" }], 1, 2));
    assert.equal((await sitemapRoute(context())).status, 503);
  } finally { globalThis.fetch = original; }
});

test("related questions use published list data, exclude self, cap links, and escape titles", async () => {
  const original = globalThis.fetch;
  const requested = [];
  globalThis.fetch = async (input, options) => {
    const url = new URL(String(input));
    requested.push(url.searchParams.get("category"));
    assert.equal(options.redirect, "manual");
    if (url.searchParams.has("category")) return json(page([
      { id: id(1), title: "현재 질문", category: "사업" },
      { id: id(2), title: `<관련 질문> & '`, category: "사업" },
    ], 1, 2));
    return json(page(Array.from({ length: 10 }, (_, index) => ({ id: id(index + 1),
      title: `질문 ${index + 1}`, category: "근로·고용" })), 1, 200));
  };
  try {
    const related = await fetchRelatedKnowledgeQuestions(env, { id: id(1), category: "사업" });
    assert.deepEqual(requested, ["사업", null]);
    assert.deepEqual(related.map((item) => item.id), [id(2), id(3), id(4), id(5), id(6)]);
    const html = renderKnowledgeQuestion({ id: id(1), title: "현재 질문", body: "본문", category: "사업",
      isAnonymous: true, nickname: null, status: "published", answer: { body: "공식답변" },
      relatedServices: [{ slug: "labor-pay", name: "주휴수당 계산기" }] }, "preview", related);
    const dom = new JSDOM(html);
    const anchors = [...dom.window.document.querySelectorAll("#related-questions + ul a")];
    assert.equal(anchors.length, 5);
    assert.ok(anchors.every((anchor) => anchor.getAttribute("href") !== `/knowledge/${id(1)}/`));
    assert.equal(anchors[0].textContent, `<관련 질문> & '`);
    assert.equal(dom.window.document.querySelectorAll("script").length, 0);
    assert.equal(dom.window.document.querySelectorAll("#related-calculators + ul a").length, 1);
  } finally { globalThis.fetch = original; }
});
