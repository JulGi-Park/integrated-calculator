import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { CALCULATOR_REGISTRY } from "../../../lib/calculatorRegistry.ts";

const migrationUrl = new URL("../migrations/0002_service_catalog.sql", import.meta.url);
const quoted = (value) => `'${value.replaceAll("'", "''")}'`;

export function serviceId(slug) {
  const hex = createHash("sha256").update(`gyesanbox:knowledge:service:v1:${slug}`).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20)}`;
}

export function renderServiceCatalogSql() {
  if (new Set(CALCULATOR_REGISTRY.map(({ id }) => id)).size !== CALCULATOR_REGISTRY.length) {
    throw new Error("Calculator Registry contains duplicate slugs");
  }
  return `-- Generated from lib/calculatorRegistry.ts by service-catalog.mjs. Existing IDs are never replaced.\n${CALCULATOR_REGISTRY.map(({ id, title, path }) => `INSERT INTO services (id,slug,name,path,status,created_at,updated_at) VALUES (${quoted(serviceId(id))},${quoted(id)},${quoted(title)},${quoted(path)},'active','2026-10-03T00:00:00.000Z','2026-10-03T00:00:00.000Z') ON CONFLICT(slug) DO UPDATE SET name=excluded.name,path=excluded.path,status='active',updated_at=excluded.updated_at;`).join("\n")}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const expected = renderServiceCatalogSql();
  if (process.argv.includes("--check")) {
    const current = await readFile(migrationUrl, "utf8");
    if (current !== expected) throw new Error("Service catalog migration differs from Calculator Registry");
    console.log(`Service catalog matches ${CALCULATOR_REGISTRY.length} Registry entries.`);
  } else {
    process.stdout.write(expected);
  }
}
