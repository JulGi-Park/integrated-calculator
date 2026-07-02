import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CarCostCalculator } from "@/components/calculators/CarCostCalculator";

const title =
  "자동차 유지비 계산기 | 월 유지비·연 유지비·1km당 비용 계산";
const description =
  "월 주행거리, 연비, 유류 단가, 보험료, 자동차세, 정비비를 입력해 자동차 월 유지비와 연 유지비, 1km당 비용을 계산해 보세요.";

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

  return (
    <section className="page-section">
      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">Private local calculator</p>
        <h1>자동차 유지비 계산기</h1>
        <p>
          월 주행거리, 연비, 유류 단가, 보험료, 자동차세, 정비비 등을
          입력해 월간·연간 자동차 유지비와 1km당 비용을 계산합니다.
        </p>
        <div className="seller-margin-meta">
          <span>1차 로컬 비공개</span>
          <span>계산 기준일: 2026-07-02</span>
          <span>전기차, 리스·렌트 견적, 세금 자동 계산은 포함하지 않습니다.</span>
        </div>
      </div>

      <CarCostCalculator />

      {/*
        2차 공개 검토용 섹션 메모:
        제목, 한 줄 설명, 기준일, 입력 영역, 결과 요약, 상세 계산 내역,
        고정비와 변동비 설명, 운행 유지비와 총 부담 차이, 할부금·감가상각
        포함 여부, 1km당 비용, 계산 예시, 적용되지 않는 예외, FAQ,
        참고 기준, 면책 문구, SEO 메타데이터, 구조화된 데이터, 관련 계산기.
      */}
    </section>
  );
}
