import assert from "node:assert/strict";
import { afterEach, before, beforeEach, test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/calculators/roas",
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

const { act, cleanup, render, screen, waitFor, within } = await import(
  "@testing-library/react"
);
const userEvent = (await import("@testing-library/user-event")).default;
const { RoasCalculator } = await import(
  "../components/calculators/RoasCalculator.tsx"
);
const React = await import("react");

before(() => {
  globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  delete window.localStorage.getItem;
  delete window.localStorage.setItem;
  delete window.localStorage.removeItem;
  delete navigator.clipboard;
  delete navigator.share;
  delete document.execCommand;
});

beforeEach(() => {
  window.localStorage.clear();
});

function renderCalculator() {
  render(React.createElement(RoasCalculator));
}

async function settleMount() {
  await act(async () => {
    await Promise.resolve();
  });
}

async function replaceValue(user, label, value) {
  const input = screen.getByLabelText(label);
  await user.clear(input);

  if (value !== "") {
    await user.type(input, value);
  }

  return input;
}

async function enterBaseInput(user) {
  await replaceValue(user, "광고비", "100000");
  await replaceValue(user, "광고 매출", "500000");
}

test("ROAS 입력 필드와 계산 전 안내를 표시한다", async () => {
  renderCalculator();
  await settleMount();

  for (const label of [
    "광고비",
    "광고 매출",
    "상품 원가 (선택)",
    "기타 비용 (선택)",
    "목표 ROAS (선택)",
  ]) {
    assert.ok(screen.getByLabelText(label));
  }

  assert.ok(screen.getByRole("button", { name: "계산하기" }));
  assert.ok(screen.getByRole("button", { name: "다시 계산" }));
  assert.ok(screen.getByText("입력값을 입력한 후 계산해 주세요."));
});

test("필수값 누락과 광고비 0원 오류를 사용자 문구로 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();

  await user.click(screen.getByRole("button", { name: "계산하기" }));
  assert.ok(screen.getByText("광고비를 입력해주세요."));
  assert.ok(screen.getByText("광고 매출을 입력해주세요."));
  assert.equal(screen.getByLabelText("광고비").getAttribute("aria-invalid"), "true");

  await replaceValue(user, "광고비", "0");
  await replaceValue(user, "광고 매출", "1000");
  await user.click(screen.getByRole("button", { name: "계산하기" }));

  assert.ok(screen.getByText("광고비는 0보다 커야 합니다."));
  assert.ok(
    screen.getByText("광고비는 0보다 커야 ROAS를 계산할 수 있습니다."),
  );
});

test("음수와 숫자가 아닌 입력 오류를 필드별로 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();

  await replaceValue(user, "광고비", "-1");
  await replaceValue(user, "광고 매출", "-1");
  await replaceValue(user, "상품 원가 (선택)", "-1");
  await replaceValue(user, "기타 비용 (선택)", "-1");
  await replaceValue(user, "목표 ROAS (선택)", "0");
  await user.click(screen.getByRole("button", { name: "계산하기" }));

  assert.ok(screen.getByText("광고비는 음수로 입력할 수 없습니다."));
  assert.ok(screen.getByText("광고 매출은 음수로 입력할 수 없습니다."));
  assert.ok(screen.getByText("상품 원가는 음수로 입력할 수 없습니다."));
  assert.ok(screen.getByText("기타 비용은 음수로 입력할 수 없습니다."));
  assert.ok(screen.getByText("목표 ROAS는 0보다 커야 합니다."));

  await replaceValue(user, "광고비", "abc");
  await user.click(screen.getByRole("button", { name: "계산하기" }));
  assert.ok(screen.getByText("광고비는 숫자로 입력해주세요."));
});

test("정상 입력 후 오류가 사라지고 ROAS 500%를 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();

  await user.click(screen.getByRole("button", { name: "계산하기" }));
  assert.ok(screen.getByText("광고비를 입력해주세요."));

  await enterBaseInput(user);
  await user.click(screen.getByRole("button", { name: "계산하기" }));

  assert.equal(screen.queryByRole("alert"), null);
  assert.ok(screen.getByText("500%"));
});

test("광고 매출 0원은 ROAS 0%와 계산 불가 항목을 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();

  await replaceValue(user, "광고비", "100000");
  await replaceValue(user, "광고 매출", "0");
  await user.click(screen.getByRole("button", { name: "계산하기" }));

  const result = screen.getByRole("region", { name: "ROAS와 손익" });
  assert.ok(within(result).getByText("0%"));
  assert.ok(within(result).getAllByText("계산 불가").length >= 3);
});

test("원가와 기타 비용을 반영해 순이익, 공헌이익률, 손익분기 ROAS를 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();

  await enterBaseInput(user);
  await replaceValue(user, "상품 원가 (선택)", "250000");
  await replaceValue(user, "기타 비용 (선택)", "50000");
  await user.click(screen.getByRole("button", { name: "계산하기" }));

  const result = screen.getByRole("region", { name: "ROAS와 손익" });
  assert.ok(within(result).getAllByText("100,000원").length >= 1);
  assert.ok(within(result).getByText("40%"));
  assert.ok(within(result).getByText("250%"));
});

test("목표 ROAS 달성 여부와 미달을 각각 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();

  await enterBaseInput(user);
  await replaceValue(user, "목표 ROAS (선택)", "400");
  await user.click(screen.getByRole("button", { name: "계산하기" }));
  assert.ok(screen.getAllByText("목표 달성").length >= 1);

  await replaceValue(user, "목표 ROAS (선택)", "600");
  await user.click(screen.getByRole("button", { name: "계산하기" }));
  assert.ok(screen.getAllByText("목표 미달").length >= 1);
});

test("계산 결과를 복사하고 Web Share 지원 환경에서 공유한다", async () => {
  let copiedText = "";
  let sharedData;
  const user = userEvent.setup();

  Object.defineProperty(navigator, "clipboard", {
    value: {
      writeText: async (text) => {
        copiedText = text;
      },
    },
    configurable: true,
  });
  Object.defineProperty(navigator, "share", {
    value: async (data) => {
      sharedData = data;
    },
    configurable: true,
  });
  renderCalculator();
  await enterBaseInput(user);
  await user.click(screen.getByRole("button", { name: "계산하기" }));

  await waitFor(() => {
    assert.ok(screen.getByRole("button", { name: "공유" }));
  });

  await user.click(screen.getByRole("button", { name: "결과 복사" }));
  assert.match(copiedText, /ROAS: 500%/);
  assert.ok(screen.getByText("계산 결과를 복사했습니다."));

  await user.click(screen.getByRole("button", { name: "공유" }));
  assert.equal(sharedData.title, "ROAS 계산 결과");
  assert.match(sharedData.text, /ROAS: 500%/);
  assert.equal(sharedData.url, "http://localhost/calculators/roas");
  assert.ok(screen.getByText("계산 결과를 공유했습니다."));
});

test("다시 계산은 입력, 오류, 결과를 초기화한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterBaseInput(user);
  await user.click(screen.getByRole("button", { name: "계산하기" }));

  await user.click(screen.getByRole("button", { name: "다시 계산" }));

  assert.equal(screen.getByLabelText("광고비").value, "");
  assert.equal(screen.getByLabelText("광고 매출").value, "");
  assert.equal(screen.getByLabelText("상품 원가 (선택)").value, "0");
  assert.equal(screen.queryByText("500%"), null);
  assert.equal(screen.queryByRole("alert"), null);
  assert.equal(document.activeElement, screen.getByLabelText("광고비"));
});
