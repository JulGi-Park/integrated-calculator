import { fetchPublishedQuestion, notFound, renderKnowledgeQuestion, resolveKnowledgeRuntime, unavailable, type KnowledgePageFunctionContext } from "../../pages-functions/knowledge-seo";
import { curatedKnowledgeSeo } from "../../pages-functions/knowledge-curated-seo";
import { knowledgeDetailPath, normalizeKnowledgeQuestionId } from "../../lib/knowledge/seo";

const responseHeaders = (environment: "preview" | "production") => ({
  "Content-Type": "text/html; charset=UTF-8",
  "Cache-Control": "no-store",
  ...(environment === "preview" ? { "X-Robots-Tag": "noindex, nofollow, noarchive" } : {}),
});

export const onRequestGet = async (context: KnowledgePageFunctionContext): Promise<Response> => {
  const url = new URL(context.request.url);
  const runtime = resolveKnowledgeRuntime(url, context.env);
  if (!runtime) return notFound();
  const requestedId = context.params.questionId ?? "";
  let id: string;
  try {
    id = normalizeKnowledgeQuestionId(requestedId);
  } catch {
    return notFound();
  }
  const requestedPath = `/knowledge/${requestedId}/`;
  if (url.pathname !== requestedPath && url.pathname !== requestedPath.slice(0, -1)) return notFound();
  if (url.pathname !== knowledgeDetailPath(id)) return Response.redirect(new URL(knowledgeDetailPath(id), url.origin), 308);
  try {
    const question = await fetchPublishedQuestion(runtime, id);
    if (!question) return notFound();
    const curated = await curatedKnowledgeSeo({ environment: runtime.environment,
      db: context.env.KNOWLEDGE_SEO_IDENTITY_DB, question,
      readPublished: (targetId) => fetchPublishedQuestion(runtime, targetId) });
    return new Response(renderKnowledgeQuestion(question, runtime.environment, curated.related, curated.metadata), { status: 200, headers: responseHeaders(runtime.environment) });
  } catch {
    return unavailable();
  }
};
