import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});

Object.defineProperties(globalThis, {
  window: { value: dom.window, configurable: true },
  document: { value: dom.window.document, configurable: true },
  navigator: { value: dom.window.navigator, configurable: true },
  HTMLElement: { value: dom.window.HTMLElement, configurable: true },
  HTMLInputElement: { value: dom.window.HTMLInputElement, configurable: true },
  Node: { value: dom.window.Node, configurable: true },
  DOMException: { value: dom.window.DOMException, configurable: true },
  getComputedStyle: {
    value: dom.window.getComputedStyle.bind(dom.window),
    configurable: true,
  },
  IS_REACT_ACT_ENVIRONMENT: {
    value: true,
    configurable: true,
    writable: true,
  },
});

const { cleanup, render, screen, within } = await import(
  "@testing-library/react"
);
const userEvent = (await import("@testing-library/user-event")).default;
const { VatProfitCalculator } = await import(
  "../components/calculators/VatProfitCalculator.tsx"
);
const React = await import("react");

afterEach(() => {
  cleanup();
});

async function replaceValue(user, label, value) {
  const input = screen.getByLabelText(label);
  await user.clear(input);

  if (value !== "") {
    await user.type(input, value);
  }
}

test("공급가액 기준 입력과 계산 결과를 유지한다", async () => {
  const user = userEvent.setup();
  render(React.createElement(VatProfitCalculator));

  await replaceValue(user, "매출 공급가액", "1000000");
  await replaceValue(user, "공제할 매입세액", "30000");
  await user.click(screen.getByRole("button", { name: "부가세 계산하기" }));

  const result = screen.getByRole("region", { name: "부가세 계산 결과" });
  assert.ok(within(result).getByText("70,000원"));
  assert.ok(within(result).getByText("1,000,000원"));
  assert.ok(within(result).getByText("100,000원"));
});

test("합계금액 전환 뒤 실제 입력 이벤트가 값을 유지하고 정상 계산한다", async () => {
  const user = userEvent.setup();
  render(React.createElement(VatProfitCalculator));

  await user.click(screen.getByRole("button", { name: "합계금액" }));
  const salesAmount = screen.getByLabelText("매출 합계금액");
  await replaceValue(user, "매출 합계금액", "1100000");
  await replaceValue(user, "공제할 매입세액", "30000");

  assert.equal(salesAmount.value, "1100000");
  assert.equal(screen.getByLabelText("공제할 매입세액").value, "30000");

  await user.click(screen.getByRole("button", { name: "부가세 계산하기" }));

  const result = screen.getByRole("region", { name: "부가세 계산 결과" });
  assert.ok(within(result).getByText("70,000원"));
  assert.ok(within(result).getByText("1,000,000원"));
  assert.ok(within(result).getByText("100,000원"));
});

test("기준 전환·연속 입력·초기화 후 합계금액 재입력이 가능하다", async () => {
  const user = userEvent.setup();
  render(React.createElement(VatProfitCalculator));

  await user.click(screen.getByRole("button", { name: "합계금액" }));
  await replaceValue(user, "매출 합계금액", "1000000");
  await replaceValue(user, "매출 합계금액", "1100000");
  await replaceValue(user, "매출 합계금액", "");
  await replaceValue(user, "매출 합계금액", "1100000");
  assert.equal(screen.getByLabelText("매출 합계금액").value, "1100000");

  await user.click(screen.getByRole("button", { name: "공급가액" }));
  assert.ok(screen.getByLabelText("매출 공급가액"));
  await user.click(screen.getByRole("button", { name: "합계금액" }));
  assert.ok(screen.getByLabelText("매출 합계금액"));

  await user.click(screen.getByRole("button", { name: "다시 계산" }));
  assert.equal(screen.getByLabelText("매출 공급가액").value, "1000000");
  assert.equal(screen.getByLabelText("공제할 매입세액").value, "30000");

  await user.click(screen.getByRole("button", { name: "합계금액" }));
  await replaceValue(user, "매출 합계금액", "1100000");
  assert.equal(screen.getByLabelText("매출 합계금액").value, "1100000");
});
