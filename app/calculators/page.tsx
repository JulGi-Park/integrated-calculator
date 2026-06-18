import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "전체 계산기 목록",
  description: "현재 이용할 수 있는 통합 계산기 목록을 확인하세요.",
};

export default function CalculatorsPage() {
  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="page-heading__eyebrow">Calculators</p>
        <h1>계산기 목록</h1>
        <p>필요한 계산기를 선택해 시작하세요.</p>
      </div>

      <div className="calculator-grid" role="list">
        <Link
          className="calculator-card"
          href="/calculators/seller-margin"
          role="listitem"
        >
          <div>
            <span className="calculator-card__category">사업</span>
            <h2>온라인 판매자 마진·순이익 계산기</h2>
            <p>판매 비용을 바탕으로 마진과 순이익을 확인하는 계산기입니다.</p>
          </div>
          <span className="calculator-card__arrow" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
