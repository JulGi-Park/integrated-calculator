import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/calculators/rent-conversion-rate/" });
Object.defineProperties(globalThis, {
  window: { value: dom.window, configurable: true }, document: { value: dom.window.document, configurable: true }, navigator: { value: dom.window.navigator, configurable: true }, HTMLElement: { value: dom.window.HTMLElement, configurable: true }, HTMLInputElement: { value: dom.window.HTMLInputElement, configurable: true }, Node: { value: dom.window.Node, configurable: true }, DOMException: { value: dom.window.DOMException, configurable: true }, getComputedStyle: { value: dom.window.getComputedStyle.bind(dom.window), configurable: true }, IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true, writable: true },
});
const { cleanup, render, screen } = await import("@testing-library/react");
const userEvent = (await import("@testing-library/user-event")).default;
const { RentConversionRateCalculator } = await import("../components/calculators/RentConversionRateCalculator.tsx");
const React = await import("react");
afterEach(cleanup);
function renderCalculator() { render(React.createElement(RentConversionRateCalculator)); }
async function setValue(user, label, value) { const input = screen.getByLabelText(label); await user.clear(input); await user.type(input, value); }

test("보증금 감소액을 월세로 환산하고 초기화한다", async () => {
  const user = userEvent.setup(); renderCalculator();
  await setValue(user, "감소한 보증금", "100000000"); await user.click(screen.getByRole("button", { name: "계산하기" }));
  assert.ok(screen.getByText("395,833원")); assert.ok(screen.getByText("4,750,000원"));
  await user.click(screen.getByRole("button", { name: "초기화" }));
  assert.equal(screen.getByLabelText("감소한 보증금").value, ""); assert.ok(screen.getByText("전환 조건을 입력해 주세요"));
});

test("월세와 실제 조건 모드를 각각 계산한다", async () => {
  const user = userEvent.setup(); renderCalculator();
  await user.click(screen.getByRole("button", { name: "월세 → 보증금" })); await setValue(user, "월세 증가액", "400000"); await user.click(screen.getByRole("button", { name: "계산하기" }));
  assert.ok(screen.getByText("101,052,632원"));
  await user.click(screen.getByRole("button", { name: "실제 전환율 확인" })); await setValue(user, "감소한 보증금", "100000000"); await setValue(user, "월세 증가액", "400000"); await user.click(screen.getByRole("button", { name: "계산하기" }));
  assert.ok(screen.getByText("4.8%")); assert.ok(screen.getByText(/0.05%p 높음/));
});
