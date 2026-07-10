import assert from "node:assert/strict";
import { afterEach, before, test } from "node:test";
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

const { act, cleanup, render, screen, within } = await import(
  "@testing-library/react"
);
const userEvent = (await import("@testing-library/user-event")).default;
const { LaborPayCalculator } = await import(
  "../components/calculators/LaborPayCalculator.tsx"
);
const React = await import("react");

before(() => {
  globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
});

afterEach(() => {
  cleanup();
  delete navigator.clipboard;
  delete navigator.share;
});

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
}

test("기본 입력 필드와 월 환산 선택을 표시한다", async () => {
  render(React.createElement(LaborPayCalculator));
  await settleMount();

  assert.equal(screen.getByLabelText("시급").value, "10320");
  assert.equal(screen.getByLabelText("1주 소정근로시간").value, "40");
  assert.equal(screen.getByLabelText("1주 실제 근로시간").value, "40");
  assert.ok(screen.getByRole("button", { name: "2026 최저임금 적용" }));
  assert.ok(screen.getByLabelText("월 환산 표시"));
  assert.equal(
    screen.getByRole("button", { name: "개근" }).getAttribute("aria-pressed"),
    "false",
  );
});

test("정상 입력을 계산해 결과 요약과 상세 계산 내역을 표시한다", async () => {
  const user = userEvent.setup();
  render(React.createElement(LaborPayCalculator));

  await replaceValue(user, "시급", "10320");
  await replaceValue(user, "1주 소정근로시간", "20");
  await replaceValue(user, "1주 실제 근로시간", "20");
  await user.click(screen.getByRole("button", { name: "개근" }));
  await user.click(screen.getByRole("button", { name: "주휴수당 계산하기" }));

  const result = screen.getByRole("region", { name: "주휴수당 계산 결과" });
  assert.ok(within(result).getByText("지급 대상"));
  assert.ok(within(result).getByText("41,280원"));
  assert.ok(within(result).getByText("4시간"));
  assert.ok(within(result).getByText("주휴시간 계산식"));
});

test("필수값 누락과 음수 입력 오류를 필드별로 표시한다", async () => {
  const user = userEvent.setup();
  render(React.createElement(LaborPayCalculator));

  await replaceValue(user, "시급", "");
  await replaceValue(user, "1주 실제 근로시간", "-1");
  await user.click(screen.getByRole("button", { name: "주휴수당 계산하기" }));

  assert.ok(screen.getByText("시급 값을 숫자로 입력해 주세요."));
  assert.ok(screen.getByText("실제 근로시간은 0 이상으로 입력해 주세요."));
  assert.ok(screen.getByText("소정근로일 개근 여부를 선택해 주세요."));
  assert.equal(screen.getByLabelText("시급").getAttribute("aria-invalid"), "true");
});

test("개근 아님 선택과 다시 계산 버튼이 동작한다", async () => {
  const user = userEvent.setup();
  render(React.createElement(LaborPayCalculator));

  await user.click(screen.getByRole("button", { name: "개근 아님" }));
  await user.click(screen.getByRole("button", { name: "주휴수당 계산하기" }));

  assert.ok(screen.getByText("지급 대상 아님"));
  assert.ok(screen.getByText("0원"));

  await user.click(screen.getByRole("button", { name: "다시 계산" }));
  assert.equal(screen.queryByText("지급 대상 아님"), null);
});

test("결과 복사와 공유 fallback이 동작한다", async () => {
  const user = userEvent.setup();
  const writes = [];
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: async (text) => writes.push(text) },
    configurable: true,
  });

  render(React.createElement(LaborPayCalculator));
  await user.click(screen.getByRole("button", { name: "개근" }));
  await user.click(screen.getByRole("button", { name: "주휴수당 계산하기" }));
  await user.click(screen.getByRole("button", { name: "결과 복사" }));

  assert.match(writes.at(-1), /주휴수당 계산 결과/);
  assert.ok(screen.getByText("계산 결과를 복사했습니다."));

  await user.click(screen.getByRole("button", { name: "공유" }));
  assert.match(writes.at(-1), /예상 주휴수당/);
});

test("Web Share 지원 환경에서는 native share를 호출한다", async () => {
  const user = userEvent.setup();
  const shares = [];
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: async () => assert.fail("clipboard fallback should not run") },
    configurable: true,
  });
  Object.defineProperty(navigator, "share", {
    value: async (payload) => shares.push(payload),
    configurable: true,
  });

  render(React.createElement(LaborPayCalculator));
  await user.click(screen.getByRole("button", { name: "개근" }));
  await user.click(screen.getByRole("button", { name: "주휴수당 계산하기" }));
  await user.click(screen.getByRole("button", { name: "공유" }));

  assert.equal(shares.length, 1);
  assert.equal(shares[0].title, "주휴수당 계산 결과");
  assert.match(shares[0].text, /예상 주휴수당/);
  assert.ok(screen.getByText("공유 창을 열었습니다."));
});

test("입력 수정 후 재계산하면 최신 결과로 갱신한다", async () => {
  const user = userEvent.setup();
  render(React.createElement(LaborPayCalculator));

  await replaceValue(user, "1주 소정근로시간", "20");
  await replaceValue(user, "1주 실제 근로시간", "20");
  await user.click(screen.getByRole("button", { name: "개근" }));
  await user.click(screen.getByRole("button", { name: "주휴수당 계산하기" }));
  assert.ok(screen.getByText("41,280원"));

  await replaceValue(user, "1주 소정근로시간", "40");
  assert.ok(
    screen.getByText("입력값이 바뀌었습니다. 다시 계산하면 최신 결과로 갱신됩니다."),
  );

  await user.click(screen.getByRole("button", { name: "주휴수당 계산하기" }));
  assert.ok(screen.getByText("82,560원"));
  assert.equal(
    screen.queryByText("입력값이 바뀌었습니다. 다시 계산하면 최신 결과로 갱신됩니다."),
    null,
  );
});

test("클립보드 실패 시 짧은 실패 안내를 표시한다", async () => {
  const user = userEvent.setup();
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: async () => Promise.reject(new Error("denied")) },
    configurable: true,
  });

  render(React.createElement(LaborPayCalculator));
  await user.click(screen.getByRole("button", { name: "개근" }));
  await user.click(screen.getByRole("button", { name: "주휴수당 계산하기" }));
  await user.click(screen.getByRole("button", { name: "결과 복사" }));

  assert.ok(
    screen.getByText("클립보드 복사에 실패했습니다. 브라우저 권한을 확인해 주세요."),
  );
  assert.equal(screen.queryByText("주휴수당 계산 결과"), null);
});
