import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/calculators/salary/",
});
Object.defineProperties(globalThis, {
  window: { value: dom.window, configurable: true },
  document: { value: dom.window.document, configurable: true },
  HTMLElement: { value: dom.window.HTMLElement, configurable: true },
});

const { render, screen, cleanup } = await import("@testing-library/react");
const { RatioBar } = await import("../components/ui/RatioBar.tsx");

test("급여 비율 막대는 실제 금액과 퍼센트를 접근 가능한 범례로 표시한다", () => {
  render(
    RatioBar({
      total: 3_000_000,
      value: 2_700_000,
      valueLabel: "실수령액",
      remainderLabel: "공제액",
      formatValue: (value) => `${value.toLocaleString("ko-KR")}원`,
    }),
  );

  const bar = screen.getByRole("img");
  assert.equal(bar.getAttribute("aria-label"), "실수령액 90%, 공제액 10%");
  assert.equal(bar.querySelector("span").style.width, "90%");
  assert.ok(screen.getByText("2,700,000원"));
  assert.ok(screen.getByText("300,000원"));
  cleanup();
});

test("0원이나 유효 범위 밖의 값은 비율 막대 대신 안내를 표시한다", () => {
  const { unmount } = render(
    RatioBar({ total: 0, value: 0, valueLabel: "실수령액", remainderLabel: "공제액" }),
  );
  assert.equal(screen.queryByRole("img"), null);
  assert.ok(screen.getByRole("note"));
  unmount();

  render(
    RatioBar({ total: 100, value: 101, valueLabel: "실수령액", remainderLabel: "공제액" }),
  );
  assert.equal(screen.queryByRole("img"), null);
  assert.ok(screen.getByRole("note"));
  cleanup();
});
