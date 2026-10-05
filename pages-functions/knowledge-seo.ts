import {
  escapeKnowledgeSeoHtml,
  knowledgeCanonical,
  knowledgeDetailPath,
  knowledgeSeo,
  knowledgeSeoRobots,
  normalizeKnowledgeQuestionId,
} from "../lib/knowledge/seo";
import { knowledgeGates, type KnowledgeGateEnv } from "../lib/knowledge/gates";
import { knowledgeServiceFetch, knowledgeReadRequest, type KnowledgeTransportEnv } from "./knowledge-transport";
import { CALCULATOR_REGISTRY } from "../lib/calculatorRegistry";

export type KnowledgePageFunctionContext = {
  request: Request;
  env: KnowledgePagesEnv;
  params: Record<string, string | undefined>;
};

type Runtime = KnowledgeTransportEnv & { environment: "preview" | "production";
  publicEnabled: boolean; indexEnabled: boolean; curatedEnabled: boolean };
export type PublicListQuestion = { id: string; title: string; category: string | null };
type PublicQuestionPage = { items: PublicListQuestion[]; page: number; total: number; totalPages: number };
export type PublicQuestion = {
  id: string;
  title: string;
  body: string;
  category: string | null;
  createdAt?: string;
  isAnonymous: boolean;
  nickname: string | null;
  status: "published";
  answer: { body: string } | null;
  relatedServices: Array<{ slug: string; name: string }>;
};

const PREVIEW_HOST = /^[a-z0-9-]+\.integrated-calculator\.pages\.dev$/u;
const PREVIEW_ROBOTS = "noindex, nofollow, noarchive";
const NO_STORE = { "Cache-Control": "no-store", "X-Robots-Tag": PREVIEW_ROBOTS };
const escape = escapeKnowledgeSeoHtml;
const PUBLIC_PAGE_SIZE = 10;
const MAX_SITEMAP_PAGES = 100;
const RELATED_QUESTION_LIMIT = 5;

export type KnowledgePagesEnv = KnowledgeGateEnv & KnowledgeTransportEnv & {
  NEXT_PUBLIC_ENABLE_KNOWLEDGE_PREVIEW?: string;
  KNOWLEDGE_ENV?: string;
  KNOWLEDGE_PUBLIC_ENABLED?: string;
  KNOWLEDGE_SEO_IDENTITY_DB?: import("./knowledge-curated-seo").IdentityDatabase;
};

export function resolveKnowledgeRuntime(url: URL, env: KnowledgePagesEnv): Runtime | null {
  const preview = PREVIEW_HOST.test(url.hostname)
    && env.NEXT_PUBLIC_ENABLE_KNOWLEDGE_PREVIEW === "true";
  const production = url.hostname === "gyesanbox.kr"
    && env.KNOWLEDGE_ENV === "production"
    && env.KNOWLEDGE_PUBLIC_ENABLED === "true";
  if (!preview && !production) return null;
  const environment = production ? "production" : "preview";
  return { KNOWLEDGE_SERVICE: env.KNOWLEDGE_SERVICE, environment, ...knowledgeGates(environment, env) };
}

export function notFound(): Response {
  return new Response("Not found", { status: 404, headers: { ...NO_STORE } });
}

export function unavailable(): Response {
  return new Response("Service unavailable", { status: 503, headers: { ...NO_STORE } });
}

async function fetchPublicQuestionPage(runtime: Runtime, page: number, category?: string): Promise<PublicQuestionPage> {
  const url = new URL(knowledgeReadRequest("/questions").url);
  url.searchParams.set("limit", String(PUBLIC_PAGE_SIZE));
  url.searchParams.set("page", String(page));
  if (category) url.searchParams.set("category", category);
  const response = await knowledgeServiceFetch(runtime, new Request(url, { headers: { Accept: "application/json" } }));
  if (!response.ok || !response.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    throw new Error("KNOWLEDGE_LIST_API_UNAVAILABLE");
  }
  const payload = await response.json() as { ok?: boolean; data?: Record<string, unknown> };
  const data = payload.data;
  if (!payload.ok || !data || !Array.isArray(data.items)
    || data.page !== page || data.page_size !== PUBLIC_PAGE_SIZE
    || !Number.isSafeInteger(data.total) || Number(data.total) < 0
    || !Number.isSafeInteger(data.total_pages)
    || data.total_pages !== Math.max(1, Math.ceil(Number(data.total) / PUBLIC_PAGE_SIZE))) {
    throw new Error("KNOWLEDGE_LIST_API_PAYLOAD_INVALID");
  }
  const total = Number(data.total);
  if (data.items.length !== Math.min(PUBLIC_PAGE_SIZE, Math.max(0, total - (page - 1) * PUBLIC_PAGE_SIZE))) {
    throw new Error("KNOWLEDGE_LIST_API_PAGE_INCOMPLETE");
  }
  const items = data.items.map((item: unknown) => {
    if (!item || typeof item !== "object") throw new Error("KNOWLEDGE_LIST_API_ITEM_INVALID");
    const candidate = item as Partial<PublicListQuestion> & { status?: unknown };
    const id = normalizeKnowledgeQuestionId(String(candidate.id ?? ""));
    if (typeof candidate.title !== "string" || !(candidate.category === null || typeof candidate.category === "string")
      || (candidate.status !== undefined && candidate.status !== "published")) {
      throw new Error("KNOWLEDGE_LIST_API_ITEM_INVALID");
    }
    return { id, title: candidate.title, category: candidate.category };
  });
  return { items, page, total, totalPages: Number(data.total_pages) };
}

export async function fetchAllPublishedKnowledgeQuestions(runtime: Runtime): Promise<PublicListQuestion[]> {
  const first = await fetchPublicQuestionPage(runtime, 1);
  if (first.totalPages > MAX_SITEMAP_PAGES) throw new Error("KNOWLEDGE_SITEMAP_MAX_PAGES_REACHED");
  const items = [...first.items];
  for (let page = 2; page <= first.totalPages; page += 4) {
    const pages = await Promise.all(Array.from({ length: Math.min(4, first.totalPages - page + 1) },
      (_, offset) => fetchPublicQuestionPage(runtime, page + offset)));
    for (const current of pages) {
      if (current.total !== first.total || current.totalPages !== first.totalPages) {
        throw new Error("KNOWLEDGE_SITEMAP_PAGE_TOTAL_CHANGED");
      }
      items.push(...current.items);
    }
  }
  if (items.length !== first.total || new Set(items.map((item) => item.id)).size !== items.length) {
    throw new Error("KNOWLEDGE_SITEMAP_INCOMPLETE");
  }
  return items;
}

export async function fetchRelatedKnowledgeQuestions(runtime: Runtime, question: Pick<PublicQuestion, "id" | "category">): Promise<PublicListQuestion[]> {
  const related: PublicListQuestion[] = [];
  const seen = new Set([question.id]);
  const add = (items: PublicListQuestion[]) => {
    for (const item of items) {
      if (!seen.has(item.id) && related.length < RELATED_QUESTION_LIMIT) {
        seen.add(item.id);
        related.push(item);
      }
    }
  };
  if (question.category) add((await fetchPublicQuestionPage(runtime, 1, question.category)).items);
  if (related.length < RELATED_QUESTION_LIMIT) add((await fetchPublicQuestionPage(runtime, 1)).items);
  return related;
}

export function renderKnowledgeSitemap(items: PublicListQuestion[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items
    .toSorted((a, b) => a.id.localeCompare(b.id))
    .map((item) => `<url><loc>${escape(knowledgeCanonical(item.id))}</loc></url>`).join("")}</urlset>`;
}

export const knowledgeSitemapHeaders = { "Content-Type": "application/xml; charset=UTF-8", ...NO_STORE };

export async function fetchPublishedQuestion(runtime: Runtime, id: string): Promise<PublicQuestion | null> {
  let stage = "fetch";
  let upstreamStatus: number | null = null;
  let upstreamContentType: string | null = null;
  try {
    const response = await knowledgeServiceFetch(runtime, knowledgeReadRequest(`/questions/${encodeURIComponent(id)}`));
    upstreamStatus = response.status;
    upstreamContentType = response.headers.get("content-type");
    if (response.status === 404) return null;
    if (!response.ok || !upstreamContentType?.toLowerCase().includes("application/json")) {
      throw new Error("KNOWLEDGE_DETAIL_API_UNAVAILABLE");
    }
    stage = "json_parse";
    const payload = await response.json() as { ok?: boolean; data?: { question?: unknown } };
    if (!payload.ok || !payload.data?.question || typeof payload.data.question !== "object") {
      throw new Error("KNOWLEDGE_DETAIL_API_PAYLOAD_INVALID");
    }
    stage = "payload_validation";
    const question = payload.data.question as Partial<Omit<PublicQuestion, "status">>;
    const normalizedId = normalizeKnowledgeQuestionId(String(question.id ?? ""));
    // The public detail endpoint already selects only published rows and deliberately
    // omits internal status from its serialized response.
    if (normalizedId !== id
      || typeof question.title !== "string" || typeof question.body !== "string"
      || !(question.category === null || typeof question.category === "string")
      || (question.createdAt !== undefined && typeof question.createdAt !== "string")
      || typeof question.isAnonymous !== "boolean"
      || !(question.nickname === null || typeof question.nickname === "string")
      || !(question.answer === null || (typeof question.answer === "object" && typeof question.answer.body === "string"))
      || !Array.isArray(question.relatedServices)
      || question.relatedServices.some((service) => !service || typeof service.slug !== "string"
        || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(service.slug) || typeof service.name !== "string")) {
      throw new Error("KNOWLEDGE_DETAIL_API_PAYLOAD_INVALID");
    }
    return { ...question, status: "published" } as PublicQuestion;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const cause = error instanceof Error ? error.cause : undefined;
    console.error("knowledge_detail_upstream_failure", {
      stage, upstreamStatus, upstreamContentType,
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: errorMessage.replace(/https?:\/\/[^\s)]+/gu, "[url]").slice(0, 160),
      causeName: cause instanceof Error ? cause.name : undefined,
      causeCode: cause && typeof cause === "object" && "code" in cause ? String(cause.code).slice(0, 80) : undefined,
      failureCode: /^KNOWLEDGE_DETAIL_API_[A-Z_]+$/u.test(errorMessage) ? errorMessage : "UPSTREAM_FETCH_REJECTED",
    });
    throw error;
  }
}

const paragraphs = (body: string) => body.split(/\n{2,}/u).map((part) => `<p>${escape(part).replace(/\n/gu, "<br>")}</p>`).join("");

function formattedQuestionDate(value: string | undefined): { dateTime: string; label: string } | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return {
    dateTime: date.toISOString(),
    label: new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Seoul" }).format(date),
  };
}

const footerLinks = [
  ["/about/", "소개"], ["/methodology/", "계산 방법론"], ["/updates/", "변경 이력"],
  ["/contact/", "문의"], ["/privacy-policy/", "개인정보처리방침"], ["/terms/", "이용약관"], ["/disclaimer/", "면책문구"],
] as const;

function renderSiteHeader(): string {
  return `<header class="site-header"><div class="site-header__inner"><a class="brand" href="/" aria-label="계산박스 홈"><span class="brand__mark" aria-hidden="true">=</span><span>계산박스</span></a><nav aria-label="주요 메뉴"><a class="nav-link" href="/calculators/">계산기 목록</a><a class="nav-link" href="/knowledge/" aria-current="page">지식센터</a><a class="nav-link" href="/about/">소개</a></nav></div></header>`;
}

function renderSiteFooter(): string {
  const links = footerLinks.map(([href, label]) => `<a href="${href}">${label}</a>`).join("");
  return `<footer class="site-footer"><div class="site-footer__inner"><div class="site-footer__brand"><p class="site-footer__brand-name">계산박스</p><p>문의: <a class="site-footer__link" href="/contact/">문의 페이지</a></p><p class="site-footer__copyright">© 2026 줄기Dev. All rights reserved.</p><p>계산박스는 대한민국 상표 출원 중입니다.</p><nav class="site-footer__nav" aria-label="사이트 정책">${links}</nav></div><p class="site-footer__note">계산 결과는 참고용입니다. 실제 세금, 보험료, 급여, 대출 조건, 고용보험 판단은 개인 상황과 기관 기준에 따라 달라질 수 있으며, 정확한 판단은 관련 기관 또는 전문가 확인이 필요합니다.</p></div></footer>`;
}

export function renderKnowledgeQuestion(question: PublicQuestion, environment: "preview" | "production" = "preview", related: PublicListQuestion[] = [], metadata?: { title: string; description: string }, gates?: { publicEnabled: boolean; indexEnabled: boolean }): string {
  const seo = { ...knowledgeSeo(question), ...metadata };
  const robots = knowledgeSeoRobots({ environment, status: question.status,
    productionPublicEnabled: gates?.publicEnabled, productionIndexEnabled: gates?.indexEnabled });
  const robotsContent = robots.index ? "index, follow" : PREVIEW_ROBOTS;
  const canonical = escape(seo.canonical);
  const title = escape(seo.title);
  const description = escape(seo.description);
  const image = "https://gyesanbox.kr/og-default.png";
  const author = question.isAnonymous ? "익명" : (question.nickname || "질문 작성자");
  const questionDate = formattedQuestionDate(question.createdAt);
  const category = question.category?.trim() || "기타";
  const answer = question.answer
    ? `<section class="knowledge-answer" aria-labelledby="official-answer"><div class="knowledge-answer__heading"><span class="knowledge-answer__mark" aria-hidden="true">✓</span><div><p class="knowledge-eyebrow">공식 답변</p><h2 id="official-answer">계산박스 공식답변</h2></div></div><div class="knowledge-prose knowledge-answer__body">${paragraphs(question.answer.body)}</div></section>`
    : `<section class="knowledge-answer" aria-labelledby="official-answer"><div class="knowledge-answer__heading"><span class="knowledge-answer__mark" aria-hidden="true">✓</span><div><p class="knowledge-eyebrow">공식 답변</p><h2 id="official-answer">계산박스 공식답변</h2></div></div><p class="knowledge-answer__pending">아직 공식답변이 등록되지 않았습니다.</p></section>`;
  const services = question.relatedServices.length
    ? `<section class="knowledge-support-card knowledge-calculators" aria-labelledby="related-calculators"><div class="knowledge-section-heading"><p class="knowledge-eyebrow">계산박스 도구</p><h2 id="related-calculators">관련 계산기</h2></div><ul class="knowledge-calculator-list">${question.relatedServices.map((service) => {
      const registryItem = CALCULATOR_REGISTRY.find((item) => item.id === service.slug);
      const description = registryItem?.description ?? `${service.name} 계산에 필요한 조건을 입력하고 예상 결과를 확인할 수 있습니다.`;
      return `<li><a class="knowledge-calculator-card" href="/calculators/${encodeURIComponent(service.slug)}/"><span class="knowledge-calculator-card__content"><strong>${escape(service.name)}</strong><span>${escape(description)}</span></span><span class="knowledge-calculator-card__cta">계산기 열기 <span aria-hidden="true">→</span></span></a></li>`;
    }).join("")}</ul></section>`
    : "";
  const relatedQuestions = related.length
    ? `<section class="knowledge-support-card knowledge-related" aria-labelledby="related-questions"><div class="knowledge-section-heading"><p class="knowledge-eyebrow">함께 살펴보기</p><h2 id="related-questions">관련 질문</h2></div><ul class="knowledge-related-list">${related.filter((item) => item.id !== question.id).slice(0, RELATED_QUESTION_LIMIT).map((item) => `<li><a href="${knowledgeDetailPath(item.id)}"><span>${escape(item.title)}</span><span class="knowledge-related-list__arrow" aria-hidden="true">↗</span></a></li>`).join("")}</ul></section>`
    : "";
  const breadcrumbCategory = question.category ? `<li aria-current="page">${escape(category)}</li>` : "";
  const dateMetadata = questionDate ? `<span class="knowledge-meta__item"><span class="knowledge-meta__label">작성일</span><time datetime="${escape(questionDate.dateTime)}">${escape(questionDate.label)}</time></span>` : "";
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="description" content="${description}"><meta name="robots" content="${robotsContent}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${image}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="${image}"><link rel="stylesheet" href="/knowledge-detail.css"></head><body class="knowledge-detail-body"><div class="knowledge-site-shell">${renderSiteHeader()}<main class="knowledge-main"><div class="knowledge-page-shell"><nav class="knowledge-breadcrumb" aria-label="현재 위치"><ol><li><a href="/">계산박스</a></li><li><a href="/knowledge/">지식센터</a></li>${breadcrumbCategory}</ol></nav><a class="knowledge-back-link" href="/knowledge/"><span aria-hidden="true">←</span> 지식센터로 돌아가기</a><article class="knowledge-article"><header class="knowledge-question-header"><span class="knowledge-category">${escape(category)}</span><p class="knowledge-eyebrow">지식센터 질문</p><h1>${escape(question.title)}</h1><div class="knowledge-meta"><span class="knowledge-meta__item"><span class="knowledge-meta__label">작성자</span><span>${escape(author)}</span></span>${dateMetadata}</div></header><section class="knowledge-question-card" aria-labelledby="question-body"><div class="knowledge-card-heading"><span class="knowledge-card-heading__icon" aria-hidden="true">Q</span><h2 id="question-body">질문 내용</h2></div><div class="knowledge-prose knowledge-question-body">${paragraphs(question.body)}</div></section>${answer}<div class="knowledge-support-grid">${services}${relatedQuestions}</div><div class="knowledge-bottom-cta"><div><p class="knowledge-eyebrow">더 궁금한 점을 찾아보세요</p><h2>지식센터 다른 질문 보기</h2><p>생활과 일에 필요한 질문과 계산박스의 공식답변을 살펴보세요.</p></div><a class="knowledge-button" href="/knowledge/">질문 둘러보기 <span aria-hidden="true">→</span></a></div></article></div></main>${renderSiteFooter()}</div></body></html>`;
}
