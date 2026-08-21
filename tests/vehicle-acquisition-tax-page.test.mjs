import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const root = new URL("../", import.meta.url);
async function source(path) { return readFile(new URL(path, root), "utf8"); }
test("자동차 취득세 페이지는 private gate와 SEO·JSON-LD·공식 출처를 갖는다", async () => {
  const [page, content, policy, publication] = await Promise.all([source("app/calculators/vehicle-acquisition-tax/page.tsx"),source("components/calculators/VehicleAcquisitionTaxContent.tsx"),source("lib/calculators/vehicle-acquisition-tax/vehicleAcquisitionTax.ts"),source("lib/calculators/vehicle-acquisition-tax/publication.ts")]);
  assert.match(page,/자동차 취득세 계산기/); assert.match(page,/canonical/); assert.match(page,/WebApplication/); assert.match(page,/FAQPage/); assert.match(page,/notFound/);
  assert.match(content,/하이브리드/); assert.match(content,/공식 출처/); assert.match(content,/시가표준액/); assert.match(policy,/2026-08-21/); assert.match(policy,/2026-12-31/); assert.match(policy,/2027-12-31/); assert.match(publication,/NEXT_PUBLIC_ENABLE_VEHICLE_ACQUISITION_TAX_CALCULATOR/); assert.match(publication,/value === "true"/);
});
