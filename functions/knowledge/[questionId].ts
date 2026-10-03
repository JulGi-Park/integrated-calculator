import { fetchPublishedQuestion, fetchRelatedKnowledgeQuestions, notFound, renderKnowledgeQuestion, resolveKnowledgeRuntime, unavailable, type KnowledgePageFunctionContext } from "../../pages-functions/knowledge-seo";
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
    let related: Awaited<ReturnType<typeof fetchRelatedKnowledgeQuestions>> = [];
    try {
      related = await fetchRelatedKnowledgeQuestions(runtime, question);
    } catch (error) {
      console.error("knowledge_related_questions_unavailable", { errorName: error instanceof Error ? error.name : "UnknownError" });
    }
    return new Response(renderKnowledgeQuestion(question, runtime.environment, related), { status: 200, headers: responseHeaders(runtime.environment) });
  } catch {
    return unavailable();
  }
};
