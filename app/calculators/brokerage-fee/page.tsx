import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrokerageFeeCalculator } from "@/components/calculators/BrokerageFeeCalculator";
import { BrokerageFeeContent } from "@/components/calculators/BrokerageFeeContent";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import {
  brokerageFeeBreadcrumbJsonLd,
  brokerageFeeFaqJsonLd,
  brokerageFeePolicySummary,
  brokerageFeeWebApplicationJsonLd,
} from "@/lib/calculators/brokerage-fee/content";
import { isBrokerageFeeCalculatorEnabled } from "@/lib/calculators/brokerage-fee/visibility";

const title = "부동산 중개보수 계산기 | 복비·중개수수료 계산";
const description =
  "주택 매매, 전세, 월세 거래금액으로 부동산 중개보수 상한액, 부가세 포함 중개수수료, 협의요율 적용 금액과 월세 환산 거래금액을 계산합니다.";

export const metadata: Metadata = {
  title,
  description,
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title,
    description,
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function BrokerageFeePage() {
  if (!isBrokerageFeeCalculatorEnabled()) {
    notFound();
  }

  const jsonLdItems = [
    brokerageFeeWebApplicationJsonLd,
    brokerageFeeBreadcrumbJsonLd,
    brokerageFeeFaqJsonLd,
  ];

  return (
    <section className="page-section">
      <JsonLdScripts items={jsonLdItems} />

      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">Brokerage fee</p>
        <h1>부동산 중개보수 계산기</h1>
        <p>
          주택 매매·교환, 전세, 월세 거래금액을 입력해 중개보수 상한액과
          부가세 포함 예상 금액, 협의요율 적용 금액을 계산합니다.
        </p>
        <div className="seller-margin-meta">
          <span>로컬 비공개 계산기</span>
          <span>기준일: {brokerageFeePolicySummary.verifiedAt}</span>
          <span>결과는 확정 청구액이 아닌 참고 계산입니다.</span>
        </div>
      </div>

      <BrokerageFeeCalculator />
      <BrokerageFeeContent />

      <nav className="link-row seller-margin-links" aria-label="페이지 이동">
        <Link className="text-link" href="/calculators">
          ← 계산기 목록
        </Link>
        <Link className="text-link" href="/">
          홈으로
        </Link>
      </nav>
    </section>
  );
}
