import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { metadata } from "../app/calculators/average-price/page.tsx";
import {
  AVERAGE_PRICE_MAX_INPUT,
  calculateAveragePrice,
  validateAveragePriceInput,
} from "../lib/calculators/average-price/average-price.ts";

const baseInput = {
  currentQuantity: 10,
  currentAveragePrice: 50_000,
  additionalQuantity: 5,
  additionalPrice: 40_000,
};

test("물타기 계산기는 전용 Open Graph와 Twitter 이미지를 사용한다", async () => {
  const image = "https://gyesanbox.kr/og/average-price.png";
  const png = await readFile("public/og/average-price.png");

  assert.equal(metadata.alternates.canonical, "https://gyesanbox.kr/calculators/average-price/");
  assert.equal(metadata.openGraph.url, "https://gyesanbox.kr/calculators/average-price/");
  assert.deepEqual(metadata.openGraph.images, [
    { url: image, width: 1200, height: 630, alt: metadata.title },
  ]);
  assert.equal(metadata.twitter.card, "summary_large_image");
  assert.deepEqual(metadata.twitter.images, [image]);
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
});

function assertSuccess(response) {
  assert.equal(response.success, true);
  return response.data;
}

function assertHasError(response, field, code) {
  assert.equal(response.success, false);
  assert.ok(
    response.errors.some(
      (error) => error.field === field && error.code === code,
    ),
    `${field} 필드에 ${code} 오류가 있어야 합니다.`,
  );
}

test("추가 매수 단가가 기존 평균 단가보다 낮으면 평균 단가가 내려간다", () => {
  const data = assertSuccess(calculateAveragePrice(baseInput));

  assert.deepEqual(data, {
    existingInvestmentAmount: 500_000,
    additionalInvestmentAmount: 200_000,
    totalQuantity: 15,
    totalInvestmentAmount: 700_000,
    newAveragePrice: 46_666.67,
    expectedValuationAmount: null,
    expectedProfitLoss: null,
    expectedProfitRate: null,
  });
});

test("추가 매수 단가가 기존 평균 단가보다 높으면 평균 단가가 올라간다", () => {
  const data = assertSuccess(
    calculateAveragePrice({
      ...baseInput,
      additionalPrice: 80_000,
    }),
  );

  assert.equal(data.newAveragePrice, 60_000);
});

test("추가 매수 단가가 기존 평균 단가와 같으면 평균 단가가 동일하다", () => {
  const data = assertSuccess(
    calculateAveragePrice({
      ...baseInput,
      additionalPrice: 50_000,
    }),
  );

  assert.equal(data.newAveragePrice, 50_000);
});

test("소수 수량 입력을 계산한다", () => {
  const data = assertSuccess(
    calculateAveragePrice({
      currentQuantity: 1.25,
      currentAveragePrice: 40_000,
      additionalQuantity: 0.75,
      additionalPrice: 44_000,
    }),
  );

  assert.equal(data.totalQuantity, 2);
  assert.equal(data.totalInvestmentAmount, 83_000);
  assert.equal(data.newAveragePrice, 41_500);
});

test("현재가 입력 시 예상 평가금액, 손익, 수익률을 계산한다", () => {
  const data = assertSuccess(
    calculateAveragePrice({
      ...baseInput,
      targetPrice: 45_000,
    }),
  );

  assert.equal(data.expectedValuationAmount, 675_000);
  assert.equal(data.expectedProfitLoss, -25_000);
  assert.equal(data.expectedProfitRate, -3.57);
});

for (const field of [
  "currentQuantity",
  "currentAveragePrice",
  "additionalQuantity",
  "additionalPrice",
  "targetPrice",
]) {
  test(`${field} 값이 0 이하이면 거부한다`, () => {
    assertHasError(
      calculateAveragePrice({ ...baseInput, [field]: 0 }),
      field,
      "MUST_BE_POSITIVE",
    );
    assertHasError(
      calculateAveragePrice({ ...baseInput, [field]: -1 }),
      field,
      "MUST_BE_POSITIVE",
    );
  });
}

for (const invalidValue of ["100", null, undefined]) {
  test(`숫자가 아닌 값 ${String(invalidValue)}을 거부한다`, () => {
    assertHasError(
      calculateAveragePrice({
        ...baseInput,
        currentAveragePrice: invalidValue,
      }),
      "currentAveragePrice",
      "INVALID_NUMBER",
    );
  });
}

test("선택 입력인 현재가 또는 목표 매도가는 빈 값을 허용한다", () => {
  const errors = validateAveragePriceInput({
    ...baseInput,
    targetPrice: undefined,
  });

  assert.equal(errors.length, 0);
});

test("과도하게 큰 값을 거부한다", () => {
  assertHasError(
    calculateAveragePrice({
      ...baseInput,
      currentQuantity: AVERAGE_PRICE_MAX_INPUT + 1,
    }),
    "currentQuantity",
    "TOO_LARGE",
  );
});

for (const invalidValue of [Number.NaN, Infinity, -Infinity]) {
  test(`${String(invalidValue)} 입력을 거부한다`, () => {
    assertHasError(
      calculateAveragePrice({
        ...baseInput,
        additionalPrice: invalidValue,
      }),
      "additionalPrice",
      "INVALID_NUMBER",
    );
  });
}

test("계산 함수는 입력 객체를 변경하지 않는다", () => {
  const input = { ...baseInput, targetPrice: 45_000 };
  const snapshot = structuredClone(input);

  calculateAveragePrice(input);

  assert.deepEqual(input, snapshot);
});
