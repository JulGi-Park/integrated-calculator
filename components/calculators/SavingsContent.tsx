import {
  savingsCalculationCriteria,
  savingsCriterionDateLabel,
  savingsExampleInputItems,
  savingsExampleResultItems,
  savingsExclusions,
  savingsFaqs,
  savingsInterpretationCards,
  savingsInterpretationNotes,
  savingsSources,
} from "./savingsContentData";
import styles from "./LoanInterestContent.module.css";

export function SavingsContent() {
  return (
    <div className={styles.content}>
      <section className={styles.section} aria-labelledby="criteria-title">
        <div className={styles.sectionHeading}>
          <h2 id="criteria-title">계산 기준</h2>
          <p>
            기준일 {savingsCriterionDateLabel}의 일반 과세 구조를 기준으로,
            사용자가 입력한 예금 또는 정기적금 조건을 단리 방식으로 계산합니다.
          </p>
        </div>
        <dl className={styles.criteriaList}>
          {savingsCalculationCriteria.map(({ title, description }) => (
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
            매월 같은 금액을 넣는 정기적금의 경우 납입 회차마다 이자 발생 기간이
            달라집니다.
          </p>
        </div>
        <div className={styles.exampleGrid}>
          <article className={styles.exampleCard}>
            <h3>예시 입력</h3>
            <dl>
              {savingsExampleInputItems.map(({ label, value }) => (
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
              {savingsExampleResultItems.map(({ label, value }) => (
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
            예금 이자 계산과 적금 이자 계산은 원금이 이자를 받는 기간이 다르므로
            같은 금리라도 세후 이자와 만기 수령액이 다르게 보일 수 있습니다.
          </p>
        </div>
        <div className={styles.cardGrid}>
          {savingsInterpretationCards.map(({ title, description }) => (
            <article className={styles.infoCard} key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
        <ul className={styles.interpretationNotes}>
          {savingsInterpretationNotes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="exclusion-title">
        <div className={styles.sectionHeading}>
          <h2 id="exclusion-title">적용되지 않는 예외</h2>
          <p>
            다음 항목은 1차 계산 범위에 포함하지 않습니다. 실제 상품 약관과 금융기관
            안내를 함께 확인해야 합니다.
          </p>
        </div>
        <ul className={styles.exclusionList}>
          {savingsExclusions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="faq-title">
        <div className={styles.sectionHeading}>
          <h2 id="faq-title">자주 묻는 질문</h2>
        </div>
        <div className={styles.faqList}>
          {savingsFaqs.map(({ question, answer }) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="sources-title">
        <div className={styles.sectionHeading}>
          <h2 id="sources-title">공식 출처</h2>
          <p>
            세율과 제도는 변경될 수 있으므로 기준일 이후에는 공식 안내를 다시 확인해
            주세요.
          </p>
        </div>
        <ul className={styles.sourceList}>
          {savingsSources.map(({ organization, title, criterion, verifiedAt, href }) => (
            <li key={`${organization}-${title}`}>
              <div>
                <strong>{organization}</strong>
                <span>{criterion}</span>
                <span>확인일: {verifiedAt}</span>
              </div>
              <a href={href} target="_blank" rel="noopener noreferrer">
                {title} 보기
              </a>
            </li>
          ))}
        </ul>
      </section>

      <aside className={styles.disclaimer} aria-label="면책 문구">
        계산 결과는 입력값 기준의 참고 계산입니다. 실제 지급 이자는 금융기관의
        약관, 일수 계산, 원미만 처리, 우대금리 충족 여부, 납입일, 중도해지 여부와
        세율 변경에 따라 달라질 수 있습니다. 이 결과는 금융상품 가입 권유나
        세무적 확정 판단이 아닙니다.
      </aside>
    </div>
  );
}
