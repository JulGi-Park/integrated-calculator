import { fetchAllPublishedKnowledgeQuestions, knowledgeSitemapHeaders, notFound, renderKnowledgeSitemap, resolveKnowledgeRuntime, unavailable, type KnowledgePageFunctionContext } from "../pages-functions/knowledge-seo";

export const onRequestGet = async (context: KnowledgePageFunctionContext): Promise<Response> => {
  const runtime = resolveKnowledgeRuntime(new URL(context.request.url), context.env);
  if (!runtime || (runtime.environment === "production" && !runtime.indexEnabled)) return notFound();
  try {
    const items = await fetchAllPublishedKnowledgeQuestions(runtime);
    const headers = new Headers(knowledgeSitemapHeaders);
    if (runtime.environment === "production") headers.delete("X-Robots-Tag");
    return new Response(renderKnowledgeSitemap(items), { status: 200, headers });
  } catch (error) {
    console.error("knowledge_sitemap_unavailable", { errorName: error instanceof Error ? error.name : "UnknownError" });
    return unavailable();
  }
};
