import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { onRequestGet } from "../functions/knowledge/[questionId].ts";

const id = "5e0221de-67a8-47ec-9211-7d28b8614dba";
const relatedId = "e3710eb4-499f-4f64-be4f-ce02c2a100a4";
const env = { NEXT_PUBLIC_ENABLE_KNOWLEDGE_PREVIEW: "true",
  KNOWLEDGE_SERVICE: { fetch: request => globalThis.fetch(request.url, { redirect: request.redirect }) } };
const question = { id, isAnonymous: true, nickname: null, title: `제목 </title><script>alert("x")</script> & '`,
  body: `질문 <img src=x onerror="alert(1)"> & '`, category: `근로·고용 <svg onload="x">`,
  createdAt: "2026-10-04T03:20:00.000Z",
  answer: { id: "answer-id", body: `답변 </section> & " ' <script>x</script>` },
  relatedServices: [{ id: "service-id", slug: "labor-pay", name: `주휴수당 <script>x</script>` }] };
const context = (questionId = id, hostname = "know-02-preview.integrated-calculator.pages.dev", runtimeEnv = env) => ({
  request: new Request(`https://${hostname}/knowledge/${questionId}/`), env: runtimeEnv, params: { questionId },
});
const json = (status, payload) => new Response(JSON.stringify(payload), { status,
  headers: { "content-type": "application/json" } });

test("Pages Function fail-closes outside enabled Pages Preview and on invalid IDs", async () => {
  const saved = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => { called = true; return json(200, {}); };
  try {
    assert.equal((await onRequestGet(context(id, "gyesanbox.kr", env))).status, 404);
    assert.equal((await onRequestGet(context(id, "evil.pages.dev", env))).status, 404);
    assert.equal((await onRequestGet(context(id, undefined, { ...env, NEXT_PUBLIC_ENABLE_KNOWLEDGE_PREVIEW: "false" }))).status, 404);
    assert.equal((await onRequestGet(context("not-a-uuid"))).status, 404);
    assert.equal((await onRequestGet(context("..%2Frobots.txt"))).status, 404);
    assert.equal(called, false);
  } finally { globalThis.fetch = saved; }
});

test("published detail returns metadata and question/answer in escaped initial HTML", async () => {
  const saved = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(options.redirect, "manual");
    if (String(url) === `https://knowledge.internal/api/knowledge/v1/questions/${id}`) {
      return json(200, { ok: true, data: { question } });
    }
    const listUrl = new URL(String(url));
    assert.equal(listUrl.pathname, "/api/knowledge/v1/questions");
    return json(200, { ok: true, data: { items: [question, { id: relatedId, title: `<관련 질문> & '`, category: "근로·고용" }],
      page: 1, page_size: 10, total: 2, total_pages: 1 } });
  };
  try {
    const response = await onRequestGet(context());
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow, noarchive");
    assert.equal(response.headers.get("cache-control"), "no-store");
    const source = await response.text();
    assert.match(source, /<h1>제목 &lt;\/title&gt;&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt; &amp; &#39;<\/h1>/);
    assert.match(source, /질문 &lt;img src=x onerror=&quot;alert\(1\)&quot;&gt; &amp; &#39;/);
    assert.match(source, /답변 &lt;\/section&gt; &amp; &quot; &#39; &lt;script&gt;x&lt;\/script&gt;/);
    assert.match(source, /<title>제목 &lt;\/title&gt;/);
    assert.match(source, /name="description" content="질문 &lt;img/);
    assert.ok(source.includes(`rel="canonical" href="https://gyesanbox.kr/knowledge/${id}/"`));
    assert.match(source, /name="robots" content="noindex, nofollow, noarchive"/);
    assert.match(source, /property="og:title"/);
    assert.match(source, /property="og:description"/);
    assert.match(source, /property="og:url"/);
    assert.match(source, /property="og:image"/);
    assert.match(source, /name="twitter:card"/);
    assert.match(source, /name="twitter:title"/);
    assert.match(source, /name="twitter:description"/);
    assert.match(source, /name="twitter:image"/);
    assert.match(source, /<link rel="stylesheet" href="\/knowledge-detail\.css">/);
    assert.match(source, /<header class="site-header">[\s\S]*?계산박스/);
    assert.match(source, /<nav class="knowledge-breadcrumb" aria-label="현재 위치">[\s\S]*?근로·고용 &lt;svg/);
    assert.match(source, /class="knowledge-category">근로·고용 &lt;svg/);
    assert.match(source, /<span class="knowledge-meta__label">작성자<\/span><span>익명<\/span>/);
    assert.match(source, /<time datetime="2026-10-04T03:20:00\.000Z">2026년 10월 4일<\/time>/);
    assert.match(source, /class="knowledge-question-card"[\s\S]*?질문 내용/);
    assert.match(source, /class="knowledge-answer"[\s\S]*?계산박스 공식답변/);
    assert.match(source, /href="\/calculators\/labor-pay\/"[\s\S]*?주휴수당 &lt;script&gt;x&lt;\/script&gt;[\s\S]*?시급과 소정근로시간[\s\S]*?계산기 열기/);
    // Unmapped questions use deterministic metadata and never receive global filler links.
    assert.doesNotMatch(source, /aria-labelledby="related-questions"/u);
    assert.match(source, /class="knowledge-back-link" href="\/knowledge\/"[\s\S]*?지식센터로 돌아가기/);
    assert.match(source, /href="\/knowledge\/">질문 둘러보기/);
    assert.match(source, /class="site-footer"[\s\S]*?개인정보처리방침/);
    assert.equal((source.match(/<h1\b/g) ?? []).length, 1);
    const dom = new JSDOM(source);
    assert.equal(dom.window.document.querySelectorAll("script").length, 0);
    assert.equal(dom.window.document.querySelector("h1").textContent, question.title);
    assert.equal(dom.window.document.querySelector("meta[name=description]").content,
      question.body.replace(/\s+/gu, " ").trim());
  } finally { globalThis.fetch = saved; }
});

test("hidden/nonexistent details are 404 and API errors fail closed with 503", async () => {
  const saved = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response("not found", { status: 404 });
    const notFound = await onRequestGet(context());
    assert.equal(notFound.status, 404);
    assert.equal(notFound.headers.get("x-robots-tag"), "noindex, nofollow, noarchive");
    globalThis.fetch = async () => { throw new Error("upstream down"); };
    const unavailable = await onRequestGet(context());
    assert.equal(unavailable.status, 503);
    assert.equal(unavailable.headers.get("cache-control"), "no-store");
  } finally { globalThis.fetch = saved; }
});

test("upstream redirects are manual and rejected rather than followed", async () => {
  const saved = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (_url, options) => {
    calls += 1;
    assert.equal(options.redirect, "manual");
    return new Response(null, { status: 302, headers: { location: "https://attacker.example/" } });
  };
  try {
    assert.equal((await onRequestGet(context())).status, 503);
    assert.equal(calls, 1);
  } finally { globalThis.fetch = saved; }
});

test("uppercase valid IDs redirect to lowercase canonical path", async () => {
  const saved = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => { called = true; return json(404, {}); };
  try {
    const response = await onRequestGet(context(id.toUpperCase()));
    assert.equal(response.status, 308);
    assert.equal(response.headers.get("location"), `https://know-02-preview.integrated-calculator.pages.dev/knowledge/${id}/`);
    assert.equal(called, false);
  } finally { globalThis.fetch = saved; }
});
