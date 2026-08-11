import type { Metadata } from "next";
import { SavingsCalculator } from "@/components/calculators/SavingsCalculator";
import { SavingsContent } from "@/components/calculators/SavingsContent";
import {
  savingsBreadcrumbJsonLd,
  savingsFaqJsonLd,
  savingsWebApplicationJsonLd,
} from "@/components/calculators/savingsContentData";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";

const title = "예금·적금 이자 계산기 | 세후 이자·만기 수령액 계산";
const description =
  "예금과 적금의 세전 이자, 세후 이자, 세금, 만기 수령액을 입력값 기준으로 계산합니다.";
const ogUrl = "https://gyesanbox.kr/calculators/savings/";
const ogImage = "https://gyesanbox.kr/og/savings.png";

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
    images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
};

export default function SavingsPage() {
  const jsonLdItems = [
    savingsWebApplicationJsonLd,
    savingsBreadcrumbJsonLd,
    savingsFaqJsonLd,
  ];

  return (
    <section className="page-section">
      <JsonLdScripts items={jsonLdItems} />

      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">Savings</p>
        <h1>예금 적금 계산기</h1>
        <p>
          예금 이자 계산과 정기적금 이자 계산을 나누어 세전 이자, 이자소득세,
          지방소득세, 세후 이자, 만기 수령액을 확인합니다.
        </p>
        <div className="seller-margin-meta">
          <span>계산 기준일: 2026-08-09</span>
          <span>입력값 기준의 참고 계산이며 금융상품 추천이 아닙니다.</span>
        </div>
      </div>

      <SavingsCalculator />
      <SavingsContent />
    </section>
  );
}
