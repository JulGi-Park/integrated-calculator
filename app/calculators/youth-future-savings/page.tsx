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
  "2026 청년미래적금 계산기 | 정부기여금·만기 예상금액";
const description =
  "월 납입액과 예상 금리를 입력해 3년 만기 예상액을 계산합니다. 월 최대 50만원과 일반형 6%·우대형 12% 기여금은 참고 기준이며, 가입 자격은 판정하지 않습니다.";
const ogUrl = "https://gyesanbox.kr/calculators/youth-future-savings/";
const ogImage = "https://gyesanbox.kr/og/youth-future-savings.png";

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
          월 납입액과 예상 금리, 정부기여금 참고 유형을 입력해 원금·예상 이자·정부기여금과
          예상 만기금액을 확인합니다. 실제 금리와 가입 자격은 금융기관 심사 기준을 따릅니다.
        </p>
        <div className="seller-margin-meta">
          <span>계산 기준일: {youthFutureSavingsPolicySummary.verifiedAt}</span>
          <span>기본 기간: {youthFutureSavingsPolicySummary.defaultTerm}</span>
          <span>월 납입 한도: {youthFutureSavingsPolicySummary.monthlyLimit}</span>
          <span>이자소득: 비과세 안내</span>
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
        <Link className="text-link" href="/calculators/savings/">
          예금·적금 이자 계산기
        </Link>
        <Link className="text-link" href="/calculators/salary/">
          연봉 실수령액 계산기
        </Link>
      </nav>
    </section>
  );
}
