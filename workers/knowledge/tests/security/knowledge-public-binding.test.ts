import { applyD1Migrations, env } from "cloudflare:test";
import { beforeAll, describe, expect, it, vi } from "vitest";
import base from "../../migrations/0001_knowledge_base.sql?raw";
import catalog from "../../migrations/0002_service_catalog.sql?raw";
import { KnowledgePublicEntrypoint } from "../../src/index";

const id = "12345678-1234-4123-8123-123456789abc";
const root = "/api/knowledge/v1";
const production = { ...env, ENVIRONMENT: "production", KNOWLEDGE_API_HOST: "knowledge-api-disabled.invalid",
  KNOWLEDGE_PUBLIC_ORIGIN: "https://gyesanbox.kr", KNOWLEDGE_ADMIN_ENABLED: "false" } as Env;
const service = () => new KnowledgePublicEntrypoint({} as ExecutionContext, production);
const request = (path: string, method = "GET", headers: HeadersInit = {}, body?: string) =>
  new Request(`https://knowledge.internal${root}${path}`, { method, headers, body });

describe("public-only named binding entrypoint", () => {
  beforeAll(async () => {
    await applyD1Migrations(env.KNOWLEDGE_DB, [base, catalog].map((sql, index) => ({ name: `${index + 1}.sql`,
      queries: sql.replace(/^--.*$/gm, "").split(";").map(s => s.trim()).filter(Boolean) })));
  });
  it("dispatches reads through the existing Worker without a public host or Internet fetch", async () => {
    const outbound = vi.fn(() => { throw Error("external fetch forbidden"); });
    vi.stubGlobal("fetch", outbound);
    try {
      const response = await service().fetch(request("/questions?q=test&page=1&limit=10"));
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect((await response.json() as { data: { total: number } }).data.total).toBe(0);
      const services = await service().fetch(request("/services"));
      expect(services.status).toBe(200);
      expect(outbound).not.toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); }
  });
  it("exposes only a fixed read-only RPC probe on the named entrypoint", async () => {
    const bound = service();
    const before = await env.KNOWLEDGE_DB.prepare("SELECT COUNT(*) AS n FROM knowledge_questions").first();
    expect(await bound.probe()).toBe("knowledge-binding-probe-v1");
    expect(await env.KNOWLEDGE_DB.prepare("SELECT COUNT(*) AS n FROM knowledge_questions").first()).toEqual(before);
    expect("call" in bound).toBe(false);
  });
  it("denies admin/import/internal/unknown methods even with spoofed Access headers", async () => {
    for (const path of ["/admin/questions", "/admin/import", "/import", "/internal", `/questions/${id}/publish`, `/questions/${id}/answer`]) {
      const response = await service().fetch(request(path, "POST", { "CF-Access-Jwt-Assertion": "spoofed" }));
      expect(response.status).toBe(404);
    }
    for (const method of ["HEAD", "PUT", "OPTIONS"]) expect((await service().fetch(request("/questions", method))).status).toBe(404);
    expect("call" in service()).toBe(false); // Import RPC cannot be invoked on this capability.
  });
  it("retains Origin and visitor validation, never writing on rejected mutations", async () => {
    const before = await env.KNOWLEDGE_DB.prepare("SELECT COUNT(*) AS n FROM knowledge_questions").first();
    for (const headers of [new Headers(), new Headers({ Origin: "https://evil.example" })]) {
      expect((await service().fetch(request("/questions", "POST", headers, "{}"))).status).toBe(403);
    }
    // Correct Origin reaches existing validation, not an administrative bypass.
    expect((await service().fetch(request("/questions", "POST", { Origin: "https://gyesanbox.kr", "Content-Type": "application/json" }, "{}"))).status).toBe(400);
    expect(await env.KNOWLEDGE_DB.prepare("SELECT COUNT(*) AS n FROM knowledge_questions").first()).toEqual(before);
  });
  it("preserves create/verify/PATCH/DELETE and exact passwords through the named fetch capability", async () => {
    const bound = new KnowledgePublicEntrypoint({} as ExecutionContext, { ...production,
      AUTHOR_TOKEN_PEPPER: "local-binding-test-pepper", TURNSTILE_SECRET: "local-test-secret",
      KNOWLEDGE_WRITE_LIMITER: { limit: async () => ({ success: true }) } } as Env);
    const send = (path: string, method: string, body: unknown) => bound.fetch(request(path, method, {
      Origin: "https://gyesanbox.kr", "Content-Type": "application/json", "CF-Connecting-IP": "192.0.2.41",
      "Idempotency-Key": crypto.randomUUID(),
    }, JSON.stringify(body)));
    const verify = vi.fn(async () => Response.json({ success: true, hostname: "gyesanbox.kr" }));
    vi.stubGlobal("fetch", verify);
    try {
      const password = " café-binding-password ";
      const created = await send("/questions", "POST", { title: "local binding lifecycle", body: "binding test question body",
        category: "금융", isAnonymous: true, password, serviceIds: [], turnstile_token: "test-token" });
      expect(created.status).toBe(201);
      const payload = await created.json() as { data: { id: string } };
      const path = `/questions/${payload.data.id}`;
      const before = await env.KNOWLEDGE_DB.prepare("SELECT * FROM knowledge_questions WHERE id=?1").bind(payload.data.id).first();
      expect((await send(`${path}/verify-password`, "POST", { password: "wrong-password", turnstile_token: "test-token" })).status).toBe(403);
      expect((await send(path, "PATCH", { title: "must not change", body: "rejected", password: password.trim(), turnstile_token: "test-token" })).status).toBe(403);
      expect(await env.KNOWLEDGE_DB.prepare("SELECT * FROM knowledge_questions WHERE id=?1").bind(payload.data.id).first()).toEqual(before);
      expect((await send(`${path}/verify-password`, "POST", { password, turnstile_token: "test-token" })).status).toBe(200);
      expect((await send(path, "PATCH", { title: "updated binding question", body: "updated through binding", password, turnstile_token: "test-token" })).status).toBe(200);
      expect((await bound.fetch(request(path))).status).toBe(200);
      expect((await send(path, "DELETE", { password, turnstile_token: "test-token" })).status).toBe(200);
      expect((await bound.fetch(request(path))).status).toBe(404);
      expect(verify).toHaveBeenCalled(); // Existing Siteverify was retained, not bypassed.
    } finally { vi.unstubAllGlobals(); }
  });
});
