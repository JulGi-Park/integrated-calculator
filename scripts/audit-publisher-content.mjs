import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const outputRoot = path.join(projectRoot, "out");
const siteOrigin = "https://gyesanbox.kr";
const adsenseSource = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";

function decodeEntities(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function visibleText(html) {
  return decodeEntities(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function getAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"));
  return match ? decodeEntities(match[1]) : null;
}

function findTagByAttribute(html, tagName, attribute, expectedValue) {
  const tags = html.match(new RegExp(`<${tagName}\\b[^>]*>`, "gi")) ?? [];
  return tags.find((tag) => getAttribute(tag, attribute)?.toLowerCase() === expectedValue) ?? null;
}

function outputPathFor(pathname) {
  if (pathname === "/") return path.join(outputRoot, "index.html");
  return path.join(outputRoot, pathname.replace(/^\//, ""), "index.html");
}

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") return false;
    throw error;
  }
}

async function discoverAppPageRoutes(directory = path.join(projectRoot, "app"), segments = []) {
  const entries = await readdir(directory, { withFileTypes: true });
  const routes = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      routes.push(
        ...(await discoverAppPageRoutes(path.join(directory, entry.name), [
          ...segments,
          entry.name,
        ])),
      );
      continue;
    }

    if (entry.name !== "page.tsx") continue;
    assert.equal(
      segments.some((segment) => /[\[\]()@]/.test(segment)),
      false,
      `Publisher audit requires explicit review for dynamic or grouped routes: ${segments.join("/")}`,
    );
    routes.push(segments.length === 0 ? "/" : `/${segments.join("/")}/`);
  }

  return routes;
}

function collectJsonLdRouteUrls(value, found = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectJsonLdRouteUrls(item, found);
    return found;
  }
  if (!value || typeof value !== "object") return found;

  for (const [key, item] of Object.entries(value)) {
    if ((key === "url" || key === "item") && typeof item === "string") {
      found.push(item);
    }
    collectJsonLdRouteUrls(item, found);
  }
  return found;
}

function addUnique(map, key, pathname, label) {
  const previous = map.get(key);
  assert.equal(previous, undefined, `${label} duplicate: ${key} (${previous}, ${pathname})`);
  map.set(key, pathname);
}

const sitemapXml = await readFile(path.join(outputRoot, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
  decodeEntities(match[1]),
);

assert.equal(sitemapUrls.length, 30, "Sitemap must expose exactly 30 reviewed canonical URLs.");
assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, "Sitemap URLs must be unique.");

const titles = new Map();
const descriptions = new Map();
const canonicals = new Map();
const routeSet = new Set(sitemapUrls.map((value) => new URL(value).pathname));
const appPageRoutes = await discoverAppPageRoutes();
assert.deepEqual(
  [...routeSet].sort(),
  [...appPageRoutes].sort(),
  "App Router pages and Sitemap/indexable routes must match exactly.",
);
const calculatorRoutes = [...routeSet].filter((pathname) =>
  /^\/calculators\/[^/]+\/$/.test(pathname),
);

for (const absoluteUrl of sitemapUrls) {
  const url = new URL(absoluteUrl);
  assert.equal(url.origin, siteOrigin, `Sitemap URL must use the production origin: ${absoluteUrl}`);
  assert.ok(url.pathname === "/" || url.pathname.endsWith("/"), `Sitemap URL must use a trailing slash: ${absoluteUrl}`);

  const htmlPath = outputPathFor(url.pathname);
  assert.equal(await exists(htmlPath), true, `Missing static output: ${htmlPath}`);
  const html = await readFile(htmlPath, "utf8");
  const text = visibleText(html);
  const head = html.split(/<\/head>/i)[0] ?? "";
  const title = decodeEntities(head.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim();
  const descriptionTag = findTagByAttribute(head, "meta", "name", "description");
  const canonicalTag = findTagByAttribute(head, "link", "rel", "canonical");
  const description = descriptionTag ? getAttribute(descriptionTag, "content") : null;
  const canonical = canonicalTag ? getAttribute(canonicalTag, "href") : null;

  assert.ok(title.length >= 8, `${url.pathname}: missing or weak title.`);
  assert.ok(description && description.length >= 35, `${url.pathname}: missing or weak description.`);
  assert.equal(canonical, absoluteUrl, `${url.pathname}: canonical must match the Sitemap URL.`);
  assert.equal((html.match(/<h1\b/gi) ?? []).length, 1, `${url.pathname}: exactly one H1 is required.`);
  assert.doesNotMatch(head, /name=["']robots["'][^>]+noindex|content=["'][^"']*noindex/i, `${url.pathname}: Sitemap pages must remain indexable.`);
  assert.doesNotMatch(html, /data-ad-slot|class=["'][^"']*adsbygoogle/i, `${url.pathname}: ad units and ad placeholders are not allowed before approval.`);

  assert.ok(text.length >= 80, `${url.pathname}: rendered main content is empty or unreadable.`);

  const shouldPrepareAdsense = url.pathname === "/" || calculatorRoutes.includes(url.pathname);
  if (!shouldPrepareAdsense) {
    assert.equal(html.includes(adsenseSource), false, `${url.pathname}: blocked routes must not prepare the AdSense connection.`);
  }

  for (const jsonLdMatch of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const jsonLd = JSON.parse(decodeEntities(jsonLdMatch[1]));
    for (const structuredUrl of collectJsonLdRouteUrls(jsonLd)) {
      const structuredTarget = new URL(structuredUrl, siteOrigin);
      if (structuredTarget.origin !== siteOrigin) continue;
      assert.equal(structuredTarget.search, "", `${url.pathname}: JSON-LD URL must not contain a query (${structuredUrl}).`);
      assert.equal(structuredTarget.hash, "", `${url.pathname}: JSON-LD URL must not contain a fragment (${structuredUrl}).`);
      assert.equal(routeSet.has(structuredTarget.pathname), true, `${url.pathname}: JSON-LD references a non-indexable route (${structuredUrl}).`);
      assert.ok(structuredTarget.pathname === "/" || structuredTarget.pathname.endsWith("/"), `${url.pathname}: JSON-LD route must use a trailing slash (${structuredUrl}).`);
    }
  }

  addUnique(titles, title, url.pathname, "title");
  addUnique(descriptions, description, url.pathname, "description");
  addUnique(canonicals, canonical, url.pathname, "canonical");

  for (const anchor of html.match(/<a\b[^>]*>/gi) ?? []) {
    const href = getAttribute(anchor, "href");
    if (!href || href.startsWith("#")) continue;
    const target = new URL(href, siteOrigin);
    if (target.origin !== siteOrigin) continue;
    assert.equal(target.search, "", `${url.pathname}: internal links must not create query variants (${href}).`);
    assert.equal(target.hash, "", `${url.pathname}: static route links must not depend on fragments (${href}).`);
    assert.ok(target.pathname === "/" || target.pathname.endsWith("/"), `${url.pathname}: internal link must use the canonical trailing slash (${href}).`);
    assert.equal(routeSet.has(target.pathname), true, `${url.pathname}: broken or non-indexable internal link (${href}).`);
  }
}

assert.equal(calculatorRoutes.length, 21, "Exactly 21 reviewed calculators must be public.");

for (const pathname of calculatorRoutes) {
  const html = await readFile(outputPathFor(pathname), "utf8");
  const text = visibleText(html);
  assert.match(text, /계산 기준|계산식|계산 방식|계산 방법|산식|상세 계산 내역/, `${pathname}: calculation basis/formula signal missing.`);
  assert.match(text, /예시/, `${pathname}: worked example signal missing.`);
  assert.match(text, /결과 해석|해석하세요|결과를 이렇게|결과를 확인|예상 결과/, `${pathname}: result interpretation signal missing.`);
  assert.match(text, /주의|예외|반영하지|포함하지|달라질|참고용/, `${pathname}: limitations signal missing.`);
  assert.match(text, /기준일|확인일/, `${pathname}: basis date signal missing.`);
}

const notFoundHtml = await readFile(path.join(outputRoot, "404.html"), "utf8");
const notFoundHead = notFoundHtml.split(/<\/head>/i)[0] ?? "";
assert.match(notFoundHead, /noindex/i, "404 output must be noindex.");
assert.equal((notFoundHtml.match(/<h1\b/gi) ?? []).length, 1, "404 output must have one H1.");
assert.doesNotMatch(notFoundHtml, /pagead2\.googlesyndication|adsbygoogle|data-ad-slot/i, "404 output must not load or render ads.");
assert.doesNotMatch(notFoundHead, /rel=["']canonical["']/i, "404 output must not declare a canonical URL.");
assert.match(notFoundHtml, /href=["']\/["']/, "404 output must link back to the home page.");
assert.match(notFoundHtml, /href=["']\/calculators\/["']/, "404 output must link to the calculator index.");

console.log(`Publisher audit passed: ${sitemapUrls.length} indexable URLs, ${calculatorRoutes.length} calculators, 0 broken internal links, 0 duplicate metadata.`);
