import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { TrainingCertificateCostCalculator } from "@/components/calculators/TrainingCertificateCostCalculator";
import { TrainingCertificateCostContent } from "@/components/calculators/TrainingCertificateCostContent";
import {
  trainingCertificateCostBreadcrumbJsonLd,
  trainingCertificateCostFaqJsonLd,
  trainingCertificateCostSeo,
  trainingCertificateCostWebApplicationJsonLd,
} from "@/components/calculators/trainingCertificateCostContentData";

const fallbackOgImage = "https://gyesanbox.kr/og-default.png";

export const metadata: Metadata = {
  title: trainingCertificateCostSeo.title,
  description: trainingCertificateCostSeo.description,
  alternates: {
    canonical: trainingCertificateCostSeo.canonical,
  },
  openGraph: {
    title: trainingCertificateCostSeo.title,
    description: trainingCertificateCostSeo.description,
    url: trainingCertificateCostSeo.canonical,
    type: "website",
    images: [
      {
        url: fallbackOgImage,
        width: 1200,
        height: 630,
        alt: "계산박스 기본 공유 이미지",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: trainingCertificateCostSeo.title,
    description: trainingCertificateCostSeo.description,
    images: [fallbackOgImage],
  },
};

function isTrainingCertificateCostCalculatorEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_ENABLE_TRAINING_CERTIFICATE_COST_CALCULATOR ===
    "true"
  );
}

export default function TrainingCertificateCostPage() {
  if (!isTrainingCertificateCostCalculatorEnabled()) {
    notFound();
  }

  const jsonLdItems = [
    trainingCertificateCostWebApplicationJsonLd,
    trainingCertificateCostBreadcrumbJsonLd,
    trainingCertificateCostFaqJsonLd,
  ];

  return (
    <section className="page-section">
      <JsonLdScripts items={jsonLdItems} />

      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">Training certificate cost</p>
        <h1>국비지원 자격증 취득비용 계산기</h1>
        <p>
          국비지원 과정에서도 훈련비 본인부담 외에 시험 응시료, 교재비,
          실습·재료비와 교통비가 들 수 있습니다. 고용24에서 확인한 총
          훈련비와 본인부담액에 추가 비용을 더해 자격증 취득까지의 전체
          예상 부담액을 계산합니다.
        </p>
        <div className="seller-margin-meta">
          <span>로컬 비공개 검수 중</span>
          <span>입력값 기준 예상 계산</span>
          <span>정책 검토 기준일: 2026-08-12</span>
        </div>
      </div>

      <TrainingCertificateCostCalculator />
      <TrainingCertificateCostContent />
    </section>
  );
}
