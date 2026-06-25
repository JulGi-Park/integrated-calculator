import assert from "node:assert/strict";
import { afterEach, before, beforeEach, test } from "node:test";
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
const { SalaryTakeHomeCalculator } = await import(
  "../components/calculators/SalaryTakeHomeCalculator.tsx"
);
const {
  SALARY_TAKE_HOME_STORAGE_KEY,
  serializeSalaryTakeHomeInputs,
} = await import(
  "../components/calculators/salaryTakeHomeClientUtils.ts"
);
const { SELLER_MARGIN_STORAGE_KEY } = await import(
  "../components/calculators/sellerMarginClientUtils.ts"
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

async function settleMount() {
  await act(async () => {
    await Promise.resolve();
  });
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

test("개인정보 안내를 입력 영역 가까이에 표시한다", () => {
  renderCalculator();
  assert.ok(
    screen.getByText(
      "입력값은 서버로 전송하지 않고 현재 브라우저에만 저장됩니다.",
    ),
  );
});

test("입력 변경 시 전용 키에 버전과 네 raw 입력값만 저장한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await settleMount();
  await replaceValue(user, "연봉", "50000000");

  const stored = JSON.parse(
    window.localStorage.getItem(SALARY_TAKE_HOME_STORAGE_KEY),
  );
  assert.equal(stored.version, 1);
  assert.deepEqual(stored.inputs, {
    annualSalary: "50000000",
    monthlyNonTaxableAmount: "0",
    dependentCount: "1",
    childCount: "0",
  });
  assert.equal("result" in stored, false);
});

test("저장 입력을 복원하되 자동 계산하거나 결과를 복원하지 않는다", async () => {
  window.localStorage.setItem(
    SALARY_TAKE_HOME_STORAGE_KEY,
    serializeSalaryTakeHomeInputs({
      annualSalary: "60000000",
      monthlyNonTaxableAmount: "200000",
      dependentCount: "3",
      childCount: "1",
    }),
  );
  renderCalculator();

  await screen.findByDisplayValue("60000000");
  assert.equal(screen.getByLabelText("월 비과세액").value, "200000");
  assert.equal(screen.getByLabelText("공제대상 가족 수").value, "3");
  assert.equal(screen.getByLabelText("간이세액표상 자녀 수").value, "1");
  assert.ok(screen.getByText("연봉을 입력한 후 계산해 주세요."));
  assert.equal(screen.queryByText("월 공제 합계"), null);
  assert.equal(screen.queryByRole("button", { name: "결과 복사" }), null);
  assert.equal(screen.queryByRole("button", { name: "공유" }), null);
});

test("초기 마운트는 기존 저장값을 기본값으로 덮어쓰지 않는다", async () => {
  const serialized = serializeSalaryTakeHomeInputs({
    annualSalary: "70000000",
    monthlyNonTaxableAmount: "100000",
    dependentCount: "2",
    childCount: "0",
  });
  window.localStorage.setItem(SALARY_TAKE_HOME_STORAGE_KEY, serialized);
  renderCalculator();

  await screen.findByDisplayValue("70000000");
  assert.equal(
    window.localStorage.getItem(SALARY_TAKE_HOME_STORAGE_KEY),
    serialized,
  );
});

for (const [name, storedValue] of [
  ["손상된 JSON", "{"],
  ["null", "null"],
  ["배열", "[]"],
  ["필드 누락", JSON.stringify({ version: 1, inputs: { annualSalary: "" } })],
  [
    "잘못된 타입",
    JSON.stringify({
      version: 1,
      inputs: {
        annualSalary: 1,
        monthlyNonTaxableAmount: "0",
        dependentCount: "1",
        childCount: "0",
      },
    }),
  ],
  [
    "이전 버전",
    JSON.stringify({
      version: 0,
      inputs: {
        annualSalary: "1",
        monthlyNonTaxableAmount: "0",
        dependentCount: "1",
        childCount: "0",
      },
    }),
  ],
]) {
  test(`${name} 저장 데이터는 제거하고 기본값을 사용한다`, async () => {
    window.localStorage.setItem(SALARY_TAKE_HOME_STORAGE_KEY, storedValue);
    renderCalculator();

    await settleMount();
    assert.equal(
      window.localStorage.getItem(SALARY_TAKE_HOME_STORAGE_KEY),
      null,
    );
    assert.equal(screen.getByLabelText("연봉").value, "");
    assert.equal(screen.getByLabelText("월 비과세액").value, "0");
  });
}

test("localStorage 읽기 실패에도 입력과 계산을 사용할 수 있다", async () => {
  Object.defineProperty(window.localStorage, "getItem", {
    value: () => {
      throw new Error("denied");
    },
    configurable: true,
  });
  const user = userEvent.setup();
  renderCalculator();
  await enterStandardSalary(user);
  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));
  assert.ok(screen.getAllByText("2,626,698원").length >= 1);
});

test("localStorage 쓰기 및 용량 초과 실패에도 계산을 계속한다", async () => {
  Object.defineProperty(window.localStorage, "setItem", {
    value: () => {
      throw new DOMException("quota", "QuotaExceededError");
    },
    configurable: true,
  });
  const user = userEvent.setup();
  renderCalculator();
  await settleMount();
  await enterStandardSalary(user);
  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));
  assert.ok(screen.getAllByText("2,626,698원").length >= 1);
});

test("정상 입력으로 고정된 결과 요약과 상세 공제를 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await settleMount();
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

test("계산 결과가 없을 때 복사와 공유 버튼을 표시하지 않는다", async () => {
  Object.defineProperty(navigator, "share", {
    value: async () => {},
    configurable: true,
  });
  renderCalculator();
  await settleMount();

  assert.equal(screen.queryByRole("button", { name: "결과 복사" }), null);
  assert.equal(screen.queryByRole("button", { name: "공유" }), null);
});

test("Clipboard API로 고정 결과 텍스트를 복사하고 성공을 안내한다", async () => {
  let copiedText = "";
  const user = userEvent.setup();
  Object.defineProperty(navigator, "clipboard", {
    value: {
      writeText: async (text) => {
        copiedText = text;
      },
    },
    configurable: true,
  });
  renderCalculator();
  await enterStandardSalary(user);
  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));
  await user.click(screen.getByRole("button", { name: "결과 복사" }));

  assert.match(copiedText, /^연봉 실수령액 계산 결과/);
  assert.match(copiedText, /연봉: 36,000,000원/);
  assert.match(copiedText, /소득세: 74,350원/);
  assert.match(copiedText, /월 예상 실수령액: 2,626,698원/);
  assert.match(copiedText, /기준 확인일: 2026년 6월 19일/);
  assert.equal(copiedText.includes("NaN"), false);
  assert.equal(copiedText.includes("Infinity"), false);
  assert.ok(screen.getByText("계산 결과를 복사했습니다."));
});

test("Clipboard API 실패 후 fallback 복사에 성공하고 포커스를 복원한다", async () => {
  const user = userEvent.setup();
  Object.defineProperty(navigator, "clipboard", {
    value: {
      writeText: async () => Promise.reject(new Error("denied")),
    },
    configurable: true,
  });
  Object.defineProperty(document, "execCommand", {
    value: (command) => command === "copy",
    configurable: true,
  });
  renderCalculator();
  await enterStandardSalary(user);
  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));
  const copyButton = screen.getByRole("button", { name: "결과 복사" });
  copyButton.focus();
  await user.click(copyButton);

  assert.ok(screen.getByText("계산 결과를 복사했습니다."));
  assert.equal(document.querySelector("textarea"), null);
  assert.equal(document.activeElement, copyButton);
});

test("Clipboard API 미지원 환경에서도 fallback으로 복사한다", async () => {
  const user = userEvent.setup();
  Object.defineProperty(navigator, "clipboard", {
    value: undefined,
    configurable: true,
  });
  Object.defineProperty(document, "execCommand", {
    value: () => true,
    configurable: true,
  });
  renderCalculator();
  await enterStandardSalary(user);
  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));
  await user.click(screen.getByRole("button", { name: "결과 복사" }));
  assert.ok(screen.getByText("계산 결과를 복사했습니다."));
});

test("Clipboard와 fallback이 모두 실패하면 실패를 안내한다", async () => {
  const user = userEvent.setup();
  Object.defineProperty(navigator, "clipboard", {
    value: {
      writeText: async () => Promise.reject(new Error("denied")),
    },
    configurable: true,
  });
  Object.defineProperty(document, "execCommand", {
    value: () => false,
    configurable: true,
  });
  renderCalculator();
  await enterStandardSalary(user);
  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));
  await user.click(screen.getByRole("button", { name: "결과 복사" }));
  assert.ok(
    screen.getByText("결과를 복사하지 못했습니다. 다시 시도해 주세요."),
  );
});

test("Web Share 지원 환경에서 결과 제목·텍스트·현재 URL을 공유한다", async () => {
  let sharedData;
  Object.defineProperty(navigator, "share", {
    value: async (data) => {
      sharedData = data;
    },
    configurable: true,
  });
  const user = userEvent.setup();
  renderCalculator();
  await enterStandardSalary(user);
  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));
  const shareButton = await screen.findByRole("button", { name: "공유" });
  await user.click(shareButton);

  assert.equal(sharedData.title, "연봉 실수령액 계산 결과");
  assert.match(sharedData.text, /월 예상 실수령액: 2,626,698원/);
  assert.match(sharedData.text, /소득세: 74,350원/);
  assert.equal(sharedData.url, "http://localhost/calculators/salary/");
  assert.ok(screen.getByText("계산 결과를 공유했습니다."));
});

test("Web Share 미지원 환경에서는 공유를 숨기고 복사는 유지한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await settleMount();
  await enterStandardSalary(user);
  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));

  assert.ok(screen.getByRole("button", { name: "결과 복사" }));
  assert.equal(screen.queryByRole("button", { name: "공유" }), null);
});

test("사용자가 Web Share를 취소하면 실패 메시지를 표시하지 않는다", async () => {
  Object.defineProperty(navigator, "share", {
    value: async () =>
      Promise.reject(new DOMException("cancelled", "AbortError")),
    configurable: true,
  });
  const user = userEvent.setup();
  renderCalculator();
  await enterStandardSalary(user);
  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));
  await user.click(await screen.findByRole("button", { name: "공유" }));

  assert.equal(
    screen.queryByText(
      "결과를 공유하지 못했습니다. 결과 복사를 이용해 주세요.",
    ),
    null,
  );
});

test("Web Share 실제 실패는 복사 이용 안내를 표시한다", async () => {
  Object.defineProperty(navigator, "share", {
    value: async () => Promise.reject(new Error("failed")),
    configurable: true,
  });
  const user = userEvent.setup();
  renderCalculator();
  await enterStandardSalary(user);
  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));
  await user.click(await screen.findByRole("button", { name: "공유" }));

  assert.ok(
    screen.getByText(
      "결과를 공유하지 못했습니다. 결과 복사를 이용해 주세요.",
    ),
  );
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
  assert.equal(screen.queryByRole("button", { name: "결과 복사" }), null);
  assert.equal(screen.queryByRole("button", { name: "공유" }), null);

  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));
  assert.equal(
    screen.queryByText("입력값이 변경되었습니다. 다시 계산해 주세요."),
    null,
  );
  assert.ok(screen.getAllByText("3,395,754원").length >= 1);
  assert.ok(screen.getByRole("button", { name: "결과 복사" }));
});

test("재계산 후 Web Share를 다시 사용할 수 있다", async () => {
  let shareCount = 0;
  Object.defineProperty(navigator, "share", {
    value: async () => {
      shareCount += 1;
    },
    configurable: true,
  });
  const user = userEvent.setup();
  renderCalculator();
  await enterStandardSalary(user);
  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));
  await replaceValue(user, "연봉", "48000000");
  assert.equal(screen.queryByRole("button", { name: "공유" }), null);

  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));
  await user.click(await screen.findByRole("button", { name: "공유" }));
  assert.equal(shareCount, 1);
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

test("초기화는 연봉 저장값만 삭제하고 판매자 저장값은 보존한다", async () => {
  const sellerStoredValue = '{"seller":"preserved"}';
  window.localStorage.setItem(SELLER_MARGIN_STORAGE_KEY, sellerStoredValue);
  const user = userEvent.setup();
  renderCalculator();
  await settleMount();
  await replaceValue(user, "연봉", "36000000");
  assert.ok(window.localStorage.getItem(SALARY_TAKE_HOME_STORAGE_KEY));

  await user.click(screen.getByRole("button", { name: "초기화" }));

  assert.equal(
    window.localStorage.getItem(SALARY_TAKE_HOME_STORAGE_KEY),
    null,
  );
  assert.equal(
    window.localStorage.getItem(SELLER_MARGIN_STORAGE_KEY),
    sellerStoredValue,
  );
});

test("localStorage 삭제 실패에도 초기화와 이후 계산을 계속한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await settleMount();
  await enterStandardSalary(user);
  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));
  Object.defineProperty(window.localStorage, "removeItem", {
    value: () => {
      throw new Error("delete denied");
    },
    configurable: true,
  });

  await user.click(screen.getByRole("button", { name: "초기화" }));
  assert.equal(screen.getByLabelText("연봉").value, "");
  assert.equal(screen.queryByText("월 공제 합계"), null);

  await enterStandardSalary(user);
  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));
  assert.ok(screen.getAllByText("2,626,698원").length >= 1);
});

test("초기화는 복사·공유 상태 메시지도 제거한다", async () => {
  const user = userEvent.setup();
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: async () => {} },
    configurable: true,
  });
  renderCalculator();
  await enterStandardSalary(user);
  await user.click(screen.getByRole("button", { name: "실수령액 계산하기" }));
  await user.click(screen.getByRole("button", { name: "결과 복사" }));
  assert.ok(screen.getByText("계산 결과를 복사했습니다."));

  await user.click(screen.getByRole("button", { name: "초기화" }));
  assert.equal(screen.queryByText("계산 결과를 복사했습니다."), null);
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
