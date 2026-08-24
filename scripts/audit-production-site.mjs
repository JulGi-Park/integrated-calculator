import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const origin = "https://gyesanbox.kr";
const adsenseSource = "pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
const blockedPaths = new Set([
  "/calculators/",
  "/about/",
  "/methodology/",
  "/updates/",
  "/contact/",
  "/privacy-policy/",
  "/terms/",
  "/disclaimer/",
]);

function decodeEntities(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    );
}

function matchRequired(html, pattern, label) {
  const value = html.match(pattern)?.[1];
  assert.ok(value, `${label} is missing.`);
  return decodeEntities(value.trim());
}

function extractMainText(html) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
  return decodeEntities(
    main
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function shingles(text, size = 5) {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}%]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const found = new Set();
  for (let index = 0; index <= words.length - size; index += 1) {
    found.add(words.slice(index, index + size).join(" "));
  }
  return found;
}

function jaccard(left, right) {
  let intersection = 0;
  for (const value of left) {
    if (right.has(value)) intersection += 1;
  }
  return intersection / (left.size + right.size - intersection || 1);
}

async function get(url) {
  const response = await fetch(url, {
    headers: {
      "cache-control": "no-cache",
      "user-agent": "Gyesanbox-Production-Gate/2026-08-24",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });
  return { response, body: await response.text() };
}

const localSitemap = await readFile("out/sitemap.xml", "utf8");
const expectedUrls = [...localSitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(
  (match) => match[1],
);
const { response: sitemapResponse, body: productionSitemap } = await get(
  `${origin}/sitemap.xml`,
);
assert.equal(sitemapResponse.status, 200, "Production sitemap must return 200.");
const productionUrls = [...productionSitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(
  (match) => match[1],
);
assert.deepEqual(
  productionUrls,
  expectedUrls,
  "Production and final local sitemap URL sets differ.",
);
assert.equal(productionUrls.length, 30, "Production must have 30 sitemap URLs.");

const routeSet = new Set(productionUrls.map((url) => new URL(url).pathname));
const titles = new Map();
const descriptions = new Map();
const canonicals = new Set();
const internalLinks = new Set();
let jsonLdPageCount = 0;
const calculatorPages = [];

for (const absoluteUrl of productionUrls) {
  const expected = new URL(absoluteUrl);
  assert.equal(expected.origin, origin);
  assert.equal(expected.search, "");
  assert.equal(expected.hash, "");
  assert.ok(expected.pathname === "/" || expected.pathname.endsWith("/"));

  const { response, body } = await get(absoluteUrl);
  assert.equal(response.status, 200, `${expected.pathname} must return 200.`);
  assert.equal(response.url, absoluteUrl, `${expected.pathname} unexpectedly redirects.`);

  const title = matchRequired(body, /<title>(.*?)<\/title>/i, `${expected.pathname}: title`);
  const description = matchRequired(
    body,
    /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i,
    `${expected.pathname}: description`,
  );
  const canonical = matchRequired(
    body,
    /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i,
    `${expected.pathname}: canonical`,
  );
  assert.equal(canonical, absoluteUrl, `${expected.pathname}: canonical mismatch.`);
  assert.equal((body.match(/<h1\b/gi) ?? []).length, 1, `${expected.pathname}: H1 count.`);
  assert.doesNotMatch(
    body.split(/<\/head>/i)[0] ?? "",
    /name=["']robots["'][^>]+noindex|content=["'][^"']*noindex/i,
    `${expected.pathname}: sitemap page is noindex.`,
  );

  for (const property of ["og:title", "og:description", "og:image"]) {
    assert.match(
      body,
      new RegExp(`<meta\\s+property=["']${property}["']\\s+content=["'][^"']+["']`, "i"),
      `${expected.pathname}: ${property} is missing.`,
    );
  }
  const jsonLdMatches = [...body.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )];
  if (jsonLdMatches.length > 0) jsonLdPageCount += 1;
  for (const match of jsonLdMatches) {
    JSON.parse(decodeEntities(match[1]));
  }

  if (blockedPaths.has(expected.pathname)) {
    assert.equal(
      body.includes(adsenseSource),
      false,
      `${expected.pathname}: blocked page prepares AdSense in initial HTML.`,
    );
  }

  assert.equal(titles.has(title), false, `${expected.pathname}: duplicate title.`);
  assert.equal(descriptions.has(description), false, `${expected.pathname}: duplicate description.`);
  assert.equal(canonicals.has(canonical), false, `${expected.pathname}: duplicate canonical.`);
  titles.set(title, expected.pathname);
  descriptions.set(description, expected.pathname);
  canonicals.add(canonical);

  for (const match of body.matchAll(/href=["']([^"'#]+)["']/gi)) {
    const target = new URL(decodeEntities(match[1]), origin);
    if (target.origin !== origin) continue;
    if (target.pathname.startsWith("/_next/") || /\.[a-z0-9]+$/i.test(target.pathname)) {
      continue;
    }
    internalLinks.add(target.pathname);
  }

  if (/^\/calculators\/[^/]+\/$/.test(expected.pathname)) {
    const text = extractMainText(body);
    calculatorPages.push({
      route: expected.pathname,
      text,
      shingles: shingles(text),
    });
  }
}

for (const pathname of internalLinks) {
  assert.equal(routeSet.has(pathname), true, `Broken production internal route: ${pathname}`);
}

const { response: robotsResponse, body: robots } = await get(`${origin}/robots.txt`);
assert.equal(robotsResponse.status, 200);
assert.match(robots, /Sitemap:\s*https:\/\/gyesanbox\.kr\/sitemap\.xml/i);
assert.doesNotMatch(robots, /Disallow:\s*\/(calculators|about|methodology|updates)/i);

for (const pathname of [
  "/this-page-does-not-exist/",
  "/calculators/not-a-real-calculator/",
  "/adsense-audit-404-test/",
]) {
  const { response, body } = await get(`${origin}${pathname}`);
  assert.equal(response.status, 404, `${pathname}: must return HTTP 404.`);
  const head = body.split(/<\/head>/i)[0] ?? "";
  assert.match(head, /noindex/i, `${pathname}: 404 must be noindex.`);
  assert.doesNotMatch(head, /rel=["']canonical["']/i, `${pathname}: 404 canonical.`);
  assert.doesNotMatch(body, /pagead2\.googlesyndication|adsbygoogle|data-ad-slot/i);
  assert.equal((body.match(/<h1\b/gi) ?? []).length, 1);
  assert.match(body, /href=["']\/["']/);
  assert.match(body, /href=["']\/calculators\/["']/);
}

const calculatorCount = [...routeSet].filter((pathname) =>
  /^\/calculators\/[^/]+\/$/.test(pathname),
).length;
assert.equal(calculatorPages.length, 21);

const similarities = [];
for (let left = 0; left < calculatorPages.length; left += 1) {
  for (let right = left + 1; right < calculatorPages.length; right += 1) {
    similarities.push({
      left: calculatorPages[left].route,
      right: calculatorPages[right].route,
      value: jaccard(
        calculatorPages[left].shingles,
        calculatorPages[right].shingles,
      ),
    });
  }
}
similarities.sort((left, right) => right.value - left.value);

const sentenceOwners = new Map();
for (const page of calculatorPages) {
  const sentences = new Set(
    page.text
      .split(/(?<=[.!?。]|다\.)\s+/u)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length >= 35),
  );
  for (const sentence of sentences) {
    const owners = sentenceOwners.get(sentence) ?? [];
    owners.push(page.route);
    sentenceOwners.set(sentence, owners);
  }
}
const repeatedSentenceCount = [...sentenceOwners.values()].filter(
  (owners) => owners.length >= 3,
).length;
const topSimilarity = similarities[0];
console.log(
  `Production audit passed: ${routeSet.size} indexable URLs, ${calculatorCount} calculators, ${jsonLdPageCount} pages with valid JSON-LD, ${internalLinks.size} valid internal route targets, 0 duplicate metadata, 3 hard 404 responses. Production calculator similarity: highest pair ${topSimilarity.left} <> ${topSimilarity.right} at ${(topSimilarity.value * 100).toFixed(2)}%; repeated 35+ character sentences across 3+ calculators: ${repeatedSentenceCount}.`,
);
