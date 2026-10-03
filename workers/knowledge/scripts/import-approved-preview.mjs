import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { CALCULATOR_REGISTRY } from "../../../lib/calculatorRegistry.ts";
import { KNOWLEDGE_CATEGORIES } from "../../../lib/knowledge/categories.ts";

const expectedSha = "6c3d6aca606d4f0eb63377765ff9e2ce8e937c4c60d7701bc27e9dbcd9d7dd7f";
const inputPath = process.env.KNOWLEDGE_APPROVED_JSON;
const session = process.env.IMPORT_SESSION_KEY;
if (!inputPath || !session) throw new Error("Approved JSON path and import session are required");
const raw = await readFile(inputPath);
const sourceSha256 = createHash("sha256").update(raw).digest("hex");
if (sourceSha256 !== expectedSha) throw new Error("Approved JSON SHA-256 mismatch");
const source = JSON.parse(raw.toString("utf8"));
if (!Array.isArray(source) || source.length !== 200) throw new Error("Expected exactly 200 approved records");
const categories = new Set(KNOWLEDGE_CATEGORIES);
const serviceSlugs = new Set(CALCULATOR_REGISTRY.map(({ id }) => id));
const indexes = new Set();
const items = source.map((record) => {
  if (!Number.isSafeInteger(record.source_index) || record.source_index < 1 || indexes.has(record.source_index)) throw new Error("Invalid or duplicate source_index");
  indexes.add(record.source_index);
  if (record.processing_status !== "ready" || record.privacy_checked !== true
    || (record.fact_check_required && record.fact_check_status !== "verified")) throw new Error("Record is not approved");
  if (!categories.has(record.category) || ![record.title, record.question_body, record.answer_body].every((value) => typeof value === "string" && value.trim())) throw new Error("Missing or invalid content/category");
  if (record.related_calculator_slug && !serviceSlugs.has(record.related_calculator_slug)) throw new Error("Unknown related service");
  return {
    sourceKey: `kin-261001-${String(record.source_index).padStart(3, "0")}`,
    title: record.title,
    questionBody: record.question_body,
    answerBody: record.answer_body,
    category: record.category,
    serviceSlugs: record.related_calculator_slug ? [record.related_calculator_slug] : [],
  };
});
if (new Set(items.map(({ sourceKey }) => sourceKey)).size !== 200) throw new Error("Duplicate sourceKey");

const bridge = "http://127.0.0.1:8798/import-rpc";
const call = async (tool, input) => {
  const response = await fetch(bridge, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Import-Session": session },
    body: JSON.stringify({ tool, input }),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Import bridge HTTP ${response.status}`);
  const payload = await response.json();
  if (!payload.ok) throw new Error(`${tool} failed: ${payload.error?.code ?? "unknown"} (${payload.error?.status ?? "?"})`);
  return payload.data;
};
const initial = await call("knowledge_preview_status", {});
if (initial.environment !== "preview" || initial.services.length !== 21 || initial.questions > 200 || initial.answers > 200 || initial.serviceLinks > 109) throw new Error("Unexpected dedicated Preview D1 baseline");
console.log(`Preflight: source SHA verified, ${items.length} ready records, Preview D1 ${initial.questions} questions, ${initial.services.length} services`);
const validationBatches = Array.from({ length: 10 }, (_, index) => ({ batchId: `kin-dedicated-261003-${String(index + 1).padStart(2, "0")}`, items: items.slice(index * 20, index * 20 + 20) }));
for (const batch of validationBatches) {
  const validation = await call("knowledge_validate_import", batch);
  if (validation.attempted !== 20 || validation.failed !== 0 || validation.valid + validation.existing !== 20) throw new Error(`Validation failed for ${batch.batchId}`);
}
console.log("Validation: 10/10 batches passed without writes");

const outcomes = [];
// Five PBKDF2 hashes per RPC stay within the remote Preview Worker CPU budget.
const batches = Array.from({ length: 40 }, (_, index) => ({ batchId: `kin-dedicated-261003-small-${String(index + 1).padStart(2, "0")}`, items: items.slice(index * 5, index * 5 + 5) }));
for (const batch of batches) {
  let result;
  try {
    result = await call("knowledge_import_drafts", batch);
  } catch {
    // A remote CPU timeout can occur after some rows committed. Resolve every
    // original sourceKey before retrying only missing rows, one at a time.
    let inserted = 0;
    for (const item of batch.items) {
      const found = (await call("knowledge_import_result", { sourceKey: item.sourceKey })).items[0];
      if (found) continue;
      const single = await call("knowledge_import_drafts", { batchId: `${batch.batchId}-${item.sourceKey}`, items: [item] });
      if (single.failed || single.inserted + single.existing !== 1) throw new Error(`Single-record recovery failed for ${item.sourceKey}`);
      inserted += single.inserted;
    }
    result = { attempted: 5, inserted, existing: 5 - inserted, failed: 0 };
  }
  if (result.attempted !== 5 || result.failed !== 0 || result.inserted + result.existing !== 5) throw new Error(`Import incomplete for ${batch.batchId}`);
  const readback = await Promise.all(batch.items.map(async ({ sourceKey }) => (await call("knowledge_import_result", { sourceKey })).items[0]));
  if (readback.some((item) => !item)) throw new Error(`Readback incomplete for ${batch.batchId}`);
  for (const item of readback) {
    const expected = batch.items.find((candidate) => candidate.sourceKey === item.sourceKey);
    if (!expected || item.category !== expected.category || JSON.stringify(item.serviceSlugs) !== JSON.stringify(expected.serviceSlugs)
      || typeof item.questionId !== "string" || typeof item.answerId !== "string") throw new Error(`Readback mismatch in ${batch.batchId}`);
    outcomes.push({ sourceKey: item.sourceKey, questionId: item.questionId, answerId: item.answerId, serviceSlugs: item.serviceSlugs, category: item.category, batchId: batch.batchId });
  }
  console.log(`${batch.batchId}: inserted ${result.inserted}, existing ${result.existing}`);
}
if (outcomes.length !== 200 || new Set(outcomes.map(({ questionId }) => questionId)).size !== 200) throw new Error("Duplicate or missing imported question");
const beforePublish = await call("knowledge_preview_status", {});
if (beforePublish.questions !== 200 || beforePublish.answers !== 200 || beforePublish.serviceLinks !== 109) throw new Error("Imported Preview counts mismatch");

const ledgerPath = path.resolve("reports/preview-import-261003.json");
await mkdir(path.dirname(ledgerPath), { recursive: true });
await writeFile(ledgerPath, `${JSON.stringify({ sourceSha256, environment: "preview", questions: 200, answers: 200, serviceLinks: 109, items: outcomes }, null, 2)}\n`, "utf8");
console.log(`Ledger: ${ledgerPath}`);

if (process.argv.includes("--publish")) {
  const published = await call("knowledge_publish_verified_imports", { sourceSha256, sourceKeys: items.map(({ sourceKey }) => sourceKey) });
  if (published.published !== 200) throw new Error("Published count mismatch");
  console.log("Published: 200 approved imports");
}
