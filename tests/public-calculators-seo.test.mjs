import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import { PUBLIC_CALCULATOR_SEO, PUBLIC_CALCULATOR_SEO_SOURCE_NOTE } from "../lib/seo/publicCalculatorSeo.ts";

const pageModules = {
  "seller-margin": "../app/calculators/seller-margin/page.tsx",
  salary: "../app/calculators/salary/page.tsx",
  loan: "../app/calculators/loan/page.tsx",
  severance: "../app/calculators/severance/page.tsx",
  unemployment: "../app/calculators/unemployment/page.tsx",
  "social-insurance": "../app/calculators/social-insurance/page.tsx",
  "labor-pay": "../app/calculators/labor-pay/page.tsx",
  "vat-profit": "../app/calculators/vat-profit/page.tsx",
  "parental-leave": "../app/calculators/parental-leave/page.tsx",
  "rent-vs-jeonse": "../app/calculators/rent-vs-jeonse/page.tsx",
};

function readPngDimensions(buffer) {
  assert.equal(buffer.toString("ascii", 12, 16), "IHDR");
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test("공개 계산기 SEO 설정은 10개 페이지의 의도·이미지·키워드 후보를 고유하게 관리한다", async () => {
  const entries = Object.entries(pageModules);
  assert.equal(entries.length, 10);
  assert.match(PUBLIC_CALCULATOR_SEO_SOURCE_NOTE, /GSC 자료 미제공/);

  const titles = new Set();
  const descriptions = new Set();
  const images = new Set();
  const alts = new Set();

  for (const [slug, modulePath] of entries) {
    const seo = PUBLIC_CALCULATOR_SEO[slug];
    const pageSource = await readFile(`app/calculators/${slug}/page.tsx`, "utf8");
    const pageModule = await import(modulePath);
    const metadata = pageModule.metadata;

    assert.ok(seo);
    assert.equal(metadata.title, seo.title);
    assert.equal(metadata.description, seo.description);
    assert.equal(metadata.alternates.canonical, `https://gyesanbox.kr${seo.path}`);
    assert.equal(metadata.robots.index, true);
    assert.equal(metadata.robots.follow, true);
    assert.equal(metadata.openGraph.url, `https://gyesanbox.kr${seo.path}`);
    assert.equal(metadata.openGraph.images[0].url, seo.image);
    assert.equal(metadata.twitter.images[0], seo.image);
    assert.equal(metadata.openGraph.images[0].alt, metadata.openGraph.title === metadata.title ? metadata.title : metadata.openGraph.images[0].alt);
    assert.ok(pageSource.match(/<h1>[^<]+<\/h1>/g)?.length === 1);
    assert.match(pageSource, /CalculatorHeroImage/);
    assert.doesNotMatch(pageSource, /keywords\s*:/);
    assert.ok(seo.representativeTerm.length > 0);
    assert.ok([...seo.supportingTerms, ...seo.questionTerms, ...seo.purposeTerms, ...seo.conditionTerms].length >= 6);

    titles.add(metadata.title);
    descriptions.add(metadata.description);
    images.add(seo.image);
    alts.add(seo.imageAlt);
  }

  assert.equal(titles.size, 10);
  assert.equal(descriptions.size, 10);
  assert.equal(images.size, 10);
  assert.equal(alts.size, 10);
});

test("공개 계산기 대표 이미지 10개는 1200x630 PNG이며 파일 해시가 모두 다르다", async () => {
  const hashes = new Set();
  for (const seo of Object.values(PUBLIC_CALCULATOR_SEO)) {
    const buffer = await readFile(`public${seo.imagePath}`);
    assert.deepEqual(readPngDimensions(buffer), { width: 1200, height: 630 });
    hashes.add(createHash("sha256").update(buffer).digest("hex"));
  }
  assert.equal(hashes.size, 10);
});

test("신규 대표 이미지 5개는 400KB 이하로 유지한다", async () => {
  const newImagePaths = [
    "public/og/social-insurance-hero.png",
    "public/og/labor-pay-hero.png",
    "public/og/vat-profit-hero.png",
    "public/og/parental-leave-hero.png",
    "public/og/rent-vs-jeonse-hero.png",
  ];

  for (const imagePath of newImagePaths) {
    assert.ok((await stat(imagePath)).size <= 400 * 1024, imagePath);
  }
});

test("본문 대표 이미지는 원본 비율을 유지하고 데스크톱에서 계산 입력을 과도하게 밀지 않는다", async () => {
  const css = await readFile("components/common/CalculatorHeroImage.module.css", "utf8");
  assert.match(css, /max-width:\s*720px/);
  assert.match(css, /height:\s*auto/);
});

test("대표 이미지 JSON-LD는 페이지 OG 이미지와 같은 URL을 사용한다", async () => {
  const dataModules = [
    ["seller-margin", "../components/calculators/sellerMarginContentData.ts", "sellerMarginWebApplicationJsonLd"],
    ["salary", "../components/calculators/salaryTakeHomeContentData.ts", "salaryTakeHomeWebApplicationJsonLd"],
    ["loan", "../components/calculators/loanInterestContentData.ts", "loanInterestWebApplicationJsonLd"],
    ["severance", "../components/calculators/severanceContentData.ts", "severanceWebApplicationJsonLd"],
    ["unemployment", "../components/calculators/unemploymentContentData.ts", "unemploymentWebApplicationJsonLd"],
    ["social-insurance", "../components/calculators/socialInsuranceContentData.ts", "socialInsuranceWebApplicationJsonLd"],
    ["labor-pay", "../components/calculators/laborPayContentData.ts", "laborPayWebApplicationJsonLd"],
    ["vat-profit", "../components/calculators/vatProfitContentData.ts", "vatProfitWebApplicationJsonLd"],
    ["parental-leave", "../components/calculators/parentalLeaveContentData.ts", "parentalLeaveWebApplicationJsonLd"],
    ["rent-vs-jeonse", "../components/calculators/rentVsJeonseContentData.ts", "rentVsJeonseWebApplicationJsonLd"],
  ];

  for (const [slug, modulePath, exportName] of dataModules) {
    const dataModule = await import(modulePath);
    const jsonLd = dataModule[exportName];
    const seo = PUBLIC_CALCULATOR_SEO[slug];
    const pageSource = await readFile(`app/calculators/${slug}/page.tsx`, "utf8");
    const parsed = JSON.parse(JSON.stringify({ ...jsonLd, image: seo.image }));
    assert.equal(parsed["@type"], "WebApplication");
    assert.equal(parsed.image, seo.image);
    assert.match(pageSource, /image:\s*ogImage|image:\s*seo\.image/);
  }
});
