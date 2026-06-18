import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "온라인 판매자 마진·순이익 계산기",
  description: "온라인 판매 비용과 수익을 정리하기 위한 계산기입니다.",
};

export default function SellerMarginPage() {
  return (
    <section className="status-page">
      <div className="status-page__icon" aria-hidden="true">
        %
      </div>
      <p className="page-heading__eyebrow">Seller margin</p>
      <h1>온라인 판매자<br />마진·순이익 계산기</h1>
      <p className="status-page__description">
        판매가와 각종 비용을 바탕으로 마진과 순이익을 확인하는 계산기입니다.
      </p>
      <div className="status-badge">
        <span aria-hidden="true" />
        계산 기능 준비 중
      </div>
      <div className="link-row" aria-label="페이지 이동">
        <Link className="text-link" href="/calculators">
          ← 계산기 목록
        </Link>
        <Link className="text-link" href="/">
          홈으로
        </Link>
      </div>
    </section>
  );
}
