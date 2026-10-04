import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { JSDOM } from "jsdom";
import { knowledgeGates, knowledgeBuildGates } from "../lib/knowledge/gates.ts";
import { knowledgeSeo } from "../lib/knowledge/seo.ts";
import { curatedKnowledgeSeo, parseCuratedManifest } from "../pages-functions/knowledge-curated-seo.ts";
import { renderKnowledgeQuestion } from "../pages-functions/knowledge-seo.ts";
import { onRequestGet as detail } from "../functions/knowledge/[questionId].ts";
import { onRequestGet as list } from "../functions/knowledge/index.ts";
import { onRequestGet as sitemap } from "../functions/sitemap-knowledge.xml.ts";

const id = "12345678-1234-4123-8123-123456789abc";
const q = { id, title: "검증 질문 < &", body: "질문 내용", category: "금융", status: "published",
  isAnonymous: true, nickname: null, answer: { body: "공식답변" }, relatedServices: [] };
const sha = text => createHash("sha256").update(text).digest("hex");
const fingerprint = { title:sha(q.title),question_body:sha(q.body),answer_body:sha(q.answer.body),category:sha(q.category),
  content:sha(JSON.stringify({title:q.title,body:q.body,answer:q.answer.body,category:q.category})) };
const env = (publicOn, indexOn) => ({ KNOWLEDGE_ENV:"production", KNOWLEDGE_PUBLIC_ENABLED:String(publicOn),
  KNOWLEDGE_INDEX_ENABLED:String(indexOn), KNOWLEDGE_API_BASE:"https://knowledge.gyesanbox.kr/api/knowledge/v1" });
const ctx = (path, values, host="gyesanbox.kr") => ({request:new Request(`https://${host}${path}`),env:values,params:{questionId:id}});
const assets = () => Promise.resolve(new Response('<html><head><meta name="robots" content="noindex, nofollow"></head><body>계산박스 지식센터</body></html>',
  {headers:{"content-type":"text/html","etag":"old","content-length":"1","x-robots-tag":"noindex"}}));

test("Production/Preview matrix applies to actual detail/list HTML and sitemap, defaults fail closed", async()=>{
  const saved=globalThis.fetch;
  globalThis.fetch=async url => String(url).includes(`/questions/${id}`) ? Response.json({ok:true,data:{question:q}})
    : Response.json({ok:true,data:{items:[{id,title:q.title,category:q.category}],page:1,page_size:10,total:1,total_pages:1}});
  try {
    for(const publicOn of [false,true]) for(const indexOn of [false,true]) {
      const values=env(publicOn,indexOn);const expected=publicOn&&indexOn;
      assert.equal(knowledgeGates("production",values).indexEnabled,expected);
      assert.equal(knowledgeBuildGates(values).indexEnabled,expected);
      const result=await detail(ctx(`/knowledge/${id}/`,values));
      const listing=await list({...ctx('/knowledge/',values),next:assets});
      assert.equal(result.status,publicOn?200:404);assert.equal(listing.status,publicOn?200:404);
      if(publicOn) {
        for(const response of [result,listing]) {
          const doc=new JSDOM(await response.text()).window.document;
          assert.equal(doc.querySelector('meta[name="robots"]').content,expected?'index, follow':'noindex, nofollow, noarchive');
          assert.equal(doc.title.includes('검증 질문'),response===result);
          doc.defaultView.close();
        }
      } else assert.match(result.headers.get('x-robots-tag'),/noindex/);
      const xml=await sitemap(ctx('/sitemap-knowledge.xml',values));assert.equal(xml.status,expected?200:404);
      if(expected){assert.match(await xml.text(),new RegExp(id));assert.equal(xml.headers.get('x-robots-tag'),null);}
    }
    for(const values of [{},env(true,true)]) {
      const preview={...values,NEXT_PUBLIC_ENABLE_KNOWLEDGE_PREVIEW:'true',NEXT_PUBLIC_KNOWLEDGE_API_BASE:'https://knowledge-preview.gyesanbox.kr/api/knowledge/v1'};
      // Even production-looking variables on a Pages Preview hostname cannot allow indexing.
      const response=await detail(ctx(`/knowledge/${id}/`,preview,'gate-preview.integrated-calculator.pages.dev'));
      assert.equal(response.status,200);assert.match(await response.text(),/noindex, nofollow, noarchive/);
      const listing=await list({...ctx('/knowledge/',preview,'gate-preview.integrated-calculator.pages.dev'),next:assets});
      assert.equal(listing.headers.get('x-robots-tag'),'noindex');assert.match(await listing.text(),/noindex, nofollow, noarchive/);
    }
    assert.equal(knowledgeBuildGates({}).indexEnabled,false);
    assert.equal((await detail(ctx(`/knowledge/${id}/`,{}))).status,404);
    assert.equal((await list({...ctx('/knowledge/',{}),next:()=>{throw Error('must not fetch assets');}})).status,404);
  } finally {globalThis.fetch=saved;}
});

test("Production curated resolver requires explicit permission; all 200 policy records retain 190/10 split",async()=>{
  const approved=JSON.parse(fs.readFileSync(new URL('../pages-functions/data/knowledge-seo-enhancement-261004.json',import.meta.url)));
  const records=parseCuratedManifest(approved);let curated=0,review=0;
  for(const record of records.values()) {
    const fixture={...record,fingerprint,related:[]};
    const db={prepare(){return {bind(){return {all:async()=>({success:true,results:[{source_key:record.sourceKey,question_id:id}]})};}};}};
    const options={environment:'production',curatedEnabled:true,question:q,db,records:new Map([[record.sourceKey,fixture]]),readPublished:async()=>null};
    const result=await curatedKnowledgeSeo(options);
    assert.equal(result.reason,record.review?'review':'curated');
    if(record.review) review++; else curated++;
    const doc=new JSDOM(renderKnowledgeQuestion(q,'production',result.related,result.metadata,{publicEnabled:true,indexEnabled:true})).window.document;
    const expected=record.review?knowledgeSeo(q):{title:record.seoTitle,description:record.description};
    assert.equal(doc.title,expected.title);
    for(const s of ['meta[property="og:title"]','meta[name="twitter:title"]'])assert.equal(doc.querySelector(s).content,expected.title);
    for(const s of ['meta[name="description"]','meta[property="og:description"]','meta[name="twitter:description"]'])assert.equal(doc.querySelector(s).content,expected.description);
    assert.equal(doc.querySelector('meta[name="robots"]').content,'index, follow');
    assert.equal(doc.querySelector('h1').textContent,q.title);
    assert.equal(doc.querySelector('link[rel="canonical"]').href,`https://gyesanbox.kr/knowledge/${id}/`);
    doc.defaultView.close();
    for(const extra of [{curatedEnabled:false},{curatedEnabled:undefined},{question:{...q,title:'changed'}},{db:undefined},
      {question:{...q,id:'12345678-1234-4123-8123-123456789abd'}}]) {
      const fallback=await curatedKnowledgeSeo({...options,...extra});assert.equal(fallback.metadata,undefined);
      const fallbackDoc=new JSDOM(renderKnowledgeQuestion(q,'production',[],fallback.metadata,{publicEnabled:true,indexEnabled:true})).window.document;
      assert.equal(fallbackDoc.querySelector('meta[name="robots"]').content,'index, follow');
      fallbackDoc.defaultView.close();
    }
  }
  assert.equal(curated,190);assert.equal(review,10);
});

test("list response fails closed on missing/duplicate robots and preserves UI without cached indexing headers",async()=>{
  for(const html of ['<html></html>','<meta name="robots" content="index"><meta name="robots" content="index">']) {
    assert.equal((await list({...ctx('/knowledge/',env(true,true)),next:async()=>new Response(html,{headers:{'content-type':'text/html'}})})).status,503);
  }
  const result=await list({...ctx('/knowledge/',env(true,true)),next:assets});
  assert.equal(result.headers.get('cache-control'),'no-store');assert.equal(result.headers.get('etag'),null);
  assert.equal(result.headers.get('content-length'),null);assert.equal(result.headers.get('x-robots-tag'),'index, follow');
});
