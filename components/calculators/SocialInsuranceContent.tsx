import {
  socialInsuranceCriteria,
  socialInsuranceExceptions,
  socialInsuranceExamples,
  socialInsuranceFaqs,
  socialInsuranceSources,
} from "./socialInsuranceContentData";
import styles from "./SocialInsuranceCalculator.module.css";

export function SocialInsuranceContent() {
  return (
    <div className={styles.content}>
      <section className={styles.contentSection}>
        <h2>2026년 4대보험 계산 기준</h2>
        <p>
          본 계산기는 2026년 7월 10일 확인 기준의 일반 근로자 월급 기준
          예상값입니다. 기준 변경, 회사 신고 보수월액, 정산 여부에 따라
          실제 공제액은 달라질 수 있습니다.
        </p>
        <div className={styles.criteriaGrid}>
          {socialInsuranceCriteria.map(({ title, description }) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.contentSection}>
        <h2>계산 예시</h2>
        <div className={styles.exampleGrid}>
          {socialInsuranceExamples.map(({ title, inputItems, resultItems }) => (
            <article className={styles.exampleCard} key={title}>
              <h3>{title}</h3>
              <dl>
                {[...inputItems, ...resultItems].map(({ label, value }) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.contentSection}>
        <h2>급여명세서와 달라질 수 있는 경우</h2>
        <ul className={styles.checkList}>
          {socialInsuranceExceptions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.contentSection}>
        <h2>자주 묻는 질문</h2>
        <div className={styles.faqList}>
          {socialInsuranceFaqs.map(({ question, answer }) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.contentSection}>
        <h2>관련 계산기</h2>
        <div className={styles.relatedGrid}>
          <a className={styles.relatedCard} href="/calculators/salary/">
            <h3>연봉 실수령액 계산기</h3>
            <p>
              4대보험뿐 아니라 소득세와 지방소득세까지 포함한 예상 월
              실수령액을 확인합니다.
            </p>
          </a>
          <a className={styles.relatedCard} href="/calculators/severance/">
            <h3>퇴직금 계산기</h3>
            <p>평균임금과 근속기간을 기준으로 예상 퇴직금을 계산합니다.</p>
          </a>
        </div>
      </section>

      <section className={styles.contentSection}>
        <h2>공식 출처</h2>
        <ul className={styles.sourceList}>
          {socialInsuranceSources.map(
            ({ organization, title, criterion, href }) => (
              <li key={`${organization}-${title}`}>
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {organization} - {title}
                </a>
                <span>{criterion}</span>
              </li>
            ),
          )}
        </ul>
      </section>

      <section className={styles.disclaimerBox} aria-label="면책 문구">
        <h2>안내</h2>
        <p>
          본 계산기는 2026년 7월 10일 확인 기준의 일반 근로자 월급 기준
          예상값입니다. 실제 공제액은 회사 신고 보수월액, 비과세 처리,
          건강보험 정산, 입퇴사일, 적용 제외 여부, 사업장 처리 방식에 따라
          달라질 수 있습니다. 소득세와 지방소득세는 이번 계산 범위에 포함하지
          않습니다. 정확한 납부액은 급여 담당자, 국민연금공단,
          국민건강보험공단, 고용보험 관련 기관에서 확인해 주세요.
        </p>
      </section>
    </div>
  );
}
