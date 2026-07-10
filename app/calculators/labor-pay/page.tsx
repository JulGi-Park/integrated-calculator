import type { Metadata } from "next";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { LaborPayCalculator } from "@/components/calculators/LaborPayCalculator";
import { LaborPayContent } from "@/components/calculators/LaborPayContent";
import {
  laborPayBaseDate,
  laborPayBreadcrumbJsonLd,
  laborPayFaqJsonLd,
  laborPayWebApplicationJsonLd,
} from "@/components/calculators/laborPayContentData";

const canonical = "https://gyesanbox.kr/calculators/labor-pay/";
const ogTitle = "주휴수당 계산기 2026 - 알바 주휴수당과 주급 계산";
const ogDescription =
  "2026년 최저임금과 근로기준법 기준을 참고해 시급제·단시간 근로자의 예상 주휴시간, 주휴수당, 주휴 포함 주급을 계산합니다.";
const ogImage = "https://gyesanbox.kr/og/calculators.png";

export const metadata: Metadata = {
  title: "주휴수당 계산기 2026 - 알바 주휴수당과 주급 계산 | 계산박스",
  description:
    "2026년 최저임금과 근로기준법 기준을 참고해 시급제·단시간 근로자의 예상 주휴시간, 주휴수당, 주휴 포함 주급을 계산합니다.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical,
  },
  openGraph: {
    title: ogTitle,
    description: ogDescription,
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
    description: ogDescription,
    images: [ogImage],
  },
};

export default function LaborPayPage() {
  const jsonLdItems = [
    laborPayWebApplicationJsonLd,
    laborPayBreadcrumbJsonLd,
    laborPayFaqJsonLd,
  ];

  return (
    <section className="page-section labor-pay-page">
      <style>
        {`
          @media (max-width: 560px) {
            body:has(.labor-pay-page) .site-header__inner {
              align-items: flex-start;
              flex-direction: column;
              gap: 8px;
              padding-block: 14px;
            }

            body:has(.labor-pay-page) .site-header nav {
              justify-content: flex-start;
            }

            .labor-pay-page,
            .labor-pay-heading,
            .labor-pay-heading p,
            .labor-pay-heading span {
              min-width: 0;
              overflow-wrap: anywhere;
              word-break: break-all;
            }

            .labor-pay-page * {
              overflow-wrap: anywhere;
              word-break: break-all;
            }

            .labor-pay-heading .seller-margin-meta {
              display: grid;
              gap: 6px;
            }
          }
        `}
      </style>
      <JsonLdScripts items={jsonLdItems} />

      <div className="page-heading labor-pay-heading">
        <p className="page-heading__eyebrow">Labor pay</p>
        <h1>주휴수당 계산기</h1>
        <p>
          근무시간, 시급, 개근 여부를 입력해 예상 주휴수당과 주휴 포함
          주급을 계산하는 계산기입니다.
        </p>
        <div className="seller-margin-meta">
          <span>계산 기준일: {laborPayBaseDate}</span>
          <span>
            계산 결과는 입력값 기준 참고용이며 실제 임금 판단과 다를 수
            있습니다.
          </span>
        </div>
      </div>

      <LaborPayCalculator />
      <LaborPayContent />
    </section>
  );
}
