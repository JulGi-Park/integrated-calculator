import assert from "node:assert/strict";
import test from "node:test";
import {
  isRoasCalculatorEnabled,
  ROAS_CALCULATOR_FLAG,
} from "../lib/calculators/roas/roasVisibility.ts";

test("ROAS 공개 플래그는 기본값이 비공개다", () => {
  assert.equal(isRoasCalculatorEnabled(undefined), false);
});

test("ROAS 공개 플래그는 false, 0, TRUE와 기타 문자열을 비공개로 처리한다", () => {
  for (const value of ["false", "0", "TRUE", "True", "yes", "", " true "]) {
    assert.equal(isRoasCalculatorEnabled(value), false);
  }
});

test("ROAS 공개 플래그는 정확히 true일 때만 공개한다", () => {
  assert.equal(isRoasCalculatorEnabled("true"), true);
});

test("ROAS 공개 플래그 함수는 process.env 값을 기본으로 읽는다", () => {
  const previousValue = process.env[ROAS_CALCULATOR_FLAG];

  try {
    delete process.env[ROAS_CALCULATOR_FLAG];
    assert.equal(isRoasCalculatorEnabled(), false);

    process.env[ROAS_CALCULATOR_FLAG] = "false";
    assert.equal(isRoasCalculatorEnabled(), false);

    process.env[ROAS_CALCULATOR_FLAG] = "true";
    assert.equal(isRoasCalculatorEnabled(), true);
  } finally {
    if (typeof previousValue === "undefined") {
      delete process.env[ROAS_CALCULATOR_FLAG];
    } else {
      process.env[ROAS_CALCULATOR_FLAG] = previousValue;
    }
  }
});
