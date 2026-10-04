/** Shared build/runtime gates. Missing values always fail closed. */
export type KnowledgeGateEnv = {
  NEXT_PUBLIC_ENABLE_KNOWLEDGE_PREVIEW?: string;
  KNOWLEDGE_ENV?: string;
  KNOWLEDGE_PUBLIC_ENABLED?: string;
  KNOWLEDGE_INDEX_ENABLED?: string;
};

// One implementation also runs in plain Node build scripts, without TS loaders.
export { knowledgeGates, knowledgeBuildGates } from "./gates.mjs";
