import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("비공개 원천징수 계산기 페이지는 metadata, JSON-LD, 콘텐츠와 strict gate를 갖는다", async () => {
  const [page, content, publication, sitemap, registry, home] = await Promise.all(["app/calculators/withholding-tax/page.tsx", "components/calculators/WithholdingTaxContent.tsx", "lib/calculators/withholding-tax/publication.ts", "app/sitemap.ts", "lib/seo/publicCalculatorSeo.ts", "app/page.tsx"].map((file) => readFile(file, "utf8")));
  assert.match(page, /3\.3% 원천징수 계산기/); assert.match(page, /canonical/); assert.match(page, /WebApplication/); assert.match(page, /isWithholdingTaxCalculatorEnabled\(\)/);
  for (const term of ["소득세 3%", "종합소득세", "근로자성", "2026-08-21", "국세청 사업소득", "소액부징수"]) assert.match(content, new RegExp(term));
  assert.match(publication, /NEXT_PUBLIC_ENABLE_WITHHOLDING_TAX_CALCULATOR/);
  for (const source of [sitemap, registry, home]) assert.doesNotMatch(source, /withholding-tax/);
});
