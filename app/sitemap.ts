import type { MetadataRoute } from "next";
import {
  isTrainingCertificateCostCalculatorEnabled,
  TRAINING_CERTIFICATE_COST_PUBLICATION,
} from "@/lib/calculators/training-certificate-cost/publication";

const baseUrl = "https://gyesanbox.kr";

export const dynamic = "force-static";

const publicCalculatorRoutes = [
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
  "/calculators/parental-leave/",
  "/calculators/rent-vs-jeonse/",
  "/calculators/roas/",
  "/calculators/savings/",
  "/calculators/average-price/",
  "/calculators/card-installment/",
  "/calculators/brokerage-fee/",
  "/calculators/car-cost/",
  "/calculators/overtime-pay/",
  "/calculators/youth-future-savings/",
  "/calculators/dsr/",
  "/calculators/work-child-incentive/",
] as const;

const policyRoutes = [
  "/about/",
  "/methodology/",
  "/updates/",
  "/contact/",
  "/privacy-policy/",
  "/terms/",
  "/disclaimer/",
] as const;

const routes = [
  ...publicCalculatorRoutes,
  ...(isTrainingCertificateCostCalculatorEnabled()
    ? [TRAINING_CERTIFICATE_COST_PUBLICATION.path]
    : []),
  ...policyRoutes,
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: route === "/" ? `${baseUrl}/` : `${baseUrl}${route}`,
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.8,
  }));
}
