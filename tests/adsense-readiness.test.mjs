import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join, sep } from "node:path";
import test from "node:test";
import sitemapModule from "../app/sitemap.ts";

const sitemap = sitemapModule.default;

const sourceRoots = ["app", "components", "lib", "public"];
const sourceExtensions = new Set([".ts", ".tsx", ".txt"]);
const routeFiles = [
  ["app/page.tsx", "/"],
  ["app/calculators/page.tsx", "/calculators"],
  ["app/calculators/seller-margin/page.tsx", "/calculators/seller-margin"],
  ["app/calculators/salary/page.tsx", "/calculators/salary"],
  ["app/calculators/loan/page.tsx", "/calculators/loan"],
  ["app/calculators/severance/page.tsx", "/calculators/severance"],
  ["app/calculators/unemployment/page.tsx", "/calculators/unemployment"],
  ["app/about/page.tsx", "/about"],
  ["app/contact/page.tsx", "/contact"],
  ["app/privacy-policy/page.tsx", "/privacy-policy"],
  ["app/terms/page.tsx", "/terms"],
  ["app/disclaimer/page.tsx", "/disclaimer"],
];

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await listFiles(path));
      continue;
    }

    if ([...sourceExtensions].some((extension) => path.endsWith(extension))) {
      files.push(path);
    }
  }

  return files;
}

function normalizePath(path) {
  return path.split(sep).join("/");
}

test("운영 소스에 placeholder나 준비 상태 문구가 남아 있지 않다", async () => {
  const files = (await Promise.all(sourceRoots.map(listFiles))).flat();
  const blockedPattern =
    /TODO|lorem ipsum|coming soon|placeholder|계산 기능 준비 중|준비 중|준비중|임시|광고를 눌러|후원/iu;

  for (const file of files) {
    const source = await readFile(file, "utf8");
    assert.doesNotMatch(
      source,
      blockedPattern,
      `${normalizePath(file)} contains a blocked readiness phrase`,
    );
  }
});

test("sitemap URL은 실제 App Router 페이지와 일치한다", () => {
  const routeSet = new Set(routeFiles.map(([, route]) => route));
  const sitemapRoutes = sitemap().map((entry) => {
    const url = new URL(entry.url);
    return url.pathname === "/" ? "/" : url.pathname.replace(/\/$/, "");
  });

  assert.deepEqual(sitemapRoutes, [...routeSet]);
});

test("정적 내부 링크는 실제 라우트만 가리킨다", async () => {
  const routeSet = new Set(routeFiles.map(([, route]) => route));
  const files = (await Promise.all(["app", "components"].map(listFiles))).flat();
  const hrefPattern = /href=(?:\{)?["'](\/[^"'#?]*)["'](?:\})?/g;

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const matches = source.matchAll(hrefPattern);

    for (const match of matches) {
      const href = match[1].replace(/\/$/, "") || "/";
      assert.equal(
        routeSet.has(href),
        true,
        `${normalizePath(file)} links to missing route ${href}`,
      );
    }
  }
});

test("AdSense 전역 스크립트는 루트 레이아웃에서 한 번만 삽입한다", async () => {
  const files = (await Promise.all(["app", "components"].map(listFiles))).flat();
  const usages = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");

    if (source.includes("<AdSenseScript")) {
      usages.push(normalizePath(file));
    }
  }

  assert.deepEqual(usages, ["app/layout.tsx"]);
});

test("ads.txt는 공개 publisher ID와 AdSense 기본 client가 일치한다", async () => {
  const [adsTxt, adsenseSource] = await Promise.all([
    readFile("public/ads.txt", "utf8"),
    readFile("lib/adsense.ts", "utf8"),
  ]);

  assert.match(adsTxt.trim(), /^google\.com, pub-\d{16}, DIRECT, f08c47fec0942fa0$/);
  const publisherId = adsTxt.match(/pub-\d{16}/)?.[0];
  assert.ok(publisherId);
  assert.match(adsenseSource, new RegExp(`ca-${publisherId}`));
  assert.doesNotMatch(adsTxt, /pub-0{16}|pub-1234567890123456/);
});
