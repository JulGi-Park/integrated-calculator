import {
  calculateRentVsJeonse,
  getDefaultRentVsJeonseInput,
  RENT_VS_JEONSE_LEGAL_REFERENCE,
} from "@/lib/calculators/rent-vs-jeonse/rent-vs-jeonse";

function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

function getCheaperLabel(option: string): string {
  if (option === "jeonse") {
    return "전세 예상 총비용이 더 낮습니다";
  }

  if (option === "monthlyRent") {
    return "월세 예상 총비용이 더 낮습니다";
  }

  return "전세와 월세 총비용이 거의 같습니다";
}

export function RentVsJeonseCalculator() {
  const input = getDefaultRentVsJeonseInput();
  const response = calculateRentVsJeonse(input);

  if (!response.success) {
    return null;
  }

  const result = response.data;

  return (
    <section className="calculator-card" aria-labelledby="rent-vs-jeonse-result-title">
      <div className="calculator-card__header">
        <p className="calculator-card__eyebrow">Local preview</p>
        <h2 id="rent-vs-jeonse-result-title">계산 엔진 확인용 예시</h2>
        <p>
          전세대출 이자, 월세, 보증금 차이, 관리비, 기회비용을 기준으로
          전세와 월세의 월 부담과 총비용을 비교합니다.
        </p>
      </div>

      <div className="result-grid">
        <article className="result-card">
          <h3>전세 월 환산 부담</h3>
          <strong>{formatWon(result.jeonseMonthlyBurden)}</strong>
          <p>전체 기간 총비용 {formatWon(result.jeonseTotalCost)}</p>
        </article>
        <article className="result-card">
          <h3>월세 월 부담</h3>
          <strong>{formatWon(result.monthlyRentBurden)}</strong>
          <p>전체 기간 총비용 {formatWon(result.monthlyRentTotalCost)}</p>
        </article>
        <article className="result-card">
          <h3>비교 결과</h3>
          <strong>{getCheaperLabel(result.cheaperOption)}</strong>
          <p>총비용 차이 {formatWon(result.totalCostDifference)}</p>
        </article>
      </div>

      <dl className="summary-list">
        <div>
          <dt>전세대출 월 이자</dt>
          <dd>{formatWon(result.jeonseMonthlyInterestCost)}</dd>
        </div>
        <div>
          <dt>전세 자기자본 기회비용</dt>
          <dd>{formatWon(result.jeonseEquityMonthlyOpportunityCost)}</dd>
        </div>
        <div>
          <dt>월세 보증금 기회비용</dt>
          <dd>{formatWon(result.monthlyRentDepositMonthlyOpportunityCost)}</dd>
        </div>
        <div>
          <dt>보증금 차이 월세 환산 참고값</dt>
          <dd>{formatWon(result.depositDifferenceMonthlyRentEquivalent)}</dd>
        </div>
        <div>
          <dt>법정 전월세전환율 참고값</dt>
          <dd>{result.legalReferenceRate.toFixed(2)}%</dd>
        </div>
      </dl>

      <p className="helper-text">
        {RENT_VS_JEONSE_LEGAL_REFERENCE.notice} {result.disclaimer}
      </p>
    </section>
  );
}
