import baseMigration from "../../migrations/0001_knowledge_base.sql?raw";
import catalogMigration from "../../migrations/0002_service_catalog.sql?raw";
import { beforeAll, describe, expect, it } from "vitest";
import { applyD1Migrations, env } from "cloudflare:test";
import { importBatch, importResult, importStatus, publishVerifiedImports } from "../../src/domain/knowledge-import";
import { route } from "../../src/router";
import { KnowledgeImportEntrypoint } from "../../src/knowledge-import-entrypoint";


const testEnv = { ...env, ENVIRONMENT: "preview", KNOWLEDGE_ADMIN_ENABLED: "true", AUTHOR_TOKEN_PEPPER: "test-import-pepper" } as unknown as Env;
const actor = { hash: "import-test-actor" };
const sample = (sourceKey: string, serviceSlugs: string[] = []) => ({ category: "근로·고용", sourceKey, title: "테스트 질문", questionBody: "질문 내용", answerBody: "공식답변 내용", serviceSlugs });
const payload = (items: unknown[], batchId = "test-batch") => ({ batchId, items });
const counts = async () => { const data = await importStatus(testEnv); return [data.questions, data.answers, data.serviceLinks]; };

describe("knowledge draft import", () => {
  beforeAll(async () => { await applyD1Migrations(env.KNOWLEDGE_DB, [baseMigration,catalogMigration].map((source,index) => ({ name: `${index+1}.sql`, queries: source.replace(/^--.*$/gm, "").split(";").map(x=>x.trim()).filter(Boolean) }))); });
  it("rejects incomplete or unapproved publication without changing questions", async () => {
    await expect(publishVerifiedImports(testEnv, actor, { sourceKeys: [], sourceSha256: "wrong" })).rejects.toMatchObject({ status: 409 });
    await expect(publishVerifiedImports(testEnv, actor, { sourceKeys: [], sourceSha256: "6c3d6aca606d4f0eb63377765ff9e2ce8e937c4c60d7701bc27e9dbcd9d7dd7f" })).rejects.toMatchObject({ status: 400 });
    expect((await env.KNOWLEDGE_DB.prepare("SELECT COUNT(*) AS count FROM knowledge_questions WHERE status='published'").first<{ count: number }>())?.count).toBe(0);
  });
  it("validates without writing and reports unknown/missing/privileged input", async () => {
    const before = await counts();
    expect((await importBatch(testEnv, actor, payload([sample("validate-a"), sample("validate-b", ["severance"])]), false)).valid).toBe(2);
    expect((await importBatch(testEnv, actor, payload([sample("unknown", ["not-a-service"])]), false)).items[0].errorCode).toBe("UNKNOWN_SERVICE");
    for (const extra of ["status", "origin", "password", "password_hash", "serviceIds", "targetUrl"]) expect((await importBatch(testEnv, actor, payload([{ ...sample("privileged"), [extra]: "published" }]), false)).failed).toBe(1);
    expect((await importBatch(testEnv, actor, payload([{ sourceKey: "missing" }]), false)).failed).toBe(1);
    await expect(importBatch(testEnv, actor, payload([sample("duplicate"), sample("duplicate")]), false)).rejects.toMatchObject({ code: "DUPLICATE_REQUEST" });
    await expect(importBatch(testEnv, actor, payload(Array.from({length:21},(_,i)=>sample(`size-${i}`))), false)).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(importBatch(testEnv, actor, { ...payload([sample("x")]), status: "published" }, true)).rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect(await counts()).toEqual(before);
  });
  it("writes 1 then 3 atomically, replays forever, and rejects changed payload", async () => {
    const one = await importBatch(testEnv, actor, payload([sample("one", ["labor-pay"])]), true);
    expect(one.inserted).toBe(1);
    const three = payload([sample("three-a"), sample("three-b", ["salary"]), sample("three-c", ["labor-pay", "severance", "salary", "salary"])], "three-batch");
    const first = await importBatch(testEnv, actor, three, true);
    expect(first.inserted).toBe(3); expect(await counts()).toEqual([4,4,5]);
    const retry = await importBatch(testEnv, actor, three, true);
    expect(retry.existing).toBe(3); expect(retry.inserted).toBe(0); expect(await counts()).toEqual([4,4,5]);
    expect(retry.items.map(x=>x.questionId)).toEqual(first.items.map(x=>x.questionId));
    expect((await importBatch(testEnv, actor, payload([{ ...sample("three-a"), title: "다른 제목" }]), true)).items[0].errorCode).toBe("SOURCE_KEY_CONFLICT");
    expect((await importResult(testEnv, {batchId:"three-batch"})).items).toHaveLength(3);
    expect((await importResult(testEnv, {sourceKey:"one"})).items).toHaveLength(1);
    const rows = (await env.KNOWLEDGE_DB.prepare("SELECT status,origin,is_anonymous,nickname,password_hash FROM knowledge_questions").all()).results;
    for (const row of rows) expect(row).toMatchObject({status:"draft",origin:"admin_seed",is_anonymous:1,nickname:null,password_hash:expect.stringMatching(/^v1\$pbkdf2-sha256\$100000\$/)});
    const ctx = {} as ExecutionContext;
    const publicList = await route(new Request("https://knowledge-preview.gyesanbox.kr/api/knowledge/v1/questions"), testEnv, ctx, "req");
    expect(await publicList.response.json()).toMatchObject({data:{total:0,items:[]}});
    expect(publicList.response.headers.get("Cache-Control")).toBe("no-store");
    await expect(route(new Request(`https://knowledge-preview.gyesanbox.kr/api/knowledge/v1/questions/${one.items[0].questionId}`),testEnv,ctx,"req")).rejects.toMatchObject({status:404});
    expect(JSON.stringify(first)).not.toMatch(/password|payload_hash|actor_subject_hash/);
    expect((await env.KNOWLEDGE_DB.prepare("SELECT COUNT(*) n FROM knowledge_answers a LEFT JOIN knowledge_questions q ON q.id=a.question_id WHERE q.id IS NULL").first<{n:number}>())?.n).toBe(0);
    expect((await env.KNOWLEDGE_DB.prepare("SELECT COUNT(*) n FROM knowledge_audit_actions WHERE action='knowledge_question_created' AND actor_subject_hash='import-test-actor'").first<{n:number}>())?.n).toBe(4);
  });
  it("rolls back a failed ledger write including question, answer, relations, audit", async () => {
    const before = await counts();
    await env.KNOWLEDGE_DB.exec("CREATE TRIGGER reject_import BEFORE INSERT ON knowledge_imports WHEN NEW.source_key='rollback' BEGIN SELECT RAISE(ABORT,'test rollback'); END;");
    const result = await importBatch(testEnv, actor, payload([sample("rollback", ["labor-pay"])]), true);
    expect(result.failed).toBe(1); expect(await counts()).toEqual(before);
  });
  it("concurrent retries create one logical item", async () => {
    const before = await counts();
    const p = payload([sample("concurrent", ["labor-pay"])]);
    const results = await Promise.all([importBatch(testEnv,actor,p,true),importBatch(testEnv,actor,p,true)]);
    expect(results.reduce((n,r)=>n+r.inserted,0)).toBe(1);
    expect(results.reduce((n,r)=>n+r.existing,0)).toBe(1);
    expect(await counts()).toEqual(before.map(x=>Number(x)+1));
  });
  it("denies public HTTP admin access and Production domain service calls", async () => {
    await expect(route(new Request("https://knowledge-preview.gyesanbox.kr/api/knowledge/v1/admin/import", {method:"POST"}),testEnv,{} as ExecutionContext,"req")).rejects.toMatchObject({status:401});
    await expect(importStatus({...testEnv,ENVIRONMENT:"production"})).rejects.toMatchObject({status:403});
    const rpc = new KnowledgeImportEntrypoint({} as ExecutionContext,testEnv);
    expect(await rpc.call("publish",{})).toMatchObject({ok:false,error:{status:403}});
    expect(await rpc.call("knowledge_preview_status",{})).toMatchObject({ok:true,data:{environment:"preview",services:expect.any(Array)}});
  });
  it("keeps authenticated human admin routes and imported draft detail available", async () => {
    const ctx = {access:{getIdentity:async()=>({user_uuid:"test-human-admin"})}} as unknown as ExecutionContext;
    const root = "https://knowledge-preview.gyesanbox.kr/api/knowledge/v1/admin/";
    const created = await route(new Request(`${root}import`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload([sample("one",["labor-pay"])]))}),testEnv,ctx,"req");
    expect(await created.response.json()).toMatchObject({data:{inserted:1}});
    const status = await route(new Request(`${root}import/status`),testEnv,ctx,"req");
    expect(status.response.status).toBe(200);
    expect(status.response.headers.get("Cache-Control")).toBe("no-store");
    const lookup = await route(new Request(`${root}import/result`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sourceKey:"one"})}),testEnv,ctx,"req");
    const data = await lookup.response.json() as {data:{items:{questionId:string}[]}};
    const detail = await route(new Request(`${root}questions/${data.data.items[0].questionId}`),testEnv,ctx,"req");
    expect(detail.response.status).toBe(200);
    const serialized = await detail.response.text();
    expect(serialized).toContain('"status":"draft"');
    expect(serialized).toContain('"answer"');
    expect(serialized).not.toContain('"password":');
    expect(serialized).not.toContain('"password_hash":');
    expect(serialized).not.toContain("v1$pbkdf2-sha256$");
    const dry = await route(new Request(`${root}import/validate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload([sample("human-dry")]))}),testEnv,ctx,"req");
    expect(await dry.response.json()).toMatchObject({data:{valid:1,inserted:0}});
  });
  it("deletes an imported draft and its FK ledger atomically without leaving visible rows", async () => {
    const humanCtx = {access:{getIdentity:async()=>({user_uuid:"test-human-admin"})}} as unknown as ExecutionContext;
    const root = "https://knowledge-preview.gyesanbox.kr/api/knowledge/v1/admin/";
    const sourceKey = "delete-import-draft";
    const imported = await route(new Request(`${root}import`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload([sample(sourceKey,["labor-pay"])]))}),testEnv,humanCtx,"delete-import-create");
    expect(imported.response.status).toBe(200);
    const lookup = await route(new Request(`${root}import/result`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sourceKey})}),testEnv,humanCtx,"delete-import-result");
    const resultData = await lookup.response.json() as {data:{items:{questionId:string;answerId:string}[]}};
    const {questionId,answerId} = resultData.data.items[0];
    expect(await env.KNOWLEDGE_DB.prepare("SELECT status FROM knowledge_questions WHERE id=?1").bind(questionId).first()).toMatchObject({status:"draft"});
    expect(await env.KNOWLEDGE_DB.prepare("SELECT COUNT(*) n FROM knowledge_question_services WHERE question_id=?1").bind(questionId).first<{n:number}>()).toMatchObject({n:1});
    const deleted = await route(new Request(`${root}questions/${questionId}`,{method:"DELETE",headers:{"Idempotency-Key":crypto.randomUUID()}}),testEnv,humanCtx,"delete-imported-draft");
    expect(deleted.response.status).toBe(200);
    expect(await env.KNOWLEDGE_DB.prepare("SELECT COUNT(*) n FROM knowledge_questions WHERE id=?1").bind(questionId).first<{n:number}>()).toMatchObject({n:0});
    expect(await env.KNOWLEDGE_DB.prepare("SELECT COUNT(*) n FROM knowledge_answers WHERE id=?1").bind(answerId).first<{n:number}>()).toMatchObject({n:0});
    expect(await env.KNOWLEDGE_DB.prepare("SELECT COUNT(*) n FROM knowledge_question_services WHERE question_id=?1").bind(questionId).first<{n:number}>()).toMatchObject({n:0});
    expect(await env.KNOWLEDGE_DB.prepare("SELECT COUNT(*) n FROM knowledge_imports WHERE question_id=?1 OR answer_id=?2").bind(questionId,answerId).first<{n:number}>()).toMatchObject({n:0});
    expect(await env.KNOWLEDGE_DB.prepare("SELECT COUNT(*) n FROM knowledge_audit_actions WHERE question_id=?1 AND action='knowledge_question_deleted'").bind(questionId).first<{n:number}>()).toMatchObject({n:1});
    const adminList = await route(new Request(`${root}questions?query=${encodeURIComponent("테스트 질문")}`),testEnv,humanCtx,"delete-import-list");
    const adminJson = await adminList.response.json() as {data:{items:{id:string}[]}};
    expect(adminJson.data.items.some(item=>item.id===questionId)).toBe(false);
    const publicList = await route(new Request("https://knowledge-preview.gyesanbox.kr/api/knowledge/v1/questions"),testEnv,{} as ExecutionContext,"delete-import-public-list");
    const publicJson = await publicList.response.json() as {data:{items:{id:string}[]}};
    expect(publicJson.data.items.some(item=>item.id===questionId)).toBe(false);
    await expect(route(new Request(`https://knowledge-preview.gyesanbox.kr/api/knowledge/v1/questions/${questionId}`),testEnv,{} as ExecutionContext,"delete-import-public-detail")).rejects.toMatchObject({status:404,code:"NOT_FOUND"});
  });
});
