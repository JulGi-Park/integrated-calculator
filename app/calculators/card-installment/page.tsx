import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CardInstallmentCalculator } from "@/components/calculators/CardInstallmentCalculator";
import {
  CardInstallmentContent,
  cardInstallmentFaqs,
} from "@/components/calculators/CardInstallmentContent";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";

const title = "카드 할부 계산기 | 월별 수수료·총 납부액 계산";
const description =
  "구매금액, 할부 개월 수, 연 할부 수수료율을 입력해 월별 수수료, 월 납부액, 총 수수료와 총 납부액을 추정합니다.";

export const metadata: Metadata = {
  title,
  description,
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "https://gyesanbox.kr/calculators/card-installment/",
  },
  openGraph: {
    title,
    description,
    url: "https://gyesanbox.kr/calculators/card-installment/",
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

function isCardInstallmentCalculatorEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_CARD_INSTALLMENT_CALCULATOR === "true";
}

export default function CardInstallmentPage() {
  if (!isCardInstallmentCalculatorEnabled()) {
    notFound();
  }

  const jsonLdItems = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "카드 할부 계산기",
      url: "https://gyesanbox.kr/calculators/card-installment/",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      description,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "KRW",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "홈",
          item: "https://gyesanbox.kr/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "계산기 목록",
          item: "https://gyesanbox.kr/calculators/",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "카드 할부 계산기",
          item: "https://gyesanbox.kr/calculators/card-installment/",
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: cardInstallmentFaqs.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: {
            "@type": "Answer",
            text: answer,
          },
        })),
    },
  ];

  return (
    <section className="page-section">
      <JsonLdScripts items={jsonLdItems} />

      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">Card installment</p>
        <h1>카드 할부 계산기</h1>
        <p>
          구매금액, 할부 개월 수, 연 할부 수수료율을 입력해 월별 수수료와
          총 납부액을 추정합니다.
        </p>
        <div className="seller-margin-meta">
          <span>로컬 비공개 검수 중</span>
          <span>계산 기준일: 2026년 7월 5일</span>
          <span>확정 청구금액이 아닌 입력값 기준 예상 계산</span>
        </div>
      </div>

      <CardInstallmentCalculator />
      <CardInstallmentContent />

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
