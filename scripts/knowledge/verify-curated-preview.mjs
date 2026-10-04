// Read-only raw initial HTML audit. Identity snapshot must come from dedicated Preview imports, not title matching.
import fs from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { JSDOM } from "jsdom";
import { parseCuratedManifest, fingerprintMatches } from "../../pages-functions/knowledge-curated-seo.ts";
import { knowledgeSeo, knowledgeCanonical, knowledgeDetailPath } from "../../lib/knowledge/seo.ts";

const origin = new URL(process.argv[2]);
assert.equal(origin.protocol,"https:");assert.match(origin.hostname,/^[a-z0-9-]+\.integrated-calculator\.pages\.dev$/u);
const identity = JSON.parse(fs.readFileSync(process.argv[3],"utf8"));
const approved = JSON.parse(fs.readFileSync(new URL("../../pages-functions/data/knowledge-seo-enhancement-261004.json",import.meta.url),"utf8"));
const manifest = parseCuratedManifest(approved);assert.equal(manifest?.size,200);
const ids = new Map(identity.map(row=>[row.sourceKey,row.id]));
assert.equal(ids.size,200);assert.equal(new Set(ids.values()).size,200);
assert.deepEqual(new Set(ids.keys()),new Set(manifest.keys()));
const api="https://knowledge-preview.gyesanbox.kr/api/knowledge/v1";
async function get(url, requireNoStore = true) {
  const response=await fetch(url,{redirect:"manual",signal:AbortSignal.timeout(30000)});
  assert.equal(response.status,200,`${response.status}: ${url}`);
  if (requireNoStore) assert.equal(response.headers.get("cache-control"),"no-store");return response;
}
const questions=new Map();
const records=[...manifest.values()];
async function parallel(items,action) {
  let next=0;await Promise.all(Array.from({length:4},async()=>{while(next<items.length)await action(items[next++]);}));
}
await parallel(records,async record=>{
  const payload=await (await get(`${api}/questions/${ids.get(record.sourceKey)}`)).json();assert.equal(payload.ok,true);
  const q={...payload.data.question,status:"published"};assert.equal(q.id,ids.get(record.sourceKey));
  assert.equal(await fingerprintMatches(record,q),true,`Fingerprint mismatch: ${record.sourceKey}`);questions.set(q.id,q);
});
const results={manifest:200,resolve:ids.size,fingerprintPass:questions.size,curated:0,reviewFallback:0,staleFallback:0,unresolvedFallback:0,
  http200:0,h1:0,canonical:0,noindex:0,metadata:0,relatedEdges:0,maxLinks:0,self:0,duplicate:0,invalidTarget:0,privateTarget:0,calculatorLinks:0,qapage:0};
const titles=new Set();
await parallel(records,async record=>{
  const q=questions.get(ids.get(record.sourceKey));const response=await get(new URL(knowledgeDetailPath(q.id),origin));
  assert.equal(response.headers.get("x-robots-tag"),"noindex, nofollow, noarchive");
  const html=await response.text();const doc=new JSDOM(html).window.document;
  const expected=record.review?knowledgeSeo(q):{title:record.seoTitle,description:record.description};
  assert.equal(doc.title,expected.title,`Title: ${record.sourceKey}`);
  assert.equal(doc.querySelector('meta[name="description"]').content,expected.description,`Description: ${record.sourceKey}`);
  for(const selector of ['meta[property="og:title"]','meta[name="twitter:title"]'])assert.equal(doc.querySelector(selector).content,expected.title);
  for(const selector of ['meta[property="og:description"]','meta[name="twitter:description"]'])assert.equal(doc.querySelector(selector).content,expected.description);
  assert.equal(doc.querySelector('meta[property="og:url"]').content,knowledgeCanonical(q.id));
  assert.equal(doc.querySelector('link[rel="canonical"]').href,knowledgeCanonical(q.id));
  assert.equal(doc.querySelector('meta[name="robots"]').content,"noindex, nofollow, noarchive");
  assert.equal(doc.querySelector("h1").textContent,q.title);
  const normalize=text=>text.replace(/\s/gu,"");
  for(const [heading,body] of [["question-body",q.body],["official-answer",q.answer.body]]) {
    const content=[...doc.querySelectorAll(`section[aria-labelledby="${heading}"] p`)].map(p=>p.textContent).join("");
    assert.equal(normalize(content),normalize(body),`Initial HTML body: ${record.sourceKey}`);
  }
  assert.doesNotMatch(html,/QAPage|application\/ld\+json|ANSWER_SCOPE_REVIEW|password_hash|passwordConfigured|kin-261001-/u);
  const actual=[...doc.querySelectorAll('section[aria-labelledby="related-questions"] a')];
  const expectedRelated=record.related.filter(edge=>{const id=ids.get(edge.sourceKey);return id&&id!==q.id&&questions.get(id)?.title===edge.title;}).slice(0,5);
  assert.equal(actual.length,expectedRelated.length,`Edges: ${record.sourceKey}`);
  assert.deepEqual(actual.map(a=>a.getAttribute("href")),expectedRelated.map(e=>knowledgeDetailPath(ids.get(e.sourceKey))));
  assert.equal(new Set(actual.map(a=>a.getAttribute("href"))).size,actual.length);
  for(const a of actual){const targetId=a.getAttribute("href").split("/")[2];assert.notEqual(targetId,q.id);assert.ok(questions.has(targetId));assert.equal(a.textContent,questions.get(targetId).title);}
  const calculators=[...doc.querySelectorAll('section[aria-labelledby="related-calculators"] a')];
  assert.deepEqual(calculators.map(a=>a.getAttribute("href")),q.relatedServices.map(s=>`/calculators/${s.slug}/`));
  titles.add(doc.title);results.http200++;results.h1++;results.canonical++;results.noindex++;results.metadata++;
  results[record.review?"reviewFallback":"curated"]++;results.relatedEdges+=actual.length;
  results.maxLinks=Math.max(results.maxLinks,actual.length);results.calculatorLinks+=calculators.length;
  doc.defaultView.close();
});
assert.equal(results.curated,190);assert.equal(results.reviewFallback,10);assert.equal(results.http200,200);assert.equal(titles.size,200);
const list=await get(new URL("/knowledge/",origin),false);assert.match(await list.text(),/계산박스 지식센터/u);
assert.equal(list.headers.get("x-robots-tag"),"noindex");
const sitemap=await get(new URL("/sitemap-knowledge.xml",origin));const xml=await sitemap.text();
const locs=[...xml.matchAll(/<loc>([^<]+)<\/loc>/gu)].map(m=>m[1]);
assert.deepEqual(new Set(locs),new Set([...ids.values()].map(knowledgeCanonical)));assert.equal(locs.length,200);assert.doesNotMatch(xml,/<lastmod>/u);
for(const path of ["/knowledge/not-a-uuid/","/knowledge/00000000-0000-4000-8000-000000000000/"]) {
  assert.equal((await fetch(new URL(path,origin),{redirect:"manual"})).status,404);
}
const snapshotHash=createHash("sha256").update(JSON.stringify([...questions.values()].sort((a,b)=>a.id.localeCompare(b.id)))).digest("hex");
console.log(JSON.stringify({...results,uniqueTitles:titles.size,sitemap:locs.length,publicReadbackHash:snapshotHash,origin:origin.origin},null,2));
