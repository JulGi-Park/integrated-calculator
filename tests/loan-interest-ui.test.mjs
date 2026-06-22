import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/calculators/loan/",
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
const { LoanInterestCalculator } = await import(
  "../components/calculators/LoanInterestCalculator.tsx"
);
const React = await import("react");

afterEach(() => {
  cleanup();
});

function renderCalculator() {
  render(React.createElement(LoanInterestCalculator));
}

async function replaceValue(user, label, value) {
  const input = screen.getByLabelText(label);
  await user.clear(input);
  if (value !== "") {
    await user.type(input, value);
  }
  return input;
}

async function enterLoan(user, {
  principal = "100000000",
  rate = "4.5",
  months = "360",
} = {}) {
  await replaceValue(user, "대출금액", principal);
  await replaceValue(user, "연이율", rate);
  await replaceValue(user, "대출기간", months);
}

async function calculate(user) {
  await user.click(screen.getByRole("button", { name: "상환방식 비교하기" }));
}

test("세 입력과 단위·서비스 제한 안내를 표시한다", () => {
  renderCalculator();

  assert.equal(screen.getByLabelText("대출금액").value, "");
  assert.equal(screen.getByLabelText("연이율").value, "");
  assert.equal(screen.getByLabelText("대출기간").value, "");
  assert.equal(screen.getByLabelText("대출금액").getAttribute("inputmode"), "numeric");
  assert.equal(screen.getByLabelText("연이율").getAttribute("inputmode"), "decimal");
  assert.equal(screen.getByLabelText("대출기간").getAttribute("inputmode"), "numeric");
  assert.ok(screen.getByText(/최대 100억원.*서비스 계산 제한/));
  assert.ok(screen.getByText(/소수점 이하 최대 4자리/));
  assert.ok(screen.getByText(/최대 600개월/));
});

test("대출금액 정수 입력에 천 단위 구분을 적용한다", async () => {
  const user = userEvent.setup();
  renderCalculator();

  await user.type(screen.getByLabelText("대출금액"), "100000000");

  assert.equal(screen.getByLabelText("대출금액").value, "100,000,000");
});

test("일반 대출의 결과 요약과 세 방식 고정값을 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterLoan(user);
  await calculate(user);

  const summary = screen.getByRole("region", { name: "대출 상환 비교 결과" });
  assert.ok(within(summary).getByText("100,000,000원"));
  assert.ok(within(summary).getByText("4.5%"));
  assert.ok(within(summary).getByText("360개월(30년)"));
  assert.ok(within(summary).getByText("원금균등상환"));
  assert.ok(within(summary).getByText("만기일시상환"));

  const cards = screen.getAllByRole("article");
  assert.equal(cards.length, 3);
  assert.ok(within(cards[0]).getByText("506,685원"));
  assert.ok(within(cards[0]).getByText("506,926원"));
  assert.ok(within(cards[0]).getByText("82,406,841원"));
  assert.ok(within(cards[0]).getByText("182,406,841원"));
  assert.ok(within(cards[1]).getByText("652,777원"));
  assert.ok(within(cards[1]).getByText("279,100원"));
  assert.ok(within(cards[1]).getByText("67,687,688원"));
  assert.ok(within(cards[2]).getByText("375,000원"));
  assert.ok(within(cards[2]).getByText("100,375,000원"));
  assert.ok(within(cards[2]).getByText("135,000,000원"));
  assert.equal(document.body.textContent.includes("NaN"), false);
  assert.equal(document.body.textContent.includes("Infinity"), false);
});

test("0% 금리 총이자 동률과 엔진 순서를 모두 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterLoan(user, {
    principal: "10000000",
    rate: "0",
    months: "12",
  });
  await calculate(user);

  assert.ok(
    screen.getByText(
      "원리금균등상환, 원금균등상환, 만기일시상환 공동",
    ),
  );
  assert.ok(screen.getAllByText("0원").length >= 3);
});

test("1개월 대출의 첫 달 부담 동률을 모두 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterLoan(user, {
    principal: "1000000",
    rate: "4.5",
    months: "1",
  });
  await calculate(user);

  assert.equal(
    screen.getAllByText(
      "원리금균등상환, 원금균등상환, 만기일시상환 공동",
    ).length,
    2,
  );
});

test("빈 입력 오류를 연결하고 첫 입력으로 포커스를 이동한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await calculate(user);

  const principal = screen.getByLabelText("대출금액");
  assert.equal(principal.getAttribute("aria-invalid"), "true");
  assert.match(principal.getAttribute("aria-describedby"), /principal-error/);
  assert.ok(screen.getByText("대출금액을 입력해 주세요."));
  assert.equal(document.activeElement, principal);
  assert.equal(screen.queryByText("대출 상환 비교 결과"), null);
});

test("원금·금리·기간 경계와 정밀도 오류를 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterLoan(user, {
    principal: "10000000001",
    rate: "4.12345",
    months: "600.5",
  });
  await calculate(user);

  assert.ok(screen.getByText(/10,000,000,000원 이하여야/));
  assert.ok(screen.getByText(/소수점 이하 4자리/));
  assert.ok(screen.getByText(/대출기간은 정수로 입력해 주세요/));
  assert.equal(screen.queryByText("대출 상환 비교 결과"), null);
});

test("100억원·100%·600개월 경계를 허용한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterLoan(user, {
    principal: "10000000000",
    rate: "100",
    months: "600",
  });
  await calculate(user);

  assert.ok(screen.getByText("대출 상환 비교 결과"));
  assert.ok(screen.getByText("전체 600회차 중 20회차 표시"));
  assert.equal(screen.getAllByRole("row").length, 21);
});

test("0원·음수 원금, 100% 초과 금리와 600개월 초과를 거부한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterLoan(user, {
    principal: "-1",
    rate: "100.1",
    months: "601",
  });
  await calculate(user);

  assert.ok(screen.getByText("대출금액은 0보다 커야 합니다."));
  assert.ok(screen.getByText(/100% 이하여야/));
  assert.ok(screen.getByText("대출기간은 600개월 이하여야 합니다."));
});

test("Enter 키로 계산하고 입력 변경·재계산 상태를 처리한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterLoan(user);
  screen.getByLabelText("대출기간").focus();
  await user.keyboard("{Enter}");

  assert.ok(screen.getByText("대출 상환 비교 결과"));
  await replaceValue(user, "연이율", "4.6");
  assert.ok(
    screen.getByText("입력값이 변경되었습니다. 다시 계산해 주세요."),
  );
  await calculate(user);
  assert.equal(
    screen.queryByText("입력값이 변경되었습니다. 다시 계산해 주세요."),
    null,
  );
});

test("초기화는 입력·오류·결과·선택 상태를 복원한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterLoan(user, { months: "21" });
  await calculate(user);
  await user.click(screen.getByRole("button", { name: "원금균등상환" }));
  await user.click(screen.getByRole("button", { name: /다음 1회차 더 보기/ }));
  await user.click(screen.getByRole("button", { name: "초기화" }));

  assert.equal(screen.getByLabelText("대출금액").value, "");
  assert.equal(screen.getByLabelText("연이율").value, "");
  assert.equal(screen.getByLabelText("대출기간").value, "");
  assert.equal(screen.queryByText("대출 상환 비교 결과"), null);
  assert.equal(document.activeElement, screen.getByLabelText("대출금액"));
});

test("기본 원리금균등 일정 20행과 마지막 회차 잔액을 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterLoan(user);
  await calculate(user);

  const selected = screen.getByRole("button", { name: "원리금균등상환" });
  assert.equal(selected.getAttribute("aria-pressed"), "true");
  assert.equal(screen.getAllByRole("row").length, 21);
  assert.ok(screen.getByText("전체 360회차 중 20회차 표시"));
  assert.ok(screen.getByText("마지막 360회차"));
  assert.ok(screen.getByText("납부 후 잔액 0원"));
});

test("상환방식을 전환하면 엔진 일정이 즉시 바뀐다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterLoan(user);
  await calculate(user);

  await user.click(screen.getByRole("button", { name: "원금균등상환" }));
  assert.equal(
    screen.getByRole("button", { name: "원금균등상환" }).getAttribute(
      "aria-pressed",
    ),
    "true",
  );
  assert.ok(screen.getAllByText("652,777원").length >= 1);

  await user.click(screen.getByRole("button", { name: "만기일시상환" }));
  assert.ok(screen.getAllByText("375,000원").length >= 1);
  assert.ok(screen.getByText("마지막 360회차"));
});

test("더 보기로 나머지 회차를 표시하고 완료 후 버튼을 제거한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterLoan(user, { months: "21" });
  await calculate(user);

  assert.equal(screen.getAllByRole("row").length, 21);
  const moreButton = screen.getByRole("button", {
    name: "다음 1회차 더 보기",
  });
  assert.equal(moreButton.getAttribute("type"), "button");
  await user.click(moreButton);

  assert.equal(screen.getAllByRole("row").length, 22);
  assert.ok(screen.getByText("전체 21회차 중 21회차 표시"));
  assert.equal(
    screen.queryByRole("button", { name: /더 보기/ }),
    null,
  );
});

test("1개월과 20개월 일정은 처음부터 전체를 표시하고 더 보기를 숨긴다", async () => {
  for (const months of ["1", "20"]) {
    const user = userEvent.setup();
    renderCalculator();
    await enterLoan(user, { months });
    await calculate(user);

    assert.equal(screen.getAllByRole("row").length, Number(months) + 1);
    assert.ok(
      screen.getByText(
        `전체 ${months}회차 중 ${months}회차 표시`,
      ),
    );
    assert.equal(screen.queryByRole("button", { name: /더 보기/ }), null);
    assert.ok(screen.getByText(`마지막 ${months}회차`));
    assert.ok(screen.getByText("납부 후 잔액 0원"));

    cleanup();
  }
});

test("40개월과 41개월 일정은 20회차 단위로 안전하게 확장한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterLoan(user, { months: "40" });
  await calculate(user);

  assert.equal(screen.getAllByRole("row").length, 21);
  await user.click(
    screen.getByRole("button", { name: "다음 20회차 더 보기" }),
  );
  assert.equal(screen.getAllByRole("row").length, 41);
  assert.ok(screen.getByText("전체 40회차 중 40회차 표시"));
  assert.equal(screen.queryByRole("button", { name: /더 보기/ }), null);

  cleanup();
  renderCalculator();
  const nextUser = userEvent.setup();
  await enterLoan(nextUser, { months: "41" });
  await calculate(nextUser);

  await nextUser.click(
    screen.getByRole("button", { name: "다음 20회차 더 보기" }),
  );
  assert.equal(screen.getAllByRole("row").length, 41);
  await nextUser.click(
    screen.getByRole("button", { name: "다음 1회차 더 보기" }),
  );
  assert.equal(screen.getAllByRole("row").length, 42);
  assert.ok(screen.getByText("전체 41회차 중 41회차 표시"));
  assert.equal(screen.queryByRole("button", { name: /더 보기/ }), null);
});

test("600개월 일정은 20회차씩 늘고 전체 회차에 중복·누락이 없다", async (t) => {
  const user = userEvent.setup();
  renderCalculator();
  const startedAt = performance.now();
  await enterLoan(user, {
    principal: "10000000000",
    rate: "100",
    months: "600",
  });
  await calculate(user);

  assert.equal(screen.getAllByRole("row").length, 21);

  let expectedVisible = 20;
  while (screen.queryByRole("button", { name: /더 보기/ })) {
    const moreButton = screen.getByRole("button", { name: /더 보기/ });
    expectedVisible = Math.min(expectedVisible + 20, 600);
    await user.click(moreButton);
    assert.equal(screen.getAllByRole("row").length, expectedVisible + 1);
  }

  const installments = screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => Number(within(row).getByRole("rowheader").textContent));

  assert.equal(installments.length, 600);
  assert.equal(new Set(installments).size, 600);
  assert.deepEqual(
    installments,
    Array.from({ length: 600 }, (_, index) => index + 1),
  );
  assert.ok(screen.getByText("전체 600회차 중 600회차 표시"));
  assert.equal(screen.queryByRole("button", { name: /더 보기/ }), null);
  assert.ok(screen.getByText("마지막 600회차"));
  assert.ok(screen.getByText("납부 후 잔액 0원"));

  t.diagnostic(
    `jsdom에서 최대 입력 계산부터 600행 표시까지 ${Math.round(
      performance.now() - startedAt,
    )}ms`,
  );
});

test("방식 변경은 caption과 일정만 교체하고 표시 개수를 20회차로 복원한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterLoan(user, { months: "41" });
  await calculate(user);
  await user.click(
    screen.getByRole("button", { name: "다음 20회차 더 보기" }),
  );
  assert.equal(screen.getAllByRole("row").length, 41);

  await user.click(screen.getByRole("button", { name: "원금균등상환" }));
  assert.equal(screen.getAllByRole("row").length, 21);
  assert.ok(
    screen.getByRole("table", {
      name: "원금균등상환 월별 상환 일정",
    }),
  );
  assert.ok(screen.getByText("전체 41회차 중 20회차 표시"));

  await user.click(screen.getByRole("button", { name: "만기일시상환" }));
  assert.equal(screen.getAllByRole("row").length, 21);
  assert.ok(
    screen.getByRole("table", {
      name: "만기일시상환 월별 상환 일정",
    }),
  );
  assert.ok(screen.getAllByText("375,000원").length >= 1);
});

test("성공 결과 뒤 검증 실패 시 이전 결과와 일정이 제거된다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterLoan(user);
  await calculate(user);
  assert.ok(screen.getByText("대출 상환 비교 결과"));

  await replaceValue(user, "연이율", "4.12345");
  await calculate(user);

  assert.ok(screen.getByText(/소수점 이하 4자리/));
  assert.equal(screen.queryByText("대출 상환 비교 결과"), null);
  assert.equal(screen.queryByRole("table"), null);
});

test("새 계산은 일정 선택과 표시 개수를 기본값으로 복원한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterLoan(user, { months: "21" });
  await calculate(user);
  await user.click(screen.getByRole("button", { name: "원금균등상환" }));
  await user.click(screen.getByRole("button", { name: /더 보기/ }));
  await replaceValue(user, "대출기간", "22");
  await calculate(user);

  assert.equal(
    screen.getByRole("button", { name: "원리금균등상환" }).getAttribute(
      "aria-pressed",
    ),
    "true",
  );
  assert.ok(screen.getByText("전체 22회차 중 20회차 표시"));
});

test("일정 표는 열 제목·caption과 키보드 접근 가능한 스크롤 영역을 제공한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterLoan(user, { months: "1" });
  await calculate(user);

  assert.ok(screen.getByRole("table", { name: "원리금균등상환 월별 상환 일정" }));
  for (const heading of [
    "회차",
    "납부 전 잔액",
    "원금",
    "이자",
    "월 납입액",
    "납부 후 잔액",
  ]) {
    assert.ok(screen.getByRole("columnheader", { name: heading }));
  }
  const region = screen.getByRole("region", {
    name: /가로로 스크롤할 수 있습니다/,
  });
  assert.equal(region.getAttribute("tabindex"), "0");
  assert.equal(screen.getAllByRole("row").length, 2);
  assert.equal(
    screen.getByRole("button", { name: "상환방식 비교하기" }).getAttribute(
      "type",
    ),
    "submit",
  );
  assert.equal(
    screen.getByRole("button", { name: "초기화" }).getAttribute("type"),
    "button",
  );
  assert.equal(
    screen.getByRole("button", { name: "원금균등상환" }).getAttribute("type"),
    "button",
  );
});
