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

test("related calculators stay optional and preserve the existing serviceIds save contract", async () => {
  const html = await (await knowledgeAdminUi()).text();
  const errors = [];
  const requests = [];
  const services = [
    { id: "service-1", name: "4대보험 계산기" },
    { id: "service-2", name: "연봉 실수령액 계산기" },
    { id: "service-3", name: "국비지원 자격증 취득비용 계산기" },
  ];
  const question = {
    id: "question-1", title: "관리자 편집 테스트", category: "금융", body: "질문 본문",
    status: "published", answer: null, isAnonymous: true, nickname: null,
    relatedServices: [services[0], services[1]],
  };
  const response = (data) => ({ ok: true, json: async () => ({ data }) });
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (error) => errors.push(error.message));
  const dom = new JSDOM(html, {
    url: "https://gyesanbox.kr/admin/knowledge",
    runScripts: "dangerously",
    virtualConsole,
    beforeParse(window) {
      Object.defineProperty(window.crypto, "randomUUID", { value: () => "00000000-0000-4000-8000-000000000000" });
      window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
      window.fetch = async (input, options = {}) => {
        const url = String(input);
        const method = options.method || "GET";
        if (url === "/api/knowledge/v1/services") return response({ items: services });
        if (url.startsWith("/api/knowledge/v1/admin/questions?")) return response({ items: [question], page: 1, page_size: 20, total: 1, total_pages: 1 });
        if (url === "/api/knowledge/v1/admin/questions/question-1" && method === "GET") return response({ question: structuredClone(question) });
        if (url === "/api/knowledge/v1/admin/questions/question-1" && method === "PATCH") {
          const body = JSON.parse(options.body);
          requests.push({ method, body });
          question.title = body.title;
          question.category = body.category;
          question.body = body.body;
          if (Object.hasOwn(body, "serviceIds")) question.relatedServices = services.filter((service) => body.serviceIds.includes(service.id));
          return response({ question: structuredClone(question) });
        }
        if (url === "/api/knowledge/v1/admin/questions" && method === "POST") {
          const body = JSON.parse(options.body);
          requests.push({ method, body });
          return response({ id: "created-question" });
        }
        if (url === "/api/knowledge/v1/admin/questions/created-question" && method === "GET") return response({ question: { ...question, id: "created-question", relatedServices: [] } });
        throw new Error(`Unexpected request: ${method} ${url}`);
      };
    },
  });
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
  const document = dom.window.document;
  await flush();

  document.querySelector('[data-open-kid="question-1"]').click();
  await flush();
  const details = document.querySelector("#knowledge-services-details");
  const checkboxes = [...document.querySelectorAll('[name="knowledge-service"]')];
  assert.equal(details.open, false, "calculator list starts collapsed");
  assert.deepEqual(checkboxes.map((input) => input.checked), [true, true, false], "existing related service IDs restore selection");
  assert.equal(document.querySelectorAll(".knowledge-service-chip").length, 2);
  assert.match(document.querySelector("#knowledge-services-count").textContent || "", /2개 선택/u);
  assert.equal(checkboxes[0].value, "service-1");
  assert.equal(checkboxes[0].closest("label")?.querySelector("span")?.textContent, "4대보험 계산기");

  checkboxes[1].click();
  checkboxes[2].click();
  document.querySelector("#knowledge-title").value = "관리자 편집 테스트 수정";
  document.querySelector("#knowledge-form").dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();
  assert.deepEqual(requests.at(-1), {
    method: "PATCH",
    body: { title: "관리자 편집 테스트 수정", category: "금융", body: "질문 본문", serviceIds: ["service-1", "service-3"] },
  });

  const reloadedCheckboxes = [...document.querySelectorAll('[name="knowledge-service"]')];
  assert.deepEqual(reloadedCheckboxes.map((input) => input.checked), [true, false, true]);
  reloadedCheckboxes[0].click();
  reloadedCheckboxes[2].click();
  document.querySelector("#knowledge-form").dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();
  assert.deepEqual(requests.at(-1).body.serviceIds, [], "clearing all calculator selections sends an empty serviceIds array");
  assert.equal(document.querySelector(".knowledge-services-empty").hidden, false);
  assert.equal(document.querySelectorAll(".knowledge-service-chip").length, 0);

  document.querySelector("#knowledge-cancel").click();
  document.querySelector("#knowledge-new").click();
  assert.equal(document.querySelector("#knowledge-services-details").open, false);
  assert.equal(document.querySelector(".knowledge-services-empty").hidden, false);
  document.querySelector("#knowledge-title").value = "신규 질문";
  document.querySelector("#knowledge-category").value = document.querySelector("#knowledge-category option[value]:not([value=''])").value;
  document.querySelector("#knowledge-body").value = "질문 내용";
  document.querySelector("#knowledge-password").value = "1234";
  document.querySelector("#knowledge-form").dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
  await flush();
  assert.deepEqual(requests.at(-1).body.serviceIds, [], "creating with no calculators sends serviceIds: []");
  assert.deepEqual(errors, []);

  const style = [...document.querySelectorAll("style")].map((node) => node.textContent).join("\n");
  assert.match(style, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/u);
  assert.match(style, /@media\(max-width:780px\)\{\.knowledge-service-options\{grid-template-columns:minmax\(0,1fr\)\}/u);
  assert.match(style, /\.knowledge-service-option\{[^}]*min-height:44px/u);
  assert.match(style, /overflow-wrap:anywhere/u);
  dom.window.close();
});

const mountAnswerEditor = async ({ initialAnswer = null, onSave } = {}) => {
  const html = await (await knowledgeAdminUi()).text();
  const requests = [];
  const errors = [];
  const question = {
    id: "question-answer-test", title: "답변 편집 질문", category: "금융", body: "질문 원문",
    status: "published", answer: initialAnswer ? { id: "answer-1", body: initialAnswer } : null,
    isAnonymous: true, nickname: null, relatedServices: [{ id: "service-1", name: "4대보험 계산기" }],
  };
  const response = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => status >= 400 ? { error: { message: "Preview 저장 오류" } } : { data } });
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (error) => errors.push(error.message));
  const dom = new JSDOM(html, {
    url: "https://preview.gyesanbox.kr/admin/knowledge",
    runScripts: "dangerously",
    virtualConsole,
    beforeParse(window) {
      Object.defineProperty(window.crypto, "randomUUID", { value: () => "00000000-0000-4000-8000-000000000000" });
      window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
      window.HTMLElement.prototype.scrollIntoView = function () {};
      window.fetch = async (input, options = {}) => {
        const url = String(input), method = options.method || "GET";
        if (url === "/api/knowledge/v1/services") return response({ items: [{ id: "service-1", name: "4대보험 계산기" }] });
        if (url.startsWith("/api/knowledge/v1/admin/questions?")) return response({ items: [question], page: 1, page_size: 20, total: 1, total_pages: 1 });
        if (url === "/api/knowledge/v1/admin/questions/question-answer-test" && method === "GET") return response({ question: structuredClone(question) });
        if (url === "/api/knowledge/v1/admin/questions/question-answer-test/answer" && ["POST", "PATCH"].includes(method)) {
          const body = JSON.parse(options.body);
          requests.push({ url, method, body });
          if (onSave) {
            const result = await onSave({ question, requests, body, method });
            if (result?.status >= 400) return response({}, result.status);
          }
          question.answer = { id: "answer-1", body: body.body };
          return response({ id: "answer-1", question_id: question.id });
        }
        if (url === "/api/knowledge/v1/admin/questions/question-answer-test" && method === "PATCH") {
          requests.push({ url, method, body: JSON.parse(options.body) });
          return response({ id: question.id, status: "published" });
        }
        throw new Error(`Unexpected request: ${method} ${url}`);
      };
    },
  });
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
  await flush();
  dom.window.document.querySelector('[data-open-kid="question-answer-test"]').click();
  await flush();
  return { dom, question, requests, errors, flush };
};

test("official answer editor sends multi-paragraph Korean text and refreshes saved state without mutating question fields", async () => {
  const { dom, question, requests, errors, flush } = await mountAnswerEditor();
  const document = dom.window.document;
  const answer = "사기업 근로자인 배우자가 같은 자녀에 대해 먼저 3개월간 육아휴직을 사용하고 복직한 뒤, 공무원인 배우자가 출산전후휴가 종료 후 육아휴직을 시작하려고 합니다.\n\n이 경우 공무원 배우자가 두 번째 육아휴직자 특례를 적용받아 첫 6개월 동안 높아진 육아휴직수당 상한을 적용받을 수 있는지 궁금합니다.\n\n먼저 육아휴직한 배우자가 3개월만 사용하고 복직하더라도 공무원 배우자는 6개월까지 특례를 적용받을 수 있는지 알고 싶습니다.";
  document.querySelector("#knowledge-answer").value = answer;
  document.querySelector("#knowledge-answer-save").click();
  await flush(); await flush();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].method, "POST");
  assert.deepEqual(requests[0].body, { body: answer });
  assert.match(document.querySelector("#knowledge-form-status").textContent || "", /공식답변을 저장했습니다/u);
  assert.equal(document.querySelector("#knowledge-answer").value, answer);
  assert.equal(question.title, "답변 편집 질문");
  assert.deepEqual(question.relatedServices.map((service) => service.id), ["service-1"]);
  assert.equal(requests.some((request) => request.method === "PATCH" && !request.url.endsWith("/answer")), false, "answer-only save must not patch question fields or serviceIds");
  assert.deepEqual(errors, []);
  dom.window.close();
});

test("official answer validation shows a textarea error, focuses it, and does not call the API", async () => {
  const { dom, requests, flush } = await mountAnswerEditor();
  const document = dom.window.document, answer = document.querySelector("#knowledge-answer"), button = document.querySelector("#knowledge-answer-save");
  answer.value = "";
  button.click();
  await flush();
  assert.equal(document.querySelector("#knowledge-answer-error").textContent, "공식답변을 입력해 주세요.");
  assert.equal(document.querySelector("#knowledge-answer-error").hidden, false);
  assert.equal(document.activeElement, answer);
  assert.equal(document.querySelector("#knowledge-form-status").textContent, "공식답변 저장 요청을 보내지 않았습니다. 입력 내용을 확인해 주세요.");
  assert.equal(requests.length, 0);
  answer.value = "허용되지 않는 <태그>";
  button.click();
  await flush();
  assert.equal(document.querySelector("#knowledge-answer-error").textContent, "공식답변 형식이 올바르지 않습니다.");
  assert.equal(requests.length, 0);
  dom.window.close();
});

test("official answer API errors preserve text, report failure, and duplicate clicks produce one request", async () => {
  let releaseSave;
  const saveGate = new Promise((resolve) => { releaseSave = resolve; });
  const { dom, requests, flush } = await mountAnswerEditor({ initialAnswer: "기존 답변", onSave: async () => { await saveGate; return { status: 500 }; } });
  const document = dom.window.document, answer = document.querySelector("#knowledge-answer"), button = document.querySelector("#knowledge-answer-save");
  answer.value = "수정 답변\n\n문단 유지";
  button.click();
  button.click();
  await flush();
  assert.equal(requests.length, 1);
  assert.equal(button.disabled, true);
  assert.equal(button.textContent, "저장 중…");
  releaseSave();
  await flush(); await flush();
  assert.equal(requests.length, 1);
  assert.equal(answer.value, "수정 답변\n\n문단 유지");
  assert.match(document.querySelector("#knowledge-form-status").textContent || "", /공식답변 저장에 실패했습니다: Preview 저장 오류/u);
  assert.equal(button.disabled, false);
  dom.window.close();
});
