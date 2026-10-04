/** @param {"preview" | "production"} environment
 * @param {import("./gates").KnowledgeGateEnv} env */
export function knowledgeGates(environment, env) {
  const publicEnabled = environment === "preview"
    ? env.NEXT_PUBLIC_ENABLE_KNOWLEDGE_PREVIEW === "true"
    : env.KNOWLEDGE_ENV === "production" && env.KNOWLEDGE_PUBLIC_ENABLED === "true";
  const indexEnabled = environment === "production" && publicEnabled
    && env.NEXT_PUBLIC_ENABLE_KNOWLEDGE_PREVIEW !== "true"
    && env.KNOWLEDGE_INDEX_ENABLED === "true";
  return { publicEnabled, indexEnabled, curatedEnabled: publicEnabled };
}

/** @param {import("./gates").KnowledgeGateEnv | Record<string, string | undefined>} env */
export function knowledgeBuildGates(env) {
  const environment = env.NEXT_PUBLIC_ENABLE_KNOWLEDGE_PREVIEW === "true"
    ? "preview" : env.KNOWLEDGE_ENV === "production" ? "production" : "preview";
  return knowledgeGates(environment, env);
}
