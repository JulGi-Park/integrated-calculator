import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { afterEach, before, test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/calculators/severance/",
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
const { SeveranceCalculator } = await import(
  "../components/calculators/SeveranceCalculator.tsx"
);
const { calculateSeverance } = await import(
  "../lib/calculators/severance/severance.ts"
);
const React = await import("react");

const pageSource = await readFile("app/calculators/severance/page.tsx", "utf8");
const listPageSource = await readFile("app/calculators/page.tsx", "utf8");

const officialExampleInput = {
  employmentStartDate: "2014-10-02",
  retirementDate: "2017-09-16",
  wagesForAveragePeriod: 7_080_000,
  annualBonusTotal: 4_000_000,
  annualLeaveAllowanceTotal: 300_000,
  ordinaryDailyWage: null,
  averageWeeklyContractHours: 40,
};

before(() => {
  globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
});

afterEach(() => {
  cleanup();
});

function renderCalculator() {
  render(React.createElement(SeveranceCalculator));
}

async function replaceValue(user, label, value) {
  const input = screen.getByLabelText(label);
  await user.clear(input);
  if (value !== "") {
    await user.type(input, value);
  }
  return input;
}

async function enterOfficialExample(user) {
  await replaceValue(user, "입사일", "2014-10-02");
  await replaceValue(user, "퇴직일", "2017-09-16");
  await replaceValue(user, "퇴직 전 3개월 임금총액", "7080000");
  await replaceValue(user, "최근 1년 상여금 총액", "4000000");
  await replaceValue(user, "반영 대상 연차수당 총액", "300000");
  await replaceValue(user, "1일 통상임금", "");
  await replaceValue(user, "4주 평균 주당 소정근로시간", "40");
}

test("페이지 제목과 기준일 안내를 표시한다", () => {
  assert.equal((pageSource.match(/<h1/g) ?? []).length, 1);
  assert.match(pageSource, /퇴직금 계산기/);
  assert.match(pageSource, /기준 확인일:/);
  assert.match(pageSource, /예상 금액이며 실제 지급액과 다를 수 있습니다/);
});

test("계산기 목록에 퇴직금 계산기 링크를 활성화하고 기존 링크를 유지한다", () => {
  assert.match(listPageSource, /href="\/calculators\/loan"/);
  assert.match(listPageSource, /href="\/calculators\/salary"/);
  assert.match(listPageSource, /href="\/calculators\/seller-margin"/);
  assert.match(listPageSource, /href="\/calculators\/severance"/);
  assert.match(listPageSource, /퇴직금 계산기/);
});

test("엔진 입력 필드를 렌더링하고 선택 입력을 구분한다", () => {
  renderCalculator();

  const dateLabels = ["입사일", "퇴직일"];
  for (const label of dateLabels) {
    assert.equal(screen.getByLabelText(label).getAttribute("type"), "date");
  }

  for (const label of [
    "퇴직 전 3개월 임금총액",
    "최근 1년 상여금 총액",
    "반영 대상 연차수당 총액",
  ]) {
    assert.equal(screen.getByLabelText(label).getAttribute("inputmode"), "numeric");
  }

  assert.equal(
    screen.getByLabelText("4주 평균 주당 소정근로시간").getAttribute(
      "inputmode",
    ),
    "decimal",
  );
  assert.equal(screen.getByLabelText("최근 1년 상여금 총액").value, "0");
  assert.equal(screen.getByLabelText("반영 대상 연차수당 총액").value, "0");
  assert.equal(screen.getByLabelText("4주 평균 주당 소정근로시간").value, "40");
  assert.ok(screen.getByText("선택 입력"));
});

test("공식 예제 입력 시 7,868,434원을 표시하고 엔진 결과와 일치한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterOfficialExample(user);
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));

  const response = calculateSeverance(officialExampleInput);
  assert.equal(response.success, true);
  const result = response.data;
  const region = screen.getByRole("region", { name: "퇴직금 계산 결과" });

  assert.ok(within(region).getAllByText("7,868,434원").length >= 1);
  assert.ok(within(region).getByText("1,080일"));
  assert.ok(within(region).getAllByText("88,641.31원").length >= 1);
  assert.ok(within(region).getByText("2017년 6월 16일"));
  assert.ok(within(region).getByText("2017년 9월 15일"));
  assert.ok(within(region).getByText("92일"));
  assert.ok(within(region).getByText("8,155,000원"));
  assert.ok(
    within(region).getByText(
      `${result.totalServiceDays.toLocaleString("ko-KR")}일`,
    ),
  );
});

test("결과는 실제 엔진 반환값과 같은 통상임금 미입력 표시를 사용한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterOfficialExample(user);
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));

  const region = screen.getByRole("region", { name: "퇴직금 계산 결과" });
  assert.ok(within(region).getByText("입력하지 않음"));
});

test("Enter 키로 제출할 수 있다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterOfficialExample(user);

  screen.getByLabelText("4주 평균 주당 소정근로시간").focus();
  await user.keyboard("{Enter}");

  assert.ok(screen.getAllByText("7,868,434원").length >= 1);
});

test("초기화는 입력, 오류, 결과, 재계산 안내를 모두 지우고 첫 입력에 포커스를 둔다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterOfficialExample(user);
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));
  await replaceValue(user, "퇴직 전 3개월 임금총액", "7080001");
  assert.ok(
    screen.getByText(
      "입력값이 변경되었습니다. 변경된 조건을 반영하려면 다시 계산하세요.",
    ),
  );

  await user.click(screen.getByRole("button", { name: "초기화" }));

  assert.equal(screen.getByLabelText("입사일").value, "");
  assert.equal(screen.getByLabelText("퇴직일").value, "");
  assert.equal(screen.getByLabelText("퇴직 전 3개월 임금총액").value, "");
  assert.equal(screen.queryByRole("alert"), null);
  assert.equal(screen.queryByText("예상 퇴직금"), null);
  assert.equal(
    screen.queryByText(
      "입력값이 변경되었습니다. 변경된 조건을 반영하려면 다시 계산하세요.",
    ),
    null,
  );
  assert.equal(document.activeElement, screen.getByLabelText("입사일"));
});

test("필드별 오류를 연결하고 첫 오류 필드로 포커스를 이동한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));

  const employmentStartDate = screen.getByLabelText("입사일");
  assert.equal(employmentStartDate.getAttribute("aria-invalid"), "true");
  assert.match(
    employmentStartDate.getAttribute("aria-describedby"),
    /employmentStartDate-error/,
  );
  assert.ok(screen.getAllByText("입사일을(를) 입력해 주세요.").length >= 1);
  assert.equal(document.activeElement, employmentStartDate);
});

test("aria-invalid와 aria-describedby를 적용하고 오류 요약을 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await replaceValue(user, "입사일", "2026-06-24");
  await replaceValue(user, "퇴직일", "2026-06-23");
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));

  const retirementDate = screen.getByLabelText("퇴직일");
  assert.equal(retirementDate.getAttribute("aria-invalid"), "true");
  assert.match(
    retirementDate.getAttribute("aria-describedby"),
    /retirementDate-error/,
  );
  assert.ok(screen.getByRole("alert"));
  assert.ok(
    screen.getAllByText("퇴직일은 입사일보다 빠를 수 없습니다.").length >= 1,
  );
});

test("입력 변경 후 재계산 안내를 표시하고 재계산 후 해제한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterOfficialExample(user);
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));

  await replaceValue(user, "최근 1년 상여금 총액", "5000000");
  assert.ok(
    screen.getByText(
      "입력값이 변경되었습니다. 변경된 조건을 반영하려면 다시 계산하세요.",
    ),
  );
  assert.ok(screen.getAllByText("7,868,434원").length >= 1);

  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));
  assert.equal(
    screen.queryByText(
      "입력값이 변경되었습니다. 변경된 조건을 반영하려면 다시 계산하세요.",
    ),
    null,
  );
  const updatedResponse = calculateSeverance({
    ...officialExampleInput,
    annualBonusTotal: 5_000_000,
  });
  assert.equal(updatedResponse.success, true);
  assert.ok(
    screen.getAllByText(
      `${updatedResponse.data.estimatedSeverance.toLocaleString("ko-KR")}원`,
    ).length >= 1,
  );
});

test("1년 미만 비대상 사유를 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterOfficialExample(user);
  await replaceValue(user, "입사일", "2025-06-24");
  await replaceValue(user, "퇴직일", "2026-06-23");
  await replaceValue(user, "최근 1년 상여금 총액", "0");
  await replaceValue(user, "반영 대상 연차수당 총액", "0");
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));

  assert.ok(screen.getAllByText("0원").length >= 1);
  assert.ok(
    screen.getByText(
      "계속근로기간이 1년 미만이라 퇴직급여 비대상으로 계산되었습니다.",
    ),
  );
});

test("주 15시간 미만 비대상 사유를 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterOfficialExample(user);
  await replaceValue(user, "4주 평균 주당 소정근로시간", "14.99");
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));

  assert.ok(
    screen.getByText(
      "4주 평균 주당 소정근로시간이 15시간 미만이라 퇴직급여 비대상으로 계산되었습니다.",
    ),
  );
});

test("두 조건 모두 미충족 사유를 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterOfficialExample(user);
  await replaceValue(user, "입사일", "2026-01-01");
  await replaceValue(user, "퇴직일", "2026-06-23");
  await replaceValue(user, "4주 평균 주당 소정근로시간", "10");
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));

  assert.ok(
    screen.getByText(
      "계속근로기간 1년 미만과 주당 15시간 미만 조건이 모두 충족되지 않아 퇴직급여 비대상으로 계산되었습니다.",
    ),
  );
});

test("통상임금 대체 적용 안내를 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterOfficialExample(user);
  await replaceValue(user, "1일 통상임금", "100000");
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));

  assert.ok(
    screen.getByText(
      "1일 통상임금이 1일 평균임금보다 높아 통상임금을 퇴직금 계산에 적용했습니다.",
    ),
  );
  assert.ok(screen.getAllByText("100,000원").length >= 1);
  assert.ok(screen.getAllByText("8,876,712원").length >= 1);
});

test("상여금과 연차수당 0원 입력을 정상 처리한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterOfficialExample(user);
  await replaceValue(user, "최근 1년 상여금 총액", "0");
  await replaceValue(user, "반영 대상 연차수당 총액", "0");
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));

  const region = screen.getByRole("region", { name: "퇴직금 계산 결과" });
  assert.ok(within(region).getAllByText("0원").length >= 2);
  assert.ok(within(region).getAllByText("7,080,000원").length >= 1);
});

test("화면에 BigInt 문자열을 노출하지 않는다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterOfficialExample(user);
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));

  assert.equal(document.body.textContent.includes("BigInt"), false);
});
