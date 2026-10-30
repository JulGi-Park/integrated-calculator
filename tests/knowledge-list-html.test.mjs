import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { onRequestGet } from "../functions/knowledge/index.ts";

const id = "12345678-1234-4123-8123-123456789abc";
const title = `질문 <img src=x onerror=alert(1)> & " ' $&\n둘째 줄`;
const item = { id, title, category: "<script>카테고리</script>", status: "published" };
const shell = '<html><head><title>계산박스 지식센터</title><meta name="description" content="원래 설명"><link rel="canonical" href="https://gyesanbox.kr/knowledge/"><meta name="robots" content="noindex"></head><body><h1>계산박스 지식센터</h1><div id="knowledge-server-list"></div><div hidden>기존 UI</div><script>/* static client shell */</script></body></html>';
const payload = (page=1, total=11) => ({ok:true,data:{items:Array.from({length:Math.min(10,Math.max(0,total-(page-1)*10))},(_,i)=>({...item,id:`12345678-1234-4123-8123-${String(i).padStart(12,'0')}`})),page,page_size:10,total,total_pages:Math.max(1,Math.ceil(total/10))}});
const context = (search="",fetch=async()=>Response.json(payload()),html=shell) => ({
  request:new Request(`https://html-preview.integrated-calculator.pages.dev/knowledge/${search}`),params:{},
  env:{NEXT_PUBLIC_ENABLE_KNOWLEDGE_PREVIEW:"true",KNOWLEDGE_SERVICE:{fetch}},
  next:async()=>new Response(html,{headers:{"content-type":"text/html",etag:"stale","content-length":"1"}}),
});

test("initial HTML exposes escaped titles and real detail/page links outside scripts, retaining metadata",async()=>{
  const response=await onRequestGet(context("",async req=>{
    assert.equal(req.method,"GET");assert.equal(new URL(req.url).search,"?limit=10&page=1");return Response.json(payload());
  }));
  assert.equal(response.status,200);assert.equal(response.headers.get("cache-control"),"no-store");
  const doc=new JSDOM(await response.text()).window.document;
  assert.equal(doc.querySelector("#knowledge-server-list a").textContent,title);
  assert.equal(doc.querySelectorAll("#knowledge-server-list li").length,10);
  assert.equal(doc.querySelectorAll("#knowledge-server-list script,#knowledge-server-list img").length,0);
  assert.equal(doc.querySelector('a[rel=next]').getAttribute('href'),'/knowledge/?page=2');
  assert.match(doc.querySelector("li a").getAttribute("href"),/^\/knowledge\/[\da-f-]+\/$/);
  assert.equal(doc.title,"계산박스 지식센터");assert.equal(doc.querySelector('meta[name=description]').content,"원래 설명");
  assert.equal(doc.querySelector('link[rel=canonical]').href,"https://gyesanbox.kr/knowledge/");
  assert.match(doc.querySelector('meta[name=robots]').content,/noindex/);
  assert.equal(doc.querySelectorAll('h1').length,1);doc.defaultView.close();
});

test("pagination reflects requested page and subsequent fresh API changes; invalid/out of range pages are 404",async()=>{
  const response=await onRequestGet(context('?page=2',async req=>{
    assert.equal(new URL(req.url).searchParams.get('page'),'2');return Response.json(payload(2));
  }));
  const doc=new JSDOM(await response.text()).window.document;
  assert.equal(doc.querySelectorAll('li').length,1);assert.equal(doc.querySelector('a[aria-current=page]').textContent,'2');
  assert.equal(doc.querySelector('a[rel=prev]').getAttribute('href'),'/knowledge/');assert.equal(doc.querySelector('a[rel=next]'),null);doc.defaultView.close();
  for(const query of ['?page=0','?page=-1','?page=1.5','?page=foo','?page=01','?page=9007199254740992','?page=1&page=2']){
    assert.equal((await onRequestGet(context(query,()=>{throw Error('invalid page must not fetch');}))).status,404);
  }
  assert.equal((await onRequestGet(context('?page=3',async()=>Response.json(payload(3))))).status,404);
  const changed=payload();changed.data.items[0].title='관리자 수정 후 새 제목';
  assert.match(await (await onRequestGet(context('',async()=>Response.json(changed)))).text(),/관리자 수정 후 새 제목/);
});

test("errors, redirects, malformed pages, nonpublic rows and absent/duplicate islands fail closed with 503",async()=>{
  const hidden=payload();hidden.data.items[0].status='hidden';
  const draft=payload();draft.data.items[0].status='draft';
  const invalid=payload();invalid.data.items[0].id='javascript:alert(1)';
  for(const fetch of [async()=>{throw Error('offline');},async()=>new Response('bad',{status:500}),
    async()=>new Response(null,{status:302,headers:{location:'https://evil.example'}}),
    ...[{},hidden,draft,invalid,{...payload(),data:{...payload().data,items:[]}}].map(data=>async()=>Response.json(data))]){
    const response=await onRequestGet(context('',fetch));assert.equal(response.status,503);assert.match(response.headers.get('x-robots-tag'),/noindex/);
    assert.doesNotMatch(await response.text(),/등록된 질문이 없습니다/);
  }
  for(const html of [shell.replace('<div id="knowledge-server-list"></div>',''),shell.replace('</body>','<div id="knowledge-server-list"></div></body>')]){
    assert.equal((await onRequestGet(context('',undefined,html))).status,503);
  }
  const empty=await onRequestGet(context('',async()=>Response.json(payload(1,0))));
  assert.equal(empty.status,200);assert.match(await empty.text(),/등록된 질문이 없습니다/);
});
