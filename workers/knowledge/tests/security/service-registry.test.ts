import { beforeAll, describe, expect, it } from "vitest";
import { applyD1Migrations, env } from "cloudflare:test";
import base from "../../migrations/0001_knowledge_base.sql?raw";
import catalog from "../../migrations/0002_service_catalog.sql?raw";
import { CALCULATOR_REGISTRY } from "../../../../lib/calculatorRegistry";

const statements = (sql: string) => sql.split(";").map((query) => query.trim()).filter(Boolean);

describe("dedicated knowledge service catalog", () => {
  beforeAll(async () => {
    await applyD1Migrations(env.KNOWLEDGE_DB, [
      { name: "0001_knowledge_base.sql", queries: statements(base) },
      { name: "0002_service_catalog.sql", queries: statements(catalog) },
    ]);
  });

  it("matches the public calculator registry without Community IDs", async () => {
    const rows = (await env.KNOWLEDGE_DB.prepare("SELECT id,slug,name,path FROM services WHERE status='active' ORDER BY slug").all()).results;
    expect(rows).toHaveLength(CALCULATOR_REGISTRY.length);
    expect(rows.map((row) => [row.slug, row.name, row.path])).toEqual(
      expect.arrayContaining(CALCULATOR_REGISTRY.map((calculator) => [calculator.id, calculator.title, calculator.path])),
    );
    expect(new Set(rows.map((row) => row.slug)).size).toBe(rows.length);
    expect(rows.find((row) => row.slug === "labor-pay")?.id).not.toBe("d2f1e94b-7c80-454b-9acb-6dd66c9e29d4");
  });

  it("can upsert the catalog again without duplicating or replacing IDs", async () => {
    const before = (await env.KNOWLEDGE_DB.prepare("SELECT slug,id FROM services ORDER BY slug").all()).results;
    await applyD1Migrations(env.KNOWLEDGE_DB, [{ name: "0002_repeat.sql", queries: statements(catalog) }]);
    const after = (await env.KNOWLEDGE_DB.prepare("SELECT slug,id FROM services ORDER BY slug").all()).results;
    expect(after).toEqual(before);
  });
});
