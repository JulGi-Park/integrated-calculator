import type { KnowledgeGateEnv } from "./gates";

export type KnowledgeGateState = { publicEnabled: boolean; indexEnabled: boolean; curatedEnabled: boolean };
export function knowledgeGates(environment: "preview" | "production", env: KnowledgeGateEnv): KnowledgeGateState;
export function knowledgeBuildGates(env: KnowledgeGateEnv | Record<string, string | undefined>): KnowledgeGateState;
