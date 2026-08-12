import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { afterEach, test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/calculators/training-certificate-cost/",
});

Object.defineProperties(globalThis, {
  window: { value: dom.window, configurable: true },
  document: { value: dom.window.document, configurable: true },
  navigator: { value: dom.window.navigator, configurable: true },
  HTMLElement: { value: dom.window.HTMLElement, configurable: true },
  HTMLInputElement: { value: dom.window.HTMLInputElement, configurable: true },
  Node: { value: dom.window.Node, configurable: true },
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
const { TrainingCertificateCostCalculator } = await import(
  "../components/calculators/TrainingCertificateCostCalculator.tsx"
);
const React = await import("react");

afterEach(() => {
  cleanup();
});

function renderCalculator() {
  render(React.createElement(TrainingCertificateCostCalculator));
}

async function replaceValue(user, label, value) {
  const input = screen.getByLabelText(label);
  await user.clear(input);

  if (value !== "") {
    await user.type(input, value);
  }

  return input;
}

async function enterRepresentativeFixture(user) {
  await replaceValue(user, "총 훈련비", "1500000");
  await replaceValue(user, "본인부담 훈련비", "300000");
  await replaceValue(user, "1회 응시료", "50000");
  await replaceValue(user, "예상 응시 횟수", "2");
  await replaceValue(user, "교재비", "30000");
  await replaceValue(user, "실습·재료비", "50000");
  await replaceValue(user, "훈련기간 총 교통비", "120000");
  await replaceValue(user, "훈련기간 총 식비", "0");
  await replaceValue(user, "기타 비용", "0");
}

test("필드 label, 모바일 입력 모드, 응시 횟수 기본값을 제공한다", () => {
  renderCalculator();

  for (const label of [
    "총 훈련비",
    "본인부담 훈련비",
    "1회 응시료",
    "예상 응시 횟수",
    "교재비",
    "실습·재료비",
    "훈련기간 총 교통비",
    "훈련기간 총 식비",
    "기타 비용",
  ]) {
    assert.equal(screen.getByLabelText(label).getAttribute("inputmode"), "numeric");
  }

  assert.equal(screen.getByLabelText("예상 응시 횟수").value, "1");
});

test("금액 입력에 천 단위 콤마를 표시하고 대표 fixture를 계산한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterRepresentativeFixture(user);

  assert.equal(screen.getByLabelText("총 훈련비").value, "1,500,000");
  assert.equal(screen.getByLabelText("본인부담 훈련비").value, "300,000");

  await user.click(screen.getByRole("button", { name: "계산하기" }));

  const primaryResult = screen.getByRole("region", {
    name: "국비지원 적용 후 자격증 취득 예상비용",
  });
  assert.ok(within(primaryResult).getByText("600,000원"));
  assert.equal(screen.getAllByText("1,200,000원").length, 2);
  assert.ok(screen.getByText("1,800,000원"));
  assert.ok(screen.getByText("100,000원"));
  assert.ok(screen.getByText(/본 계산 결과는 입력한 금액을 기준으로 한 예상값/));
});

test("대표 fixture의 1·2·3회 비용과 현재 선택 및 증가액을 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterRepresentativeFixture(user);
  await user.click(screen.getByRole("button", { name: "계산하기" }));

  const comparison = screen.getByRole("region", {
    name: "응시 횟수별 예상비용 비교",
  });
  const oneAttempt = within(comparison).getByRole("article", {
    name: "1회 응시",
  });
  const twoAttempts = within(comparison).getByRole("article", {
    name: "2회 응시, 현재 선택",
  });
  const threeAttempts = within(comparison).getByRole("article", {
    name: "3회 응시",
  });

  assert.ok(within(oneAttempt).getByText("550,000원"));
  assert.ok(within(twoAttempts).getByText("600,000원"));
  assert.ok(within(twoAttempts).getByText("현재 선택"));
  assert.equal(twoAttempts.getAttribute("aria-current"), "true");
  assert.ok(within(threeAttempts).getByText("650,000원"));
  assert.ok(
    within(comparison).getByText(
      "시험을 한 번 더 응시하면 예상 취득비용이 50,000원 증가합니다.",
    ),
  );
});

test("응시료 0원은 동일 비용과 중립 안내를 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await replaceValue(user, "총 훈련비", "1000000");
  await replaceValue(user, "본인부담 훈련비", "200000");
  await replaceValue(user, "1회 응시료", "0");
  await replaceValue(user, "예상 응시 횟수", "2");
  await user.click(screen.getByRole("button", { name: "계산하기" }));

  const comparison = screen.getByRole("region", {
    name: "응시 횟수별 예상비용 비교",
  });
  assert.equal(within(comparison).getAllByText("200,000원").length, 3);
  assert.ok(
    within(comparison).getByText(
      "추가 응시료를 입력하면 응시 횟수별 비용 차이를 확인할 수 있습니다.",
    ),
  );
  assert.equal(
    within(comparison).queryByText(/예상 취득비용이 .* 증가합니다/),
    null,
  );
});

test("현재 응시 횟수 4회는 기존 결과를 유지하고 비교 선택은 표시하지 않는다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterRepresentativeFixture(user);
  await replaceValue(user, "예상 응시 횟수", "4");
  await user.click(screen.getByRole("button", { name: "계산하기" }));

  const primaryResult = screen.getByRole("region", {
    name: "국비지원 적용 후 자격증 취득 예상비용",
  });
  const comparison = screen.getByRole("region", {
    name: "응시 횟수별 예상비용 비교",
  });

  assert.ok(within(primaryResult).getByText("700,000원"));
  assert.ok(within(comparison).getByText("550,000원"));
  assert.ok(within(comparison).getByText("600,000원"));
  assert.ok(within(comparison).getByText("650,000원"));
  assert.equal(comparison.querySelector('[aria-current="true"]'), null);
  assert.equal(within(comparison).queryByText("현재 선택"), null);
});

test("선택 비용 빈 값은 0원으로 계산하고 상세 내역에 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await replaceValue(user, "총 훈련비", "1000000");
  await replaceValue(user, "본인부담 훈련비", "200000");
  await replaceValue(user, "1회 응시료", "50000");

  await user.click(screen.getByRole("button", { name: "계산하기" }));

  const breakdown = screen.getByRole("region", { name: "본인부담 비용 내역" });
  assert.equal(within(breakdown).getAllByText("0원").length, 5);
  assert.ok(within(breakdown).getByText("250,000원"));
});

test("본인부담액 초과 오류를 표시하고 이전 정상 결과를 제거한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterRepresentativeFixture(user);
  await user.click(screen.getByRole("button", { name: "계산하기" }));
  assert.ok(
    screen.getByRole("region", {
      name: "국비지원 적용 후 자격증 취득 예상비용",
    }),
  );

  await replaceValue(user, "총 훈련비", "1000000");
  await replaceValue(user, "본인부담 훈련비", "1100000");
  await user.click(screen.getByRole("button", { name: "계산하기" }));

  assert.ok(screen.getByText("훈련비 본인부담액은 총 훈련비보다 클 수 없습니다."));
  assert.ok(screen.getByRole("alert"));
  assert.equal(
    screen.queryByRole("region", {
      name: "국비지원 적용 후 자격증 취득 예상비용",
    }),
    null,
  );
  assert.equal(
    screen.queryByRole("region", { name: "응시 횟수별 예상비용 비교" }),
    null,
  );
});

test("응시 횟수 0과 100억원 초과 금액을 필드 오류로 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await replaceValue(user, "총 훈련비", "10000000001");
  await replaceValue(user, "본인부담 훈련비", "0");
  await replaceValue(user, "1회 응시료", "0");
  await replaceValue(user, "예상 응시 횟수", "0");

  await user.click(screen.getByRole("button", { name: "계산하기" }));

  assert.ok(screen.getByText("금액은 10,000,000,000원 이하여야 합니다."));
  assert.ok(screen.getByText("예상 응시 횟수는 1회 이상이어야 합니다."));
  assert.equal(screen.getByLabelText("총 훈련비").getAttribute("aria-invalid"), "true");
  assert.equal(screen.getByLabelText("예상 응시 횟수").getAttribute("aria-invalid"), "true");
});

test("초기화는 입력·오류·결과를 지우고 응시 횟수를 1회로 되돌린다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterRepresentativeFixture(user);
  await user.click(screen.getByRole("button", { name: "계산하기" }));
  await user.click(screen.getByRole("button", { name: "초기화" }));

  for (const label of [
    "총 훈련비",
    "본인부담 훈련비",
    "1회 응시료",
    "교재비",
    "실습·재료비",
    "훈련기간 총 교통비",
    "훈련기간 총 식비",
    "기타 비용",
  ]) {
    assert.equal(screen.getByLabelText(label).value, "");
  }
  assert.equal(screen.getByLabelText("예상 응시 횟수").value, "1");
  assert.equal(screen.queryByRole("alert"), null);
  assert.equal(
    screen.queryByRole("region", {
      name: "국비지원 적용 후 자격증 취득 예상비용",
    }),
    null,
  );
  assert.equal(
    screen.queryByRole("region", { name: "응시 횟수별 예상비용 비교" }),
    null,
  );
  assert.equal(document.activeElement, screen.getByLabelText("총 훈련비"));
});

test("page는 공통 strict 공개 helper와 notFound로 보호된다", async () => {
  const pageSource = await readFile(
    "app/calculators/training-certificate-cost/page.tsx",
    "utf8",
  );
  const publicationSource = await readFile(
    "lib/calculators/training-certificate-cost/publication.ts",
    "utf8",
  );

  assert.match(pageSource, /isTrainingCertificateCostCalculatorEnabled\(\)/);
  assert.match(
    publicationSource,
    /NEXT_PUBLIC_ENABLE_TRAINING_CERTIFICATE_COST_CALCULATOR/,
  );
  assert.match(publicationSource, /return value === ["']true["']/);
  assert.match(pageSource, /notFound\(\)/);
  assert.match(pageSource, /export const metadata/);
  assert.match(pageSource, /canonical/);
});
