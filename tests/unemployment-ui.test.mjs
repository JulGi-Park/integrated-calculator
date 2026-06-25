import assert from "node:assert/strict";
import { afterEach, before, test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/calculators/unemployment/",
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

const { cleanup, render, screen } = await import("@testing-library/react");
const userEvent = (await import("@testing-library/user-event")).default;
const { UnemploymentCalculator } = await import(
  "../components/calculators/UnemploymentCalculator.tsx"
);
const React = await import("react");

before(() => {
  globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
});

afterEach(() => {
  cleanup();
});

function renderCalculator() {
  render(React.createElement(UnemploymentCalculator));
}

function getRadio(name) {
  return screen.getByRole("radio", { name });
}

test("기본 입력 UI와 안내 문구를 표시한다", () => {
  renderCalculator();

  assert.ok(screen.getByRole("heading", { name: "실업급여 계산 정보를 입력하세요" }));
  assert.equal(getRadio(/월급 기준 간편 입력/).checked, true);
  assert.ok(getRadio(/1일 평균임금 직접 입력/));
  assert.ok(screen.getByLabelText("월급 금액"));
  assert.ok(screen.getByLabelText("고용보험 가입기간"));
  assert.ok(getRadio(/50세 미만/));
  assert.ok(getRadio(/비자발적 퇴사/));
  assert.ok(screen.getByText(/실제 수급 여부는 고용보험 가입 이력/));
});

test("정상 입력 시 예상 총 지급액과 상하한 적용 상태를 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();

  await user.type(screen.getByLabelText("월급 금액"), "3300000");
  await user.type(screen.getByLabelText("고용보험 가입기간"), "36");
  await user.click(getRadio(/50세 미만/));
  await user.click(getRadio(/비자발적 퇴사/));
  await user.click(screen.getByRole("button", { name: "실업급여 계산하기" }));

  assert.ok(await screen.findByText("11,888,640원"));
  assert.ok(screen.getAllByText("66,048원").length >= 1);
  assert.ok(screen.getByText("180일"));
  assert.ok(screen.getAllByText("미적용").length >= 1);
  assert.ok(screen.getAllByText("적용").length >= 1);
  assert.ok(screen.getByText(/수급 가능성 있음/));
});

test("1일 평균임금 직접 입력으로 상한액 적용 결과를 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();

  await user.click(getRadio(/1일 평균임금 직접 입력/));
  await user.type(screen.getByLabelText("1일 평균임금 금액"), "200000");
  await user.type(screen.getByLabelText("고용보험 가입기간"), "120");
  await user.click(getRadio(/50세 이상 및 장애인/));
  await user.click(getRadio(/계약만료/));
  await user.click(screen.getByRole("button", { name: "실업급여 계산하기" }));

  assert.ok(await screen.findByText("18,387,000원"));
  assert.ok(screen.getAllByText("68,100원").length >= 1);
  assert.ok(screen.getByText("270일"));
  assert.ok(screen.getAllByText("적용").length >= 1);
});

test("입력 오류를 표시하고 계산 결과를 숨긴다", async () => {
  const user = userEvent.setup();
  renderCalculator();

  await user.type(screen.getByLabelText("월급 금액"), "10");
  await user.type(screen.getByLabelText("고용보험 가입기간"), "5");
  await user.click(screen.getByRole("button", { name: "실업급여 계산하기" }));

  assert.ok(await screen.findByRole("alert"));
  assert.ok(screen.getAllByText(/100,000원 이상/).length >= 1);
  assert.ok(screen.getAllByText(/가입기간이 6개월 미만/).length >= 1);
  assert.ok(screen.getAllByText(/나이 구간을\(를\) 입력해 주세요/).length >= 1);
  assert.ok(screen.getAllByText(/퇴직 사유을\(를\) 입력해 주세요/).length >= 1);
  assert.equal(screen.queryByText("예상 총 지급액"), null);
});

test("초기화는 입력과 결과를 비운다", async () => {
  const user = userEvent.setup();
  renderCalculator();

  await user.type(screen.getByLabelText("월급 금액"), "3300000");
  await user.type(screen.getByLabelText("고용보험 가입기간"), "36");
  await user.click(getRadio(/50세 미만/));
  await user.click(getRadio(/권고사직/));
  await user.click(screen.getByRole("button", { name: "실업급여 계산하기" }));
  assert.ok(await screen.findByText("11,888,640원"));

  await user.click(screen.getByRole("button", { name: "초기화" }));

  assert.equal(screen.getByLabelText("월급 금액").value, "");
  assert.equal(screen.getByLabelText("고용보험 가입기간").value, "");
  assert.equal(getRadio(/월급 기준 간편 입력/).checked, true);
  assert.equal(screen.queryByText("11,888,640원"), null);
});
