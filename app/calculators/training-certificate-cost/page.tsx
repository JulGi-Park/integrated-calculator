import { notFound } from "next/navigation";
import { TrainingCertificateCostCalculator } from "@/components/calculators/TrainingCertificateCostCalculator";

function isTrainingCertificateCostCalculatorEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_ENABLE_TRAINING_CERTIFICATE_COST_CALCULATOR ===
    "true"
  );
}

export default function TrainingCertificateCostPage() {
  if (!isTrainingCertificateCostCalculatorEnabled()) {
    notFound();
  }

  return (
    <section className="page-section">
      <div className="page-heading seller-margin-heading">
        <p className="page-heading__eyebrow">Training certificate cost</p>
        <h1>국비지원 자격증 취득비용 계산기</h1>
        <p>
          고용24에서 확인한 훈련비와 본인부담액에 시험·교재·교통비 등을
          더해 자격증 취득 예상비용을 계산합니다.
        </p>
        <div className="seller-margin-meta">
          <span>로컬 비공개 검수 중</span>
          <span>입력값 기준 예상 계산</span>
        </div>
      </div>

      <TrainingCertificateCostCalculator />
    </section>
  );
}
