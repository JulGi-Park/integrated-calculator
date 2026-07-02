import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CarCostContent } from "@/components/calculators/CarCostContent";
import {
  carCostBreadcrumbJsonLd,
  carCostFaqJsonLd,
  carCostWebApplicationJsonLd,
} from "@/components/calculators/carCostContentData";
import { CarCostCalculator } from "@/components/calculators/CarCostCalculator";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";

const title = "자동차 유지비 계산기";
const description =
  "유류비, 보험료, 자동차세, 주차비, 정비비 등을 입력해 월간·연간 자동차 유지비와 1km당 비용을 계산합니다.";

export const metadata: Metadata = {
  title,
  description,
  robots: {
    index: false,
    follow: false,
  },
};

function isCarCostCalculatorEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_CAR_COST_CALCULATOR === "true";
}

export default function CarCostPage() {
  if (!isCarCostCalculatorEnabled()) {
    notFound();
  }

  const jsonLdItems = [
    carCostWebApplicationJsonLd,
    carCostBreadcrumbJsonLd,
    carCostFaqJsonLd,
  ];

  return (
    <section className="page-section">
      <JsonLdScripts items={jsonLdItems} />

      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">Private local calculator</p>
        <h1>자동차 유지비 계산기</h1>
        <p>
          월 주행거리, 연비, 유류 단가, 보험료, 자동차세, 정비비 등을 입력해
          자동차 한달 유지비와 연간 환산 비용, 1km당 유류비를 계산합니다.
        </p>
        <div className="seller-margin-meta">
          <span>2차 로컬 비공개</span>
          <span>계산 기준일: 2026-07-02</span>
          <span>차량 유지비 계산용 참고 결과이며 실제 견적이 아닙니다.</span>
        </div>
      </div>

      <CarCostCalculator />
      <CarCostContent />
    </section>
  );
}
