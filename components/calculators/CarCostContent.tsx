import {
  carCostCalculationCriteria,
  carCostExampleInputItems,
  carCostExampleResultItems,
  carCostExclusions,
  carCostFaqs,
  carCostInterpretationCards,
  carCostInterpretationNotes,
  carCostSources,
} from "./carCostContentData";
import styles from "./LoanInterestContent.module.css";

export function CarCostContent() {
  return (
    <div className={styles.content}>
      <section className={styles.section} aria-labelledby="criteria-title">
        <div className={styles.sectionHeading}>
          <h2 id="criteria-title">계산 기준</h2>
          <p>
            이 차량 유지비 계산기는 사용자가 입력한 금액을 기준으로 월 자동차
            유지비, 연간 환산 비용, 1km당 자동차 유지비를 나누어 보여줍니다.
          </p>
        </div>
        <dl className={styles.criteriaList}>
          {carCostCalculationCriteria.map(({ title, description }) => (
            <div key={title}>
              <dt>{title}</dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="example-title">
        <div className={styles.sectionHeading}>
          <h2 id="example-title">계산 예시</h2>
          <p>
            예를 들어 사용자가 아래처럼 입력한 경우, 같은 입력값이 월·연 비용과
            1km당 비용으로 어떻게 나뉘는지 확인할 수 있습니다.
          </p>
        </div>
        <div className={styles.exampleGrid}>
          <article className={styles.exampleCard}>
            <h3>예시 입력</h3>
            <dl>
              {carCostExampleInputItems.map(({ label, value }) => (
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
              {carCostExampleResultItems.map(({ label, value }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="interpretation-title">
        <div className={styles.sectionHeading}>
          <h2 id="interpretation-title">결과 해석</h2>
          <p>
            차 유지비 계산 결과는 비용 구조를 나누어 보는 용도입니다. 절약액이나
            실제 지출을 보장하지 않습니다.
          </p>
        </div>
        <div className={styles.cardGrid}>
          {carCostInterpretationCards.map(({ title, description }) => (
            <article className={styles.infoCard} key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
        <ul className={styles.interpretationNotes}>
          {carCostInterpretationNotes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="exclusion-title">
        <div className={styles.sectionHeading}>
          <h2 id="exclusion-title">자동 반영되지 않는 항목</h2>
          <p>
            다음 항목은 현재 계산기에 포함되지 않습니다. 실제 비용은 별도
            견적이나 공식 안내를 확인해야 합니다.
          </p>
        </div>
        <ul className={styles.exclusionList}>
          {carCostExclusions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="faq-title">
        <div className={styles.sectionHeading}>
          <h2 id="faq-title">자주 묻는 질문</h2>
        </div>
        <div className={styles.faqList}>
          {carCostFaqs.map(({ question, answer }) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="sources-title">
        <div className={styles.sectionHeading}>
          <h2 id="sources-title">참고 기준</h2>
          <p>
            자동차 유지비 전체를 확정하는 단일 공식 기준은 없습니다. 자동차세,
            유가, 보험료, 정비비는 각 확인처에서 직접 확인해야 합니다.
          </p>
        </div>
        <ul className={styles.sourceList}>
          {carCostSources.map(({ organization, title, criterion, verifiedAt, href }) => (
            <li key={`${organization}-${title}`}>
              <div>
                <strong>{organization}</strong>
                <span>{criterion}</span>
                <span>확인일: {verifiedAt}</span>
              </div>
              {href.startsWith("https://gyesanbox.kr") ? (
                <span>개별 조건 확인</span>
              ) : (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {title} 보기
                </a>
              )}
            </li>
          ))}
        </ul>
      </section>

      <aside className={styles.disclaimer} aria-label="면책 문구">
        계산 결과는 입력값 기준의 단순 추정값입니다. 실제 지출액과 다를 수
        있으며 보험료, 세금, 유류비, 정비비는 개인 조건과 시점에 따라 달라질 수
        있습니다. 이 결과는 법적·세무적 확정 판단이나 견적서가 아니며, 실제
        비용은 보험사, 지자체, 정비업체, 유가 확인처 등을 통해 확인해야 합니다.
      </aside>
    </div>
  );
}
