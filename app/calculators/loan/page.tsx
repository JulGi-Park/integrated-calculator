import Link from "next/link";
import { LoanInterestCalculator } from "@/components/calculators/LoanInterestCalculator";

export default function LoanInterestPage() {
  return (
    <section className="page-section">
      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">Loan repayment</p>
        <h1>대출이자 계산기</h1>
        <p>
          대출금액, 연이율과 기간을 입력해 원리금균등·원금균등·
          만기일시상환의 예상 비용과 월별 일정을 비교합니다.
        </p>
        <div className="seller-margin-meta">
          <span>원 단위 예상 계산</span>
          <span>
            입력 한도는 계산 안전을 위한 서비스 제한이며 실제 대출 가능
            범위를 뜻하지 않습니다.
          </span>
        </div>
      </div>

      <LoanInterestCalculator />

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
