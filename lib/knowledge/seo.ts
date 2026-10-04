/** Derived values only: no routes, database writes or deployment gate activation. */
export const KNOWLEDGE_SEO_CONTRACT_VERSION = "knowledge-seo-v1";
const CANONICAL_ORIGIN = "https://gyesanbox.kr";
const QUESTION_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeKnowledgeQuestionId(id: string): string {
  if (typeof id !== "string" || !QUESTION_UUID.test(id)) {
    throw new Error("INVALID_KNOWLEDGE_QUESTION_ID");
  }
  return id.toLowerCase();
}

export function knowledgeDetailPath(id: string): string {
  return `/knowledge/${normalizeKnowledgeQuestionId(id)}/`;
}

export function knowledgeCanonical(id: string): string {
  return `${CANONICAL_ORIGIN}${knowledgeDetailPath(id)}`;
}

export function knowledgeSeoDescription(body: string): string {
  const normalized = body.replace(/\s+/gu, " ").trim();
  const points = Array.from(normalized);
  return points.length <= 160 ? normalized : `${points.slice(0, 159).join("")}…`;
}

export function knowledgeSeoRobots(options: {
  environment: "preview" | "production";
  status: "draft" | "published" | "hidden";
  productionIndexEnabled?: boolean;
  productionPublicEnabled?: boolean;
}) {
  const index = options.environment === "production"
    && options.status === "published"
    && options.productionPublicEnabled === true
    && options.productionIndexEnabled === true;
  return { index, follow: index };
}

/** Raw text for React/Next Metadata: the renderer must escape, never use raw HTML. */
export function knowledgeSeo(question: { id: string; title: string; body: string }) {
  return {
    contractVersion: KNOWLEDGE_SEO_CONTRACT_VERSION,
    normalizedQuestionId: normalizeKnowledgeQuestionId(question.id),
    detailPath: knowledgeDetailPath(question.id),
    canonical: knowledgeCanonical(question.id),
    title: `${question.title} | 계산박스 지식센터`,
    description: knowledgeSeoDescription(question.body),
  };
}

/** For a future string-based HTML renderer only; do not pre-escape React Metadata. */
export function escapeKnowledgeSeoHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}
