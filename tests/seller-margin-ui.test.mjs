import assert from "node:assert/strict";
import { afterEach, before, beforeEach, test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
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

const { act, cleanup, render, screen, waitFor, within } = await import(
  "@testing-library/react"
);
const userEvent = (await import("@testing-library/user-event")).default;
const { SellerMarginCalculator } = await import(
  "../components/calculators/SellerMarginCalculator.tsx"
);
const React = await import("react");
const { SELLER_MARGIN_STORAGE_KEY, serializeSellerMarginInputs } = await import(
  "../components/calculators/sellerMarginClientUtils.ts"
);

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
  render(React.createElement(SellerMarginCalculator));
}

async function settleMount() {
  await act(async () => {
    await Promise.resolve();
  });
}

async function replaceValue(user, label, value) {
  const input = screen.getByLabelText(label);
  await user.clear(input);

  if (value !== "") {
    await user.type(input, value);
  }

  return input;
}

async function enterProfitableOrder(user) {
  await replaceValue(user, "상품 판매단가", "20000");
  await replaceValue(user, "판매수량", "2");
  await replaceValue(user, "판매자 부담 할인금액", "2000");
  await replaceValue(user, "고객에게 받은 배송비", "3000");
  await replaceValue(user, "상품 1개당 원가", "9000");
  await replaceValue(user, "플랫폼 수수료율", "10");
  await replaceValue(user, "결제 수수료율", "3");
  await replaceValue(user, "판매자 부담 배송비", "3500");
  await replaceValue(user, "배분 광고비", "2000");
  await replaceValue(user, "기타 비용", "500");
}

test("기본 입력값과 10개 연결된 입력 필드를 표시한다", async () => {
  renderCalculator();
  await settleMount();

  const inputs = [
    "상품 판매단가",
    "판매수량",
    "판매자 부담 할인금액",
    "고객에게 받은 배송비",
    "상품 1개당 원가",
    "플랫폼 수수료율",
    "결제 수수료율",
    "판매자 부담 배송비",
    "배분 광고비",
    "기타 비용",
  ].map((label) => screen.getByLabelText(label));

  assert.equal(inputs.length, 10);
  assert.equal(screen.getByLabelText("상품 판매단가").value, "");
  assert.equal(screen.getByLabelText("판매수량").value, "1");
  assert.equal(screen.getByLabelText("상품 1개당 원가").value, "");

  for (const label of [
    "판매자 부담 할인금액",
    "고객에게 받은 배송비",
    "플랫폼 수수료율",
    "결제 수수료율",
    "판매자 부담 배송비",
    "배분 광고비",
    "기타 비용",
  ]) {
    assert.equal(screen.getByLabelText(label).value, "0");
  }
});

test("계산 전에는 복사와 공유 버튼을 표시하지 않는다", async () => {
  Object.defineProperty(navigator, "share", {
    value: async () => {},
    configurable: true,
  });
  renderCalculator();
  await settleMount();

  assert.equal(screen.queryByRole("button", { name: "결과 복사" }), null);
  assert.equal(screen.queryByRole("button", { name: "공유" }), null);
});

test("정상 주문을 계산해 주요 결과와 상세 고정값을 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterProfitableOrder(user);

  await user.click(screen.getByRole("button", { name: "계산하기" }));

  assert.ok(screen.getByText("흑자"));
  assert.ok(screen.getByText("11,770원"));
  assert.ok(screen.getByText("순이익률 28.71%"));

  const result = screen.getByRole("region", { name: "주문 손익" });
  for (const expected of [
    "35,770원",
    "41,000원",
    "24,000원",
    "4,000원",
    "1,230원",
    "5,230원",
    "45%",
    "12.76%",
  ]) {
    assert.ok(within(result).getByText(expected));
  }

  assert.ok(screen.getByRole("button", { name: "결과 복사" }));
});

test("적자 주문은 색상에 의존하지 않고 적자 텍스트와 음수 금액을 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();

  await replaceValue(user, "상품 판매단가", "10000");
  await replaceValue(user, "상품 1개당 원가", "12000");
  await user.click(screen.getByRole("button", { name: "계산하기" }));

  assert.ok(screen.getByText("적자"));
  assert.ok(screen.getByText("-2,000원"));
  assert.ok(screen.getByText("순이익률 -20%"));
});

test("필수 입력 누락 시 결과를 숨기고 필드 오류와 접근성 속성을 적용한다", async () => {
  const user = userEvent.setup();
  renderCalculator();

  await user.click(screen.getByRole("button", { name: "계산하기" }));

  const unitPrice = screen.getByLabelText("상품 판매단가");
  const productCost = screen.getByLabelText("상품 1개당 원가");

  assert.equal(unitPrice.getAttribute("aria-invalid"), "true");
  assert.equal(productCost.getAttribute("aria-invalid"), "true");
  assert.ok(unitPrice.getAttribute("aria-describedby"));
  assert.match(
    screen.getByText("상품 판매단가 값을 숫자로 입력해 주세요.").textContent,
    /숫자로 입력/,
  );
  assert.equal(document.activeElement, unitPrice);
  assert.equal(screen.queryByText("예상 순이익"), null);
});

test("음수 금액, 잘못된 수수료율과 소수 판매수량 오류를 필드별로 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();

  await replaceValue(user, "상품 판매단가", "10000");
  await replaceValue(user, "상품 1개당 원가", "-1");
  await replaceValue(user, "플랫폼 수수료율", "100.1");
  await replaceValue(user, "판매수량", "1.5");
  await user.click(screen.getByRole("button", { name: "계산하기" }));

  assert.ok(screen.getByText(/상품 1개당 원가.*0 이상/));
  assert.ok(screen.getByText(/플랫폼 수수료율.*100% 이하/));
  assert.ok(screen.getByText("판매수량은 정수로 입력해 주세요."));
  assert.equal(screen.queryByText("예상 순이익"), null);
});

test("할인 초과와 결제금액 0 오류를 엔진 결과로 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();

  await replaceValue(user, "상품 판매단가", "10000");
  await replaceValue(user, "상품 1개당 원가", "1000");
  await replaceValue(user, "판매자 부담 할인금액", "10001");
  await user.click(screen.getByRole("button", { name: "계산하기" }));
  assert.ok(
    screen.getByText("할인금액은 상품 판매금액보다 클 수 없습니다."),
  );

  await replaceValue(user, "판매자 부담 할인금액", "10000");
  await user.click(screen.getByRole("button", { name: "계산하기" }));
  assert.ok(screen.getByText(/결제금액이 0원이 되지 않도록/));
});

test("숫자가 아닌 값과 비정상 숫자를 결과로 표시하지 않는다", async () => {
  const user = userEvent.setup();
  renderCalculator();

  await replaceValue(user, "상품 판매단가", "Infinity");
  await replaceValue(user, "상품 1개당 원가", "abc");
  await user.click(screen.getByRole("button", { name: "계산하기" }));

  assert.ok(screen.getAllByText(/숫자로 입력해 주세요/).length >= 2);
  assert.equal(document.body.textContent.includes("NaN%"), false);
  assert.equal(document.body.textContent.includes("Infinity%"), false);
  assert.equal(screen.queryByText("예상 순이익"), null);
});

test("계산 후 입력 변경을 알리고 다시 계산하면 새 결과를 표시한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterProfitableOrder(user);
  await user.click(screen.getByRole("button", { name: "계산하기" }));

  await replaceValue(user, "기타 비용", "1500");

  assert.ok(
    screen.getByText("입력값이 변경되었습니다. 다시 계산해 주세요."),
  );
  assert.ok(screen.getByText("11,770원"));
  assert.equal(screen.queryByRole("button", { name: "결과 복사" }), null);
  assert.equal(screen.queryByRole("button", { name: "공유" }), null);

  await user.click(screen.getByRole("button", { name: "계산하기" }));

  assert.equal(
    screen.queryByText("입력값이 변경되었습니다. 다시 계산해 주세요."),
    null,
  );
  assert.ok(screen.getByText("10,770원"));
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
  await enterProfitableOrder(user);
  await user.click(screen.getByRole("button", { name: "계산하기" }));
  await user.click(screen.getByRole("button", { name: "결과 복사" }));

  assert.equal(
    copiedText,
    [
      "판매자 마진 계산 결과",
      "",
      "[입력 조건]",
      "상품 판매단가: 20,000원",
      "판매수량: 2개",
      "개당 원가: 9,000원",
      "플랫폼 수수료율: 10%",
      "결제 수수료율: 3%",
      "",
      "[계산 결과]",
      "상품 판매금액: 40,000원",
      "결제금액: 41,000원",
      "상품 원가 총액: 18,000원",
      "총수수료: 5,230원",
      "총비용: 24,000원",
      "예상 순이익: 11,770원",
      "순이익률: 28.71%",
    ].join("\n"),
  );
  assert.ok(screen.getByText("계산 결과를 복사했습니다."));
});

test("Clipboard API 실패 시 대체 복사를 시도한다", async () => {
  const user = userEvent.setup();
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: async () => Promise.reject(new Error("denied")) },
    configurable: true,
  });
  Object.defineProperty(document, "execCommand", {
    value: (command) => command === "copy",
    configurable: true,
  });
  renderCalculator();
  await enterProfitableOrder(user);
  await user.click(screen.getByRole("button", { name: "계산하기" }));
  await user.click(screen.getByRole("button", { name: "결과 복사" }));

  assert.ok(screen.getByText("계산 결과를 복사했습니다."));
  assert.equal(document.querySelector("textarea"), null);
});

test("복사 API와 대체 복사가 모두 실패해도 페이지 오류 없이 안내한다", async () => {
  const user = userEvent.setup();
  Object.defineProperty(navigator, "clipboard", {
    value: undefined,
    configurable: true,
  });
  Object.defineProperty(document, "execCommand", {
    value: () => false,
    configurable: true,
  });
  renderCalculator();
  await enterProfitableOrder(user);
  await user.click(screen.getByRole("button", { name: "계산하기" }));
  await user.click(screen.getByRole("button", { name: "결과 복사" }));

  assert.ok(
    screen.getByText("결과를 복사하지 못했습니다. 다시 시도해 주세요."),
  );
});

test("Web Share 지원 환경에서 공유하고 성공을 안내한다", async () => {
  let sharedData;
  Object.defineProperty(navigator, "share", {
    value: async (data) => {
      sharedData = data;
    },
    configurable: true,
  });
  const user = userEvent.setup();
  renderCalculator();
  await enterProfitableOrder(user);
  await user.click(screen.getByRole("button", { name: "계산하기" }));
  const shareButton = await screen.findByRole("button", { name: "공유" });
  await user.click(shareButton);

  assert.equal(sharedData.title, "판매자 마진 계산 결과");
  assert.match(sharedData.text, /예상 순이익: 11,770원/);
  assert.equal(sharedData.url, "http://localhost/");
  assert.ok(screen.getByText("계산 결과를 공유했습니다."));
});

test("Web Share 취소와 실패를 구분한다", async () => {
  let shareError = new DOMException("cancelled", "AbortError");
  Object.defineProperty(navigator, "share", {
    value: async () => Promise.reject(shareError),
    configurable: true,
  });
  const user = userEvent.setup();
  renderCalculator();
  await enterProfitableOrder(user);
  await user.click(screen.getByRole("button", { name: "계산하기" }));
  const shareButton = await screen.findByRole("button", { name: "공유" });
  await user.click(shareButton);
  assert.ok(screen.getByText("공유가 취소되었습니다."));

  shareError = new Error("share failed");
  await user.click(shareButton);
  assert.ok(screen.getByText("결과를 공유하지 못했습니다."));
});

test("Web Share 미지원 환경에서는 공유를 숨기고 복사는 유지한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterProfitableOrder(user);
  await user.click(screen.getByRole("button", { name: "계산하기" }));

  assert.ok(screen.getByRole("button", { name: "결과 복사" }));
  assert.equal(screen.queryByRole("button", { name: "공유" }), null);
});

test("입력 변경 시 버전이 포함된 raw 문자열을 저장한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await replaceValue(user, "상품 판매단가", "100000");

  const stored = JSON.parse(
    window.localStorage.getItem(SELLER_MARGIN_STORAGE_KEY),
  );
  assert.equal(stored.version, 1);
  assert.equal(stored.inputs.unitPrice, "100000");
  assert.equal(stored.inputs.quantity, "1");
  assert.equal("result" in stored, false);
});

test("재마운트 시 입력만 복원하고 결과를 자동 계산하지 않는다", async () => {
  const storedInputs = {
    unitPrice: "100000",
    quantity: "5",
    sellerDiscount: "0",
    customerShippingFee: "1000",
    unitProductCost: "30000",
    platformFeeRate: "3",
    paymentFeeRate: "1",
    sellerShippingCost: "3000",
    allocatedAdCost: "1000",
    otherCost: "500",
  };
  window.localStorage.setItem(
    SELLER_MARGIN_STORAGE_KEY,
    serializeSellerMarginInputs(storedInputs),
  );

  renderCalculator();

  await waitFor(() => {
    assert.equal(screen.getByLabelText("상품 판매단가").value, "100000");
  });
  assert.equal(screen.queryByText("예상 순이익"), null);
  assert.ok(screen.getByText("입력값을 입력한 후 계산해 주세요."));
  assert.equal(screen.queryByRole("alert"), null);
});

test("초기 렌더는 기존 저장값을 기본값으로 덮어쓰지 않는다", async () => {
  const storedInputs = {
    unitPrice: "70000",
    quantity: "3",
    sellerDiscount: "0",
    customerShippingFee: "0",
    unitProductCost: "20000",
    platformFeeRate: "4",
    paymentFeeRate: "1",
    sellerShippingCost: "0",
    allocatedAdCost: "0",
    otherCost: "0",
  };
  const serialized = serializeSellerMarginInputs(storedInputs);
  window.localStorage.setItem(SELLER_MARGIN_STORAGE_KEY, serialized);

  renderCalculator();
  await waitFor(() => {
    assert.equal(screen.getByLabelText("판매수량").value, "3");
  });
  assert.equal(
    window.localStorage.getItem(SELLER_MARGIN_STORAGE_KEY),
    serialized,
  );
});

test("손상된 저장 데이터는 제거하고 기본값을 사용한다", async () => {
  window.localStorage.setItem(SELLER_MARGIN_STORAGE_KEY, "{");
  renderCalculator();

  await waitFor(() => {
    assert.equal(
      window.localStorage.getItem(SELLER_MARGIN_STORAGE_KEY),
      null,
    );
  });
  assert.equal(screen.getByLabelText("상품 판매단가").value, "");
  assert.equal(screen.getByLabelText("판매수량").value, "1");
});

test("localStorage 읽기 실패에도 기본 계산기를 사용할 수 있다", async () => {
  Object.defineProperty(window.localStorage, "getItem", {
    value: () => {
      throw new Error("storage denied");
    },
    configurable: true,
  });
  const user = userEvent.setup();
  renderCalculator();

  assert.equal(screen.getByLabelText("판매수량").value, "1");
  await enterProfitableOrder(user);
  await user.click(screen.getByRole("button", { name: "계산하기" }));
  assert.ok(screen.getByText("11,770원"));
});

test("localStorage 쓰기 실패에도 입력과 계산을 계속 사용할 수 있다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  Object.defineProperty(window.localStorage, "setItem", {
    value: () => {
      throw new Error("storage full");
    },
    configurable: true,
  });

  await enterProfitableOrder(user);
  await user.click(screen.getByRole("button", { name: "계산하기" }));

  assert.equal(screen.getByLabelText("상품 판매단가").value, "20000");
  assert.ok(screen.getByText("11,770원"));
});

test("초기화는 저장 키를 삭제하고 기본값을 즉시 다시 저장하지 않는다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await replaceValue(user, "상품 판매단가", "100000");
  assert.ok(window.localStorage.getItem(SELLER_MARGIN_STORAGE_KEY));

  await user.click(screen.getByRole("button", { name: "초기화" }));

  assert.equal(window.localStorage.getItem(SELLER_MARGIN_STORAGE_KEY), null);
  assert.equal(screen.getByLabelText("상품 판매단가").value, "");
  assert.equal(screen.queryByRole("button", { name: "결과 복사" }), null);
});

test("초기화는 입력, 오류, 결과와 변경 상태를 모두 복원한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterProfitableOrder(user);
  await user.click(screen.getByRole("button", { name: "계산하기" }));
  await replaceValue(user, "기타 비용", "1500");

  await user.click(screen.getByRole("button", { name: "초기화" }));

  assert.equal(screen.getByLabelText("상품 판매단가").value, "");
  assert.equal(screen.getByLabelText("판매수량").value, "1");
  assert.equal(screen.getByLabelText("기타 비용").value, "0");
  assert.ok(screen.getByText("입력값을 입력한 후 계산해 주세요."));
  assert.equal(screen.queryByText("예상 순이익"), null);
  assert.equal(screen.queryByRole("alert"), null);
  assert.equal(document.activeElement, screen.getByLabelText("상품 판매단가"));
});

test("Enter 키로 폼을 제출한다", async () => {
  const user = userEvent.setup();
  renderCalculator();
  await enterProfitableOrder(user);

  screen.getByLabelText("기타 비용").focus();
  await user.keyboard("{Enter}");

  assert.ok(screen.getByText("11,770원"));
  assert.ok(screen.getByText("흑자"));
});
