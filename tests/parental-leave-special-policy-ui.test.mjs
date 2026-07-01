import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { afterEach, before, test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/calculators/parental-leave/",
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
const { ParentalLeaveCalculator } = await import(
  "../components/calculators/ParentalLeaveCalculator.tsx"
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

function renderCalculator() {
  render(React.createElement(ParentalLeaveCalculator));
}

async function enterBaseInputs(user, wage = "3000000", months = "6") {
  await user.type(screen.getByLabelText("월 통상임금"), wage);
  await user.type(screen.getByLabelText("육아휴직 사용 개월 수"), months);
}

async function chooseRadioInGroup(user, groupName, optionName) {
  const group = screen.getByRole("group", { name: groupName });
  await user.click(within(group).getByRole("radio", { name: optionName }));
}

test("특례 선택 UI는 최소 3개 상태와 접근성 구조를 제공한다", () => {
  renderCalculator();

  const policyGroup = screen.getByRole("group", { name: "특례 검토 방식" });
  assert.ok(within(policyGroup).getByRole("radio", { name: /일반 계산만 사용/ }));
  assert.ok(within(policyGroup).getByRole("radio", { name: /6\+6 특례 검토/ }));
  assert.ok(within(policyGroup).getByRole("radio", { name: /한부모 특례 검토/ }));
  assert.equal(
    within(policyGroup).getByRole("radio", { name: /일반 계산만 사용/ }).checked,
    true,
  );
});

test("일반 계산만 사용하면 기존 기본 계산 결과와 mapper 결과 카드가 유지된다", async () => {
  const user = userEvent.setup();
  renderCalculator();

  await enterBaseInputs(user, "3000000", "6");
  await user.click(screen.getByRole("button", { name: "육아휴직급여 계산하기" }));

  assert.ok(await screen.findByText("13,500,000원"));
  assert.ok(screen.getByText("일반 육아휴직급여 예상 계산 · 확정 지급액이 아닌 예상값"));
  assert.ok(screen.getAllByText("일반 육아휴직급여").length >= 1);
  assert.ok(screen.getByText(/특례 조건을 선택하지 않았거나 입력되지 않았습니다/));
  assert.equal(screen.queryByText("보완 입력"), null);
});

test("6+6 특례 입력 부족은 missingInputs 안내를 결과 카드에 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();

  await enterBaseInputs(user);
  await user.click(screen.getByRole("radio", { name: /6\+6 특례 검토/ }));
  await user.click(screen.getByRole("button", { name: "육아휴직급여 계산하기" }));

  assert.ok(await screen.findByText("보완 입력"));
  assert.ok(screen.getAllByText("자녀 월령").length >= 1);
  assert.ok(screen.getAllByText("배우자 육아휴직 사용 여부").length >= 1);
  assert.ok(screen.getByText("배우자 육아휴직 사용 개월 수"));
  assert.ok(screen.getAllByText("같은 자녀 기준 여부").length >= 1);
  assert.ok(screen.getByText(/특례 금액을 임의 추정하지 않고/));
  assert.ok(screen.getByText(/적용되지 않은 계산 방식/));
});

test("6+6 특례 적용 가능 결과는 월별 특례와 일반 fallback 구간을 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();

  await enterBaseInputs(user, "5000000", "7");
  await user.click(screen.getByRole("radio", { name: /6\+6 특례 검토/ }));
  await user.type(screen.getByLabelText("자녀 월령"), "18");
  await user.type(screen.getByLabelText("배우자 사용 개월 수"), "6");
  await chooseRadioInGroup(user, "배우자 육아휴직 사용 여부", "예");
  await chooseRadioInGroup(user, "같은 자녀 기준 여부", "예");
  await user.click(screen.getByRole("button", { name: "육아휴직급여 계산하기" }));

  assert.ok(await screen.findByText("21,600,000원"));
  assert.ok(screen.getAllByText("부모 함께 육아휴직제 6+6 특례").length >= 1);
  assert.ok(screen.getByText("일반 계산 fallback 구간"));
  assert.ok(screen.getByText("7개월차는 일반 육아휴직급여 기준 예상액으로 표시합니다."));
  assert.ok(screen.getAllByText(/부모 함께 육아휴직제 6\+6 특례 기준 예상액/).length >= 1);
});

test("한부모 특례 입력 부족과 적용 가능 결과를 mapper 카드로 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();

  await enterBaseInputs(user, "4000000", "4");
  await user.click(screen.getByRole("radio", { name: /한부모 특례 검토/ }));
  await user.click(screen.getByRole("button", { name: "육아휴직급여 계산하기" }));

  assert.ok((await screen.findAllByText("한부모 해당 여부")).length >= 1);
  assert.ok(screen.getByText(/보완해야 할 입력값/));

  await user.click(screen.getByRole("button", { name: "다시 계산" }));
  await enterBaseInputs(user, "4000000", "4");
  await user.click(screen.getByRole("radio", { name: /한부모 특례 검토/ }));
  await chooseRadioInGroup(user, "한부모 해당 여부", "예");
  await user.click(screen.getByRole("button", { name: "육아휴직급여 계산하기" }));

  assert.ok(await screen.findByText("11,000,000원"));
  assert.ok(screen.getAllByText("한부모 육아휴직 특례").length >= 1);
  assert.ok(screen.getByText("4개월차는 일반 육아휴직급여 기준 예상액으로 표시합니다."));
});

test("특례 UI와 결과 카드 소스에는 지급 확정 금지 표현이 없다", async () => {
  const source = await readFile(
    "components/calculators/ParentalLeaveCalculator.tsx",
    "utf8",
  );

  assert.doesNotMatch(
    source,
    /지급됩니다|확정 금액입니다|반드시 받을 수 있습니다|승인됩니다/,
  );
});
