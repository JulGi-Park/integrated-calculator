import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { ParentalLeaveCalculator } from "@/components/calculators/ParentalLeaveCalculator";
import { ParentalLeaveContent } from "@/components/calculators/ParentalLeaveContent";
import {
  parentalLeaveBreadcrumbJsonLd,
  parentalLeaveFaqJsonLd,
  parentalLeaveWebApplicationJsonLd,
} from "@/components/calculators/parentalLeaveContentData";
import { isParentalLeaveCalculatorEnabled } from "@/lib/calculators/parental-leave/parentalLeaveVisibility";
import { PARENTAL_LEAVE_POLICY_2026 } from "@/lib/calculators/parental-leave/parentalLeave";

const title = "육아휴직급여 계산기 | 월 통상임금 기준 예상 급여 계산";
const description =
  "월 통상임금과 육아휴직 사용 개월 수로 일반 육아휴직급여의 월별 예상액, 총 예상 수령액, 상한·하한 적용 여부를 계산합니다.";

export function generateMetadata(): Metadata {
  if (!isParentalLeaveCalculatorEnabled()) {
    return {
      title: "404",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
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
}

export default function ParentalLeavePage() {
  if (!isParentalLeaveCalculatorEnabled()) {
    notFound();
  }

  const jsonLdItems = [
    parentalLeaveWebApplicationJsonLd,
    parentalLeaveBreadcrumbJsonLd,
    parentalLeaveFaqJsonLd,
  ];

  return (
    <section className="page-section">
      <JsonLdScripts items={jsonLdItems} />

      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">Parental leave benefit</p>
        <h1>육아휴직급여 계산기</h1>
        <p>
          월 통상임금과 육아휴직 사용 개월 수를 입력해 일반 육아휴직급여의
          월별 예상액과 총 예상 수령액을 확인합니다.
        </p>
        <div className="seller-margin-meta">
          <span>로컬 비공개 1차</span>
          <span>계산 기준일: {PARENTAL_LEAVE_POLICY_2026.basisDate}</span>
          <span>확정 지급액이 아닌 예상값입니다.</span>
        </div>
      </div>

      <ParentalLeaveCalculator />
      <ParentalLeaveContent />
    </section>
  );
}
