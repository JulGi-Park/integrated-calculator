import assert from "node:assert/strict";
import { afterEach, before, beforeEach, test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/calculators/dsr/",
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

const { act, cleanup, render, screen, waitFor } = await import("@testing-library/react");
const userEvent = (await import("@testing-library/user-event")).default;
const { DsrCalculator } = await import("../components/calculators/DsrCalculator.tsx");
const React = await import("react");

before(() => {
  globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
});

beforeEach(() => window.localStorage.clear());
afterEach(() => {
  cleanup();
  window.localStorage.clear();
  delete navigator.clipboard;
});

async function settleMount() {
  await act(async () => Promise.resolve());
}

async function replaceValue(user, label, value) {
  const field = screen.getByLabelText(label);
  await user.clear(field);
  await user.type(field, value);
}

test("DSR 공식 산정 입력과 결과 항목을 렌더링한다", async () => {
  render(React.createElement(DsrCalculator));
  await settleMount();
  assert.ok(screen.getByLabelText("신규 대출 종류"));
  assert.ok(screen.getByLabelText("기존 대출 연간 DSR 원리금"));
  assert.ok(screen.getByLabelText("금리상승 시나리오"));
  assert.ok(screen.getByRole("radio", { name: /일부 분할/ }));
  assert.ok(screen.getByText(/공식 정책 자동값이 아닙니다/));
});

test("신용대출 일시상환 P1 fixture를 UI에서 계산한다", async () => {
  const user = userEvent.setup();
  render(React.createElement(DsrCalculator));
  await settleMount();
  await user.selectOptions(screen.getByLabelText("신규 대출 종류"), "credit");
  await user.click(screen.getByRole("radio", { name: /만기일시/ }));
  await replaceValue(user, "연소득", "100000000");
  await replaceValue(user, "기존 대출 연간 DSR 원리금", "0");
  await replaceValue(user, "신규 대출 금액", "100000000");
  await replaceValue(user, "신규 대출 연 금리", "4.8");
  await replaceValue(user, "신규 대출 기간", "60");
  await user.click(screen.getByRole("button", { name: "DSR 계산" }));

  assert.equal(screen.getAllByText("24.8%").length, 2);
  assert.ok(screen.getByText("20,000,000원"));
  assert.equal(screen.getAllByText("4,800,000원").length, 2);
  assert.ok(screen.getAllByText("24,800,000원").length >= 1);
  assert.ok(screen.getByText("60개월"));
});

test("결과 복사와 초기화가 공식 산정 결과를 유지한다", async () => {
  let copiedText = "";
  const user = userEvent.setup();
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: async (value) => { copiedText = value; } },
    configurable: true,
  });
  render(React.createElement(DsrCalculator));
  await settleMount();
  await user.click(screen.getByRole("button", { name: "DSR 계산" }));
  await user.click(screen.getByRole("button", { name: "결과 복사" }));
  await waitFor(() => assert.match(copiedText, /DSR 산정 연간 원금/));
  assert.match(copiedText, /사용자 금리상승 시나리오/);

  await user.click(screen.getByRole("button", { name: "다시 계산" }));
  assert.ok(screen.getByText(/조건을 입력하면 일반 DSR/));
  assert.equal(screen.getByLabelText("신규 대출 종류").value, "mortgage");
});
