import { knowledgeBuildGates } from "./gates.mjs";

const ROOT_SITEMAP = "https://gyesanbox.kr/sitemap.xml";
const KNOWLEDGE_SITEMAP = "https://gyesanbox.kr/sitemap-knowledge.xml";

/** @param {Record<string, string | undefined>} env */
export function knowledgeRobotsSitemaps(env) {
  return knowledgeBuildGates(env).indexEnabled
    ? [ROOT_SITEMAP, KNOWLEDGE_SITEMAP]
    : ROOT_SITEMAP;
}
