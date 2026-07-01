import assert from "node:assert/strict";
import test from "node:test";
import { isParentalLeaveCalculatorEnabled } from "../lib/calculators/parental-leave/parentalLeaveVisibility.ts";

test("육아휴직급여 계산기는 정확히 true 값에서만 공개된다", () => {
  assert.equal(isParentalLeaveCalculatorEnabled(undefined), false);
  assert.equal(isParentalLeaveCalculatorEnabled(""), false);
  assert.equal(isParentalLeaveCalculatorEnabled("false"), false);
  assert.equal(isParentalLeaveCalculatorEnabled("0"), false);
  assert.equal(isParentalLeaveCalculatorEnabled("TRUE"), false);
  assert.equal(isParentalLeaveCalculatorEnabled("yes"), false);
  assert.equal(isParentalLeaveCalculatorEnabled("true"), true);
});
