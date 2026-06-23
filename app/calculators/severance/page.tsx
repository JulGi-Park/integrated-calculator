import Link from "next/link";
import { SeveranceCalculator } from "@/components/calculators/SeveranceCalculator";
import { SEVERANCE_POLICY_2026 } from "@/lib/calculators/severance/policy";

function formatKoreanDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

export default function SeverancePage() {
  return (
    <section className="page-section">
      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">Severance pay</p>
        <h1>퇴직금 계산기</h1>
        <p>
          입사일과 퇴직 전 임금 정보를 입력해 법정 퇴직금의 예상 금액과
          평균임금 산정 내역을 확인할 수 있습니다.
        </p>
        <div className="seller-margin-meta">
          <span>정적 계산 UI</span>
          <span>
            기준 확인일: {formatKoreanDate(SEVERANCE_POLICY_2026.verifiedAt)}
          </span>
          <span>계산 결과는 예상 금액이며 실제 지급액과 다를 수 있습니다.</span>
        </div>
      </div>

      <SeveranceCalculator />

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
