import assert from "node:assert/strict";
import { afterEach, before, test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
Object.defineProperties(globalThis, { window: { value: dom.window, configurable: true }, document: { value: dom.window.document, configurable: true }, navigator: { value: dom.window.navigator, configurable: true }, HTMLElement: { value: dom.window.HTMLElement, configurable: true }, HTMLInputElement: { value: dom.window.HTMLInputElement, configurable: true }, Node: { value: dom.window.Node, configurable: true }, IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true, writable: true } });
const { cleanup, render, screen } = await import("@testing-library/react");
const userEvent = (await import("@testing-library/user-event")).default;
const React = await import("react");
const { WithholdingTaxCalculator } = await import("../components/calculators/WithholdingTaxCalculator.tsx");
before(() => { globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0); });
afterEach(cleanup);

test("세전 계산 결과에 세목별 금액을 표시하고 초기화한다", async () => {
  const user = userEvent.setup(); render(React.createElement(WithholdingTaxCalculator));
  await user.type(screen.getByLabelText("세전 지급액"), "1000000"); await user.click(screen.getByRole("button", { name: "계산하기" }));
  for (const value of ["1,000,000원", "30,000원", "3,000원", "33,000원", "967,000원"]) assert.ok(screen.getAllByText(value).length >= 1);
  await user.click(screen.getByRole("button", { name: "초기화" })); assert.equal(screen.getByLabelText("세전 지급액").value, ""); assert.ok(screen.getByText("예상 원천징수액을 확인해 보세요"));
});

test("계산 방향을 전환해 실수령액에서 세전 금액을 역산한다", async () => {
  const user = userEvent.setup(); render(React.createElement(WithholdingTaxCalculator));
  await user.click(screen.getByRole("button", { name: "실수령액 → 세전" })); await user.type(screen.getByLabelText("원하는 실수령액"), "967000"); await user.click(screen.getByRole("button", { name: "계산하기" }));
  assert.ok(screen.getAllByText("1,000,000원").length >= 1); assert.ok(screen.getByText("3.3% 역산 기준부터 끝수 처리까지 다시 계산한 금액"));
});

test("빈값과 소수 금액을 오류로 안내한다", async () => {
  const user = userEvent.setup(); render(React.createElement(WithholdingTaxCalculator)); await user.click(screen.getByRole("button", { name: "계산하기" })); assert.ok(screen.getByRole("alert"));
  await user.type(screen.getByLabelText("세전 지급액"), "1.5"); await user.click(screen.getByRole("button", { name: "계산하기" })); assert.match(screen.getByRole("alert").textContent, /정수/);
});
