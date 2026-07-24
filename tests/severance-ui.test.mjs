import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { afterEach, before, beforeEach, test } from "node:test";
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

const { act, cleanup, render, screen, within } = await import(
  "@testing-library/react"
);
const userEvent = (await import("@testing-library/user-event")).default;
const { SeveranceCalculator } = await import(
  "../components/calculators/SeveranceCalculator.tsx"
);
const { calculateSeverance } = await import(
  "../lib/calculators/severance/severance.ts"
);
const {
  SEVERANCE_STORAGE_KEY,
  serializeSeveranceInputs,
} = await import("../components/calculators/severanceClientUtils.ts");
const { SELLER_MARGIN_STORAGE_KEY } = await import(
  "../components/calculators/sellerMarginClientUtils.ts"
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

async function settleMount() {
  await act(async () => {
    await Promise.resolve();
  });
}

test("페이지 제목과 기준일 안내를 표시한다", () => {
  assert.equal((pageSource.match(/<CompactCalculatorHero\b/g) ?? []).length, 1);
  assert.match(pageSource, /퇴직금 계산기/);
  assert.match(pageSource, /기준 확인일:/);
  assert.match(pageSource, /예상 금액이며 실제 지급액과 다를 수 있습니다/);
});

test("계산기 목록에 퇴직금 계산기 링크를 활성화하고 기존 링크를 유지한다", () => {
  assert.match(listPageSource, /href="\/calculators\/loan\/"/);
  assert.match(listPageSource, /href="\/calculators\/salary\/"/);
  assert.match(listPageSource, /href="\/calculators\/seller-margin\/"/);
  assert.match(listPageSource, /href="\/calculators\/severance\/"/);
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

test("개인정보 안내를 입력 영역 가까이에 표시한다", () => {
  renderCalculator();
  assert.ok(
    screen.getByText(
      "입력값은 서버로 전송하지 않고 현재 브라우저에만 저장됩니다.",
    ),
  );
});

test("입력 변경 시 퇴직금 전용 키에 버전과 raw 입력값만 저장한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await settleMount();
  await replaceValue(user, "입사일", "2014-10-02");
  await replaceValue(user, "퇴직 전 3개월 임금총액", "7080000");

  const stored = JSON.parse(window.localStorage.getItem(SEVERANCE_STORAGE_KEY));
  assert.equal(stored.version, 1);
  assert.deepEqual(stored.inputs, {
    employmentStartDate: "2014-10-02",
    retirementDate: "",
    wagesForAveragePeriod: "7080000",
    annualBonusTotal: "0",
    annualLeaveAllowanceTotal: "0",
    ordinaryDailyWage: "",
    averageWeeklyContractHours: "40",
  });
  assert.equal("result" in stored, false);
});

test("저장 입력을 복원하되 계산 결과는 복원하지 않는다", async () => {
  window.localStorage.setItem(
    SEVERANCE_STORAGE_KEY,
    serializeSeveranceInputs({
      employmentStartDate: "2014-10-02",
      retirementDate: "2017-09-16",
      wagesForAveragePeriod: "7080000",
      annualBonusTotal: "4000000",
      annualLeaveAllowanceTotal: "300000",
      ordinaryDailyWage: "",
      averageWeeklyContractHours: "40",
    }),
  );
  renderCalculator();

  await screen.findByDisplayValue("2014-10-02");
  assert.equal(screen.getByLabelText("퇴직일").value, "2017-09-16");
  assert.equal(screen.getByLabelText("퇴직 전 3개월 임금총액").value, "7,080,000");
  assert.equal(screen.queryByText("예상 퇴직금"), null);
  assert.equal(screen.queryByRole("button", { name: "결과 복사" }), null);
  assert.equal(screen.queryByRole("button", { name: "공유" }), null);
});

for (const [name, storedValue] of [
  ["손상된 JSON", "{"],
  ["이전 버전", JSON.stringify({ version: 0, inputs: {} })],
  ["inputs 구조 이상", JSON.stringify({ version: 1, inputs: [] })],
  [
    "필드 타입 이상",
    JSON.stringify({
      version: 1,
      inputs: {
        employmentStartDate: "2014-10-02",
        retirementDate: "2017-09-16",
        wagesForAveragePeriod: 7080000,
        annualBonusTotal: "4000000",
        annualLeaveAllowanceTotal: "300000",
        ordinaryDailyWage: "",
        averageWeeklyContractHours: "40",
      },
    }),
  ],
]) {
  test(`${name} 저장 데이터는 제거하고 기본 입력을 유지한다`, async () => {
    window.localStorage.setItem(SEVERANCE_STORAGE_KEY, storedValue);
    renderCalculator();

    await settleMount();
    assert.equal(window.localStorage.getItem(SEVERANCE_STORAGE_KEY), null);
    assert.equal(screen.getByLabelText("입사일").value, "");
    assert.equal(screen.getByLabelText("최근 1년 상여금 총액").value, "0");
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
  await enterOfficialExample(user);
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));
  assert.ok(screen.getAllByText("7,868,434원").length >= 1);
});

test("localStorage 쓰기 실패에도 입력과 계산을 계속한다", async () => {
  Object.defineProperty(window.localStorage, "setItem", {
    value: () => {
      throw new DOMException("quota", "QuotaExceededError");
    },
    configurable: true,
  });
  const user = userEvent.setup();
  renderCalculator();
  await settleMount();
  await enterOfficialExample(user);
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));
  assert.ok(screen.getAllByText("7,868,434원").length >= 1);
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

test("초기화는 퇴직금 저장값만 삭제하고 다른 계산기 저장값은 보존한다", async () => {
  const sellerStoredValue = '{"seller":"preserved"}';
  const user = userEvent.setup();
  window.localStorage.setItem(SELLER_MARGIN_STORAGE_KEY, sellerStoredValue);
  renderCalculator();
  await settleMount();
  await replaceValue(user, "입사일", "2014-10-02");
  assert.ok(window.localStorage.getItem(SEVERANCE_STORAGE_KEY));

  await user.click(screen.getByRole("button", { name: "초기화" }));

  assert.equal(window.localStorage.getItem(SEVERANCE_STORAGE_KEY), null);
  assert.equal(
    window.localStorage.getItem(SELLER_MARGIN_STORAGE_KEY),
    sellerStoredValue,
  );
});

test("localStorage 삭제 실패에도 초기화와 이후 계산을 계속한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await settleMount();
  await enterOfficialExample(user);
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));
  Object.defineProperty(window.localStorage, "removeItem", {
    value: () => {
      throw new Error("delete denied");
    },
    configurable: true,
  });

  await user.click(screen.getByRole("button", { name: "초기화" }));
  assert.equal(screen.getByLabelText("입사일").value, "");
  assert.equal(screen.queryByText("예상 퇴직금"), null);

  await enterOfficialExample(user);
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));
  assert.ok(screen.getAllByText("7,868,434원").length >= 1);
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

test("Clipboard API로 퇴직금 결과 텍스트를 복사하고 성공을 안내한다", async () => {
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
  await enterOfficialExample(user);
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));
  await user.click(screen.getByRole("button", { name: "결과 복사" }));

  assert.match(copiedText, /^퇴직금 계산 결과/);
  assert.match(copiedText, /예상 퇴직금: 7,868,434원/);
  assert.match(copiedText, /대상 여부: 대상/);
  assert.match(copiedText, /총 재직일수: 1,080일/);
  assert.match(copiedText, /적용 1일 임금: 88,641.31원/);
  assert.match(copiedText, /평균임금: 88,641.31원/);
  assert.match(copiedText, /통상임금: 입력하지 않음/);
  assert.match(copiedText, /88,641.31원 × 30일 × 1,080일 ÷ 365일/);
  assert.equal(copiedText.includes("NaN"), false);
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
  await enterOfficialExample(user);
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));
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
  await enterOfficialExample(user);
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));
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
  await enterOfficialExample(user);
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));
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
  await enterOfficialExample(user);
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));
  const shareButton = await screen.findByRole("button", { name: "공유" });
  await user.click(shareButton);

  assert.equal(sharedData.title, "퇴직금 계산 결과");
  assert.match(sharedData.text, /예상 퇴직금: 7,868,434원/);
  assert.match(sharedData.text, /대상 여부: 대상/);
  assert.equal(sharedData.url, "http://localhost/calculators/severance/");
  assert.ok(screen.getByText("계산 결과를 공유했습니다."));
});

test("Web Share 미지원 환경에서는 공유를 숨기고 복사는 유지한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await settleMount();
  await enterOfficialExample(user);
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));

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
  await enterOfficialExample(user);
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));
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
  await enterOfficialExample(user);
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));
  await user.click(await screen.findByRole("button", { name: "공유" }));

  assert.ok(
    screen.getByText(
      "결과를 공유하지 못했습니다. 결과 복사를 이용해 주세요.",
    ),
  );
});

test("계산 실패 상태에서는 복사와 공유를 사용할 수 없다", async () => {
  Object.defineProperty(navigator, "share", {
    value: async () => {},
    configurable: true,
  });
  const user = userEvent.setup();
  renderCalculator();
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));

  assert.equal(screen.queryByRole("button", { name: "결과 복사" }), null);
  assert.equal(screen.queryByRole("button", { name: "공유" }), null);
});

test("입력 변경 후 재계산 전에는 오래된 결과를 복사·공유할 수 없다", async () => {
  Object.defineProperty(navigator, "share", {
    value: async () => {},
    configurable: true,
  });
  const user = userEvent.setup();
  renderCalculator();
  await enterOfficialExample(user);
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));
  assert.ok(screen.getByRole("button", { name: "결과 복사" }));

  await replaceValue(user, "최근 1년 상여금 총액", "5000000");
  assert.ok(
    screen.getByText(
      "입력값이 변경되었습니다. 변경된 조건을 반영하려면 다시 계산하세요.",
    ),
  );
  assert.equal(screen.queryByRole("button", { name: "결과 복사" }), null);
  assert.equal(screen.queryByRole("button", { name: "공유" }), null);

  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));
  assert.ok(screen.getByRole("button", { name: "결과 복사" }));
  assert.ok(await screen.findByRole("button", { name: "공유" }));
});

test("초기화는 복사·공유 상태 메시지도 제거한다", async () => {
  const user = userEvent.setup();
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: async () => {} },
    configurable: true,
  });
  renderCalculator();
  await enterOfficialExample(user);
  await user.click(screen.getByRole("button", { name: "퇴직금 계산하기" }));
  await user.click(screen.getByRole("button", { name: "결과 복사" }));
  assert.ok(screen.getByText("계산 결과를 복사했습니다."));

  await user.click(screen.getByRole("button", { name: "초기화" }));
  assert.equal(screen.queryByText("계산 결과를 복사했습니다."), null);
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
