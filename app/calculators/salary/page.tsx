import Link from "next/link";
import { SalaryTakeHomeCalculator } from "@/components/calculators/SalaryTakeHomeCalculator";
import { SALARY_TAKE_HOME_POLICY_2026 } from "@/lib/calculators/salary-take-home/policy";

function formatKoreanDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

export default function SalaryTakeHomePage() {
  return (
    <section className="page-section salary-page">
      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">Salary take-home</p>
        <h1>
          연봉·월급
          <br />
          실수령액 계산기
        </h1>
        <p>
          연봉과 비과세액, 공제대상 가족 수를 입력해 월·연간 예상
          실수령액과 공제 내역을 확인할 수 있습니다.
        </p>
        <div className="seller-margin-meta">
          <span>
            기준 확인일:{" "}
            {formatKoreanDate(SALARY_TAKE_HOME_POLICY_2026.verifiedAt)}
          </span>
          <span>
            퇴직금과 비정기 상여를 제외한 일반 근로자의 예상값입니다.
          </span>
        </div>
      </div>

      <SalaryTakeHomeCalculator />

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
