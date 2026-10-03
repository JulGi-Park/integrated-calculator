import baseMigration from "../../migrations/0001_knowledge_base.sql?raw";
import catalogMigration from "../../migrations/0002_service_catalog.sql?raw";
import { applyD1Migrations, env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { KNOWLEDGE_CATEGORIES } from "../../../../lib/knowledge/categories";
import { route } from "../../src/router";
import { importBatch, importResult } from "../../src/domain/knowledge-import";
import { sha256 } from "../../src/security/tokens";

const LABOR = "2759964a-549f-45b7-aa5b-ea719cfe0ffd";
const LEGACY = "00000000-0000-4000-8000-000000000013";
const actor = { hash: "category-test-admin" };
const testEnv = { ...env, ENVIRONMENT: "preview", KNOWLEDGE_ADMIN_ENABLED: "true", AUTHOR_TOKEN_PEPPER: "category-test-pepper" } as unknown as Env;
const ctx = { access: { getIdentity: async () => ({ user_uuid: "category-test-admin" }) } } as unknown as ExecutionContext;
const call = async (method: string, path = "", input?: unknown) => {
  const result = await route(new Request(`https://knowledge-preview.gyesanbox.kr/api/knowledge/v1/admin/questions${path}`, {
    method, headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
    body: input === undefined ? undefined : JSON.stringify(input),
  }), testEnv, ctx, crypto.randomUUID());
  return { response: result.response, json: await result.response.json() as { data: { id: string; question: Record<string, unknown>; items: Record<string, unknown>[] } } };
};
const draft = (category: unknown) => ({ title: "카테고리 검증", body: "카테고리 저장 질문", password: "unit-test-only", serviceIds: [LABOR], category });
const item = (category: unknown) => ({ sourceKey: "category-import", title: "가져오기", questionBody: "질문 내용", answerBody: "공식답변 내용", serviceSlugs: ["labor-pay"], category });

describe("knowledge category storage contract", () => {
  beforeAll(async () => {
    const migrations = [baseMigration,catalogMigration].map((source,index) => ({ name: `${index}.sql`, queries: source.replace(/^--.*$/gm, "").split(";").map(x => x.trim()).filter(Boolean) }));
    await applyD1Migrations(env.KNOWLEDGE_DB, migrations);
    await env.KNOWLEDGE_DB.prepare("INSERT INTO knowledge_questions (id,is_anonymous,nickname,password_hash,title,body,origin,status,created_at,updated_at) VALUES (?1,1,NULL,'legacy-test-hash','기존 질문','기존 내용','admin_seed','draft','2026-01-01','2026-01-01')").bind(LEGACY).run();
  });
  it("preserves legacy rows and requires an explicit category before editing them", async () => {
    expect((await call("GET", `/${LEGACY}`)).json.data.question).toMatchObject({ category: null, body: "기존 내용" });
    await expect(call("PATCH", `/${LEGACY}`, { body: "기존 내용" })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect((await call("PATCH", `/${LEGACY}`, { body: "기존 내용", category: "근로·고용" })).response.status).toBe(200);
    expect(await env.KNOWLEDGE_DB.prepare("SELECT password_hash,status FROM knowledge_questions WHERE id=?1").bind(LEGACY).first()).toEqual({ password_hash: "legacy-test-hash", status: "published" });
  });
  it("stores and reads all ten approved knowledge categories in admin list/detail", async () => {
    for (const category of KNOWLEDGE_CATEGORIES) {
      const created = await call("POST", "", draft(category));
      expect(created.response.status).toBe(201);
      const read = await call("GET", `/${created.json.data.id}`);
      expect(read.json.data.question).toMatchObject({ category, status: "published", relatedServices: [{ id: LABOR, slug: "labor-pay", name: "주휴수당 계산기" }] });
      expect(read.response.headers.get("Cache-Control")).toBe("no-store");
      expect(read.json.data.question).toHaveProperty("passwordConfigured", true);
      expect(read.json.data.question).not.toHaveProperty("password");
      expect(read.json.data.question).not.toHaveProperty("password_hash");
      expect(JSON.stringify(read.json)).not.toContain("v1$pbkdf2-sha256$");
      expect((await call("GET")).json.data.items).toContainEqual(expect.objectContaining({ id: created.json.data.id, category }));
    }
  });
  it("searches long literal question text without SQLite LIKE pattern limits", async () => {
    const body = "근무·고용 조건을 확인하고 있는 상황입니다. 주요 조건은 5개월입니다. 이 문장은 긴 검색어 회귀 테스트를 위한 추가 본문입니다.";
    const created = await call("POST", "", { ...draft("근로·고용"), body });
    const needle = "근무·고용 조건을 확인하고 있는 상황입니다. 주요 조건은 5개월입니다.";
    const result = await call("GET", `?query=${encodeURIComponent(needle)}`);
    expect(result.json.data.items.map((question) => question.id)).toContain(created.json.data.id);
    expect(result.response.headers.get("Cache-Control")).toBe("no-store");
  });
  it("rejects missing, null, unsupported and empty categories without a write", async () => {
    for (const category of [undefined, null, "", "정책", "not-supported", 1]) {
      await expect(call("POST", "", draft(category))).rejects.toMatchObject({ code: "INVALID_INPUT" });
      const result = await importBatch(testEnv, actor, { batchId: "invalid-category", items: [item(category)] }, true);
      expect(result).toMatchObject({ inserted: 0, failed: 1, items: [{ errorCode: "INVALID_INPUT" }] });
    }
    await expect(env.KNOWLEDGE_DB.prepare("UPDATE knowledge_questions SET category='invalid' WHERE id=?1").bind(LEGACY).run()).rejects.toThrow();
  });
  it("updates category without losing answer, services or password and publishes on save", async () => {
    const id = (await call("POST", "", draft("금융"))).json.data.id;
    await call("POST", `/${id}/answer`, { body: "보존할 공식답변" });
    const before = await env.KNOWLEDGE_DB.prepare("SELECT password_hash FROM knowledge_questions WHERE id=?1").bind(id).first();
    await call("PATCH", `/${id}`, { body: "카테고리 저장 질문", category: "세금" });
    await call("PATCH", `/${id}`, { body: "카테고리 저장 질문" });
    await expect(call("PATCH", `/${id}`, { body: "카테고리 저장 질문", category: null })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    const read = (await call("GET", `/${id}`)).json.data.question;
    expect(read).toMatchObject({ category: "세금", status: "published", answer: { body: "보존할 공식답변" }, relatedServices: [{ id: LABOR }] });
    expect(await env.KNOWLEDGE_DB.prepare("SELECT password_hash FROM knowledge_questions WHERE id=?1").bind(id).first()).toEqual(before);
    expect((await route(new Request(`https://knowledge-preview.gyesanbox.kr/api/knowledge/v1/questions/${id}`), testEnv, {} as ExecutionContext, "privacy")).response.status).toBe(200);
  });
  it("stores import category, returns DB readback, and hashes category for conflict detection", async () => {
    const payload = { batchId: "category-import", items: [item("근로·고용")] };
    const created = await importBatch(testEnv, actor, payload, true);
    expect(created).toMatchObject({ inserted: 1, items: [{ category: "근로·고용" }] });
    expect((await importResult(testEnv, { sourceKey: "category-import" })).items[0].category).toBe("근로·고용");
    expect((await importBatch(testEnv, actor, payload, true)).existing).toBe(1);
    expect((await importBatch(testEnv, actor, { ...payload, items: [item("금융")] }, true)).items[0].errorCode).toBe("SOURCE_KEY_CONFLICT");
    const id = created.items[0].questionId!;
    await call("PATCH", `/${id}`, { body: "질문 내용", category: "세금" });
    expect((await importResult(testEnv, { sourceKey: "category-import" })).items[0].category).toBe("세금");
    expect((await importBatch(testEnv, actor, payload, true)).items[0].errorCode).toBe("SOURCE_KEY_CONFLICT");
  });
  it("does not silently replay or backfill pre-category import hashes", async () => {
    const { category: _category, ...oldItem } = item("근로·고용");
    void _category;
    oldItem.sourceKey = "legacy-category";
    const answerId = crypto.randomUUID();
    await env.KNOWLEDGE_DB.prepare("INSERT INTO knowledge_answers (id,question_id,body,created_at,updated_at) VALUES (?1,?2,'기존 답변','2026-01-01','2026-01-01')").bind(answerId, LEGACY).run();
    await env.KNOWLEDGE_DB.prepare("INSERT INTO knowledge_imports (source_key,payload_hash,batch_id,question_id,answer_id,service_slugs,created_at) VALUES ('legacy-category',?1,'legacy-batch',?2,?3,'[]','2026-01-01')").bind(await sha256(JSON.stringify(oldItem)), LEGACY, answerId).run();
    const retry = await importBatch(testEnv, actor, { batchId: "legacy-batch", items: [{ ...item("근로·고용"), sourceKey: "legacy-category" }] }, true);
    expect(retry).toMatchObject({ inserted: 0, existing: 0, failed: 1, items: [{ errorCode: "SOURCE_KEY_CONFLICT" }] });
  });
});
