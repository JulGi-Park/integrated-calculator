import {
  averagePriceExampleInput,
  averagePriceExampleResult,
  averagePriceExclusions,
  averagePriceFaqs,
  averagePriceFormulas,
} from "@/lib/calculators/average-price/content";
import styles from "./SellerMarginContent.module.css";

export function AveragePriceContent() {
  return (
    <div className={styles.content}>
      <section className={styles.section} aria-labelledby="interpretation-title">
        <div className={styles.sectionHeading}>
          <h2 id="interpretation-title">결과를 이렇게 해석하세요</h2>
          <p>
            결과는 입력값으로 평균단가와 예상 손익을 설명하는 계산값입니다.
            추가 매수 여부나 매도 판단을 제안하지 않습니다.
          </p>
        </div>
        <div className={styles.interpretationGrid}>
          <article className={styles.infoCard}>
            <h3>신규 평균 단가</h3>
            <p>기존 보유분과 추가 매수분을 합산한 뒤 다시 나눈 단가입니다.</p>
          </article>
          <article className={styles.infoCard}>
            <h3>총 투자금액</h3>
            <p>현재까지 투입한 금액과 추가 매수 금액을 더한 값입니다.</p>
          </article>
          <article className={styles.infoCard}>
            <h3>예상 손익</h3>
            <p>현재가 또는 목표 매도가를 입력했을 때만 산출되는 단순 차액입니다.</p>
          </article>
        </div>
        <p className={styles.roundingNote}>
          수수료, 세금, 환율 등은 반영하지 않은 단순 계산값입니다. 실제 계좌
          손익은 체결 가격과 거래 조건에 따라 달라질 수 있습니다.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="formula-title">
        <div className={styles.sectionHeading}>
          <h2 id="formula-title">계산 기준과 계산식</h2>
          <p>
            모든 단가는 원화 기준으로 입력합니다. 수량은 주식·코인·해외주식에
            맞게 소수 입력을 허용합니다.
          </p>
        </div>
        <dl className={styles.formulaList}>
          {averagePriceFormulas.map(({ title, formula }) => (
            <div key={title}>
              <dt>{title}</dt>
              <dd>{formula}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="example-title">
        <div className={styles.sectionHeading}>
          <h2 id="example-title">계산 예시</h2>
          <p>아래 예시는 평균단가와 예상 손익 계산 흐름을 보여주는 고정 사례입니다.</p>
        </div>
        <div className={styles.exampleGrid}>
          <article className={styles.exampleCard}>
            <h3>예시 입력</h3>
            <dl>
              {averagePriceExampleInput.map(({ label, value }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </article>
          <article className={styles.exampleCard}>
            <h3>예시 결과</h3>
            <dl>
              {averagePriceExampleResult.map(({ label, value }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="exclusion-title">
        <div className={styles.sectionHeading}>
          <h2 id="exclusion-title">자동 반영되지 않는 항목</h2>
          <p>아래 항목은 1차 계산 범위에 포함하지 않습니다.</p>
        </div>
        <ul className={styles.exclusionList}>
          {averagePriceExclusions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="faq-title">
        <div className={styles.sectionHeading}>
          <h2 id="faq-title">자주 묻는 질문</h2>
        </div>
        <div className={styles.faqList}>
          {averagePriceFaqs.map(({ question, answer }) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <aside className={styles.disclaimer} aria-label="계산 결과 안내">
        이 계산기는 투자 권유 도구가 아니라 입력값을 바탕으로 평균단가와 예상
        손익을 계산하는 도구입니다. 결과는 수수료, 세금, 환율 등을 반영하지
        않은 단순 계산값이며 실제 거래 결과를 보장하지 않습니다.
      </aside>
    </div>
  );
}
