import baseMigration from "../../migrations/0001_knowledge_base.sql?raw";
import catalogMigration from "../../migrations/0002_service_catalog.sql?raw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { applyD1Migrations, env } from "cloudflare:test";
import worker from "../../src/index";
import { route } from "../../src/router";
import { knowledgeAdmission } from "../../src/security/knowledge-spam";

const LABOR = "2759964a-549f-45b7-aa5b-ea719cfe0ffd";
const limiter = vi.fn(async () => ({ success: true }));
const testEnv = { ...env, ENVIRONMENT: "preview", AUTHOR_TOKEN_PEPPER: "spam-test-only-pepper", KNOWLEDGE_WRITE_LIMITER: { limit: limiter } } as unknown as Env;
const ctx = {} as ExecutionContext;
const input = (body = "주 5일 하루 8시간 근무하면 주휴수당은 어떻게 계산하나요?") => ({ title: "근무 조건 확인 질문", category: "근로·고용", body, isAnonymous: true, nickname: null, password: "test-only-pass", serviceIds: [LABOR], website: "", turnstile_token: "test-only-token" });
const request = (payload: unknown, ip = "192.0.2.1") => new Request("https://knowledge-preview.gyesanbox.kr/api/knowledge/v1/questions", {
  method: "POST", headers: { "Content-Type": "application/json", Origin: "https://know-02-preview.integrated-calculator.pages.dev", "CF-Connecting-IP": ip }, body: JSON.stringify(payload),
});
const create = (payload = input(), ip?: string) => route(request(payload, ip), testEnv, ctx, crypto.randomUUID());
const counts = () => env.KNOWLEDGE_DB.prepare(`SELECT (SELECT COUNT(*) FROM knowledge_questions) questions,
  (SELECT COUNT(*) FROM knowledge_answers) answers,(SELECT COUNT(*) FROM knowledge_question_services) links,
  (SELECT COUNT(*) FROM knowledge_submission_guards) receipts`).first();

describe("visitor knowledge spam protection", () => {
  beforeAll(async () => {
    const migrations = [baseMigration,catalogMigration].map((source,index) => ({ name: `${index}.sql`, queries: source.replace(/^--.*$/gm, "").split(";").map(x => x.trim()).filter(Boolean) }));
    await applyD1Migrations(env.KNOWLEDGE_DB, migrations);
  });
  beforeEach(() => { limiter.mockClear(); vi.stubGlobal("fetch", vi.fn(async () => Response.json({ success: true, hostname: "know-02-preview.integrated-calculator.pages.dev" }))); });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("accepts normal labor, finance, pension, amount/contact/date and official URL questions without false positives", async () => {
    const normal = [
      "주 5일 하루 8시간 근무하는데 하루 결근하면 주휴수당을 받을 수 있나요?",
      "연봉 4,000만원이고 부양가족 1명인데 실수령액은 어느 정도인가요?",
      "퇴직금 계산 결과와 실제 입금액이 다른 이유가 무엇인가요?",
      "국민연금 기준소득월액은 매년 언제 변경되나요?",
      "회사 ABC의 안내에는 2026년 10월 1일 1,250,000원이 지급된다고 합니다. 담당자 전화번호는 02-1234-5678이고 공식 자료 https://www.moel.go.kr/ 와 https://www.nps.or.kr/ 를 참고했습니다. 기준이 맞나요?",
    ];
    for (const body of normal) expect((await create(input(body))).response.status).toBe(201);
    expect(await counts()).toEqual({ questions: 5, answers: 0, links: 5, receipts: 5 });
    const publicList = await route(new Request("https://knowledge-preview.gyesanbox.kr/api/knowledge/v1/questions"), testEnv, ctx, "list");
    const json = await publicList.response.json() as {data:{items: Record<string,unknown>[]}};
    expect(json.data.items.every(item => item.category === "근로·고용")).toBe(true);
    expect(JSON.stringify(json)).not.toMatch(/password|requester_hash|content_hash|admin_seed/u);
    const receipt = await env.KNOWLEDGE_DB.prepare("SELECT * FROM knowledge_submission_guards LIMIT 1").first();
    expect(JSON.stringify(receipt)).not.toMatch(/192\.0\.2\.1|1,250,000|test-only-pass/u);
  });

  it.each([
    ["HONEYPOT_REJECTED", { website: "https://spam.example" }],
    ["SPAM_REJECTED", { body: "가입 혜택을 드립니다. 클릭 https://a.example https://b.example https://c.example https://d.example" }],
    ["SPAM_REJECTED", { body: "무료상담 카톡 spam-agent로 연락하세요. ".repeat(8) }],
    ["SPAM_REJECTED", { body: "<script>alert('xss')</script>" }],
    ["SPAM_REJECTED", { body: "<a href='https://spam.example'>광고</a>" }],
    ["SPAM_REJECTED", { body: "가".repeat(150) }],
  ])("rejects %s with no question, answer, relation or successful quota writes", async (code, changed) => {
    const before = await counts();
    const response = await worker.fetch(request({ ...input(), ...changed }), testEnv, ctx);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code } });
    expect(await counts()).toEqual(before);
  });

  it("normalizes whitespace and Latin case and blocks the same requester's duplicate for an hour", async () => {
    const first = { ...input("급여 ABC 조건 확인 질문"), title: "ABC 근무 질문" };
    expect((await create(first)).response.status).toBe(201);
    await expect(create({ ...first, title: " abc  근무 질문 ", body: "급여  abc   조건 확인 질문" })).rejects.toMatchObject({ status: 409, code: "DUPLICATE_SUBMISSION" });
    expect(await counts()).toEqual({ questions: 1, answers: 0, links: 1, receipts: 1 });
  });

  it("admits only one concurrent duplicate and does not leave dangling relations", async () => {
    const result = await Promise.allSettled([create(), create()]);
    expect(result.filter(x => x.status === "fulfilled")).toHaveLength(1);
    expect(result.filter(x => x.status === "rejected")).toHaveLength(1);
    expect(await counts()).toEqual({ questions: 1, answers: 0, links: 1, receipts: 1 });
    expect((await env.KNOWLEDGE_DB.prepare("PRAGMA foreign_key_check").all()).results).toEqual([]);
  });

  it("blocks the fourth identical cross-requester submission within a minute, but permits it after that window", async () => {
    for (let index = 1; index <= 3; index++) expect((await create(input(), `192.0.2.${index}`)).response.status).toBe(201);
    await expect(create(input(), "192.0.2.4")).rejects.toMatchObject({ code: "DUPLICATE_SUBMISSION" });
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 61_000);
    expect((await create(input(), "192.0.2.4")).response.status).toBe(201);
  });

  it("limits successful creates to five in ten minutes and sends 429 with Retry-After", async () => {
    for (let index = 0; index < 5; index++) expect((await create(input(`급여 질문 ${index}`))).response.status).toBe(201);
    const response = await worker.fetch(request(input("여섯 번째 급여 질문")), testEnv, ctx);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("600");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await counts()).toEqual({ questions: 5, answers: 0, links: 5, receipts: 5 });
  });

  it("limits twelve successes per hour independently of the ten-minute window and expires old receipts", async () => {
    const admission = await knowledgeAdmission(testEnv.AUTHOR_TOKEN_PEPPER, "192.0.2.1", "different", "different");
    await env.KNOWLEDGE_DB.batch(Array.from({length: 12}, (_,index) => env.KNOWLEDGE_DB.prepare("INSERT INTO knowledge_submission_guards (id,requester_hash,content_hash,created_at) VALUES (?1,?2,?3,?4)").bind(crypto.randomUUID(), admission.requesterHash, `content-${index}`, Date.now() - 601_000)));
    const response = await worker.fetch(request(input()), testEnv, ctx);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("3600");
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 3_600_001);
    expect((await create()).response.status).toBe(201);
    expect(await counts()).toEqual({ questions: 1, answers: 0, links: 1, receipts: 1 });
  });

  it("does not spend the post-Turnstile limiter or success quota on failed verification", async () => {
    vi.stubGlobal("fetch", async () => Response.json({ success: false }));
    await expect(create()).rejects.toMatchObject({ code: "TURNSTILE_FAILED" });
    expect(limiter).not.toHaveBeenCalled();
    expect(await counts()).toEqual({ questions: 0, answers: 0, links: 0, receipts: 0 });
  });

  it("keeps unknown/privileged fields and unsupported categories rejected", async () => {
    for (const changed of [{ status: "published" }, { origin: "admin_seed" }, { password_hash: "raw" }, { unexpected: true }, { category: "미지원" }]) {
      await expect(create({ ...input(), ...changed })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    }
    expect(await counts()).toEqual({ questions: 0, answers: 0, links: 0, receipts: 0 });
  });
});
