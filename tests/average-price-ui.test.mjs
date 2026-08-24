import assert from "node:assert/strict";
import { afterEach, before, beforeEach, test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/calculators/average-price/",
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

const { act, cleanup, render, screen } = await import("@testing-library/react");
const userEvent = (await import("@testing-library/user-event")).default;
const { AveragePriceCalculator } = await import("../components/calculators/AveragePriceCalculator.tsx");
const React = await import("react");

before(() => {
  globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
});

beforeEach(() => window.localStorage.clear());
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

async function settleMount() {
  await act(async () => Promise.resolve());
}

async function enter(user, id, value) {
  const field = document.getElementById(id);
  assert.ok(field, `${id} 입력 필드가 있어야 합니다.`);
  await user.clear(field);
  await user.type(field, value);
}

test("추가매수 전후와 현재가 기준 평균단가 도달 변화율을 표시한다", async () => {
  const user = userEvent.setup();
  render(React.createElement(AveragePriceCalculator));
  await settleMount();
  await enter(user, "currentQuantity", "10");
  await enter(user, "currentAveragePrice", "50000");
  await enter(user, "additionalQuantity", "10");
  await enter(user, "additionalPrice", "40000");
  await enter(user, "targetPrice", "40000");
  await user.click(screen.getByRole("button", { name: "계산하기" }));

  assert.ok(screen.getByText("45,000원"));
  assert.ok(screen.getByText("-5,000원 · -10%"));
  assert.ok(screen.getByText("500,000원", { exact: false }));
  assert.ok(screen.getByText("900,000원", { exact: false }));
  assert.ok(screen.getByText("25%"));
  assert.ok(screen.getByText("12.5%"));
  assert.ok(screen.getByText(/투자 권유나 특정 추가매수 조건의 추천이 아닙니다/));
});

test("사용자 입력 순서로 두 추가매수 시나리오를 비교한다", async () => {
  const user = userEvent.setup();
  render(React.createElement(AveragePriceCalculator));
  await settleMount();
  await enter(user, "currentQuantity", "10");
  await enter(user, "currentAveragePrice", "50000");
  await enter(user, "additionalQuantity", "5");
  await enter(user, "additionalPrice", "40000");
  await enter(user, "scenarioBQuantity", "10");
  await enter(user, "scenarioBPrice", "45000");
  await user.click(screen.getByRole("button", { name: "계산하기" }));

  assert.ok(screen.getByRole("columnheader", { name: "시나리오 A" }));
  assert.ok(screen.getByRole("columnheader", { name: "시나리오 B" }));
  assert.ok(screen.getAllByText("46,666.67원").length >= 1);
  assert.ok(screen.getByText("47,500원"));
  assert.ok(screen.getAllByText("200,000원").length >= 1);
  assert.ok(screen.getByText("450,000원"));
});
