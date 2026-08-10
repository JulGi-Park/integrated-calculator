import {
  youthFutureSavingsCautions,
  youthFutureSavingsCriteria,
  youthFutureSavingsExampleResult,
  youthFutureSavingsFaqs,
  youthFutureSavingsPolicySummary,
  youthFutureSavingsSources,
} from "./youthFutureSavingsContentData";
import { formatWon } from "./youthFutureSavingsClientUtils";
import styles from "./YouthFutureSavingsCalculator.module.css";

export function YouthFutureSavingsContent() {
  return (
    <div className={styles.contentWrap}>
      <section className={styles.contentCard} aria-labelledby="youth-criteria-heading">
        <h2 id="youth-criteria-heading">계산 기준</h2>
        <p>
          기준일은 {youthFutureSavingsPolicySummary.verifiedAt}이며, 월 납입 한도
          {youthFutureSavingsPolicySummary.monthlyLimit}, 기본 기간
          {youthFutureSavingsPolicySummary.defaultTerm}의 {youthFutureSavingsPolicySummary.productTerm}, 정부기여금 일반형
          {youthFutureSavingsPolicySummary.standardRate}, 우대형
          {youthFutureSavingsPolicySummary.preferredRate}를 기준으로 합니다.
        </p>
        <ul>
          {youthFutureSavingsCriteria.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>: {item.description}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.contentCard} aria-labelledby="youth-example-heading">
        <h2 id="youth-example-heading">예시</h2>
        <p>
          월 50만원, 36개월, 연 7%, 일반형 6%, 비과세로 계산하면 예상
          만기수령액은 {formatWon(youthFutureSavingsExampleResult.maturityAmount)}입니다.
        </p>
        <ul>
          <li>총 납입 원금: {formatWon(youthFutureSavingsExampleResult.totalPrincipal)}</li>
          <li>예상 세전 이자: {formatWon(youthFutureSavingsExampleResult.grossInterest)}</li>
          <li>정부기여금 합계: {formatWon(youthFutureSavingsExampleResult.governmentContribution)}</li>
          <li>비과세 절감액: {formatWon(youthFutureSavingsExampleResult.taxSaving)}</li>
          <li>예상 만기금액: {formatWon(youthFutureSavingsExampleResult.maturityAmount)}</li>
        </ul>
      </section>

      <section className={styles.contentCard} aria-labelledby="youth-cautions-heading">
        <h2 id="youth-cautions-heading">주의사항</h2>
        <ul>
          {youthFutureSavingsCautions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.contentCard} aria-labelledby="youth-faq-heading">
        <h2 id="youth-faq-heading">FAQ</h2>
        {youthFutureSavingsFaqs.map((faq) => (
          <article key={faq.question}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </article>
        ))}
      </section>

      <section className={styles.contentCard} aria-labelledby="youth-sources-heading">
        <h2 id="youth-sources-heading">공식 출처</h2>
        <ul className={styles.sourceList}>
          {youthFutureSavingsSources.map((source) => (
            <li key={source.href}>
              <a href={source.href} target="_blank" rel="noreferrer">
                {source.organization} · {source.title}
              </a>
              <p>
                {source.criterion} · 확인일 {source.verifiedAt}
              </p>
            </li>
          ))}
        </ul>
        <p className={styles.muted}>
          계산박스의 결과는 참고용이며 가입 가능 여부, 정부기여금 지급, 비과세
          적용을 보장하지 않습니다.
        </p>
      </section>
    </div>
  );
}
