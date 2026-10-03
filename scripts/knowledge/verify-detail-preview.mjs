// Read-only live Preview check for published Knowledge detail Pages Functions.
import assert from "node:assert/strict";
import { escapeKnowledgeSeoHtml, knowledgeSeo } from "../../lib/knowledge/seo.ts";

const previewOrigin = process.argv[2] ?? "https://know-02-preview.integrated-calculator.pages.dev";
const origin = new URL(previewOrigin);
assert.equal(origin.protocol, "https:");
assert.match(origin.hostname, /^[a-z0-9-]+\.integrated-calculator\.pages\.dev$/u);
const apiBase = process.env.KNOWLEDGE_API_BASE ?? "https://knowledge-preview.gyesanbox.kr/api/knowledge/v1";
async function getJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, 200, `API ${response.status}: ${url}`);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  return payload.data;
}

const firstPage = await getJson(`${apiBase}/questions?limit=10&page=1`);
assert.equal(firstPage.page_size, 10);
const records = [...firstPage.items];
for (let page = 2; page <= firstPage.total_pages; page += 1) {
  records.push(...(await getJson(`${apiBase}/questions?limit=10&page=${page}`)).items);
}
assert.equal(records.length, firstPage.total);
assert.equal(records.length, 200, "Expected published Preview baseline of 200");
const titles = records.map((record) => `${record.title} | 계산박스 지식센터`);
const paths = records.map((record) => `/knowledge/${record.id.toLowerCase()}/`);
const canonicals = records.map((record) => knowledgeSeo({ id: record.id, title: record.title, body: record.body }).canonical);
assert.equal(new Set(paths).size, records.length);
assert.equal(new Set(canonicals).size, records.length);
const sitemapResponse = await fetch(new URL("/sitemap-knowledge.xml", origin), { signal: AbortSignal.timeout(30000) });
assert.equal(sitemapResponse.status, 200);
assert.match(sitemapResponse.headers.get("content-type"), /^application\/xml/iu);
assert.equal(sitemapResponse.headers.get("x-robots-tag"), "noindex, nofollow, noarchive");
const sitemapSource = await sitemapResponse.text();
assert.doesNotMatch(sitemapSource, /<lastmod>/u);
const sitemapLocs = [...sitemapSource.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((match) => match[1]);
assert.equal(sitemapLocs.length, records.length);
assert.deepEqual(new Set(sitemapLocs), new Set(canonicals));
assert.ok(sitemapLocs.every((loc) => !loc.includes("?")));
const listResponse = await fetch(new URL("/knowledge/?q=test&category=test", origin), { signal: AbortSignal.timeout(15000) });
assert.equal(listResponse.status, 200);
const listHtml = await listResponse.text();
assert.match(listHtml, /<link rel="canonical" href="https:\/\/gyesanbox\.kr\/knowledge\/"/u);
assert.equal(listResponse.headers.get("x-robots-tag"), "noindex");

let next = 0;
let successes = 0;
let relatedLinks = 0;
const failures = [];
const categories = new Set();
const publishedPaths = new Set(paths);
async function checkRecord(record) {
  const seo = knowledgeSeo({ id: record.id, title: record.title, body: record.body });
  const url = new URL(seo.detailPath, origin);
  categories.add(record.category);
  const response = await fetch(url, { headers: { Accept: "text/html" }, signal: AbortSignal.timeout(15000) });
  const source = await response.text();
  assert.equal(response.status, 200, `${response.status} ${url}`);
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow, noarchive");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.ok(source.includes(`<title>${escapeKnowledgeSeoHtml(seo.title)}</title>`));
  assert.ok(source.includes(`<h1>${escapeKnowledgeSeoHtml(record.title)}</h1>`));
  assert.ok(source.includes(`<meta name="description" content="${escapeKnowledgeSeoHtml(seo.description)}">`));
  assert.ok(source.includes(`<link rel="canonical" href="${seo.canonical}">`));
  assert.match(source, /name="robots" content="noindex, nofollow, noarchive"/u);
  assert.match(source, /property="og:title"/u);
  assert.match(source, /property="og:description"/u);
  assert.match(source, /property="og:url"/u);
  assert.match(source, /name="twitter:card"/u);
  assert.match(source, /name="twitter:title"/u);
  assert.match(source, /name="twitter:description"/u);
  assert.ok(source.includes(escapeKnowledgeSeoHtml(record.body.split(/\n/u)[0].slice(0, 80))));
  if (record.answer?.body) assert.ok(source.includes(escapeKnowledgeSeoHtml(record.answer.body.split(/\n/u)[0].slice(0, 80))));
  else assert.match(source, /답변 대기/u);
  assert.equal((source.match(/href="\/calculators\//gu) ?? []).length, record.relatedServices.length);
  const relatedSection = source.match(/<section aria-labelledby="related-questions">([\s\S]*?)<\/section>/u)?.[1];
  assert.ok(relatedSection, "Related questions are missing from initial HTML");
  const links = [...relatedSection.matchAll(/href="(\/knowledge\/[0-9a-f-]+\/)"/gu)].map((match) => match[1]);
  assert.ok(links.length >= 3 && links.length <= 5);
  assert.equal(new Set(links).size, links.length);
  assert.ok(links.every((link) => link !== seo.detailPath && publishedPaths.has(link)));
  relatedLinks += links.length;
  assert.match(source, /href="\/knowledge\/">계산박스 지식센터 목록/u);
  successes += 1;
}

await Promise.all(Array.from({ length: 8 }, async () => {
  while (next < records.length) {
    const record = records[next++];
    try { await checkRecord(record); } catch (error) { failures.push({ id: record.id, error: String(error) }); }
  }
}));
assert.deepEqual(failures, []);
const titleCounts = new Map();
for (const title of titles) titleCounts.set(title, (titleCounts.get(title) ?? 0) + 1);
console.log(JSON.stringify({ origin: origin.origin, published: records.length, detailPaths: paths.length,
  http200: successes, uniquePaths: new Set(paths).size, uniqueCanonicals: new Set(canonicals).size,
  uniqueTitles: new Set(titles).size, duplicateTitles: records.length - new Set(titles).size,
  sitemapUrls: sitemapLocs.length, uniqueSitemapUrls: new Set(sitemapLocs).size, relatedLinks,
  categories: [...categories].sort(), missing: 0, duplicates: 0, failures: failures.length }, null, 2));
