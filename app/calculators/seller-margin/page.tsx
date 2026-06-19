import type { Metadata } from "next";
import Link from "next/link";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { SellerMarginCalculator } from "@/components/calculators/SellerMarginCalculator";
import { SellerMarginContent } from "@/components/calculators/SellerMarginContent";
import {
  sellerMarginBreadcrumbJsonLd,
  sellerMarginFaqJsonLd,
  sellerMarginWebApplicationJsonLd,
} from "@/components/calculators/sellerMarginContentData";

export const metadata: Metadata = {
  title: "온라인 판매자 마진·순이익 계산기 | 수수료·원가 계산",
  description:
    "판매단가, 수량, 개당 원가, 할인, 배송비, 플랫폼·결제 수수료와 광고비를 입력해 예상 정산금액과 세전 순이익을 계산합니다.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "온라인 판매자 마진·순이익 계산기 | 수수료·원가 계산",
    description:
      "판매단가, 수량, 개당 원가, 할인, 배송비, 플랫폼·결제 수수료와 광고비를 입력해 예상 정산금액과 세전 순이익을 계산합니다.",
    type: "website",
  },
};

export default function SellerMarginPage() {
  const jsonLdItems = [
    sellerMarginWebApplicationJsonLd,
    sellerMarginBreadcrumbJsonLd,
    sellerMarginFaqJsonLd,
  ];

  return (
    <section className="page-section seller-margin-page">
      <JsonLdScripts items={jsonLdItems} />

      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">Seller margin</p>
        <h1>온라인 판매자<br />마진·순이익 계산기</h1>
        <p>
          판매단가, 수량, 원가, 수수료와 비용을 입력해 주문 기준 예상
          정산금액과 순이익을 계산할 수 있습니다.
        </p>
        <div className="seller-margin-meta">
          <span>계산 기준일: 2026년 6월 18일</span>
          <span>
            계산 결과는 입력값을 기준으로 산출한 세전 예상값이며 실제 플랫폼
            정산액과 다를 수 있습니다.
          </span>
        </div>
      </div>

      <SellerMarginCalculator />
      <SellerMarginContent />

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
