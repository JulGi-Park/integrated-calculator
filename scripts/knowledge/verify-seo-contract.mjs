// Run: node --import tsx scripts/knowledge/verify-seo-contract.mjs <approved-json>
// Only fixed SELECTs against the pinned Preview database. No output files by default.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildSeoMapping, sha256 } from "./seo-mapping.mjs";

const expectedSha = "6c3d6aca606d4f0eb63377765ff9e2ce8e937c4c60d7701bc27e9dbcd9d7dd7f";
const databaseId = "d8b7e07e-67f9-4142-be6a-2a962f4e2b97";
const workerDirectory = fileURLToPath(new URL("../../workers/community/", import.meta.url));
const wrangler = fileURLToPath(new URL("../../workers/community/node_modules/wrangler/bin/wrangler.js", import.meta.url));
const config = JSON.parse(await readFile(new URL("../../workers/community/wrangler.jsonc", import.meta.url), "utf8"));
assert.equal(config.name, "gyesanbox-community-preview");
assert.equal(config.vars.ENVIRONMENT, "preview");
assert.equal(config.d1_databases[0].database_id, databaseId);
assert.equal(config.d1_databases[0].database_name, "gyesanbox-community-preview");
let writes = 0;
function select(sql) {
  assert.match(sql, /^SELECT\b/);
  const output = execFileSync(process.execPath, [wrangler, "d1", "execute", "gyesanbox-community-preview",
    "--remote", "--config", "wrangler.jsonc", "--json", "--command", sql],
  { cwd: workerDirectory, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
  const results = JSON.parse(output);
  for (const result of results) {
    assert.equal(result.success, true);
    assert.equal(result.meta.rows_written, 0);
    assert.equal(result.meta.changed_db, false);
    writes += result.meta.rows_written;
  }
  return results[0].results;
}
const rowsSql = `SELECT i.source_key, i.question_id, i.answer_id, i.payload_hash,
  i.batch_id, i.created_at AS import_created_at,
  q.title, q.body, q.category, q.status, q.origin, q.is_anonymous, q.nickname,
  q.created_at, q.updated_at, a.body AS answer_body, a.created_at AS answer_created_at,
  a.updated_at AS answer_updated_at,
  (SELECT json_group_array(slug) FROM (SELECT s.slug FROM knowledge_question_services r
    JOIN services s ON s.id=r.service_id WHERE r.question_id=q.id ORDER BY s.slug)) AS service_slugs,
  (SELECT json_group_array(json_object('id',service_id,'createdAt',created_at))
    FROM (SELECT r.service_id,r.created_at FROM knowledge_question_services r
      WHERE r.question_id=q.id ORDER BY r.service_id)) AS service_relations
  FROM knowledge_imports i JOIN knowledge_questions q ON q.id=i.question_id
  JOIN knowledge_answers a ON a.id=i.answer_id AND a.question_id=q.id ORDER BY i.source_key`;
const countSql = `SELECT
  (SELECT count(*) FROM knowledge_questions) AS questions,
  (SELECT count(*) FROM knowledge_answers) AS answers,
  (SELECT count(*) FROM knowledge_imports) AS imports,
  (SELECT count(*) FROM knowledge_question_services) AS serviceLinks,
  (SELECT count(*) FROM knowledge_answers a LEFT JOIN knowledge_questions q ON q.id=a.question_id WHERE q.id IS NULL) AS danglingAnswers,
  (SELECT count(*) FROM knowledge_question_services r LEFT JOIN knowledge_questions q ON q.id=r.question_id LEFT JOIN services s ON s.id=r.service_id WHERE q.id IS NULL OR s.id IS NULL) AS danglingServices`;
const sourceBytes = await readFile(process.argv[2]);
assert.equal(sha256(sourceBytes), expectedSha);
const source = JSON.parse(sourceBytes.toString("utf8"));
assert.equal(source.length, 200);
const countsBefore = select(countSql)[0];
const before = select(rowsSql);
const first = buildSeoMapping(source, before, expectedSha);
const after = select(rowsSql);
const second = buildSeoMapping(source, after, expectedSha);
assert.deepEqual(first, second);
assert.deepEqual(before, after);
assert.deepEqual(select(countSql)[0], countsBefore);
assert.equal(sha256(await readFile(process.argv[2])), expectedSha);
assert.equal(first.length, 200);
assert.deepEqual(countsBefore, { questions: 200, answers: 200, imports: 200, serviceLinks: 109,
  danglingAnswers: 0, danglingServices: 0 });
console.log(JSON.stringify({ databaseId, input: source.length, output: first.length, matched: first.length,
  missing: 0, duplicateSourceKey: 0, duplicateQuestionId: 0, duplicateDetailPath: 0, failed: 0,
  counts: countsBefore, dbWrites: writes, dataChanges: 0, sourceShaBefore: expectedSha,
  sourceShaAfter: expectedSha, deterministicMappingSha256: sha256(JSON.stringify(first)),
  repeatedReadbackIdentical: true, example: first[0] }, null, 2));
