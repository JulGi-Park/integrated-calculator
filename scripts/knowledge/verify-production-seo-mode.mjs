// Local Production-mode probe only: SELECT identity snapshot + public Preview GETs, no remote writes.
import fs from "node:fs";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { onRequestGet } from "../../functions/knowledge/[questionId].ts";
import { parseCuratedManifest, fingerprintMatches } from "../../pages-functions/knowledge-curated-seo.ts";
import { knowledgeSeo } from "../../lib/knowledge/seo.ts";

const identities=JSON.parse(fs.readFileSync(process.argv[2],"utf8"));
const records=parseCuratedManifest(JSON.parse(fs.readFileSync(new URL('../../pages-functions/data/knowledge-seo-enhancement-261004.json',import.meta.url))));
assert.equal(identities.length,200);assert.equal(records.size,200);
const questions=new Map();const rows=[];
const realFetch=globalThis.fetch;
for(let offset=0;offset<identities.length;offset+=4) {
  await Promise.all(identities.slice(offset,offset+4).map(async(row,i)=>{
    const response=await realFetch(`https://knowledge-preview.gyesanbox.kr/api/knowledge/v1/questions/${row.id}`);
    assert.equal(response.status,200);
    const payload=await response.json();const q={...payload.data.question,status:'published'};
    assert.equal(await fingerprintMatches(records.get(row.sourceKey),q),true);
    // Synthetic local-only UUIDs prove that identity is not tied to Preview UUIDs.
    const id=`${(offset+i+1).toString(16).padStart(8,'0')}-1234-4123-8123-123456789abc`;
    questions.set(id,{...q,id});rows.push({source_key:row.sourceKey,question_id:id});
  }));
}
const db={prepare(sql){assert.match(sql,/^SELECT /);return {bind(...keys){return {all:async()=>({success:true,
  results:rows.filter(row=>keys.includes(row.source_key))})};}};}};
const env={KNOWLEDGE_ENV:'production',KNOWLEDGE_PUBLIC_ENABLED:'true',KNOWLEDGE_INDEX_ENABLED:'true',
  KNOWLEDGE_API_BASE:'https://knowledge.gyesanbox.kr/api/knowledge/v1',KNOWLEDGE_SEO_IDENTITY_DB:db};
const counts={localOnly:true,resolve:200,fingerprint:200,rawHtml:0,curated:0,review:0,index:0,relatedEdges:0};
globalThis.fetch=async url=>{
  const u=new URL(url);assert.equal(u.origin,'https://knowledge.gyesanbox.kr');
  const question=questions.get(u.pathname.split('/').at(-1));
  return question?Response.json({ok:true,data:{question}}):Response.json({ok:false},{status:404});
};
try {
  for(const row of rows) {
    const q=questions.get(row.question_id);const record=records.get(row.source_key);
    const response=await onRequestGet({request:new Request(`https://gyesanbox.kr/knowledge/${q.id}/`),params:{questionId:q.id},env});
    assert.equal(response.status,200);const html=await response.text();const doc=new JSDOM(html).window.document;
    const expected=record.review?knowledgeSeo(q):{title:record.seoTitle,description:record.description};
    assert.equal(doc.title,expected.title);
    for(const s of ['meta[property="og:title"]','meta[name="twitter:title"]'])assert.equal(doc.querySelector(s).content,expected.title);
    for(const s of ['meta[name="description"]','meta[property="og:description"]','meta[name="twitter:description"]'])assert.equal(doc.querySelector(s).content,expected.description);
    assert.equal(doc.querySelector('meta[name="robots"]').content,'index, follow');
    assert.equal(doc.querySelector('h1').textContent,q.title);
    assert.equal(doc.querySelector('link[rel="canonical"]').href,`https://gyesanbox.kr/knowledge/${q.id}/`);
    assert.doesNotMatch(html,/QAPage|application\/ld\+json|noindex/);
    counts.rawHtml++;counts.index++;if(record.review)counts.review++;else counts.curated++;
    counts.relatedEdges+=doc.querySelectorAll('section[aria-labelledby="related-questions"] a').length;
    doc.defaultView.close();
  }
} finally {globalThis.fetch=realFetch;}
assert.equal(counts.curated,190);assert.equal(counts.review,10);assert.equal(counts.relatedEdges,580);
console.log(JSON.stringify(counts,null,2));
