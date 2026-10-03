import { ApiError } from "../domain/errors";
import { hmacHash } from "./tokens";

export type AdminActor = { hash: string };

export const requireAdmin = async (env: Env, ctx: ExecutionContext): Promise<AdminActor> => {
  if (env.KNOWLEDGE_ADMIN_ENABLED !== "true") throw new ApiError(404, "NOT_FOUND", "요청 경로를 찾을 수 없습니다.");
  if (!ctx.access) throw new ApiError(401, "UNAUTHORIZED", "관리자 인증이 필요합니다.");
  const identity = await ctx.access.getIdentity();
  const stableSubject = identity?.user_uuid ?? identity?.email;
  if (!stableSubject) throw new ApiError(401, "UNAUTHORIZED", "관리자 인증 정보를 확인할 수 없습니다.");
  return { hash: await hmacHash(env.AUTHOR_TOKEN_PEPPER, "admin", stableSubject) };
};
