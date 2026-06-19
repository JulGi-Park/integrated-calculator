import assert from "node:assert/strict";
import { afterEach, before, test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/calculators/salary/",
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
const { SalaryTakeHomeCalculator } = await import(
  "../components/calculators/SalaryTakeHomeCalculator.tsx"
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
  render(React.createElement(SalaryTakeHomeCalculator));
}

async function replaceValue(user, label, value) {
  const input = screen.getByLabelText(label);
  await user.clear(input);
  if (value !== "") {
    await user.type(input, value);
  }
  return input;
}

async function enterStandardSalary(user) {
  await replaceValue(user, "연봉", "36000000");
  await replaceValue(user, "월 비과세액", "0");
  await replaceValue(user, "공제대상 가족 수", "1");
  await replaceValue(user, "간이세액표상 자녀 수", "0");
}

test("기본 입력 상태와 네 개의 연결된 숫자 입력을 표시한다", () => {
  renderCalculator();

  assert.equal(screen.getByLabelText("연봉").value, "");
  assert.equal(screen.getByLabelText("월 비과세액").value, "0");
  assert.equal(screen.getByLabelText("공제대상 가족 수").value, "1");
  assert.equal(screen.getByLabelText("간이세액표상 자녀 수").value, "0");

  for (const label of [
    "연봉",
    "월 비과세액",
    "공제대상 가족 수",
    "간이세액표상 자녀 수",
  ]) {
    assert.equal(screen.getByLabelText(label).getAttribute("inputmode"), "numeric");
    assert.ok(screen.getByLabelText(label).getAttribute("aria-describedby"));
  }
});

test("정상 입력으로 고정된 결과 요약과 상세 공제를 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterStandardSalary(user);
  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));

  const result = screen.getByRole("region", { name: "급여 실수령액" });

  assert.ok(within(result).getAllByText("2,626,698원").length >= 1);
  assert.ok(within(result).getAllByText("31,520,376원").length >= 1);
  assert.ok(within(result).getAllByText("3,000,000원").length >= 1);
  assert.ok(within(result).getByText("373,302원"));

  for (const label of [
    "국민연금",
    "건강보험",
    "장기요양보험",
    "고용보험",
    "소득세",
    "지방소득세",
  ]) {
    assert.ok(within(result).getByText(label));
  }

  for (const value of [
    "142,500원",
    "107,850원",
    "14,172원",
    "27,000원",
    "74,350원",
    "7,430원",
  ]) {
    assert.ok(within(result).getByText(value));
  }
});

test("월 과세급여와 계산 당시 월 비과세액을 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await replaceValue(user, "연봉", "60000000");
  await replaceValue(user, "월 비과세액", "200000");
  await replaceValue(user, "공제대상 가족 수", "3");
  await replaceValue(user, "간이세액표상 자녀 수", "1");
  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));

  const result = screen.getByRole("region", { name: "급여 실수령액" });
  assert.ok(within(result).getByText("4,800,000원"));
  assert.ok(within(result).getByText("200,000원"));

  await replaceValue(user, "월 비과세액", "300000");
  assert.ok(within(result).getByText("200,000원"));
});

test("빈 연봉 오류를 연결하고 첫 오류 입력으로 포커스를 이동한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));

  const annualSalary = screen.getByLabelText("연봉");
  assert.equal(annualSalary.getAttribute("aria-invalid"), "true");
  assert.match(annualSalary.getAttribute("aria-describedby"), /annualSalary-error/);
  assert.ok(screen.getByText("연봉을 입력해 주세요."));
  assert.equal(document.activeElement, annualSalary);
  assert.equal(screen.queryByText("월 예상 실수령액"), null);
});

test("음수 연봉과 잘못된 금액을 결과 없이 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await replaceValue(user, "연봉", "-1");
  await replaceValue(user, "월 비과세액", "abc");
  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));

  assert.ok(screen.getByText("연봉은 0원보다 커야 합니다."));
  assert.ok(screen.getByText("월 비과세액 값을 숫자로 입력해 주세요."));
  assert.equal(screen.queryByText("월 공제 합계"), null);
});

test("월 비과세액이 월 급여보다 크면 필드 오류를 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await replaceValue(user, "연봉", "36000000");
  await replaceValue(user, "월 비과세액", "3000001");
  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));

  assert.ok(screen.getByText("월 비과세액은 월 급여보다 클 수 없습니다."));
  assert.equal(document.activeElement, screen.getByLabelText("월 비과세액"));
});

test("소수 가족 수와 가족 수보다 많은 자녀 수를 거부한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await replaceValue(user, "연봉", "36000000");
  await replaceValue(user, "공제대상 가족 수", "1.5");
  await replaceValue(user, "간이세액표상 자녀 수", "2");
  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));

  assert.ok(screen.getByText("공제대상 가족 수 값은 정수로 입력해 주세요."));
  assert.ok(
    screen.getByText("자녀 수는 공제대상 가족 수보다 많을 수 없습니다."),
  );
});

test("Enter 키로 계산을 제출한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterStandardSalary(user);

  screen.getByLabelText("간이세액표상 자녀 수").focus();
  await user.keyboard("{Enter}");

  assert.ok(screen.getAllByText("2,626,698원").length >= 1);
});

test("계산 후 입력 변경을 알리고 재계산하면 안내를 제거한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterStandardSalary(user);
  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));

  await replaceValue(user, "연봉", "48000000");
  assert.ok(
    screen.getByText("입력값이 변경되었습니다. 다시 계산해 주세요."),
  );
  assert.ok(screen.getAllByText("2,626,698원").length >= 1);

  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));
  assert.equal(
    screen.queryByText("입력값이 변경되었습니다. 다시 계산해 주세요."),
    null,
  );
  assert.ok(screen.getAllByText("3,395,754원").length >= 1);
});

test("초기화는 입력·오류·결과·변경 상태를 모두 복원한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterStandardSalary(user);
  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));
  await replaceValue(user, "연봉", "");
  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));

  await user.click(screen.getByRole("button", { name: "초기화" }));

  assert.equal(screen.getByLabelText("연봉").value, "");
  assert.equal(screen.getByLabelText("월 비과세액").value, "0");
  assert.equal(screen.getByLabelText("공제대상 가족 수").value, "1");
  assert.equal(screen.getByLabelText("간이세액표상 자녀 수").value, "0");
  assert.equal(screen.queryByRole("alert"), null);
  assert.equal(screen.queryByText("월 공제 합계"), null);
  assert.equal(
    screen.queryByText("입력값이 변경되었습니다. 다시 계산해 주세요."),
    null,
  );
  assert.equal(document.activeElement, screen.getByLabelText("연봉"));
});

test("저소득 결과에서도 소득세와 지방소득세 0원을 숨기지 않는다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await replaceValue(user, "연봉", "12000000");
  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));

  const result = screen.getByRole("region", { name: "급여 실수령액" });
  const incomeTaxTerm = within(result).getByText("소득세");
  const localTaxTerm = within(result).getByText("지방소득세");
  assert.equal(incomeTaxTerm.nextElementSibling.textContent, "0원");
  assert.equal(localTaxTerm.nextElementSibling.textContent, "0원");
});

test("정책 연도·기준일·국민연금 적용 기간과 7월 변경 안내를 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();

  assert.ok(screen.getByText(/하한 400,000원/));
  assert.ok(screen.getByText(/상한 6,370,000원/));
  assert.ok(screen.getByText(/2025년 7월 1일/));
  assert.ok(screen.getByText(/2026년 6월 30일/));
  assert.ok(screen.getByText(/2026년 7월 1일부터 변경 기준/));

  await enterStandardSalary(user);
  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));
  const result = screen.getByRole("region", { name: "급여 실수령액" });
  assert.ok(within(result).getByText("2026년"));
  assert.ok(within(result).getByText("2026년 6월 19일"));
  assert.ok(
    within(result).getByText(
      "2025년 7월 1일~2026년 6월 30일",
    ),
  );
});

test("NaN과 Infinity를 화면 결과로 표시하지 않는다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await replaceValue(user, "연봉", "Infinity");
  await replaceValue(user, "월 비과세액", "NaN");
  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));

  assert.ok(screen.getAllByText(/숫자로 입력해 주세요/).length >= 2);
  assert.equal(document.body.textContent.includes("Infinity원"), false);
  assert.equal(document.body.textContent.includes("NaN원"), false);
});
