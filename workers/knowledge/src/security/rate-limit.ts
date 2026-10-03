import { ApiError } from "../domain/errors";

type Limiter = { limit: (options: { key: string }) => Promise<{ success: boolean }> };

export const enforceRateLimit = async (limiter: Limiter, key: string): Promise<void> => {
  const result = await limiter.limit({ key });
  if (!result.success) throw new ApiError(429, "RATE_LIMITED", "잠시 후 다시 시도해 주세요.");
};
