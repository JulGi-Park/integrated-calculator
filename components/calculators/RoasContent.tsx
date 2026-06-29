import {
  roasExampleInput,
  roasExampleResult,
  roasExclusions,
  roasFaqs,
  roasFormulas,
  roasInterpretations,
} from "./roasContentData";
import styles from "./SellerMarginContent.module.css";

export function RoasContent() {
  return (
    <div className={styles.content}>
      <section className={styles.section} aria-labelledby="roas-standard-title">
        <div className={styles.sectionHeading}>
          <h2 id="roas-standard-title">계산 기준 설명</h2>
          <p>
            ROAS는 광고비 대비 광고 매출을 보는 지표입니다. ROAS가 높아도
            상품 원가, 배송비, 포장비, 수수료, 할인, 환불 등을 반영하면 실제
            순이익은 달라질 수 있습니다.
          </p>
          <p>
            이 계산기는 광고 매출, 광고비, 상품 원가, 기타 비용을 기준으로
            광고 후 순이익과 손익분기 ROAS를 함께 보여줍니다.
          </p>
        </div>
        <div className={styles.interpretationGrid}>
          {roasInterpretations.slice(0, 3).map((item) => (
            <article className={styles.infoCard} key={item}>
              <h3>해석 기준</h3>
              <p>{item}</p>
            </article>
          ))}
        </div>
        <p className={styles.roundingNote}>{roasInterpretations.slice(3).join(" ")}</p>
      </section>

      <section className={styles.section} aria-labelledby="roas-formula-title">
        <div className={styles.sectionHeading}>
          <h2 id="roas-formula-title">상세 계산 내역</h2>
          <p>
            금액은 원 단위, 비율은 소수점 둘째 자리까지 표시합니다. 광고
            매출이 0원이면 광고비 비중, 공헌이익률과 손익분기 ROAS는 계산
            불가로 안내합니다.
          </p>
        </div>
        <dl className={styles.formulaList}>
          {roasFormulas.map(({ title, formula }) => (
            <div key={title}>
              <dt>{title}</dt>
              <dd>{formula}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="roas-example-title">
        <div className={styles.sectionHeading}>
          <h2 id="roas-example-title">계산 예시</h2>
          <p>광고비 100,000원과 광고 매출 500,000원을 기준으로 한 예시입니다.</p>
        </div>
        <div className={styles.exampleGrid}>
          <article className={styles.exampleCard}>
            <h3>예시 입력</h3>
            <dl>
              {roasExampleInput.map(({ label, value }) => (
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
              {roasExampleResult.map(({ label, value }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="roas-exclusion-title">
        <div className={styles.sectionHeading}>
          <h2 id="roas-exclusion-title">적용되지 않는 예외</h2>
          <p>아래 항목은 계산기가 자동으로 확인하거나 반영하지 않습니다.</p>
        </div>
        <ul className={styles.exclusionList}>
          {roasExclusions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="roas-faq-title">
        <div className={styles.sectionHeading}>
          <h2 id="roas-faq-title">자주 묻는 질문</h2>
        </div>
        <div className={styles.faqList}>
          {roasFaqs.map(({ question, answer }) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <aside className={styles.disclaimer} aria-label="계산 결과 안내">
        이 계산기는 입력값을 기준으로 한 단순 예상 계산 도구입니다. 실제 광고
        성과, 정산 금액, 세금, 수수료, 환불, 취소, 광고 플랫폼 집계 방식에
        따라 결과가 달라질 수 있습니다. 중요한 의사결정 전에는 광고 플랫폼
        보고서와 실제 정산 자료를 함께 확인해야 합니다.
      </aside>
    </div>
  );
}
