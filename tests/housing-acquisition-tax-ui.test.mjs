import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/calculators/housing-acquisition-tax/",
});
Object.defineProperties(globalThis, {
  window: { value: dom.window, configurable: true },
  document: { value: dom.window.document, configurable: true },
  navigator: { value: dom.window.navigator, configurable: true },
  HTMLElement: { value: dom.window.HTMLElement, configurable: true },
  HTMLInputElement: { value: dom.window.HTMLInputElement, configurable: true },
  Node: { value: dom.window.Node, configurable: true },
  getComputedStyle: { value: dom.window.getComputedStyle.bind(dom.window), configurable: true },
  IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true, writable: true },
});

const { cleanup, render, screen } = await import("@testing-library/react");
const userEvent = (await import("@testing-library/user-event")).default;
const React = await import("react");
const { HousingAcquisitionTaxCalculator } = await import("../components/calculators/HousingAcquisitionTaxCalculator.tsx");

afterEach(() => cleanup());

test("UI는 금액 입력·중과 조건·세목별 결과를 표시한다", async () => {
  const user = userEvent.setup();
  render(React.createElement(HousingAcquisitionTaxCalculator));
  const price = screen.getByLabelText("취득가액");
  assert.equal(price.getAttribute("inputmode"), "numeric");
  await user.type(price, "1000000000");
  assert.equal(price.value, "1,000,000,000");
  await user.click(screen.getByRole("button", { name: "1주택" }));
  await user.click(screen.getByRole("button", { name: "조정대상지역" }));
  await user.click(screen.getByLabelText("전용면적이 85㎡를 초과합니다"));
  await user.click(screen.getByRole("button", { name: "취득세 계산하기" }));
  assert.ok(screen.getByText("90,000,000원"));
  assert.ok(screen.getByText("80,000,000원"));
  assert.ok(screen.getByText("4,000,000원"));
  assert.ok(screen.getByText("6,000,000원"));
  assert.ok(screen.getByText(/생애최초 취득세 감면/));
});

test("UI는 빈 취득가액을 오류로 안내하고 초기화한다", async () => {
  const user = userEvent.setup();
  render(React.createElement(HousingAcquisitionTaxCalculator));
  await user.click(screen.getByRole("button", { name: "취득세 계산하기" }));
  assert.ok(screen.getByRole("alert"));
  assert.ok(screen.getByText("취득가액을 입력해 주세요."));
  await user.click(screen.getByRole("button", { name: "초기화" }));
  assert.equal(screen.getByLabelText("취득가액").value, "");
  assert.equal(screen.queryByRole("alert"), null);
});
