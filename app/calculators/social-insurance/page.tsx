import type { Metadata } from "next";
import Link from "next/link";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { SocialInsuranceCalculator } from "@/components/calculators/SocialInsuranceCalculator";
import { SocialInsuranceContent } from "@/components/calculators/SocialInsuranceContent";
import { CalculatorHeroImage } from "@/components/common/CalculatorHeroImage";
import {
  socialInsuranceBreadcrumbJsonLd,
  socialInsuranceFaqJsonLd,
  socialInsuranceWebApplicationJsonLd,
} from "@/components/calculators/socialInsuranceContentData";
import { SOCIAL_INSURANCE_POLICY_2026 } from "@/lib/calculators/social-insurance/constants";
import { PUBLIC_CALCULATOR_SEO } from "@/lib/seo/publicCalculatorSeo";

const seo = PUBLIC_CALCULATOR_SEO["social-insurance"];
const { title, description } = seo;
const ogTitle = "4대보험 계산기 2026 - 국민연금·건강보험·고용보험 공제액 계산";
const canonical = "https://gyesanbox.kr/calculators/social-insurance/";
const ogImage = seo.image;

export const metadata: Metadata = {
  title,
  description,
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical,
  },
  openGraph: {
    title: ogTitle,
    description,
    url: canonical,
    type: "website",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: ogTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: ogTitle,
    description,
    images: [ogImage],
  },
};

function formatKoreanDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

export default function SocialInsurancePage() {
  const jsonLdItems = [
    { ...socialInsuranceWebApplicationJsonLd, image: ogImage },
    socialInsuranceBreadcrumbJsonLd,
    socialInsuranceFaqJsonLd,
  ];

  return (
    <section className="page-section salary-page">
      <JsonLdScripts items={jsonLdItems} />

      <CalculatorHeroImage src={seo.imagePath} alt={seo.imageAlt} />

      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">Social insurance</p>
        <h1>2026 4대보험 계산기</h1>
        <p>
          월 급여와 비과세 금액을 입력해 국민연금, 건강보험,
          장기요양보험, 고용보험의 근로자 부담 공제액을 계산합니다.
        </p>
        <div className="seller-margin-meta">
          <span>기준 확인일: {formatKoreanDate(SOCIAL_INSURANCE_POLICY_2026.verifiedAt)}</span>
          <span>산재보험은 자동 계산에서 제외됩니다.</span>
          <span>소득세와 지방소득세는 포함하지 않습니다.</span>
        </div>
      </div>

      <SocialInsuranceCalculator />
      <SocialInsuranceContent />

      <nav className="link-row seller-margin-links" aria-label="페이지 이동">
        <a className="text-link" href="/calculators/">
          ← 계산기 목록
        </a>
        <Link className="text-link" href="/">
          홈으로
        </Link>
      </nav>
    </section>
  );
}
