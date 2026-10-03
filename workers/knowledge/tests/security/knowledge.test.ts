import baseMigration from "../../migrations/0001_knowledge_base.sql?raw";
import catalogMigration from "../../migrations/0002_service_catalog.sql?raw";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { applyD1Migrations, env } from "cloudflare:test";
import { route } from "../../src/router";
import { hashPassword, passwordInput, verifyPassword } from "../../src/domain/knowledge";
import { buildVisitorQuestionCreatePayload } from "../../../../lib/knowledge/visitor-contract";


const LABOR = "2759964a-549f-45b7-aa5b-ea719cfe0ffd";
const migrations = [baseMigration, catalogMigration].map((source, index) => ({ name: `${String(index + 1).padStart(4, "0")}.sql`, queries: source.replace(/^--.*$/gm, "").split(";").map(x => x.trim()).filter(Boolean) }));
const testEnv = { ...env, KNOWLEDGE_ADMIN_ENABLED: "true", AUTHOR_TOKEN_PEPPER: "knowledge-test-pepper", KNOWLEDGE_WRITE_LIMITER: { limit: async () => ({ success: true }) } } as unknown as Env;
const ctx = { access: { getIdentity: async () => ({ user_uuid: "knowledge-admin" }) } } as unknown as ExecutionContext;
let serial = 0;
const key = () => `00000000-0000-4000-8000-${(++serial).toString().padStart(12, "0")}`;
const req = (method: string, path: string, body?: unknown) => new Request(`https://knowledge-preview.gyesanbox.kr${path}`, { method, headers: body === undefined ? undefined : { "Content-Type": "application/json", "Idempotency-Key": key() }, body: body === undefined ? undefined : JSON.stringify(body) });
const admin = (method: string, path: string, body?: unknown) => route(req(method, path, body), testEnv, ctx, crypto.randomUUID());
type KnowledgeItem = { id: string; origin: string; isAnonymous: boolean; nickname: string | null; body: string; category?: string; status?: string; answer?: { body: string } | null };
const json = async (r: Awaited<ReturnType<typeof admin>>) => r.response.json() as Promise<{ data: Record<string, unknown> }>;

describe("knowledge center schema and admin API", () => {
  beforeAll(async () => { vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ success: true, hostname: "test.integrated-calculator.pages.dev" }), { status: 200, headers: { "Content-Type": "application/json" } })); await applyD1Migrations(env.KNOWLEDGE_DB, migrations); });
  afterAll(() => vi.unstubAllGlobals());
  it("compares exact password characters without whitespace or Unicode normalization", async () => {
    const password = " café-current-password ";
    const hash = await hashPassword(passwordInput(password));
    expect(await verifyPassword(passwordInput(password), hash)).toBe(true);
    expect(await verifyPassword(passwordInput(password.trim()), hash)).toBe(false);
    expect(await verifyPassword(passwordInput(password.normalize("NFD")), hash)).toBe(false);
    expect(() => passwordInput("")).toThrow();
    expect(() => passwordInput("    ")).toThrow();
  });
  it("authenticates the current visitor password before editing and leaves every question field and relation unchanged on rejection", async () => {
    const created = await admin("POST", "/api/knowledge/v1/questions", { title: "수정 보안 fixture", body: "변경 전 질문", category: "금융", isAnonymous: false, nickname: "작성자", password: "original-password", serviceIds: [LABOR], turnstile_token: "test-token" });
    const id = (await json(created)).data.id as string;
    const path = `/api/knowledge/v1/questions/${id}`;
    const snapshot = async () => ({
      question: await env.KNOWLEDGE_DB.prepare("SELECT * FROM knowledge_questions WHERE id=?1").bind(id).first(),
      services: (await env.KNOWLEDGE_DB.prepare("SELECT * FROM knowledge_question_services WHERE question_id=?1 ORDER BY service_id").bind(id).all()).results,
      audit: (await env.KNOWLEDGE_DB.prepare("SELECT * FROM knowledge_audit_actions WHERE question_id=?1 ORDER BY id").bind(id).all()).results,
      answers: (await env.KNOWLEDGE_DB.prepare("SELECT * FROM knowledge_answers WHERE question_id=?1").bind(id).all()).results,
    });
    const before = await snapshot();
    const patch = { title: "공격자가 바꾼 제목", body: "공격자가 바꾼 내용", nickname: "다른작성자", password: "wrong-password", turnstile_token: "test-token" };
    await expect(admin("POST", `${path}/verify-password`, { password: "wrong-password", turnstile_token: "test-token" })).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });
    await expect(admin("PATCH", path, patch)).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(await snapshot()).toEqual(before);
    await expect(admin("PATCH", path, { ...patch, password: "original-password " })).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(await snapshot()).toEqual(before);
    for (const password of ["", "   "]) {
      await expect(admin("PATCH", path, { ...patch, password })).rejects.toMatchObject({ status: 400, code: "INVALID_INPUT" });
      expect(await snapshot()).toEqual(before);
    }
    await expect(admin("PATCH", `/api/knowledge/v1/questions/${crypto.randomUUID()}`, { ...patch, password: "original-password" })).rejects.toMatchObject({ status: 404 });
    const verified = await admin("POST", `${path}/verify-password`, { password: "original-password", turnstile_token: "test-token" });
    expect(await verified.response.clone().json()).toMatchObject({ data: { verified: true } });
    expect(await verified.response.text()).not.toMatch(/original-password|password_hash|pbkdf2/);
    expect(await snapshot()).toEqual(before);
    const saved = await admin("PATCH", path, { ...patch, password: "original-password" });
    expect(saved.response.status).toBe(200);
    const after = await snapshot();
    expect(after.question).toMatchObject({ title: patch.title, body: patch.body, password_hash: before.question!.password_hash });
    expect(after.services).toEqual(before.services);
    expect(after.audit).toEqual(before.audit);
    await admin("POST", `/api/knowledge/v1/admin/questions/${id}/answer`, { body: "공식답변 잠금" });
    const answered = await snapshot();
    for (const password of ["original-password", "wrong-password"]) {
      await expect(admin("PATCH", path, { ...patch, password })).rejects.toMatchObject({ status: 409, code: "INVALID_STATE" });
      await expect(admin("POST", `${path}/verify-password`, { password, turnstile_token: "test-token" })).rejects.toMatchObject({ status: 409, code: "INVALID_STATE" });
      expect(await snapshot()).toEqual(answered);
    }
  });
  it("keeps Turnstile mandatory for password verification and rechecks concurrent answer/password changes at UPDATE", async () => {
    const id = (await json(await admin("POST", "/api/knowledge/v1/admin/questions", { title: "동시 수정 보안", body: "원문 유지", category: "금융", password: "original-password", serviceIds: [LABOR] }))).data.id as string;
    const path = `/api/knowledge/v1/questions/${id}`;
    const input = { password: "original-password", turnstile_token: "test-token", body: "변경 시도" };
    await expect(admin("POST", `${path}/verify-password`, { password: input.password })).rejects.toMatchObject({ code: "TURNSTILE_REQUIRED" });
    const previousFetch = globalThis.fetch;
    try {
      vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ success: false }), { status: 200 }));
      await expect(admin("PATCH", path, input)).rejects.toMatchObject({ code: "TURNSTILE_FAILED" });
      expect(await env.KNOWLEDGE_DB.prepare("SELECT body FROM knowledge_questions WHERE id=?1").bind(id).first()).toMatchObject({ body: "원문 유지" });
      vi.stubGlobal("fetch", async () => {
        await env.KNOWLEDGE_DB.prepare("UPDATE knowledge_questions SET password_hash='changed-by-admin' WHERE id=?1").bind(id).run();
        return new Response(JSON.stringify({ success: true, hostname: "test.integrated-calculator.pages.dev" }));
      });
      await expect(admin("PATCH", path, input)).rejects.toMatchObject({ status: 409 });
      expect(await env.KNOWLEDGE_DB.prepare("SELECT body,password_hash FROM knowledge_questions WHERE id=?1").bind(id).first()).toMatchObject({ body: "원문 유지", password_hash: "changed-by-admin" });
    } finally { vi.stubGlobal("fetch", previousFetch); }
  });
  it("supports admin_seed, official answer lifecycle, and public redaction", async () => {
    const created = await admin("POST", "/api/knowledge/v1/admin/questions", { category: "근로·고용", body: "관리자 시드 질문", password: "temporary-pass", serviceIds: [LABOR] });
    expect(created.response.status).toBe(201);
    const id = (await json(created)).data.id as string;
    const publicList = await admin("GET", "/api/knowledge/v1/questions");
    expect(publicList.response.status).toBe(200);
    const item = ((await json(publicList)).data.items as KnowledgeItem[]).find(x => x.id === id);
    expect(item).toMatchObject({ id, body: "관리자 시드 질문" });
    const adminDetail = (await json(await admin("GET", `/api/knowledge/v1/admin/questions/${id}`))).data.question as Record<string, unknown>;
    expect(adminDetail).toMatchObject({ id, status: "published", passwordConfigured: true });
    expect(adminDetail).not.toHaveProperty("password");
    expect(adminDetail).not.toHaveProperty("password_hash");
    expect(JSON.stringify(adminDetail)).not.toContain("temporary-pass");
    const published = ((await json(await admin("GET", "/api/knowledge/v1/questions"))).data.items as KnowledgeItem[]).find(x => x.id === id);
    expect(published).toMatchObject({ isAnonymous: true, nickname: null, body: "관리자 시드 질문" });
    expect(published).not.toHaveProperty("origin");
    expect(published).not.toHaveProperty("passwordConfigured");
    expect(JSON.stringify(published)).not.toContain("password");
    await expect(admin("PATCH", `/api/knowledge/v1/questions/${id}`, { password: "wrong-pass", body: "잘못된 수정", turnstile_token: "test-token" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect((await admin("PATCH", `/api/knowledge/v1/questions/${id}`, { password: "temporary-pass", body: "비밀번호 수정 성공", turnstile_token: "test-token" })).response.status).toBe(200);
    expect((await admin("POST", `/api/knowledge/v1/admin/questions/${id}/answer`, { body: "계산박스 공식답변" })).response.status).toBe(200);
    await expect(admin("POST", `/api/knowledge/v1/admin/questions/${id}/answer`, { body: "중복 답변" })).rejects.toMatchObject({ code: "DUPLICATE_REQUEST" });
    expect((await admin("PATCH", `/api/knowledge/v1/admin/questions/${id}/answer`, { body: "수정 공식답변" })).response.status).toBe(200);
    await expect(admin("PATCH", `/api/knowledge/v1/questions/${id}`, { password: "temporary-pass", body: "답변 후 수정", turnstile_token: "test-token" })).rejects.toMatchObject({ code: "INVALID_STATE" });
    await expect(admin("POST", "/api/knowledge/v1/questions", { isAnonymous: true, password: "temporary-pass", title: "사용자 질문", body: "사용자 질문", turnstile_token: "" })).rejects.toMatchObject({ code: "TURNSTILE_REQUIRED" });
  });
  it("accepts the visitor form payload contract and rejects stale or privileged fields", async () => {
    const anonymousPayload = buildVisitorQuestionCreatePayload({ title: "방문자 익명 질문", anonymous: true, nickname: "", password: "visitor-pass", body: "질문 내용", serviceIds: [] }, "test-token");

    // Reproduces the old UI spread payload: `anonymous` was unknown to the API whitelist.
    await expect(admin("POST", "/api/knowledge/v1/questions", { ...anonymousPayload, anonymous: anonymousPayload.isAnonymous })).rejects.toMatchObject({ code: "INVALID_INPUT" });

    const createdAnonymous = await admin("POST", "/api/knowledge/v1/questions", anonymousPayload);
    expect(createdAnonymous.response.status).toBe(201);
    const anonymousId = ((await createdAnonymous.response.json()) as { data: { id: string; status: string } }).data.id;
    expect(((await env.KNOWLEDGE_DB.prepare("SELECT is_anonymous,nickname,status FROM knowledge_questions WHERE id=?1").bind(anonymousId).first<{ is_anonymous: number; nickname: string | null; status: string }>()))).toMatchObject({ is_anonymous: 1, nickname: null, status: "published" });

    const nicknamePayload = buildVisitorQuestionCreatePayload({ title: "방문자 닉네임 질문", anonymous: false, nickname: "계산이용자", password: "visitor-pass", body: "서비스를 연결한 질문", serviceIds: [LABOR] }, "test-token");
    const createdNickname = await admin("POST", "/api/knowledge/v1/questions", nicknamePayload);
    expect(createdNickname.response.status).toBe(201);
    const nicknameId = ((await createdNickname.response.json()) as { data: { id: string } }).data.id;
    expect(await env.KNOWLEDGE_DB.prepare("SELECT is_anonymous,nickname,password_hash FROM knowledge_questions WHERE id=?1").bind(nicknameId).first<{ is_anonymous: number; nickname: string; password_hash: string }>()).toMatchObject({ is_anonymous: 0, nickname: "계산이용자" });
    const publicResponse = await admin("GET", `/api/knowledge/v1/questions/${nicknameId}`);
    const publicJson = JSON.stringify(await publicResponse.response.json());
    expect(publicJson).not.toContain("visitor-pass");
    expect(publicJson).not.toContain("password_hash");

    for (const privilegedField of ["status", "origin", "password_hash"]) {
      await expect(admin("POST", "/api/knowledge/v1/questions", { ...anonymousPayload, [privilegedField]: "published" })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    }
    await expect(admin("POST", "/api/knowledge/v1/questions", { ...anonymousPayload, unexpected: true })).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });
  it("enforces status and service relations", async () => {
    const created = await admin("POST", "/api/knowledge/v1/admin/questions", { category: "근로·고용", body: "숨김 질문", password: "temporary-pass", serviceIds: [LABOR] });
    const id = (await json(created)).data.id as string;
    expect((await admin("POST", `/api/knowledge/v1/admin/questions/${id}/hide`, {})).response.status).toBe(200);
    expect(((await json(await admin("GET", "/api/knowledge/v1/questions"))).data.items as KnowledgeItem[]).some(x => x.id === id)).toBe(false);
    expect((await admin("POST", `/api/knowledge/v1/admin/questions/${id}/publish`, {})).response.status).toBe(200);
    expect(((await json(await admin("GET", "/api/knowledge/v1/questions"))).data.items as KnowledgeItem[]).some(x => x.id === id)).toBe(true);
    await expect(admin("POST", "/api/knowledge/v1/admin/questions", { category: "근로·고용", body: "잘못된 서비스", password: "temporary-pass", serviceIds: ["00000000-0000-4000-8000-000000000000"] })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    const duplicate = await admin("POST", "/api/knowledge/v1/admin/questions", { category: "근로·고용", body: "관계 중복", password: "temporary-pass", serviceIds: [LABOR, LABOR] });
    expect(duplicate.response.status).toBe(201);
    expect((await env.KNOWLEDGE_DB.prepare("SELECT COUNT(*) count FROM knowledge_question_services WHERE question_id=?1").bind((await json(duplicate)).data.id).first<{ count: number }>())?.count).toBe(1);
  });
  it("paginates admin questions on the server and combines keyword, status, answer, and category filters", async () => {
    const marker = `pagination-contract-${crypto.randomUUID()}`;
    const ids = Array.from({ length: 25 }, () => crypto.randomUUID());
    const at = "2026-10-01T00:00:00.000Z";
    const inserts = ids.map((id, index) => env.KNOWLEDGE_DB.prepare("INSERT INTO knowledge_questions (id,is_anonymous,nickname,password_hash,title,body,origin,status,created_at,updated_at,category) VALUES (?1,1,NULL,'test-hash',?2,?3,'admin_seed',?4,?5,?5,?6)").bind(id, `${marker} title ${index}`, `${marker} body ${index}`, index % 2 ? "draft" : "published", at, index % 2 ? "금융" : "근로·고용"));
    for (let index = 0; index < ids.length; index += 4) inserts.push(env.KNOWLEDGE_DB.prepare("INSERT INTO knowledge_answers (id,question_id,body,created_at,updated_at) VALUES (?1,?2,'pagination answer',?3,?3)").bind(crypto.randomUUID(), ids[index], at));
    await env.KNOWLEDGE_DB.batch(inserts);

    const page1 = (await json(await admin("GET", `/api/knowledge/v1/admin/questions?query=${marker}&page=1`))).data;
    const page2 = (await json(await admin("GET", `/api/knowledge/v1/admin/questions?query=${marker}&page=2`))).data;
    expect(page1).toMatchObject({ page: 1, page_size: 20, total: 25, total_pages: 2 });
    expect(page2).toMatchObject({ page: 2, page_size: 20, total: 25, total_pages: 2 });
    const firstIds = (page1.items as KnowledgeItem[]).map(item => item.id);
    const secondIds = (page2.items as KnowledgeItem[]).map(item => item.id);
    expect(firstIds).toHaveLength(20);
    expect(secondIds).toHaveLength(5);
    expect(new Set([...firstIds, ...secondIds]).size).toBe(25);
    expect(firstIds.some(id => secondIds.includes(id))).toBe(false);

    const combinedParams = new URLSearchParams({ query: marker, status: "published", answered: "yes", category: "근로·고용" });
    const combined = (await json(await admin("GET", `/api/knowledge/v1/admin/questions?${combinedParams}`))).data;
    expect(combined).toMatchObject({ page: 1, page_size: 20, total: 7, total_pages: 1 });
    expect((combined.items as KnowledgeItem[])).toHaveLength(7);
    expect((combined.items as KnowledgeItem[]).every(item => item.category === "근로·고용" && item.status === "published" && Boolean(item.answer))).toBe(true);
    expect((await json(await admin("GET", `/api/knowledge/v1/admin/questions?query=${marker}&page=999`))).data).toMatchObject({ page: 2, total_pages: 2 });
    await expect(admin("GET", `/api/knowledge/v1/admin/questions?query=${marker}&category=지원되지않는분류`)).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(admin("GET", `/api/knowledge/v1/admin/questions?query=${marker}&page=0`)).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });
  it("publishes create and save immediately, and keeps hide/save re-publication and answers", async () => {
    const created = await admin("POST", "/api/knowledge/v1/admin/questions", { category: "근로·고용", body: "즉시 공개 질문", password: "temporary-pass", serviceIds: [LABOR] });
    const createdData = (await json(created)).data;
    const id = createdData.id as string;
    expect(createdData).toMatchObject({ id, status: "published" });
    expect(((await json(await admin("GET", "/api/knowledge/v1/questions"))).data.items as KnowledgeItem[]).some(item => item.id === id)).toBe(true);
    await expect(admin("POST", "/api/knowledge/v1/admin/questions", { category: "근로·고용", body: "draft 우회", password: "temporary-pass", serviceIds: [LABOR], status: "draft" })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    const initialHash = (await env.KNOWLEDGE_DB.prepare("SELECT password_hash FROM knowledge_questions WHERE id=?1").bind(id).first<{password_hash:string}>())?.password_hash;
    const saved = await admin("PATCH", "/api/knowledge/v1/admin/questions/" + id, { body: "저장 즉시 공개 수정", password: "updated-temporary-pass", serviceIds: [LABOR] });
    expect(await saved.response.clone().text()).not.toMatch(/password|pbkdf2/i);
    expect((await json(saved)).data).toMatchObject({ id, status: "published" });
    const updatedHash = (await env.KNOWLEDGE_DB.prepare("SELECT password_hash FROM knowledge_questions WHERE id=?1").bind(id).first<{password_hash:string}>())?.password_hash;
    expect(updatedHash).toMatch(/^v1\$pbkdf2-sha256\$/);
    expect(updatedHash).not.toBe(initialHash);
    const unchangedPassword = await admin("PATCH", "/api/knowledge/v1/admin/questions/" + id, { body: "저장 즉시 공개 수정", password: "", serviceIds: [LABOR] });
    expect((await json(unchangedPassword)).data).toMatchObject({ id, status: "published" });
    expect((await env.KNOWLEDGE_DB.prepare("SELECT password_hash FROM knowledge_questions WHERE id=?1").bind(id).first<{password_hash:string}>())?.password_hash).toBe(updatedHash);
    await expect(admin("PATCH", "/api/knowledge/v1/admin/questions/" + id, { body: "잘못된 비밀번호", password: "x" })).rejects.toMatchObject({status:400,code:"INVALID_INPUT"});
    expect((await admin("POST", "/api/knowledge/v1/admin/questions/" + id + "/answer", { body: "공식답변" })).response.status).toBe(200);
    const published = ((await json(await admin("GET", "/api/knowledge/v1/questions"))).data.items as KnowledgeItem[]).find(x => x.id === id);
    expect(published?.body).toBe("저장 즉시 공개 수정");
    expect(published?.answer?.body).toBe("공식답변");
    expect((await admin("POST", "/api/knowledge/v1/admin/questions/" + id + "/hide", {})).response.status).toBe(200);
    expect(((await json(await admin("GET", "/api/knowledge/v1/questions"))).data.items as KnowledgeItem[]).some(x => x.id === id)).toBe(false);
    const hiddenSave = await admin("PATCH", "/api/knowledge/v1/admin/questions/" + id, { body: "숨김에서 저장하면 다시 공개", serviceIds: [LABOR] });
    expect((await json(hiddenSave)).data).toMatchObject({ id, status: "published" });
    const restored = ((await json(await admin("GET", "/api/knowledge/v1/questions"))).data.items as KnowledgeItem[]).find(x => x.id === id);
    expect(restored?.body).toBe("숨김에서 저장하면 다시 공개");
    expect(restored?.answer?.body).toBe("공식답변");
    const row = await env.KNOWLEDGE_DB.prepare("SELECT status,password_hash FROM knowledge_questions WHERE id=?1").bind(id).first<{ status: string; password_hash: string }>();
    expect(row?.status).toBe("published");
    expect(row?.password_hash).toMatch(/^v1\$pbkdf2-sha256\$/);
  });
  it("allows a legacy draft to be hidden or published without changing normal create policy", async () => {
    const id = crypto.randomUUID(), at = new Date().toISOString();
    await env.KNOWLEDGE_DB.prepare("INSERT INTO knowledge_questions (id,is_anonymous,nickname,password_hash,title,body,origin,status,created_at,updated_at,category) VALUES (?1,1,NULL,'test-hash','기존 draft','기존 draft 내용','admin_seed','draft',?2,?2,'근로·고용')").bind(id, at).run();
    expect((await admin("POST", `/api/knowledge/v1/admin/questions/${id}/hide`, {})).response.status).toBe(200);
    expect((await json(await admin("GET", `/api/knowledge/v1/admin/questions/${id}`))).data.question).toMatchObject({ id, status: "hidden" });
    expect((await admin("POST", `/api/knowledge/v1/admin/questions/${id}/publish`, {})).response.status).toBe(200);
    expect((await json(await admin("GET", `/api/knowledge/v1/admin/questions/${id}`))).data.question).toMatchObject({ id, status: "published" });
  });
  it("deletes a question atomically with answer and service cascades and protects the endpoint", async () => {
    const created = await admin("POST", "/api/knowledge/v1/admin/questions", { category: "근로·고용", body: "삭제 대상 질문", password: "temporary-pass", serviceIds: [LABOR] });
    const id = (await json(created)).data.id as string;
    await admin("POST", `/api/knowledge/v1/admin/questions/${id}/answer`, { body: "삭제 대상 답변" });
    expect((await json(await admin("GET", `/api/knowledge/v1/questions/${id}`))).data.question).toBeTruthy();
    await expect(route(req("DELETE", `/api/knowledge/v1/admin/questions/${id}`), testEnv, {} as ExecutionContext, "unauth-delete")).rejects.toMatchObject({ status: 401, code: "UNAUTHORIZED" });
    await expect(admin("PUT", `/api/knowledge/v1/admin/questions/${id}`, {})).rejects.toMatchObject({ status: 405, code: "METHOD_NOT_ALLOWED" });
    await expect(route(new Request(`https://knowledge-preview.gyesanbox.kr/api/knowledge/v1/admin/questions/${crypto.randomUUID()}`, { method: "DELETE", headers: { "Idempotency-Key": key() } }), testEnv, ctx, "knowledge-delete-missing")).rejects.toMatchObject({ status: 404, code: "NOT_FOUND" });

    const stableRequest = new Request(`https://knowledge-preview.gyesanbox.kr/api/knowledge/v1/admin/questions/${id}`, { method: "DELETE", headers: { "Idempotency-Key": key() } });
    const deleted = await route(stableRequest, testEnv, ctx, "knowledge-delete");
    expect(deleted.response.status).toBe(200);
    expect((await deleted.response.json() as { data: { deleted: boolean } }).data.deleted).toBe(true);
    const retry = await route(new Request(`https://knowledge-preview.gyesanbox.kr/api/knowledge/v1/admin/questions/${id}`, { method: "DELETE", headers: { "Idempotency-Key": stableRequest.headers.get("Idempotency-Key")! } }), testEnv, ctx, "knowledge-delete-retry");
    expect((await retry.response.json() as { data: { idempotent_replay: boolean } }).data.idempotent_replay).toBe(true);
    expect(await env.KNOWLEDGE_DB.prepare("SELECT COUNT(*) count FROM knowledge_questions WHERE id=?1").bind(id).first<{ count: number }>()).toMatchObject({ count: 0 });
    expect(await env.KNOWLEDGE_DB.prepare("SELECT COUNT(*) count FROM knowledge_answers WHERE question_id=?1").bind(id).first<{ count: number }>()).toMatchObject({ count: 0 });
    expect(await env.KNOWLEDGE_DB.prepare("SELECT COUNT(*) count FROM knowledge_question_services WHERE question_id=?1").bind(id).first<{ count: number }>()).toMatchObject({ count: 0 });
    expect(await env.KNOWLEDGE_DB.prepare("SELECT COUNT(*) count FROM knowledge_audit_actions WHERE question_id=?1 AND action='knowledge_question_deleted'").bind(id).first<{ count: number }>()).toMatchObject({ count: 1 });
    await expect(admin("GET", `/api/knowledge/v1/questions/${id}`)).rejects.toMatchObject({ status: 404, code: "NOT_FOUND" });
    await expect(admin("GET", `/api/knowledge/v1/admin/questions/${id}`)).rejects.toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(((await json(await admin("GET", "/api/knowledge/v1/questions"))).data.items as KnowledgeItem[]).some(item => item.id === id)).toBe(false);
  });
  it("searches published questions by title or body with category, pagination, and literal LIKE characters", async () => {
    const marker = `s${crypto.randomUUID().slice(0, 8)}`;
    const fixtures = [
      { title: `${marker} title-only`, body: "ordinary body", category: "근로·고용", status: "published", nickname: null },
      { title: "ordinary title", body: `${marker} body-only`, category: "금융", status: "published", nickname: null },
      { title: `${marker} either-title`, body: "ordinary body", category: "금융", status: "published", nickname: null },
      { title: `${marker}%literal`, body: "percent literal", category: "근로·고용", status: "published", nickname: null },
      { title: `${marker}Xliteral`, body: "wildcard distractor", category: "근로·고용", status: "published", nickname: null },
      { title: `${marker}_literal`, body: "underscore literal", category: "근로·고용", status: "published", nickname: null },
      { title: `${marker}Xunder`, body: "underscore distractor", category: "근로·고용", status: "published", nickname: null },
      { title: `${marker}\\literal`, body: "backslash literal", category: "근로·고용", status: "published", nickname: null },
      { title: `${marker}'quote`, body: "quote literal", category: "근로·고용", status: "published", nickname: null },
      { title: "unrelated title", body: "unrelated body", category: "근로·고용", status: "published", nickname: `${marker}-nickname-only` },
      { title: "unrelated title", body: "unrelated body", category: "근로·고용", status: "published", nickname: null },
      { title: `${marker}-draft-only`, body: "hidden from public", category: "근로·고용", status: "draft", nickname: null },
      { title: `${marker}-hidden-only`, body: "hidden from public", category: "근로·고용", status: "hidden", nickname: null },
      ...Array.from({ length: 23 }, (_, index) => ({ title: `${marker}-bulk-${index}`, body: "bulk body", category: index % 2 ? "금융" : "근로·고용", status: "published", nickname: null })),
    ];
    const at = new Date().toISOString();
    const ids = fixtures.map(() => crypto.randomUUID());
    await env.KNOWLEDGE_DB.batch(fixtures.map((fixture, index) => env.KNOWLEDGE_DB.prepare("INSERT INTO knowledge_questions (id,is_anonymous,nickname,password_hash,title,body,origin,status,created_at,updated_at,category) VALUES (?1,?2,?3,'test-hash',?4,?5,'admin_seed',?6,?7,?7,?8)").bind(ids[index], fixture.nickname === null ? 1 : 0, fixture.nickname, fixture.title, fixture.body, fixture.status, at, fixture.category)));
    await env.KNOWLEDGE_DB.prepare("INSERT INTO knowledge_answers (id,question_id,body,created_at,updated_at) VALUES (?1,?2,?3,?4,?4)").bind(crypto.randomUUID(), ids[10], `${marker}-answer-only`, at).run();

    const search = async (params: Record<string, string>) => (await json(await admin("GET", `/api/knowledge/v1/questions?${new URLSearchParams(params)}`))).data;
    const titleMatches = await search({ q: `${marker} title-only` });
    expect(titleMatches).toMatchObject({ total: 1, page: 1, page_size: 10, total_pages: 1 });
    expect((titleMatches.items as KnowledgeItem[]).map(item => item.id)).toEqual([ids[0]]);
    const bodyMatches = await search({ q: `${marker} body-only` });
    expect((bodyMatches.items as KnowledgeItem[]).map(item => item.id)).toEqual([ids[1]]);
    const combined = await search({ q: marker, category: "금융" });
    expect(combined.total).toBe(13);
    expect((combined.items as KnowledgeItem[]).every(item => item.category === "금융" && item.status === undefined)).toBe(true);
    const bulkPage2 = await search({ q: `${marker}-bulk-`, page: "2" });
    expect(bulkPage2).toMatchObject({ page: 2, page_size: 10, total: 23, total_pages: 3 });
    expect((bulkPage2.items as KnowledgeItem[])).toHaveLength(10);
    const bulkPage3 = await search({ q: `${marker}-bulk-`, page: "3" });
    expect(bulkPage3).toMatchObject({ page: 3, total: 23, total_pages: 3 });
    expect((bulkPage3.items as KnowledgeItem[])).toHaveLength(3);
    for (const [query, expectedId] of [[`${marker}%literal`, ids[3]], [`${marker}_literal`, ids[5]], [`${marker}\\literal`, ids[7]], [`${marker}'quote`, ids[8]]] as const) {
      const result = await search({ q: query });
      expect((result.items as KnowledgeItem[]).map(item => item.id)).toEqual([expectedId]);
    }
    expect((await search({ q: `${marker}-nickname-only` })).total).toBe(0);
    expect((await search({ q: `${marker}-answer-only` })).total).toBe(0);
    expect((await search({ q: `${marker}-draft-only` })).total).toBe(0);
    expect((await search({ q: `${marker}-hidden-only` })).total).toBe(0);
    expect((await search({ q: `${marker}-does-not-exist` })).total).toBe(0);
    expect((await search({ q: "" })).total).toBe((await search({})).total);
    expect((await search({ q: "   " })).total).toBe((await search({})).total);
    expect((await search({ q: "' OR 1=1 --" })).total).toBe(0);
    await expect(admin("GET", `/api/knowledge/v1/questions?q=${"x".repeat(51)}`)).rejects.toMatchObject({ status: 400, code: "INVALID_INPUT" });
  });
});
