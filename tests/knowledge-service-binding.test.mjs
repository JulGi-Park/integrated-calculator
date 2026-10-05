import assert from "node:assert/strict";
import { test } from "node:test";
import { onRequest as proxy } from "../functions/api/knowledge/v1/[[path]].ts";
import { knowledgeServiceFetch, knowledgeReadRequest } from "../pages-functions/knowledge-transport.ts";
import { onRequestGet as detail } from "../functions/knowledge/[questionId].ts";
import { onRequestGet as list } from "../functions/knowledge/index.ts";

const origin = "https://gyesanbox.kr";
const root = "/api/knowledge/v1";
const id = "12345678-1234-4123-8123-123456789abc";
const values = { KNOWLEDGE_ENV: "production", KNOWLEDGE_PUBLIC_ENABLED: "true" };
const request = (path, method="GET", headers={}, body) => new Request(origin+path, {method,headers,body});

test("proxy allows exactly the visitor method/path surface, preserving body/query/status and stripping trust headers", async()=>{
  const cases = [["GET","/services"],["GET","/questions?q=%ED%87%B4%EC%A7%81%EA%B8%88&category=x&page=2"],
    ["POST","/questions"],["GET",`/questions/${id}`],["PATCH",`/questions/${id}`],
    ["DELETE",`/questions/${id}`],["POST",`/questions/${id}/verify-password`]];
  for(const [method,path] of cases) {
    let calls=0;
    const body=method==="GET"?undefined:'{"password":" raw-value "}';
    const env={...values,KNOWLEDGE_SERVICE:{async fetch(req){
      calls++;assert.equal(req.method,method);assert.equal(new URL(req.url).pathname+new URL(req.url).search,root+path);
      assert.equal(req.redirect,"manual");assert.equal(req.headers.get("Origin"),origin);
      assert.equal(req.headers.get("CF-Connecting-IP"),"192.0.2.10");assert.equal(req.headers.get("Idempotency-Key"),id);
      for(const header of ["Authorization","Cookie","CF-Access-Jwt-Assertion","X-Admin","X-Forwarded-For"])assert.equal(req.headers.get(header),null);
      if(body!==undefined)assert.equal(await req.text(),body);
      return new Response('denied by worker',{status:403,headers:{"content-type":"application/json","set-cookie":"trust=yes","Retry-After":"12"}});
    }}};
    const response=await proxy({env,request:request(root+path,method,{Origin:origin,"Content-Type":"application/json",
      "CF-Connecting-IP":"192.0.2.10","Idempotency-Key":id,Authorization:"evil",Cookie:"evil",
      "CF-Access-Jwt-Assertion":"evil","X-Admin":"true","X-Forwarded-For":"evil"},body)});
    assert.equal(response.status,403);assert.equal(await response.text(),"denied by worker");assert.equal(calls,1);
    assert.equal(response.headers.get("content-type"),"application/json");assert.equal(response.headers.get("cache-control"),"no-store");
    assert.equal(response.headers.get("set-cookie"),null);assert.equal(response.headers.get("Retry-After"),"12");
  }
});

test("admin/import/internal/unknown paths and management methods never reach the binding",async()=>{
  const env={...values,KNOWLEDGE_SERVICE:{fetch(){throw Error("must not call");}}};
  for(const path of ["/admin/questions","/admin/import","/import","/internal","/questions/x",
    `/questions/${id}/publish`,`/questions/${id}/answer`,`/questions/${id}/%2e%2e/admin`,"/questions%2Fadmin"]) {
    assert.equal((await proxy({env,request:request(root+path,"POST",{Origin:origin})})).status,404);
  }
  for(const method of ["PUT","HEAD","OPTIONS"])assert.equal((await proxy({env,request:request(root+"/questions",method)})).status,404);
});

test("public/index matrix gates the proxy before any service access; Preview always noindex",async()=>{
  for(const publicOn of [false,true])for(const indexOn of [false,true]) {
    let calls=0;
    const env={...values,KNOWLEDGE_PUBLIC_ENABLED:String(publicOn),KNOWLEDGE_INDEX_ENABLED:String(indexOn),
      KNOWLEDGE_SERVICE:{async fetch(){calls++;return Response.json({ok:true});}}};
    const response=await proxy({env,request:request(root+"/questions")});
    assert.equal(response.status,publicOn?200:404);assert.equal(calls,publicOn?1:0);
    assert.match(response.headers.get("x-robots-tag"),/noindex/); // APIs are never indexed.
  }
  const env={NEXT_PUBLIC_ENABLE_KNOWLEDGE_PREVIEW:"true",KNOWLEDGE_INDEX_ENABLED:"true",
    KNOWLEDGE_SERVICE:{async fetch(){return Response.json({ok:true});}}};
  const response=await proxy({env,request:new Request("https://binding-preview.integrated-calculator.pages.dev"+root+"/questions")});
  assert.equal(response.status,200);assert.match(response.headers.get("x-robots-tag"),/noindex/);
  assert.equal((await proxy({env:{},request:request(root+"/questions")})).status,404);
});

test("missing binding/errors/redirects fail closed without Internet fallback; disabled detail/list remain 404",async()=>{
  const original=globalThis.fetch;let internet=0;
  globalThis.fetch=()=>{internet++;throw Error("Internet forbidden");};
  try {
    await assert.rejects(knowledgeServiceFetch({},knowledgeReadRequest("/questions")),/SERVICE_MISSING/);
    for(const env of [values,{...values,KNOWLEDGE_SERVICE:{fetch(){throw Error("down");}}},
      {...values,KNOWLEDGE_SERVICE:{async fetch(){return new Response(null,{status:302,headers:{location:"https://evil.example"}});}}}]) {
      assert.equal((await proxy({env,request:request(root+"/questions")})).status,503);
    }
    for(const env of [{},values]) {
      const context={request:request(`/knowledge/${id}/`),params:{questionId:id},env};
      assert.equal((await detail(context)).status,env===values?503:404);
      assert.equal((await list({...context,next(){throw Error("assets must not be read");}})).status,env===values?503:404);
    }
    assert.equal(internet,0);
  } finally {globalThis.fetch=original;}
});

test("cross-origin and missing-Origin mutations are rejected without service calls",async()=>{
  const env={...values,KNOWLEDGE_SERVICE:{fetch(){throw Error("must not call");}}};
  for(const headers of [{},{Origin:"null"},{Origin:"https://evil.example"}]) {
    for(const method of ["POST","PATCH","DELETE"]) {
      const path=method==="POST"?"/questions":`/questions/${id}`;
      assert.equal((await proxy({env,request:request(root+path,method,headers)})).status,403);
    }
  }
});

test("a hung binding is bounded by the transport deadline",async()=>{
  let forwarded;
  const env={KNOWLEDGE_SERVICE:{fetch(req){forwarded=req;return new Promise(()=>{});}}};
  await assert.rejects(knowledgeServiceFetch(env,knowledgeReadRequest("/questions")),/SERVICE_TIMEOUT/);
  assert.equal(forwarded.signal.aborted,true);
});
