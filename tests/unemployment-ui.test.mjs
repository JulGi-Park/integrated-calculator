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
const { calculateUnemploymentBenefit } = await import(
  "../lib/calculators/unemployment/unemployment.ts"
);
const {
  buildUnemploymentResultText,
  UNEMPLOYMENT_RESULT_CANONICAL_URL,
} = await import("../components/calculators/unemploymentClientUtils.ts");
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
  render(React.createElement(UnemploymentCalculator));
}

function getRadio(name) {
  return screen.getByRole("radio", { name });
}

function setClipboard(writeText) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
}

async function calculateStandardResult(user, options = {}) {
  const {
    wageAmount = "3300000",
    insuredMonths = "36",
    age = /50세 미만/,
    reason = /비자발적 퇴사/,
  } = options;

  await user.type(screen.getByLabelText("월급 금액"), wageAmount);
  await user.type(screen.getByLabelText("고용보험 가입기간"), insuredMonths);
  await user.click(getRadio(age));
  await user.click(getRadio(reason));
  await user.click(screen.getByRole("button", { name: "실업급여 계산하기" }));
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

test("계산 전에는 복사·공유 버튼을 표시하지 않고 계산 후에는 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();

  assert.equal(screen.queryByRole("button", { name: "결과 복사" }), null);
  assert.equal(screen.queryByRole("button", { name: "공유" }), null);

  await calculateStandardResult(user);
  assert.ok(await screen.findByRole("button", { name: "결과 복사" }));
  assert.ok(screen.getByRole("button", { name: "공유" }));
});

test("결과 복사는 화면 결과·입력 조건·기준일과 면책 안내를 사용한다", async () => {
  let copiedText = "";
  const user = userEvent.setup();
  setClipboard(async (text) => { copiedText = text; });
  renderCalculator();

  await calculateStandardResult(user);
  await user.click(await screen.findByRole("button", { name: "결과 복사" }));
  await screen.findByText("계산 결과를 복사했습니다.");

  assert.match(copiedText, /^실업급여 계산 결과/);
  assert.match(copiedText, /1일 예상 구직급여액: 66,048원/);
  assert.match(copiedText, /예상 소정급여일수: 180일/);
  assert.match(copiedText, /예상 총 지급액: 11,888,640원/);
  assert.match(copiedText, /월급: 3,300,000원/);
  assert.match(copiedText, /고용보험 가입기간: 36개월/);
  assert.match(copiedText, /계산 기준일: 2026-06-25/);
  assert.match(copiedText, /고용센터 심사 결과/);
  assert.ok(screen.getByText("계산 결과를 복사했습니다."));
});

test("클립보드와 fallback 복사가 모두 실패하면 안내한다", async () => {
  const user = userEvent.setup();
  setClipboard(async () => Promise.reject(new Error("denied")));
  renderCalculator();

  await calculateStandardResult(user);
  await user.click(await screen.findByRole("button", { name: "결과 복사" }));
  assert.ok(
    await screen.findByText("결과를 복사하지 못했습니다. 다시 시도해 주세요."),
  );
});

test("Web Share는 운영 canonical URL과 현재 결과를 전달한다", async () => {
  let sharedData;
  Object.defineProperty(navigator, "share", {
    value: async (data) => { sharedData = data; },
    configurable: true,
  });
  const user = userEvent.setup();
  renderCalculator();

  await calculateStandardResult(user);
  await user.click(await screen.findByRole("button", { name: "공유" }));

  assert.equal(sharedData.title, "실업급여 계산 결과");
  assert.match(sharedData.text, /예상 총 지급액: 11,888,640원/);
  assert.equal(sharedData.url, UNEMPLOYMENT_RESULT_CANONICAL_URL);
  assert.doesNotMatch(sharedData.url, /localhost|www\.gyesanbox\.kr|http:/);
  assert.ok(screen.getByText("계산 결과를 공유했습니다."));
});

test("Web Share 미지원과 실제 실패는 복사 fallback 안내를 제공한다", async () => {
  let copiedText = "";
  const user = userEvent.setup();
  setClipboard(async (text) => { copiedText = text; });
  renderCalculator();

  await calculateStandardResult(user);
  await user.click(await screen.findByRole("button", { name: "공유" }));
  await screen.findByText("공유를 지원하지 않아 결과를 복사했습니다.");
  assert.match(copiedText, /예상 총 지급액: 11,888,640원/);

  cleanup();
  Object.defineProperty(navigator, "share", {
    value: async () => Promise.reject(new Error("failed")),
    configurable: true,
  });
  renderCalculator();
  await calculateStandardResult(user);
  await user.click(await screen.findByRole("button", { name: "공유" }));
  assert.ok(
    await screen.findByText("결과를 공유하지 못해 결과를 복사했습니다."),
  );
});

test("Web Share 취소는 실패 안내를 표시하지 않는다", async () => {
  Object.defineProperty(navigator, "share", {
    value: async () => Promise.reject(new DOMException("cancelled", "AbortError")),
    configurable: true,
  });
  const user = userEvent.setup();
  renderCalculator();

  await calculateStandardResult(user);
  await user.click(await screen.findByRole("button", { name: "공유" }));
  assert.equal(screen.queryByText(/공유를 지원하지|공유하지 못/), null);
});

test("초기화와 재계산은 결과 행동 상태를 제거하고 새 결과를 사용한다", async () => {
  let copiedText = "";
  const user = userEvent.setup();
  setClipboard(async (text) => { copiedText = text; });
  renderCalculator();

  await calculateStandardResult(user);
  await user.click(await screen.findByRole("button", { name: "결과 복사" }));
  await screen.findByText("계산 결과를 복사했습니다.");
  await user.click(screen.getByRole("button", { name: "초기화" }));
  assert.equal(screen.queryByRole("button", { name: "결과 복사" }), null);
  assert.equal(screen.queryByText("계산 결과를 복사했습니다."), null);

  await calculateStandardResult(user, {
    wageAmount: "3300000",
    insuredMonths: "120",
    age: /50세 이상 및 장애인/,
    reason: /계약만료/,
  });
  await user.click(await screen.findByRole("button", { name: "결과 복사" }));
  await screen.findByText("계산 결과를 복사했습니다.");
  assert.match(copiedText, /예상 소정급여일수: 270일/);
  assert.match(copiedText, /예상 총 지급액: 17,832,960원/);
});

test("복사 문자열 생성은 비정상 숫자와 개발 URL을 거부한다", () => {
  const response = calculateUnemploymentBenefit({
    wageInputType: "monthlyWage",
    wageAmount: 3_300_000,
    insuredMonths: 36,
    ageGroup: "under50",
    leavingReason: "involuntary",
  });
  assert.equal(response.success, true);
  if (!response.success) return;

  const text = buildUnemploymentResultText(
    {
      wageInputType: "monthlyWage",
      wageAmount: "3,300,000",
      insuredMonths: "36",
      ageGroup: "under50",
      leavingReason: "involuntary",
    },
    response.data,
  );
  assert.ok(text);
  assert.doesNotMatch(text, /NaN|Infinity|undefined|localhost|www\.gyesanbox\.kr|http:\/\//);

  assert.equal(
    buildUnemploymentResultText(
      {
        wageInputType: "monthlyWage",
        wageAmount: "3,300,000",
        insuredMonths: "36",
        ageGroup: "under50",
        leavingReason: "involuntary",
      },
      { ...response.data, dailyBenefitAmount: Number.NaN },
    ),
    null,
  );
});
