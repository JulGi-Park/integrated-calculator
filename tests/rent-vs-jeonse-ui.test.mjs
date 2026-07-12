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
const { RentVsJeonseCalculator, buildRentVsJeonseResultText } = await import(
  "../components/calculators/RentVsJeonseCalculator.tsx"
);
const { getDefaultRentVsJeonseInput, compareRentVsJeonse } = await import(
  "../lib/calculators/rent-vs-jeonse/rent-vs-jeonse.ts"
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
  delete navigator.clipboard;
  delete navigator.share;
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

test("계산 후 복사 문자열은 화면 결과와 기준일을 포함하고 다시 계산로 초기화한다", async () => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: async () => {} },
  });
  const user = userEvent.setup();
  renderCalculator();

  assert.equal(screen.queryByRole("button", { name: "결과 복사" }), null);
  await user.click(screen.getByRole("button", { name: "계산하기" }));
  await user.click(screen.getByRole("button", { name: "결과 복사" }));

  assert.ok(await screen.findByText("결과를 클립보드에 복사했습니다."));

  const defaultCase = getDefaultRentVsJeonseInput();
  const copiedText = buildRentVsJeonseResultText(
    defaultCase,
    compareRentVsJeonse(defaultCase),
  );
  assert.match(copiedText, /전세 월 환산 부담: 900,000원/);
  assert.match(copiedText, /월세 월 부담: 1,125,000원/);
  assert.match(copiedText, /기준일: 2026-07-12/);
  assert.doesNotMatch(copiedText, /NaN|Infinity|undefined|localhost|127\.0\.0\.1/);
  await user.click(screen.getByRole("button", { name: "다시 계산" }));
  assert.ok(screen.getByText("계산 전입니다"));
  assert.equal(screen.queryByRole("button", { name: "결과 복사" }), null);
});

test("Web Share와 미지원 복사 fallback, AbortError 취소를 처리한다", async () => {
  let sharedData;
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: async (value) => { sharedData = value; },
  });
  const user = userEvent.setup();
  renderCalculator();
  await user.click(screen.getByRole("button", { name: "계산하기" }));
  await user.click(screen.getByRole("button", { name: "결과 공유" }));
  assert.equal(sharedData.url, "https://gyesanbox.kr/calculators/rent-vs-jeonse/");
  assert.match(sharedData.text, /전세 vs 월세 비교 계산기/);

  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: async () => { throw new DOMException("cancel", "AbortError"); },
  });
  await user.click(screen.getByRole("button", { name: "결과 공유" }));
  assert.ok(await screen.findByText("공유를 취소했습니다."));
});
