// Knowledge taxonomy approved in KNOW-PREVIEW-PUBLISH-REVIEW-261001.
// This is independent of the information-center category contract.
export const KNOWLEDGE_CATEGORIES = [
  "근로·고용", "금융", "세금", "부동산", "사업", "투자", "자동차", "교육·자격", "복지·지원", "생활",
] as const;
export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];
export const isKnowledgeCategory = (value: unknown): value is KnowledgeCategory =>
  typeof value === "string" && (KNOWLEDGE_CATEGORIES as readonly string[]).includes(value);
