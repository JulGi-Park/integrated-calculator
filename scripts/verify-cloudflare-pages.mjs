import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const sourceDirectories = ["app", "components"];
const nextConfigPath = path.join(projectRoot, "next.config.ts");

const requiredStaticFiles = [
  ["out/index.html", "계산박스"],
  ["out/calculators/index.html", "계산기 목록"],
  [
    "out/calculators/seller-margin/index.html",
    "판매 조건을 입력하세요",
  ],
  [
    "out/calculators/vat-profit/index.html",
    "부가세 계산기",
  ],
  [
    "out/calculators/unemployment/index.html",
    "실업급여 계산기",
  ],
  [
    "out/calculators/parental-leave/index.html",
    "육아휴직급여 계산기",
  ],
  [
    "out/calculators/rent-vs-jeonse/index.html",
    "전세 vs 월세 비교 계산기",
  ],
  [
    "out/calculators/social-insurance/index.html",
    "2026 국민연금 납부액·4대보험 계산기",
  ],
  [
    "out/calculators/labor-pay/index.html",
    "주휴수당 계산기",
  ],
  ["out/calculators/roas/index.html", "ROAS 계산기"],
  ["out/calculators/savings/index.html", "예금 적금 계산기"],
  ["out/calculators/average-price/index.html", "물타기 계산기"],
  ["out/calculators/card-installment/index.html", "카드 할부 계산기"],
  ["out/calculators/brokerage-fee/index.html", "부동산 중개보수 계산기"],
  ["out/calculators/car-cost/index.html", "자동차 유지비 계산기"],
  ["out/calculators/overtime-pay/index.html", "연장·야간·휴일근로수당 계산기"],
  ["out/calculators/youth-future-savings/index.html", "청년미래적금 계산기"],
  ["out/calculators/dsr/index.html", "DSR 계산기 2026"],
  ["out/calculators/work-child-incentive/index.html", "근로·자녀장려금 계산기"],
];

const newlyPublicCalculatorPages = [
  ["roas", "https://gyesanbox.kr/calculators/roas/"],
  ["savings", "https://gyesanbox.kr/calculators/savings/"],
  ["average-price", "https://gyesanbox.kr/calculators/average-price/"],
  ["card-installment", "https://gyesanbox.kr/calculators/card-installment/"],
  ["brokerage-fee", "https://gyesanbox.kr/calculators/brokerage-fee/"],
  ["car-cost", "https://gyesanbox.kr/calculators/car-cost/"],
  ["overtime-pay", "https://gyesanbox.kr/calculators/overtime-pay/"],
  ["youth-future-savings", "https://gyesanbox.kr/calculators/youth-future-savings/"],
  ["dsr", "https://gyesanbox.kr/calculators/dsr/"],
  ["work-child-incentive", "https://gyesanbox.kr/calculators/work-child-incentive/"],
];

const publicCalculatorHeroPages = [
  ["out/calculators/seller-margin/index.html", "/og/seller-margin.png"],
  ["out/calculators/salary/index.html", "/og/salary.png"],
  ["out/calculators/loan/index.html", "/og/loan.png"],
  ["out/calculators/severance/index.html", "/og/severance.png"],
  ["out/calculators/unemployment/index.html", "/og/unemployment.png"],
  ["out/calculators/social-insurance/index.html", "/og/social-insurance-hero.png"],
  ["out/calculators/labor-pay/index.html", "/og/labor-pay-hero.png"],
  ["out/calculators/vat-profit/index.html", "/og/vat-profit-hero.png"],
  ["out/calculators/parental-leave/index.html", "/og/parental-leave-hero.png"],
  ["out/calculators/rent-vs-jeonse/index.html", "/og/rent-vs-jeonse-hero.png"],
];

const forbiddenSourcePatterns = [
  {
    pattern: /["']use server["']/,
    reason: "Server Actions are not allowed.",
  },
  {
    pattern: /from\s+["']next\/(?:headers|server)["']/,
    reason: "Server-only Next.js APIs are not allowed.",
  },
  {
    pattern: /from\s+["']server-only["']/,
    reason: "The server-only package is not allowed.",
  },
  {
    pattern: /\b(?:cookies|headers|draftMode|connection)\s*\(/,
    reason: "Dynamic server functions are not allowed.",
  },
  {
    pattern: /\b(?:revalidatePath|revalidateTag|unstable_noStore)\s*\(/,
    reason: "Server revalidation APIs are not allowed.",
  },
  {
    pattern: /from\s+["']next\/image["']/,
    reason:
      "next/image requires an explicit static-export-compatible loader review.",
  },
];

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(fullPath)));
    } else if (/\.(?:ts|tsx|js|jsx|mjs)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

async function verifyNextConfig() {
  const config = await readFile(nextConfigPath, "utf8");

  assert.match(
    config,
    /output:\s*["']export["']/,
    'next.config.ts must keep output: "export".',
  );
  assert.match(
    config,
    /trailingSlash:\s*true/,
    "next.config.ts must keep trailingSlash: true.",
  );
}

async function verifySourceCompatibility() {
  const sourceFiles = (
    await Promise.all(
      sourceDirectories.map((directory) =>
        collectSourceFiles(path.join(projectRoot, directory)),
      ),
    )
  ).flat();

  for (const file of sourceFiles) {
    const relativePath = path.relative(projectRoot, file);
    const source = await readFile(file, "utf8");

    assert.ok(
      !/(?:^|[\\/])route\.(?:ts|tsx|js|jsx)$/.test(file),
      `${relativePath}: Route Handlers are not allowed in this project.`,
    );

    for (const { pattern, reason } of forbiddenSourcePatterns) {
      assert.doesNotMatch(source, pattern, `${relativePath}: ${reason}`);
    }
  }
}

async function verifyStaticOutput() {
  const outputStats = await stat(path.join(projectRoot, "out"));

  assert.ok(outputStats.isDirectory(), "The out/ directory was not created.");

  for (const [relativePath, expectedText] of requiredStaticFiles) {
    const absolutePath = path.join(projectRoot, relativePath);
    const html = await readFile(absolutePath, "utf8");

    assert.match(
      html,
      new RegExp(expectedText),
      `${relativePath} does not contain its expected page content.`,
    );
  }

  const sitemap = await readFile(path.join(projectRoot, "out/sitemap.xml"), "utf8");
  for (const [slug, canonical] of newlyPublicCalculatorPages) {
    const relativePath = `out/calculators/${slug}/index.html`;
    const html = await readFile(path.join(projectRoot, relativePath), "utf8");
    const [head = "", body = ""] = html.split(/<\/head>/i);

    assert.match(sitemap, new RegExp(`/calculators/${slug}/`));
    assert.equal((body.match(/<h1\b/gi) ?? []).length, 1, `${relativePath} must render exactly one H1.`);
    assert.match(head, new RegExp(`<link[^>]+rel="canonical"[^>]+href="${canonical}"|<link[^>]+href="${canonical}"[^>]+rel="canonical"`, "i"));
    assert.doesNotMatch(head, /name="robots"[^>]+noindex|content="[^"']*noindex/i);
    assert.equal((html.match(/<script\b[^>]*googletagmanager\.com\/gtag\/js\?id=G-YMJFLPRFMV[^>]*>/gi) ?? []).length, 1);
    assert.equal((html.match(/<script\b[^>]*pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-4273771596550595[^>]*>/gi) ?? []).length, 1);
  }

  for (const [relativePath, imagePath] of publicCalculatorHeroPages) {
    const html = await readFile(path.join(projectRoot, relativePath), "utf8");
    const [head = "", body = ""] = html.split(/<\/head>/i);
    const escapedImagePath = imagePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    assert.equal(
      (body.match(/<h1\b/gi) ?? []).length,
      1,
      `${relativePath} must render exactly one H1.`,
    );
    assert.match(
      head,
      /property="og:image"/i,
      `${relativePath} must retain its Open Graph image metadata.`,
    );
    assert.match(
      head,
      /name="twitter:image"/i,
      `${relativePath} must retain its Twitter image metadata.`,
    );
    assert.match(
      head,
      new RegExp(escapedImagePath, "i"),
      `${relativePath} must retain the original shared image URL.`,
    );
    assert.doesNotMatch(
      body,
      new RegExp(`<img\\b[^>]*(?:${escapedImagePath})`, "i"),
      `${relativePath} must not render its OG image in the page body.`,
    );
    assert.doesNotMatch(
      body,
      /data-ad-slot|class=["'][^"']*adsbygoogle/i,
      `${relativePath} must not render an advertising unit or placeholder.`,
    );
    assert.equal(
      (html.match(/<script\b[^>]*googletagmanager\.com\/gtag\/js\?id=G-YMJFLPRFMV[^>]*>/gi) ?? []).length,
      1,
      `${relativePath} must retain exactly one GA4 script.`,
    );
    assert.equal(
      (html.match(/<script\b[^>]*pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-4273771596550595[^>]*>/gi) ?? []).length,
      1,
      `${relativePath} must retain exactly one AdSense script.`,
    );
  }
}

await verifyNextConfig();
await verifySourceCompatibility();
await verifyStaticOutput();

console.log("Cloudflare Pages static export verification passed.");
