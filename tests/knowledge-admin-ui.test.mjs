import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM, VirtualConsole } from "jsdom";
import { knowledgeAdminUi } from "../lib/knowledge/admin-ui.ts";
import { onRequestGet as adminKnowledgePage } from "../functions/admin/knowledge/index.ts";

test("admin page serves the restored knowledge question management UI", async () => {
  const response = adminKnowledgePage();
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /text\/html/u);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.match(html, /id="knowledge-center-section"/u);
  assert.match(html, /id="knowledge-search-form"/u);
  assert.match(html, /id="knowledge-status"/u);
  assert.match(html, /id="knowledge-answered"/u);
  assert.match(html, /id="knowledge-category-filter"/u);
  assert.match(html, /pageSize=data\.page_size\|\|20/u);
  assert.match(html, /class="knowledge-badge/u);
  assert.match(html, /data-row-action="hide"/u);
  assert.match(html, /data-row-action="publish"/u);
  assert.match(html, /data-row-action="delete"/u);
  assert.match(html, /공식답변 등록\/수정/u);
  assert.match(html, /knowledge-pagination-mobile/u);
  assert.match(html, /min-width:72px/u);
  assert.match(html, /min-height:44px/u);
  assert.match(html, /\/api\/knowledge\/v1\/admin\/questions/u);
  assert.match(html, /\/api\/knowledge\/v1\/services/u);
  assert.doesNotMatch(html, /\/api\/community\/v1/u);
});

test("admin UI response is noindex and does not mutate data until an operator uses an action", async () => {
  const response = knowledgeAdminUi();
  const html = await response.text();

  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.match(html, /name="robots" content="noindex,nofollow"/u);
  assert.match(html, /data-row-action="delete"/u);
  assert.match(html, /window\.confirm\(/u);
});

test("the restored UI renders card badges and all row actions from the current Worker API contract", async () => {
  const html = await (await knowledgeAdminUi()).text();
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (error) => errors.push(error.message));
  const question = {
    id: "4005ff9d-36e0-4df1-afab-697919a27477",
    title: "테스트 질문 제목",
    category: "금융",
    status: "published",
    answer: null,
    isAnonymous: true,
    nickname: null,
    relatedServices: [],
  };
  const dom = new JSDOM(html, {
    url: "https://gyesanbox.kr/admin/knowledge",
    runScripts: "dangerously",
    virtualConsole,
    beforeParse(window) {
      Object.defineProperty(window.crypto, "randomUUID", { value: () => "00000000-0000-4000-8000-000000000000" });
      window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
      window.fetch = async (input) => {
        const url = String(input);
        if (url === "/api/knowledge/v1/services") return { ok: true, json: async () => ({ data: { items: [] } }) };
        if (url.startsWith("/api/knowledge/v1/admin/questions?")) return { ok: true, json: async () => ({ data: { items: [question], page: 1, page_size: 20, total: 1, total_pages: 1 } }) };
        throw new Error(`Unexpected request: ${url}`);
      };
    },
  });
  await new Promise((resolve) => setTimeout(resolve, 0));

  const rows = dom.window.document.querySelectorAll(".knowledge-row");
  assert.equal(rows.length, 1);
  assert.match(rows[0].textContent || "", /테스트 질문 제목/u);
  assert.match(rows[0].textContent || "", /금융/u);
  assert.match(rows[0].textContent || "", /공개/u);
  assert.match(rows[0].textContent || "", /답변 대기/u);
  assert.equal(rows[0].querySelectorAll(".knowledge-badge").length, 3);
  assert.deepEqual([...rows[0].querySelectorAll("[data-row-action]")].map((button) => button.getAttribute("data-row-action")), ["hide", "publish", "delete"]);
  assert.deepEqual(errors, []);
  dom.window.close();
});
