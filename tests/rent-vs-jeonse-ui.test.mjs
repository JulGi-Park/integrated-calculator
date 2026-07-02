import assert from "node:assert/strict";
import { afterEach, before, test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/calculators/rent-vs-jeonse/",
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
const { RentVsJeonseCalculator } = await import(
  "../components/calculators/RentVsJeonseCalculator.tsx"
);
const { RentVsJeonseContent } = await import(
  "../components/calculators/RentVsJeonseContent.tsx"
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
  render(React.createElement(RentVsJeonseCalculator));
}

async function replaceValue(user, label, value) {
  const input = screen.getByLabelText(label);
  await user.clear(input);

  if (value !== "") {
    await user.type(input, value);
  }

  return input;
}

test("전세 vs 월세 계산기는 필수 입력과 계산 전 안내를 표시한다", () => {
  renderCalculator();

  for (const label of [
    "전세보증금",
    "전세대출금",
    "전세대출 연이율",
    "전세 기타 월비용",
    "월세 보증금",
    "월세",
    "월세 관리비",
    "보증금 기회비용 연이율",
    "거주 예정 기간",
    "한국은행 기준금리",
    "시행령상 가산 이율",
    "법정 상한율",
  ]) {
    assert.ok(screen.getByLabelText(label));
  }

  assert.match(screen.getByText("계산 전입니다").textContent, /계산 전/);
});

test("정상 입력으로 결과 요약, 상세 계산 내역, 결과 해석을 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();

  await user.click(screen.getByRole("button", { name: "계산하기" }));

  assert.match(screen.getByText("결과 요약").textContent, /결과 요약/);
  assert.match(screen.getByText(/입력값 기준 예상 비교입니다/).textContent, /예상 비교/);
  assert.match(screen.getByText("전세가 더 저렴합니다").textContent, /전세/);
  assert.ok(screen.getByText("전세 상세"));
  assert.ok(screen.getByText("월세 상세"));
  assert.ok(screen.getByText("전월세전환율 참고"));
  assert.ok(screen.getByText("보증금 차이의 월세 환산액"));
  assert.match(screen.getByText("결과 해석").textContent, /결과 해석/);
});

test("입력값 검증 실패 시 결과를 숨기고 필드별 오류를 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();

  await replaceValue(user, "전세대출금", "400000000");
  await user.click(screen.getByRole("button", { name: "계산하기" }));

  assert.ok(
    screen.getByText("전세대출금은 전세보증금을 초과할 수 없습니다."),
  );
  assert.ok(screen.getByRole("alert"));
  assert.equal(screen.queryByText("결과 요약"), null);
});

test("월세가 더 저렴한 경우와 거의 같은 경우의 해석 문구가 달라진다", async () => {
  const user = userEvent.setup();
  renderCalculator();

  await replaceValue(user, "전세 기타 월비용", "500000");
  await replaceValue(user, "월세", "100000");
  await user.click(screen.getByRole("button", { name: "계산하기" }));
  assert.ok(screen.getByText("월세가 더 저렴합니다"));
  assert.match(screen.getByText(/대출이자와 보증금 기회비용/).textContent, /월세/);

  await user.click(screen.getByRole("button", { name: "초기화" }));
  await replaceValue(user, "전세보증금", "0");
  await replaceValue(user, "전세대출금", "0");
  await replaceValue(user, "전세대출 연이율", "0");
  await replaceValue(user, "전세 기타 월비용", "1000000");
  await replaceValue(user, "월세 보증금", "0");
  await replaceValue(user, "월세", "900000");
  await replaceValue(user, "월세 관리비", "100000");
  await replaceValue(user, "보증금 기회비용 연이율", "0");
  await user.click(screen.getByRole("button", { name: "계산하기" }));

  assert.ok(screen.getByText("입력값 기준 두 선택지의 총비용이 거의 같습니다"));
  assert.match(screen.getByText(/민감도를 확인/).textContent, /민감도/);
});

test("본문 콘텐츠는 FAQ, 출처, 면책 문구를 화면에 표시한다", () => {
  render(React.createElement(RentVsJeonseContent));

  assert.ok(screen.getByRole("heading", { name: "계산 기준" }));
  assert.ok(screen.getByRole("heading", { name: "법정 전월세전환율 참고" }));
  assert.ok(screen.getByRole("heading", { name: "자주 묻는 질문" }));
  assert.ok(screen.getAllByText(/전세 vs 월세 비교 계산기는 무엇을 비교하나요/).length >= 1);
  assert.ok(screen.getByText("주택임대차보호법 제7조의2"));
  assert.ok(screen.getByText("한국은행 기준금리 추이"));

  const disclaimer = screen.getByLabelText("계산 결과 안내");
  assert.match(
    within(disclaimer).getByText(/법률 판단이나 분쟁/).textContent,
    /공식 기관/,
  );
});
