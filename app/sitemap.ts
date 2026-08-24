import type { MetadataRoute } from "next";
import { INDEXABLE_PATHS } from "@/lib/site/publicRoutes";
const baseUrl = "https://gyesanbox.kr";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXABLE_PATHS.map((route) => ({
    url: route === "/" ? `${baseUrl}/` : `${baseUrl}${route}`,
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.8,
  }));
}
