import baseMigration from "../../migrations/0001_knowledge_base.sql?raw";
import catalogMigration from "../../migrations/0002_service_catalog.sql?raw";
import productionConfigSource from "../../wrangler.production.jsonc?raw";
import previewConfigSource from "../../wrangler.jsonc?raw";
import { applyD1Migrations, env } from "cloudflare:test";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import worker from "../../src/index";
import { route } from "../../src/router";

const migrations = [baseMigration, catalogMigration].map((source, index) => ({ name: `${index}.sql`, queries: source.replace(/^--.*$/gm, "").split(";").map(x => x.trim()).filter(Boolean) }));
const productionEnv = { ...env, ENVIRONMENT: "production", KNOWLEDGE_ADMIN_ENABLED: "false", KNOWLEDGE_API_HOST: "knowledge-api-disabled.invalid", KNOWLEDGE_PUBLIC_ORIGIN: "https://gyesanbox.kr", AUTHOR_TOKEN_PEPPER: "local-test-pepper" } as Env;
const ctx = {} as ExecutionContext;
const payload = (serviceIds: string[] = []) => ({ category: "금융", title: `운영 환경 등록 회귀 ${crypto.randomUUID()}`, body: "관련 계산기 선택 여부와 무관한 정상 질문 등록 확인", isAnonymous: true, password: "calc2026", serviceIds, turnstile_token: "local-test-token" });
const request = (body: unknown) => new Request("https://knowledge-api-disabled.invalid/api/knowledge/v1/questions", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://gyesanbox.kr", "CF-Connecting-IP": `192.0.2.${Math.floor(Math.random() * 200) + 1}` }, body: JSON.stringify(body) });
const siteverify = (success = true) => vi.fn(async () => Response.json({ success, hostname: "gyesanbox.kr" }));

describe("Production visitor submit deployment contract", () => {
  beforeAll(async () => { await applyD1Migrations(env.KNOWLEDGE_DB, migrations); });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("keeps the required limiter in the reproducible Production deployment configuration", () => {
    const production = JSON.parse(productionConfigSource);
    const preview = JSON.parse(previewConfigSource);
    expect(production.name).toBe("gyesanbox-knowledge");
    expect(production.vars).toEqual({ ENVIRONMENT: "production", KNOWLEDGE_ADMIN_ENABLED: "true", KNOWLEDGE_API_HOST: "gyesanbox.kr", KNOWLEDGE_PUBLIC_ORIGIN: "https://gyesanbox.kr" });
    expect(production.workers_dev).toBe(false);
    expect(production.preview_urls).toBe(false);
    expect(production.routes).toEqual([
      { pattern: "gyesanbox.kr/api/knowledge/v1/admin/*", zone_name: "gyesanbox.kr" },
    ]);
    expect(production.d1_databases[0].database_id).toBe("f6d4d81b-1ddc-4a4b-8b41-ef377ac09015");
    expect(production.ratelimits).toEqual([{ name: "KNOWLEDGE_WRITE_LIMITER", namespace_id: "30012", simple: { limit: 3, period: 60 } }]);
    expect(production.ratelimits[0].namespace_id).not.toBe(preview.ratelimits[0].namespace_id);
    expect(production.d1_databases[0].database_id).not.toBe(preview.d1_databases[0].database_id);
    expect(production.vars).not.toHaveProperty("KNOWLEDGE_IMPORT_ENABLED");
  });

  it("leaves the admin HTML route to Pages while the Worker keeps only protected admin APIs", async () => {
    const response = await route(new Request("https://gyesanbox.kr/admin/knowledge"), productionEnv, ctx, "admin-ui-separation").catch((error: unknown) => error);
    expect(response).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("reproduces the missing Production limiter after successful siteverify, before any D1 access", async () => {
    const verify = siteverify();
    vi.stubGlobal("fetch", verify);
    const prepare = vi.fn();
    const batch = vi.fn();
    const missingBinding = { ...productionEnv, KNOWLEDGE_WRITE_LIMITER: undefined, KNOWLEDGE_DB: { prepare, batch } } as unknown as Env;
    await expect(route(request(payload()), missingBinding, ctx, "local-replay")).rejects.toThrow(/limit/);
    expect(verify).toHaveBeenCalledTimes(1);
    expect(prepare).not.toHaveBeenCalled();
    expect(batch).not.toHaveBeenCalled();
    const response = await worker.fetch(request(payload()), missingBinding, ctx);
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "INTERNAL_ERROR", message: "일시적인 오류가 발생했습니다." }, request_id: response.headers.get("X-Request-Id") });
    expect(prepare).not.toHaveBeenCalled();
    expect(batch).not.toHaveBeenCalled();
  });

  for (const serviceIds of [[], ["2759964a-549f-45b7-aa5b-ea719cfe0ffd"]]) {
    it(`creates a question with ${serviceIds.length} relations under Production origin/hostname checks`, async () => {
      const verify = siteverify();
      vi.stubGlobal("fetch", verify);
      const limit = vi.fn(async () => ({ success: true }));
      const response = await worker.fetch(request(payload(serviceIds)), { ...productionEnv, KNOWLEDGE_WRITE_LIMITER: { limit } } as unknown as Env, ctx);
      expect(response.status).toBe(201);
      const result = await response.json() as { data: { id: string } };
      expect(await env.KNOWLEDGE_DB.prepare("SELECT id FROM knowledge_questions WHERE id=?1").bind(result.data.id).first()).not.toBeNull();
      expect(await env.KNOWLEDGE_DB.prepare("SELECT COUNT(*) count FROM knowledge_question_services WHERE question_id=?1").bind(result.data.id).first("count")).toBe(serviceIds.length);
      expect(verify).toHaveBeenCalledTimes(1);
      expect(limit).toHaveBeenCalledTimes(1);
      expect(verify.mock.invocationCallOrder[0]).toBeLessThan(limit.mock.invocationCallOrder[0]);
    });
  }

  it("rejects invalid Turnstile before the limiter and all D1 access", async () => {
    vi.stubGlobal("fetch", siteverify(false));
    const prepare = vi.fn(), batch = vi.fn(), limit = vi.fn();
    const response = await worker.fetch(request(payload()), { ...productionEnv, KNOWLEDGE_WRITE_LIMITER: { limit }, KNOWLEDGE_DB: { prepare, batch } } as unknown as Env, ctx);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "TURNSTILE_FAILED" } });
    expect(limit).not.toHaveBeenCalled();
    expect(prepare).not.toHaveBeenCalled();
    expect(batch).not.toHaveBeenCalled();
  });

  it("blocks 3001 characters before siteverify and all D1 access", async () => {
    const verify = siteverify();
    vi.stubGlobal("fetch", verify);
    const prepare = vi.fn(), batch = vi.fn();
    const response = await worker.fetch(request({ ...payload(), body: "가".repeat(3001) }), { ...productionEnv, KNOWLEDGE_DB: { prepare, batch } } as unknown as Env, ctx);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { message: "질문 내용은 3,000자 이하로 입력해 주세요." } });
    expect(verify).not.toHaveBeenCalled();
    expect(prepare).not.toHaveBeenCalled();
    expect(batch).not.toHaveBeenCalled();
  });
});
