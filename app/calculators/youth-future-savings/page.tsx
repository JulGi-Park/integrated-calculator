import type { Metadata } from "next";
import Link from "next/link";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { YouthFutureSavingsCalculator } from "@/components/calculators/YouthFutureSavingsCalculator";
import { YouthFutureSavingsContent } from "@/components/calculators/YouthFutureSavingsContent";
import {
  youthFutureSavingsBreadcrumbJsonLd,
  youthFutureSavingsFaqJsonLd,
  youthFutureSavingsPolicySummary,
  youthFutureSavingsWebApplicationJsonLd,
} from "@/components/calculators/youthFutureSavingsContentData";

const title =
  "청년미래적금 계산기 - 만기수령액·정부기여금·비과세 예상액";
const description =
  "월 납입액, 가입 기간, 연 이자율, 정부기여금 방식과 과세 여부를 입력해 청년미래적금 예상 만기수령액과 비과세 절감액을 계산합니다.";
const ogUrl = "https://gyesanbox.kr/calculators/youth-future-savings/";
const ogImage = "https://gyesanbox.kr/og/default.png";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: ogUrl,
  },
  openGraph: {
    title,
    description,
    url: ogUrl,
    type: "website",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "청년미래적금 계산기",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
};

export default function YouthFutureSavingsPage() {
  const jsonLdItems = [
    youthFutureSavingsWebApplicationJsonLd,
    youthFutureSavingsBreadcrumbJsonLd,
    youthFutureSavingsFaqJsonLd,
  ];

  return (
    <section className="page-section">
      <JsonLdScripts items={jsonLdItems} />

      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">Youth future savings</p>
        <h1>청년미래적금 계산기</h1>
        <p>
          월 납입액과 금리, 정부기여금 방식을 입력해 예상 만기수령액,
          정부기여금과 비과세 절감액을 확인합니다.
        </p>
        <div className="seller-margin-meta">
          <span>계산 기준일: {youthFutureSavingsPolicySummary.verifiedAt}</span>
          <span>기본 기간: {youthFutureSavingsPolicySummary.defaultTerm}</span>
          <span>월 납입 한도: {youthFutureSavingsPolicySummary.monthlyLimit}</span>
        </div>
      </div>

      <YouthFutureSavingsCalculator />
      <YouthFutureSavingsContent />

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
