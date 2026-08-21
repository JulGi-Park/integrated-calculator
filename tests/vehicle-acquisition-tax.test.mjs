import assert from "node:assert/strict";
import test from "node:test";
import { calculateVehicleAcquisitionTaxFromUnknown, VEHICLE_ACQUISITION_TAX_POLICY } from "../lib/calculators/vehicle-acquisition-tax/vehicleAcquisitionTax.ts";
const base = { acquisitionMode: "new", vehicleType: "passenger", ecoType: "none", taxableBaseInput: 30_000_000 };
function result(input) { const response = calculateVehicleAcquisitionTaxFromUnknown(input); assert.equal(response.success, true); return response.data; }
test("2026 정책 기준일과 기본 차량 세율을 적용한다", () => {
  assert.equal(VEHICLE_ACQUISITION_TAX_POLICY.checkedAt, "2026-08-21");
  assert.equal(result(base).grossTax, 2_100_000);
  assert.equal(result({ ...base, vehicleType: "lightPassenger", taxableBaseInput: 30_000_000 }).grossTax, 1_200_000);
  assert.equal(result({ ...base, vehicleType: "other" }).grossTax, 1_500_000);
  assert.equal(result({ ...base, vehicleType: "business" }).grossTax, 1_200_000);
});
test("중고차 과세표준은 실제 취득가격과 시가표준액 중 높은 값이다", () => {
  const lowerActual = result({ ...base, acquisitionMode: "used", taxableBaseInput: 12_000_000, standardValue: 14_000_000 });
  const higherActual = result({ ...base, acquisitionMode: "used", taxableBaseInput: 15_000_000, standardValue: 14_000_000 });
  assert.equal(lowerActual.taxableBase, 14_000_000); assert.equal(lowerActual.grossTax, 980_000);
  assert.equal(higherActual.taxableBase, 15_000_000); assert.equal(higherActual.grossTax, 1_050_000);
});
test("전기·수소·경형 차량 감면 한도와 면제를 적용한다", () => {
  const ev = result({ ...base, ecoType: "electric" }); const h2 = result({ ...base, ecoType: "hydrogen" });
  const light = result({ ...base, vehicleType: "lightPassenger", taxableBaseInput: 10_000_000 }); const lightOther = result({ ...base, vehicleType: "lightOther" });
  assert.deepEqual([ev.reliefAmount, ev.finalTax], [1_400_000, 700_000]); assert.deepEqual([h2.reliefAmount, h2.finalTax], [1_400_000, 700_000]);
  assert.deepEqual([light.reliefAmount, light.finalTax], [400_000, 0]); assert.deepEqual([lightOther.reliefAmount, lightOther.finalTax], [1_200_000, 0]);
});
test("감면 한도 초과와 중복 감면 금지를 처리하고 하이브리드는 자동 감면하지 않는다", () => {
  const light = result({ ...base, vehicleType: "lightPassenger", taxableBaseInput: 30_000_000 });
  const combined = result({ ...base, vehicleType: "lightPassenger", ecoType: "electric", taxableBaseInput: 50_000_000 });
  assert.deepEqual([light.reliefAmount, light.finalTax], [750_000, 450_000]);
  assert.deepEqual([combined.reliefType, combined.reliefAmount, combined.finalTax], ["electric", 1_400_000, 600_000]);
  assert.deepEqual([result(base).reliefType, result(base).reliefAmount], ["none", 0]);
});
test("빈값·0·음수·소수·과대·중고차 시가표준액 누락을 거부한다", () => {
  for (const [input, field] of [[{ ...base, taxableBaseInput: 0 }, "taxableBaseInput"], [{ ...base, taxableBaseInput: -1 }, "taxableBaseInput"], [{ ...base, taxableBaseInput: 1.5 }, "taxableBaseInput"], [{ ...base, taxableBaseInput: VEHICLE_ACQUISITION_TAX_POLICY.maximumAmount + 1 }, "taxableBaseInput"], [{ ...base, acquisitionMode: "used" }, "standardValue"]]) { const response = calculateVehicleAcquisitionTaxFromUnknown(input); assert.equal(response.success, false); assert.equal(response.errors[0].field, field); }
});
