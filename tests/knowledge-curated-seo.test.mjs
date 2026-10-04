import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { JSDOM } from "jsdom";
import { curatedKnowledgeSeo, parseCuratedManifest, resolveImportIdentities } from "../pages-functions/knowledge-curated-seo.ts";
import { knowledgeSeo } from "../lib/knowledge/seo.ts";
import { renderKnowledgeQuestion } from "../pages-functions/knowledge-seo.ts";
import { onRequestGet } from "../functions/knowledge/[questionId].ts";

const approved = JSON.parse(fs.readFileSync(new URL("../pages-functions/data/knowledge-seo-enhancement-261004.json", import.meta.url)));
const id = "12345678-1234-4123-8123-123456789abc";
const otherId = "12345678-1234-4123-8123-123456789abd";
const sha = value => createHash("sha256").update(value).digest("hex");
const question = { id, title: "기존 질문 <title>", body: "질문 원문 & 내용", answer: { body: "공식답변" },
  category: "금융", status: "published", isAnonymous: true, nickname: null, relatedServices: [] };
const fingerprint = q => ({ title: sha(q.title), question_body: sha(q.body), answer_body: sha(q.answer.body), category: sha(q.category),
  content: sha(JSON.stringify({ title:q.title, body:q.body, answer:q.answer.body, category:q.category })) });
const record = { sourceKey:"fixture-source", title:question.title, seoTitle:`SEO </title> & " ' | 계산박스`,
  description:`설명 <script> & " '`, review:false, fingerprint:fingerprint(question), related:[] };
function database(rows, calls = []) {
  return { prepare(sql) {
    assert.match(sql, /^SELECT /u); assert.doesNotMatch(sql, /password|audit|INSERT|UPDATE|DELETE/iu);
    return { bind(...keys) { assert.ok(keys.length <= 80); calls.push({sql,keys});
      return { all:async () => ({ success:true, results:rows.filter(row => keys.includes(row.source_key)) }) }; } };
  } };
}
const options = (q=question, r=record, db=database([{source_key:r.sourceKey, question_id:q.id}])) => ({
  environment:"preview", question:q, db, records:new Map([[r.sourceKey,r]]), readPublished:async () => null });

test("approved artifact is exact, valid 200 records with required fields and review guard 10", () => {
  assert.equal(sha(fs.readFileSync(new URL("../pages-functions/data/knowledge-seo-enhancement-261004.json",import.meta.url))),
    "e317c85418c416e53b3f2745c67b1b370e186a5503315ba49ec0925c072cf27b");
  const records=parseCuratedManifest(approved); assert.equal(records.size,200);
  assert.equal(new Set([...records.keys()]).size,200);
  assert.deepEqual(approved.records.filter(r => records.get(r.sourceKey).review).map(r=>r.source_index),
    [86,118,122,130,135,140,153,154,191,192]);
  for(const mutate of [m=>m.records.pop(),m=>m.records[1].sourceKey=m.records[0].sourceKey,
    m=>m.records[0].proposed_meta_description="",m=>m.records[0].source_fingerprint.title="invalid",
    m=>m.records[0].related_question_evidence=[{source_index:999,anchor:"unknown"}]]) {
    const m=structuredClone(approved); mutate(m); assert.equal(parseCuratedManifest(m),null);
  }
  assert.equal(parseCuratedManifest(null),null);
});

test("environment identity is bound sourceKey SQL, never historical Preview UUID",async () => {
  const calls=[]; const r=await resolveImportIdentities(database([{source_key:record.sourceKey,question_id:otherId}],calls),[record.sourceKey]);
  assert.equal(r.get(record.sourceKey),otherId); assert.ok(!calls[0].sql.includes(record.sourceKey));
  const records=new Map([[record.sourceKey,record]]);
  assert.equal((await curatedKnowledgeSeo({...options({...question,id:otherId}),records})).reason,"curated");
  const many=Array.from({length:200},(_,i)=>`key-${i}`); const chunks=[];
  await resolveImportIdentities(database([],chunks),many); assert.deepEqual(chunks.map(c=>c.keys.length),[80,80,40]);
});

test("full fingerprint only applies curated, every individual mismatch falls back",async () => {
  assert.deepEqual((await curatedKnowledgeSeo(options())).metadata,{title:record.seoTitle,description:record.description});
  for(const q of [{...question,title:"changed"},{...question,body:"changed"},{...question,answer:{body:"changed"}},
    {...question,category:"세금"},{...question,answer:null},{...question,status:"hidden"}]) {
    const result=await curatedKnowledgeSeo(options(q)); assert.equal(result.reason,"stale");assert.equal(result.metadata,undefined);
  }
  assert.equal((await curatedKnowledgeSeo(options(question,{...record,fingerprint:{...record.fingerprint,content:sha("changed")}}))).reason,"stale");
});

test("all 10 review records keep deterministic metadata even with matching verified content",async () => {
  const records=parseCuratedManifest(approved);
  for(const reviewed of [...records.values()].filter(r=>r.review)) {
    const result=await curatedKnowledgeSeo(options(question,{...reviewed,fingerprint:fingerprint(question),related:[]}));
    assert.equal(result.reason,"review"); assert.equal(result.metadata,undefined);
    assert.ok(renderKnowledgeQuestion(question,"preview",result.related,result.metadata).includes(knowledgeSeo(question).title.replace(/</g,"&lt;").replace(/>/g,"&gt;")));
  }
});

test("unresolved, invalid manifest, new user and production safely fall back without private data",async () => {
  for(const extra of [{db:undefined},{db:database([])},{records:null},{environment:"production"},
    {db:{prepare(){throw Error("unavailable");}}}]) {
    const result=await curatedKnowledgeSeo({...options(),...extra});assert.equal(result.metadata,undefined);assert.deepEqual(result.related,[]);
  }
});

test("related targets published/current title only, no missing/draft/hidden/self/duplicate/filler; max5",async () => {
  const targets=Array.from({length:10},(_,i)=>({...question,id:`12345678-1234-4123-8123-${String(i).padStart(12,"0")}`,title:`질문${i}`}));
  const entries=[record,...targets.map((q,i)=>({...record,sourceKey:`target-${i}`,title:q.title}))];
  const r={...record,related:[{sourceKey:record.sourceKey,title:record.title},...targets.map((q,i)=>({sourceKey:`target-${i}`,title:q.title})),
    {sourceKey:"missing",title:"none"},{sourceKey:"target-4",title:targets[4].title}]};
  const rows=[{source_key:record.sourceKey,question_id:id},...targets.map((q,i)=>({source_key:`target-${i}`,question_id:q.id}))];
  const result=await curatedKnowledgeSeo({...options(question,r,database(rows)),records:new Map(entries.map(e=>[e.sourceKey,e.sourceKey===record.sourceKey?r:e])),
    readPublished:async targetId=>{const index=targets.findIndex(q=>q.id===targetId);if(index===0)return null;
      return index===1?{...targets[index],status:"draft"}:index===2?{...targets[index],status:"hidden"}:index===3?{...targets[index],title:"stale"}:targets[index];}});
  assert.equal(result.related.length,5);assert.equal(new Set(result.related.map(q=>q.id)).size,5);
  assert.ok(result.related.every(q=>q.id!==id));
  const none=await curatedKnowledgeSeo(options());assert.deepEqual(none.related,[]);
});

test("curated HTML escaping, OG/Twitter equality, canonical/H1/answer/calculators untouched, no schemas",()=>{
  const source=renderKnowledgeQuestion(question,"preview",[],{title:record.seoTitle,description:record.description});
  const doc=new JSDOM(source).window.document;
  assert.equal(doc.title,record.seoTitle);assert.equal(doc.querySelector("h1").textContent,question.title);
  for(const selector of ['meta[property="og:title"]','meta[name="twitter:title"]'])assert.equal(doc.querySelector(selector).content,record.seoTitle);
  for(const selector of ['meta[name="description"]','meta[property="og:description"]','meta[name="twitter:description"]'])assert.equal(doc.querySelector(selector).content,record.description);
  assert.equal(doc.querySelector('link[rel="canonical"]').href,`https://gyesanbox.kr/knowledge/${id}/`);
  assert.equal(doc.querySelectorAll("script").length,0);assert.doesNotMatch(source,/QAPage|application\/ld\+json|ANSWER_SCOPE_REVIEW|sourceKey/);
});

test("actual Function initial HTML uses bound identity; no public identity endpoint and fallback on DB failure",async ()=>{
  const saved=globalThis.fetch;
  globalThis.fetch=async url=>{assert.equal(String(url),`https://knowledge-preview.gyesanbox.kr/api/knowledge/v1/questions/${id}`);
    return Response.json({ok:true,data:{question}});};
  try {
    const response=await onRequestGet({request:new Request(`https://know-02-preview.integrated-calculator.pages.dev/knowledge/${id}/`),
      params:{questionId:id},env:{NEXT_PUBLIC_ENABLE_KNOWLEDGE_PREVIEW:"true",NEXT_PUBLIC_KNOWLEDGE_API_BASE:"https://knowledge-preview.gyesanbox.kr/api/knowledge/v1",
        KNOWLEDGE_SEO_IDENTITY_DB:database([])}});
    assert.equal(response.status,200);assert.equal(response.headers.get("cache-control"),"no-store");
    assert.equal(new JSDOM(await response.text()).window.document.title,knowledgeSeo(question).title);
  } finally {globalThis.fetch=saved;}
});
