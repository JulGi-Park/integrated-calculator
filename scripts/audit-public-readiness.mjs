import { JSDOM } from "jsdom";
import { mkdir, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

// Read-only GET audit. Never submits forms or follows admin/API action links.
const origin = "https://gyesanbox.kr";
const output = process.argv[2] || "docs/reports/adsense-readiness-2026-10-20.json";
const cache = new Map();
async function request(url) {
  if (cache.has(url)) return cache.get(url);
  const promise = (async () => {
    const chain = []; let current = url;
    try {
      for (let hop = 0; hop < 10; hop++) {
        await delay(250);
        const response = await fetch(current, { redirect: "manual", signal: AbortSignal.timeout(15000), headers: { "user-agent": "Gyesanbox-ReadOnly-Audit/1.0" } });
        const location = response.headers.get("location");
        chain.push({ url: current, status: response.status, location });
        if ([301, 302, 303, 307, 308].includes(response.status) && location) {
          await response.body?.cancel();
          current = new URL(location, current).href;
          if (chain.some((step) => step.url === current)) throw new Error("redirect-loop");
          continue;
        }
        return { url, finalUrl: current, status: response.status, chain, robotsHeader: response.headers.get("x-robots-tag"), contentType: response.headers.get("content-type"), body: await response.text() };
      }
      throw new Error("redirect-limit");
    } catch (error) { return { url, finalUrl: current, chain, error: error.message, body: "" }; }
  })();
  cache.set(url, promise); return promise;
}
async function pool(items, fn, concurrency = 4) {
  let next = 0; const result = new Array(items.length);
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (next < items.length) { const i = next++; result[i] = await fn(items[i]); }
  })); return result;
}
const withoutBody = (response) => {
  const copy = { ...response };
  delete copy.body;
  return copy;
};
const maps = await pool(["/sitemap.xml", "/sitemap-knowledge.xml"], (path) => request(origin + path));
const urls = new Set([origin + "/knowledge/"]);
for (const map of maps) for (const match of map.body.matchAll(/<loc>(.*?)<\/loc>/g)) urls.add(match[1].replaceAll("&amp;", "&"));
const targets = new Map(); const fragments = []; const ids = new Map();
function addTarget(href, source) {
  try {
    const target = new URL(href, source);
    if (!/^https?:$/.test(target.protocol)) return;
    if (target.origin === origin && /^\/(admin|api)\//.test(target.pathname)) return;
    if (target.hash && target.origin === origin) fragments.push({ source, url: target.origin + target.pathname + target.search, hash: decodeURIComponent(target.hash.slice(1)) });
    target.hash = "";
    const owners = targets.get(target.href) || new Set(); owners.add(source); targets.set(target.href, owners);
  } catch { /* Invalid destinations are recorded by the page audit. */ }
}
const pages = await pool([...urls], async (url) => {
  const response = await request(url);
  const dom = new JSDOM(response.body, { url }); const doc = dom.window.document;
  const meta = (selector) => doc.querySelector(selector)?.getAttribute("content") || null;
  ids.set(url, new Set([...doc.querySelectorAll("[id], a[name]")].map((node) => node.id || node.getAttribute("name"))));
  for (const node of doc.querySelectorAll("a[href]")) addTarget(node.getAttribute("href"), url);
  const image = meta('meta[property="og:image"]'); if (image) addTarget(image, url);
  const jsonLd = []; const jsonLdErrors = [];
  for (const node of doc.querySelectorAll('script[type="application/ld+json"]')) {
    try { const data = JSON.parse(node.textContent); jsonLd.push(data); } catch (e) { jsonLdErrors.push(e.message); }
  }
  const result = { ...withoutBody(response), title: doc.title, description: meta('meta[name="description"]'), canonical: doc.querySelector('link[rel="canonical"]')?.href || null, robots: meta('meta[name="robots"]'), ogImage: image, h1Count: doc.querySelectorAll("h1").length, copyright: doc.querySelector(".site-footer__copyright")?.textContent.trim() || null, footerText: doc.querySelector("footer")?.textContent.replace(/\s+/g, " ").trim() || null, jsonLd, jsonLdErrors, mainTextLength: doc.querySelector("main")?.textContent.length || 0 };
  dom.window.close(); return result;
});
console.log(`Audited ${pages.length} pages; checking ${targets.size} distinct link/image destinations.`);
const links = await pool([...targets.keys()], async (url) => {
  let response = await request(url);
  if (response.error || response.status >= 400) { cache.delete(url); const retry = await request(url); response = { ...retry, firstAttempt: withoutBody(response) }; }
  return { ...withoutBody(response), sources: [...targets.get(url)] };
});
function duplicates(key) {
  const groups = new Map();
  for (const page of pages) { const value = page[key]; if (!value) continue; const owners = groups.get(value) || []; owners.push(page.url); groups.set(value, owners); }
  return [...groups].filter(([, owners]) => owners.length > 1).map(([value, owners]) => ({ value, urls: owners }));
}
const controls = await pool(["/robots.txt", "/ads.txt", "/api/knowledge/v1/questions?limit=1&page=1", "/this-page-does-not-exist-adsense-audit/"], async (path) => {
  const r = await request(origin + path); return { ...withoutBody(r), body: path.includes("does-not-exist") ? undefined : r.body };
});
const report = { auditedAt: new Date().toISOString(), origin, sitemaps: maps.map(withoutBody), pages, links, controls,
  summary: { pages: pages.length, calculators: pages.filter(p => /\/calculators\/[^/]+\/$/.test(p.url)).length, knowledge: pages.filter(p => /\/knowledge\/[0-9a-f-]+\/$/.test(p.url)).length, linkTargets: links.length,
    pageErrors: pages.filter(p => p.status !== 200 || p.error).map(withoutBody), canonicalErrors: pages.filter(p => p.canonical !== p.url).map(p => ({ url: p.url, canonical: p.canonical })), noindexPages: pages.filter(p => /noindex/i.test((p.robots || "") + (p.robotsHeader || ""))).map(p => p.url), duplicateTitles: duplicates("title"), duplicateDescriptions: duplicates("description"), missingMetadata: pages.filter(p => !p.title || !p.description || !p.ogImage).map(p => p.url), brokenOrBlockedLinks: links.filter(p => p.status >= 400 || p.error), redirects: links.filter(p => p.chain.length > 1), fragmentMissingInInitialHtml: fragments.filter(f => ids.has(f.url) && !ids.get(f.url).has(f.hash)), copyrightVariants: [...new Set(pages.map(p => p.copyright))], jsonLdErrors: pages.filter(p => p.jsonLdErrors.length) } };
await mkdir(output.slice(0, output.lastIndexOf("/")), { recursive: true });
await writeFile(output, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report.summary, null, 2));
console.log(`Report: ${output}`);
