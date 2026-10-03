import assert from "node:assert/strict";
import { afterEach, before, beforeEach, test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", {
  url: "https://know-02-preview.integrated-calculator.pages.dev/knowledge/",
});

Object.defineProperties(globalThis, {
  window: { value: dom.window, configurable: true },
  document: { value: dom.window.document, configurable: true },
  navigator: { value: dom.window.navigator, configurable: true },
  HTMLElement: { value: dom.window.HTMLElement, configurable: true },
  HTMLInputElement: { value: dom.window.HTMLInputElement, configurable: true },
  Node: { value: dom.window.Node, configurable: true },
  DOMException: { value: dom.window.DOMException, configurable: true },
  getComputedStyle: { value: dom.window.getComputedStyle.bind(dom.window), configurable: true },
  IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true, writable: true },
});

const { act, cleanup, render, screen, waitFor, within } = await import("@testing-library/react");
const userEvent = (await import("@testing-library/user-event")).default;
const React = await import("react");
const { KnowledgeCenter } = await import("../components/knowledge/KnowledgeCenter.tsx");
const { KnowledgeLatestQuestions } = await import("../components/knowledge/KnowledgeLatestQuestions.tsx");

const apiBase = "https://knowledge-preview.gyesanbox.kr/api/knowledge/v1";
let turnstileReset;
let turnstileCallback;

before(() => {
  globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
});

beforeEach(() => {
  turnstileReset = [];
  turnstileCallback = null;
  window.turnstile = {
    render: (_element, options) => {
      turnstileCallback = options.callback;
      return "widget-1";
    },
    reset: (id) => turnstileReset.push(id),
  };
});

afterEach(() => {
  cleanup();
  delete window.turnstile;
  delete globalThis.fetch;
  delete window.matchMedia;
  delete window.confirm;
});

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function emptyList() {
  return { ok: true, data: { items: [], total_pages: 1 }, request_id: "list-1" };
}

async function fillVisitorForm(user, { anonymous = true } = {}) {
  await user.selectOptions(screen.getAllByRole("combobox")[1], "근로·고용");
  await user.type(screen.getByLabelText("제목"), "등록 후에도 화면 유지 질문");
  if (!anonymous) {
    await user.click(screen.getByRole("checkbox", { name: "익명으로 등록" }));
    await user.type(screen.getByLabelText("닉네임"), "방문자 닉네임");
  }
  await user.type(screen.getByLabelText("비밀번호"), "question-pass-1");
  await user.type(screen.getByLabelText("질문 내용"), "질문 등록 이후 상세 화면을 확인합니다.");
}

test("visitor form submits through fetch, opens the wrapped detail response, and stays on /knowledge/", async () => {
  const user = userEvent.setup();
  const postBodies = [];
  const question = {
    id: "5e0221de-67a8-47ec-9211-7d28b8614dba",
    title: "등록 후에도 화면 유지 질문",
    body: "질문 등록 이후 상세 화면을 확인합니다.",
    isAnonymous: true,
    nickname: null,
    status: "published",
    createdAt: "2026-10-01T01:09:16.929Z",
    updatedAt: "2026-10-01T01:09:16.929Z",
    answer: null,
    relatedServices: [],
  };
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    if (url.endsWith("/services")) return jsonResponse(200, { ok: true, data: { items: [] } });
    if (url.endsWith("/questions?limit=10&page=1")) {
      const created = postBodies.length > 0;
      return jsonResponse(200, created
        ? { ok: true, data: { items: [question], total_pages: 1 }, request_id: "list-2" }
        : emptyList());
    }
    if (url.endsWith("/questions") && init.method === "POST") {
      postBodies.push(JSON.parse(init.body));
      return jsonResponse(201, { ok: true, data: { id: question.id, status: "published" }, request_id: "create-1" });
    }
    if (url.endsWith(`/questions/${question.id}`)) {
      return jsonResponse(200, { ok: true, data: { question }, request_id: "detail-1" });
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  render(React.createElement(KnowledgeCenter, { apiBase }));
  await waitFor(() => assert.ok(turnstileCallback));
  await fillVisitorForm(user);
  assert.equal(screen.getByLabelText("비밀번호").getAttribute("autocomplete"), "new-password");
  await act(async () => turnstileCallback("test-only-token"));
  const pathnameBeforeSubmit = window.location.pathname;
  await user.click(screen.getByRole("button", { name: "질문 등록" }));

  await screen.findByTestId("desktop-question-detail");
  const permanentLink = await screen.findByRole("link", { name: "질문 상세" });
  assert.equal(permanentLink.getAttribute("href"), `/knowledge/${question.id}/`);
  await waitFor(() => assert.equal(screen.getByRole("status").textContent, "질문이 등록되었습니다."));
  assert.equal(window.location.pathname, pathnameBeforeSubmit);
  assert.equal(screen.getByLabelText("제목").value, "");
  assert.equal(screen.getByLabelText("질문 내용").value, "");
  assert.deepEqual(postBodies[0], {
    title: "등록 후에도 화면 유지 질문",
    isAnonymous: true,
    nickname: null,
    password: "question-pass-1",
    body: "질문 등록 이후 상세 화면을 확인합니다.",
    serviceIds: [],
    turnstile_token: "test-only-token",
    category: "근로·고용",
    website: "",
  });
  assert.deepEqual(turnstileReset, ["widget-1"]);
});

test("named visitor submits the same create contract with nickname and selected service", async () => {
  const user = userEvent.setup();
  const service = { id: "service-1", slug: "labor-pay", name: "주휴수당 계산기" };
  let posted;
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    if (url.endsWith("/services")) return jsonResponse(200, { ok: true, data: { items: [service] } });
    if (url.endsWith("/questions?limit=10&page=1")) return jsonResponse(200, emptyList());
    if (url.endsWith("/questions") && init.method === "POST") {
      posted = JSON.parse(init.body);
      return jsonResponse(201, { ok: true, data: { id: "18d0e041-1c43-48f8-91a8-2bf2725bb15b", status: "published" } });
    }
    if (url.endsWith("/questions/18d0e041-1c43-48f8-91a8-2bf2725bb15b")) {
      return jsonResponse(200, { ok: true, data: { question: {
        id: "18d0e041-1c43-48f8-91a8-2bf2725bb15b", title: posted.title, body: posted.body, isAnonymous: false,
        nickname: posted.nickname, status: "published", createdAt: "2026-10-01T01:00:00.000Z",
        updatedAt: "2026-10-01T01:00:00.000Z", answer: null, relatedServices: [service],
      } } });
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  render(React.createElement(KnowledgeCenter, { apiBase }));
  await waitFor(() => assert.ok(turnstileCallback));
  await fillVisitorForm(user, { anonymous: false });
  await user.click(screen.getByRole("checkbox", { name: /주휴수당 계산기/ }));
  await act(async () => turnstileCallback("test-only-token-2"));
  await user.click(screen.getByRole("button", { name: "질문 등록" }));

  await screen.findByTestId("desktop-question-detail");
  assert.equal(posted.isAnonymous, false);
  assert.equal(posted.nickname, "방문자 닉네임");
  assert.deepEqual(posted.serviceIds, [service.id]);
  assert.equal(posted.turnstile_token, "test-only-token-2");
  assert.equal(posted.category, "근로·고용");
  assert.equal(posted.website, "");
});

test("create API error keeps /knowledge/ and preserves entered values for correction", async () => {
  const user = userEvent.setup();
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    if (url.endsWith("/services")) return jsonResponse(200, { ok: true, data: { items: [] } });
    if (url.endsWith("/questions?limit=10&page=1")) return jsonResponse(200, emptyList());
    if (url.endsWith("/questions") && init.method === "POST") {
      return jsonResponse(400, { ok: false, error: { code: "INVALID_INPUT", message: "질문 내용을 확인해 주세요." } });
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  render(React.createElement(KnowledgeCenter, { apiBase }));
  await waitFor(() => assert.ok(turnstileCallback));
  await fillVisitorForm(user);
  await act(async () => turnstileCallback("test-only-token"));
  const pathnameBeforeSubmit = window.location.pathname;
  await user.click(screen.getByRole("button", { name: "질문 등록" }));

  assert.equal((await screen.findByRole("alert")).textContent.includes("질문 내용을 확인해 주세요."), true);
  assert.equal(window.location.pathname, pathnameBeforeSubmit);
  assert.equal(screen.getByLabelText("제목").value, "등록 후에도 화면 유지 질문");
  assert.equal(screen.getByLabelText("질문 내용").value, "질문 등록 이후 상세 화면을 확인합니다.");
  assert.equal(screen.getByLabelText("비밀번호").value, "question-pass-1");
  assert.deepEqual(turnstileReset, ["widget-1"]);
});

function paginatedQuestions(page) {
  const start = (page - 1) * 10;
  return Array.from({ length: Math.min(10, 201 - start) }, (_, offset) => {
    const number = start + offset + 1;
    return {
      id: `00000000-0000-4000-8000-${String(number).padStart(12, "0")}`,
      title: `질문 ${number}`,
      body: `질문 본문 ${number}`,
      category: "근로·고용",
      isAnonymous: true,
      nickname: null,
      status: "published",
      createdAt: "2026-10-01T01:09:16.929Z",
      updatedAt: "2026-10-01T01:09:16.929Z",
      answer: number % 2 === 0 ? { id: `answer-${number}`, body: `공식 답변 ${number}`, created_at: "2026-10-01T01:09:16.929Z", updated_at: "2026-10-01T01:09:16.929Z" } : null,
      relatedServices: [{ id: "service-1", slug: "labor-pay", name: "주휴수당 계산기" }],
    };
  });
}

function installPaginatedApi() {
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.endsWith("/services")) return jsonResponse(200, { ok: true, data: { items: [{ id: "service-1", slug: "labor-pay", name: "주휴수당 계산기" }] } });
    if (url.includes("/questions?limit=10&page=")) {
      const page = Number(new URL(url).searchParams.get("page"));
      return jsonResponse(200, { ok: true, data: { items: paginatedQuestions(page), page, total_pages: 21 } });
    }
    const id = url.match(/\/questions\/(00000000-0000-4000-8000-\d{12})$/)?.[1];
    if (id) {
      const number = Number(id.slice(-12));
      return jsonResponse(200, { ok: true, data: { question: paginatedQuestions(Math.ceil(number / 10)).find((item) => item.id === id) } });
    }
    throw new Error(`Unexpected request: ${url}`);
  };
}

function questionRow(number) {
  return screen.getAllByRole("button").find((button) => button.querySelector("strong")?.textContent === `질문 ${number}`);
}

test("edit begins with password verification and never prefills the new-question composer", async () => {
  const user = userEvent.setup();
  installPaginatedApi();
  render(React.createElement(KnowledgeCenter, { apiBase }));
  await screen.findByText("질문 1", { selector: "strong" });
  await user.click(questionRow(1));
  await screen.findByTestId("desktop-question-detail");
  await user.click(screen.getAllByRole("button", { name: "질문 수정" })[1]);
  assert.equal(screen.getByLabelText("제목").value, "");
  assert.equal(screen.getByLabelText("질문 내용").value, "");
  assert.ok(screen.getByLabelText("현재 비밀번호"));
  assert.equal(screen.queryByLabelText("수정 제목"), null);
});

function installEditApi({ answered = false, totalPages = 1 } = {}) {
  const question = { ...paginatedQuestions(1)[0], answer: answered ? { id: "answer-1", body: "공식답변" } : null };
  const mutations = [];
  let deleted = false;
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    if (url.endsWith("/services")) return jsonResponse(200, { ok: true, data: { items: [] } });
    if (url.includes("/questions?")) return jsonResponse(200, { ok: true, data: { items: deleted ? [] : [question], page: 1, total: deleted ? 0 : totalPages, total_pages: deleted ? 1 : totalPages } });
    if (init.method === "DELETE") {
      const body = JSON.parse(init.body);
      mutations.push({ url, method: init.method, body });
      if (question.answer) return jsonResponse(409, { ok: false, error: { message: "공식답변이 등록되어 삭제할 수 없습니다." } });
      if (body.password !== "current-password") return jsonResponse(403, { ok: false, error: { message: "비밀번호가 일치하지 않습니다." } });
      deleted = true;
      return jsonResponse(200, { ok: true, data: { id: question.id, deleted: true } });
    }
    if (init.method === "POST" || init.method === "PATCH") {
      const body = JSON.parse(init.body);
      mutations.push({ url, method: init.method, body });
      if (question.answer) return jsonResponse(409, { ok: false, error: { message: "공식답변이 등록되어 수정할 수 없습니다." } });
      if (body.password !== "current-password") return jsonResponse(403, { ok: false, error: { message: "비밀번호가 일치하지 않습니다." } });
      if (url.endsWith("/verify-password")) return jsonResponse(200, { ok: true, data: { verified: true } });
      assert.equal(init.method, "PATCH");
      Object.assign(question, { title: body.title, body: body.body });
      return jsonResponse(200, { ok: true, data: { id: question.id } });
    }
    if (url.endsWith(`/questions/${question.id}`)) return deleted
      ? jsonResponse(404, { ok: false, error: { message: "지식센터 질문을 찾을 수 없습니다." } })
      : jsonResponse(200, { ok: true, data: { question } });
    throw new Error(`Unexpected request: ${url}`);
  };
  return { question, mutations };
}

test("wrong password never opens edit fields; verified inline editing PATCHes the same ID with the current password", async () => {
  const user = userEvent.setup();
  const { question, mutations } = installEditApi({ totalPages: 21 });
  render(React.createElement(KnowledgeCenter, { apiBase }));
  await screen.findByText(question.title, { selector: "strong" });
  await user.type(screen.getByLabelText("제목"), "작성 중인 새 질문");
  await user.click(questionRow(1));
  const detail = await screen.findByTestId("desktop-question-detail");
  await user.click(within(detail).getByRole("button", { name: "질문 수정" }));
  const editor = screen.getByTestId("question-editor");
  assert.ok(detail.contains(editor));
  assert.equal(screen.queryByLabelText("수정 제목"), null);
  await user.type(within(editor).getByLabelText("현재 비밀번호"), "wrong-password");
  await act(async () => turnstileCallback("test-only-token"));
  await user.click(within(editor).getByRole("button", { name: "비밀번호 확인" }));
  await within(editor).findByRole("alert");
  assert.match(editor.textContent, /비밀번호가 일치하지 않습니다/);
  assert.equal(screen.queryByLabelText("수정 질문 내용"), null);
  assert.equal(mutations.filter(request => request.method === "PATCH").length, 0);
  assert.equal(question.title, "질문 1");
  assert.equal(question.body, "질문 본문 1");
  assert.equal(screen.getByLabelText("제목").value, "작성 중인 새 질문");
  await user.clear(within(editor).getByLabelText("현재 비밀번호"));
  await user.type(within(editor).getByLabelText("현재 비밀번호"), "current-password");
  await act(async () => turnstileCallback("fresh-auth-token"));
  await user.click(within(editor).getByRole("button", { name: "비밀번호 확인" }));
  await within(editor).findByLabelText("수정 제목");
  assert.equal(within(editor).queryByLabelText("현재 비밀번호"), null);
  assert.equal(within(editor).getByLabelText("수정 질문 내용").value, question.body);
  await user.clear(within(editor).getByLabelText("수정 제목"));
  await user.type(within(editor).getByLabelText("수정 제목"), "인증 후 수정 제목");
  await act(async () => turnstileCallback("fresh-save-token"));
  await user.click(within(editor).getByRole("button", { name: "수정 저장" }));
  await waitFor(() => assert.equal(screen.queryByTestId("question-editor"), null));
  assert.ok(screen.getAllByRole("heading", { name: "인증 후 수정 제목" }).length);
  assert.equal(screen.getByLabelText("제목").value, "작성 중인 새 질문");
  assert.equal(screen.getByRole("status").textContent, "질문이 수정되었습니다.");
  const patched = mutations.find(request => request.method === "PATCH");
  assert.equal(patched.url, `${apiBase}/questions/${question.id}`);
  assert.equal(patched.body.password, "current-password");
  assert.equal(patched.body.turnstile_token, "fresh-save-token");
  assert.equal(mutations.some(request => request.url === `${apiBase}/questions`), false);
});

test("mobile editor stays inside the selected question and cancel never changes the original or composer", async () => {
  window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
  const user = userEvent.setup();
  const { question, mutations } = installEditApi({ totalPages: 21 });
  const original = question.body;
  render(React.createElement(KnowledgeCenter, { apiBase }));
  await screen.findByText(question.title, { selector: "strong" });
  await user.click(questionRow(1));
  const detail = await screen.findByTestId("inline-question-detail");
  await user.click(within(detail).getByRole("button", { name: "질문 수정" }));
  const editor = screen.getByTestId("question-editor");
  assert.ok(detail.contains(editor));
  const selectedItem = questionRow(1).parentElement;
  assert.ok(selectedItem.contains(editor));
  assert.ok(selectedItem.compareDocumentPosition(screen.getByTestId("mobile-pagination")) & Node.DOCUMENT_POSITION_FOLLOWING);
  assert.equal(screen.getAllByTestId("question-editor").length, 1);
  await user.type(within(editor).getByLabelText("현재 비밀번호"), "current-password");
  await act(async () => turnstileCallback("test-only-token"));
  await user.click(within(editor).getByRole("button", { name: "비밀번호 확인" }));
  await within(editor).findByLabelText("수정 질문 내용");
  await user.type(within(editor).getByLabelText("수정 질문 내용"), "취소할 변경");
  await user.click(within(editor).getByRole("button", { name: "취소" }));
  assert.equal(screen.queryByTestId("question-editor"), null);
  assert.equal(question.body, original);
  assert.equal(screen.getByLabelText("질문 내용").value, "");
  assert.equal(mutations.filter(request => request.method === "PATCH").length, 0);
});

test("mobile edit placement uses the viewport at the tap, not a stale responsive snapshot", async () => {
  let narrowViewport = false;
  window.matchMedia = () => ({ matches: narrowViewport, addEventListener() {}, removeEventListener() {} });
  const user = userEvent.setup();
  const { question } = installEditApi({ totalPages: 21 });
  render(React.createElement(KnowledgeCenter, { apiBase }));
  await screen.findByText(question.title, { selector: "strong" });
  await user.click(questionRow(1));
  const inlineDetail = await screen.findByTestId("inline-question-detail");

  // Model a phone whose layout viewport changed without a matchMedia change
  // event reaching the component before the user taps the edit control.
  narrowViewport = true;
  await user.click(within(inlineDetail).getByRole("button", { name: "질문 수정" }));

  const editor = screen.getByTestId("question-editor");
  assert.ok(inlineDetail.contains(editor));
  assert.ok(questionRow(1).parentElement.contains(editor));
  assert.ok(questionRow(1).parentElement.compareDocumentPosition(screen.getByTestId("mobile-pagination")) & Node.DOCUMENT_POSITION_FOLLOWING);
  assert.equal(screen.getAllByTestId("question-editor").length, 1);
  assert.equal(screen.queryByLabelText("수정 제목"), null);
  assert.equal(screen.queryByLabelText("수정 질문 내용"), null);
  assert.equal(screen.getByLabelText("제목").value, "");
  assert.equal(screen.getByLabelText("질문 내용").value, "");
});

test("answered questions have no edit entry point", async () => {
  const user = userEvent.setup();
  const { question } = installEditApi({ answered: true });
  render(React.createElement(KnowledgeCenter, { apiBase }));
  await screen.findByText(question.title, { selector: "strong" });
  await user.click(questionRow(1));
  await screen.findByTestId("desktop-question-detail");
  assert.equal(screen.queryByRole("button", { name: "질문 수정" }), null);
  assert.equal(screen.queryByTestId("question-editor"), null);
});

test("visitor delete is only available after password confirmation and stays bound to the selected mobile question", async () => {
  window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
  const user = userEvent.setup();
  const { question, mutations } = installEditApi();
  let confirmCalls = 0;
  window.confirm = (message) => { confirmCalls++; assert.match(message, /삭제하시겠습니까/u); assert.match(message, /복구할 수 없습니다/u); return false; };
  render(React.createElement(KnowledgeCenter, { apiBase }));
  await screen.findByText(question.title, { selector: "strong" });
  await user.type(screen.getByLabelText("제목"), "새 질문 초안은 유지");
  await user.click(questionRow(1));
  const detail = await screen.findByTestId("inline-question-detail");
  const item = questionRow(1).parentElement;
  await user.click(within(detail).getByRole("button", { name: "질문 수정" }));
  const editor = screen.getByTestId("question-editor");
  assert.ok(item.contains(editor));
  assert.equal(within(editor).queryByRole("button", { name: "질문 삭제" }), null);
  assert.equal(screen.queryByRole("button", { name: "질문 삭제" }), null);

  await user.type(within(editor).getByLabelText("현재 비밀번호"), "current-password");
  await act(async () => turnstileCallback("verify-token"));
  await user.click(within(editor).getByRole("button", { name: "비밀번호 확인" }));
  await within(editor).findByLabelText("수정 제목");
  const deleteButton = within(editor).getByRole("button", { name: "질문 삭제" });
  assert.ok(item.contains(deleteButton));

  await act(async () => turnstileCallback("delete-token-cancel"));
  await user.click(deleteButton);
  assert.equal(confirmCalls, 1);
  assert.equal(mutations.some(request => request.method === "DELETE"), false);
  assert.equal(screen.getByTestId("question-editor"), editor);
  assert.equal(question.title, "질문 1");

  window.confirm = () => true;
  await act(async () => turnstileCallback("delete-token-success"));
  await user.click(within(editor).getByRole("button", { name: "질문 삭제" }));
  await waitFor(() => assert.equal(screen.queryByTestId("question-editor"), null));
  const deletion = mutations.find(request => request.method === "DELETE");
  assert.equal(deletion.url, `${apiBase}/questions/${question.id}`);
  assert.equal(deletion.body.password, "current-password");
  assert.equal(deletion.body.turnstile_token, "delete-token-success");
  assert.equal(mutations.some(request => request.url === `${apiBase}/questions`), false);
  assert.equal(screen.getByLabelText("제목").value, "새 질문 초안은 유지");
  assert.equal(screen.getByRole("status").textContent, "질문을 삭제했습니다.");
  assert.equal(screen.queryByText(question.title, { selector: "strong" }), null);
});

test("selected question detail is inserted directly below its list item and moves with a new selection", async () => {
  const user = userEvent.setup();
  installPaginatedApi();
  render(React.createElement(KnowledgeCenter, { apiBase }));
  await screen.findByText("질문 1", { selector: "strong" });
  const first = questionRow(1);
  assert.equal(first.parentElement.querySelector("a")?.getAttribute("href"), "/knowledge/00000000-0000-4000-8000-000000000001/");
  await user.click(first);
  const firstDetail = await screen.findByTestId("inline-question-detail");
  assert.equal(first.parentElement.children[1], firstDetail);
  assert.match(firstDetail.textContent, /질문 본문 1/);
  assert.match(firstDetail.textContent, /답변 전 수정 가능/);
  assert.match(firstDetail.textContent, /주휴수당 계산기/);

  const second = questionRow(2);
  await user.click(second);
  const secondDetail = screen.getByTestId("inline-question-detail");
  assert.equal(second.parentElement.children[1], secondDetail);
  assert.match(secondDetail.textContent, /공식 답변 2/);
  assert.match(secondDetail.textContent, /공식답변 후 수정 잠금/);
  assert.equal(screen.getAllByTestId("inline-question-detail").length, 1);
});

test("home latest question title is a permanent detail anchor", async () => {
  globalThis.fetch = async () => jsonResponse(200, { ok: true, data: { items: [{
    id: "5e0221de-67a8-47ec-9211-7d28b8614dba", title: "홈 최신 질문", isAnonymous: true,
    nickname: null, answer: { body: "공식답변" },
  }] } });
  render(React.createElement(KnowledgeLatestQuestions, { apiBase }));
  const link = await screen.findByRole("link", { name: /홈 최신 질문/u });
  assert.equal(link.getAttribute("href"), "/knowledge/5e0221de-67a8-47ec-9211-7d28b8614dba/");
});

test("clicking the selected question again collapses it, while selecting another replaces the detail", async () => {
  const user = userEvent.setup();
  installPaginatedApi();
  render(React.createElement(KnowledgeCenter, { apiBase }));
  await screen.findByText("질문 1", { selector: "strong" });
  const first = questionRow(1);
  const second = questionRow(2);

  await user.click(first);
  await screen.findByTestId("inline-question-detail");
  assert.equal(first.getAttribute("aria-expanded"), "true");

  await user.click(first);
  assert.equal(screen.queryByTestId("inline-question-detail"), null);
  assert.equal(screen.queryByTestId("desktop-question-detail"), null);
  assert.equal(first.getAttribute("aria-expanded"), "false");

  await user.click(first);
  await screen.findByTestId("inline-question-detail");
  await user.click(second);
  const secondDetail = await screen.findByTestId("inline-question-detail");
  assert.equal(second.parentElement.children[1], secondDetail);
  assert.match(screen.getByTestId("desktop-question-detail").textContent, /질문 2/u);
  assert.equal(first.getAttribute("aria-expanded"), "false");
  assert.equal(second.getAttribute("aria-expanded"), "true");

  await user.click(second);
  assert.equal(screen.queryByTestId("inline-question-detail"), null);
  assert.equal(screen.queryByTestId("desktop-question-detail"), null);
  assert.equal(second.getAttribute("aria-expanded"), "false");
});

test("pagination keeps numeric buttons compact, offers mobile summary, and clears selected detail on page change", async () => {
  const user = userEvent.setup();
  installPaginatedApi();
  render(React.createElement(KnowledgeCenter, { apiBase }));
  await screen.findByText("질문 1", { selector: "strong" });
  const desktop = screen.getByTestId("desktop-pagination");
  const mobile = screen.getByTestId("mobile-pagination");
  const mobilePageText = () => mobile.querySelector("[aria-live]").textContent;
  const mobileButton = (label) => Array.from(mobile.querySelectorAll("button")).find((button) => button.textContent === label);
  const desktopLabels = () => Array.from(desktop.children, (element) => element.textContent).join(" ");
  assert.equal(mobilePageText(), "1 / 21");
  assert.equal(mobileButton("이전").disabled, true);
  assert(screen.getAllByRole("button", { name: /\d+페이지/u }).length < 8);

  await user.click(questionRow(1));
  await screen.findByTestId("inline-question-detail");
  await user.click(mobileButton("다음"));
  await waitFor(() => assert.equal(mobilePageText(), "2 / 21"));
  assert.equal(screen.queryByTestId("inline-question-detail"), null);

  for (let page = 3; page <= 11; page++) {
    await user.click(mobileButton("다음"));
    await waitFor(() => assert.equal(mobilePageText(), `${page} / 21`));
  }
  assert.match(desktopLabels(), /1 … 9 10 11 12 13 … 21/u);
  await user.click(desktop.querySelector('button[aria-label="21페이지"]'));
  await waitFor(() => assert.equal(mobilePageText(), "21 / 21"));
  assert.equal(mobileButton("다음").disabled, true);
  assert.match(desktopLabels(), /1 … 19 20 21/u);
});

test("server search combines with category, resets pagination and selection, and clears only the query", async () => {
  const user = userEvent.setup();
  const requests = [];
  const makeItems = (page, category = "") => Array.from({ length: page === 3 ? 3 : 10 }, (_, offset) => {
    const number = (page - 1) * 10 + offset + 1;
    return { id: `00000000-0000-4000-8000-${String(number).padStart(12, "0")}`, title: `질문 ${number}`, body: `본문 ${number}`, category: category || "근로·고용", isAnonymous: true, nickname: null, status: "published", createdAt: "2026-10-01T01:09:16.929Z", updatedAt: "2026-10-01T01:09:16.929Z", answer: null, relatedServices: [] };
  });
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.endsWith("/services")) return jsonResponse(200, { ok: true, data: { items: [] } });
    const parsed = new URL(url);
    if (parsed.pathname.endsWith("/questions")) {
      const params = parsed.searchParams;
      requests.push({ q: params.get("q"), category: params.get("category"), page: Number(params.get("page")) });
      const q = params.get("q") || "";
      const category = params.get("category") || "";
      if (q === "no-match") return jsonResponse(200, { ok: true, data: { items: [], page: 1, page_size: 10, total: 0, total_pages: 1 } });
      if (q === "needle") return jsonResponse(200, { ok: true, data: { items: [makeItems(params.get("page") === "1" ? 1 : 2, category)[0]], page: Number(params.get("page")), page_size: 10, total: category ? 12 : 21, total_pages: category ? 2 : 3 } });
      return jsonResponse(200, { ok: true, data: { items: makeItems(Number(params.get("page")), category), page: Number(params.get("page")), page_size: 10, total: category ? 25 : 23, total_pages: category ? 3 : 3 } });
    }
    const id = decodeURIComponent(parsed.pathname).match(/\/questions\/([0-9a-f-]{36})$/)?.[1];
    if (id) return jsonResponse(200, { ok: true, data: { question: { id, title: "질문 상세", body: "상세 본문", isAnonymous: true, nickname: null, createdAt: "2026-10-01T01:09:16.929Z", answer: null, relatedServices: [] } } });
    throw new Error(`Unexpected request: ${url}`);
  };

  render(React.createElement(KnowledgeCenter, { apiBase }));
  await screen.findByText("질문 1", { selector: "strong" });
  await user.click(questionRow(1));
  await screen.findByTestId("inline-question-detail");
  const search = screen.getByPlaceholderText("질문 제목이나 내용 검색");
  await user.type(search, "needle");
  await user.keyboard("{Enter}");
  await waitFor(() => assert.equal(requests.at(-1).q, "needle"));
  assert.equal(requests.at(-1).page, 1);
  assert.equal(screen.queryByTestId("inline-question-detail"), null);
  assert.match(screen.getByText("검색 결과 21건").textContent, /21건/u);

  await user.selectOptions(screen.getByLabelText("카테고리 필터"), "금융");
  await waitFor(() => assert.deepEqual(requests.at(-1), { q: "needle", category: "금융", page: 1 }));
  await screen.findByText("검색 결과 12건");
  assert.equal(screen.queryByTestId("inline-question-detail"), null);
  await screen.findByText("질문 1", { selector: "strong" });
  await user.click(questionRow(1));
  await screen.findByTestId("inline-question-detail");
  const mobileNext = screen.getByTestId("mobile-pagination").querySelectorAll("button")[1];
  await user.click(mobileNext);
  await waitFor(() => assert.deepEqual(requests.at(-1), { q: "needle", category: "금융", page: 2 }));
  assert.equal(screen.queryByTestId("inline-question-detail"), null);
  await user.click(screen.getByRole("button", { name: "검색어 지우기" }));
  await waitFor(() => assert.deepEqual(requests.at(-1), { q: null, category: "금융", page: 1 }));

  await user.type(search, "no-match");
  await user.click(screen.getByRole("button", { name: "검색" }));
  await screen.findByText("검색 결과가 없습니다.");
  assert.deepEqual(requests.at(-1), { q: "no-match", category: "금융", page: 1 });
  assert.ok(screen.getByLabelText("카테고리 필터"));
  assert.equal(screen.getByPlaceholderText("질문 제목이나 내용 검색").value, "no-match");
});
