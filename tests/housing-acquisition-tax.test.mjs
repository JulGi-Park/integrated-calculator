import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { calculateHousingAcquisitionTax, validateHousingAcquisitionTaxInput } from "../lib/calculators/housing-acquisition-tax/housingAcquisitionTax.ts";
import { housingAcquisitionTaxFaqJsonLd, housingAcquisitionTaxFaqs } from "../components/calculators/housingAcquisitionTaxContentData.ts";

const baseInput = { acquisitionPrice: 600_000_000, existingHomeCount: "0", regulatoryArea: "non-regulated", exceeds85SquareMeters: false };
function success(input) { const response = calculateHousingAcquisitionTax(input); assert.equal(response.success, true); return response.data; }

test("기본세율 경계값: 6억 이하 1%, 9억 초과 3%, 중간구간 산식을 적용한다", () => {
  assert.equal(success(baseInput).acquisitionTaxRateUnits, 10_000);
  assert.equal(success({ ...baseInput, acquisitionPrice: 600_000_001 }).acquisitionTaxRateUnits, 10_000);
  assert.equal(success({ ...baseInput, acquisitionPrice: 750_000_000 }).acquisitionTaxRateUnits, 20_000);
  assert.equal(success({ ...baseInput, acquisitionPrice: 900_000_000 }).acquisitionTaxRateUnits, 30_000);
  assert.equal(success({ ...baseInput, acquisitionPrice: 900_000_001 }).acquisitionTaxRateUnits, 30_000);
});

test("주택 수와 조정대상지역에 따른 8%·12% 중과세율을 구분한다", () => {
  assert.equal(success({ ...baseInput, existingHomeCount: "1", regulatoryArea: "regulated" }).acquisitionTaxRateUnits, 80_000);
  assert.equal(success({ ...baseInput, existingHomeCount: "2", regulatoryArea: "non-regulated" }).acquisitionTaxRateUnits, 80_000);
  assert.equal(success({ ...baseInput, existingHomeCount: "2", regulatoryArea: "regulated" }).acquisitionTaxRateUnits, 120_000);
  assert.equal(success({ ...baseInput, existingHomeCount: "3-plus", regulatoryArea: "non-regulated" }).acquisitionTaxRateUnits, 120_000);
});

test("세목별 계산: 전용 85㎡ 초과, 중과세, 감면 미반영을 표시한다", () => {
  const result = success({ ...baseInput, acquisitionPrice: 1_000_000_000, existingHomeCount: "1", regulatoryArea: "regulated", exceeds85SquareMeters: true });
  assert.equal(result.acquisitionTax, 80_000_000);
  assert.equal(result.localEducationTax, 4_000_000);
  assert.equal(result.ruralSpecialTax, 6_000_000);
  assert.equal(result.reliefAmount, 0);
  assert.equal(result.finalTotal, 90_000_000);
});

test("중간 기본세율 구간의 지방교육세는 취득세율의 10%를 소수점까지 적용한다", () => {
  const result = success({ ...baseInput, acquisitionPrice: 650_000_000 });
  assert.equal(result.acquisitionTaxRateUnits, 13_333);
  assert.equal(result.acquisitionTax, 8_666_450);
  assert.equal(result.localEducationTax, 866_645);
});

test("입력 검증은 비정상 금액과 선택값을 거부한다", () => {
  assert.ok(validateHousingAcquisitionTaxInput(null).length >= 4);
  assert.ok(validateHousingAcquisitionTaxInput({ ...baseInput, acquisitionPrice: 1.5 }).some((error) => error.code === "MUST_BE_INTEGER"));
  assert.ok(validateHousingAcquisitionTaxInput({ ...baseInput, acquisitionPrice: 0 }).some((error) => error.code === "MUST_BE_POSITIVE"));
  assert.ok(validateHousingAcquisitionTaxInput({ ...baseInput, existingHomeCount: "4" }).some((error) => error.field === "existingHomeCount"));
});

test("비공개 페이지·콘텐츠·FAQ는 가드와 공식 출처를 제공한다", async () => {
  const [page, content] = await Promise.all([readFile("app/calculators/housing-acquisition-tax/page.tsx", "utf8"), readFile("components/calculators/HousingAcquisitionTaxContent.tsx", "utf8")]);
  assert.match(page, /NEXT_PUBLIC_ENABLE_HOUSING_ACQUISITION_TAX_CALCULATOR/);
  assert.match(page, /notFound\(\)/);
  assert.match(page, /robots: \{ index: false, follow: false \}/);
  assert.match(content, /생애최초 취득세 감면/);
  assert.match(content, /중개보수, 국민주택채권, 등기·법무 비용/);
  assert.match(content, /공식 출처/);
  assert.deepEqual(housingAcquisitionTaxFaqJsonLd.mainEntity.map((entry) => entry.name), housingAcquisitionTaxFaqs.map((entry) => entry.question));
});
