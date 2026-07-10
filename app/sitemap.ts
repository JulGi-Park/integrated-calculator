import type { MetadataRoute } from "next";

const baseUrl = "https://gyesanbox.kr";

export const dynamic = "force-static";

const routes = [
  "/",
  "/calculators/",
  "/calculators/seller-margin/",
  "/calculators/vat-profit/",
  "/calculators/salary/",
  "/calculators/social-insurance/",
  "/calculators/labor-pay/",
  "/calculators/loan/",
  "/calculators/severance/",
  "/calculators/unemployment/",
  "/about/",
  "/contact/",
  "/privacy-policy/",
  "/terms/",
  "/disclaimer/",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: route === "/" ? `${baseUrl}/` : `${baseUrl}${route}`,
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.8,
  }));
}
