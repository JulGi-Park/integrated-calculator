import {
  dsrCautions,
  dsrCriteria,
  dsrExampleItems,
  dsrFaqs,
  dsrPolicySummary,
  dsrSources,
} from "./dsrContentData";
import styles from "./DsrCalculator.module.css";

export function DsrContent() {
  return (
    <div className={styles.contentWrap}>
      <section className={styles.contentCard} aria-labelledby="dsr-criteria-heading">
        <h2 id="dsr-criteria-heading">계산 기준</h2>
        <p>
          기준일은 {dsrPolicySummary.verifiedAt}이며, 기본 DSR 기준은
          {dsrPolicySummary.defaultLimitRate}, 기본 스트레스 금리는
          {dsrPolicySummary.defaultStressRate}입니다.
        </p>
        <ul>
          {dsrCriteria.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>: {item.description}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.contentCard} aria-labelledby="dsr-example-heading">
        <h2 id="dsr-example-heading">예시</h2>
        <p>
          연소득 6,000만원, 기존 대출 연간 원리금 800만원, 신규 대출 2억원,
          연 4.5%, 30년 원리금균등상환 조건의 예시입니다.
        </p>
        <ul>
          {dsrExampleItems.map((item) => (
            <li key={item.label}>
              <strong>{item.label}</strong>: {item.value}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.contentCard} aria-labelledby="dsr-cautions-heading">
        <h2 id="dsr-cautions-heading">주의사항</h2>
        <ul>
          {dsrCautions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.contentCard} aria-labelledby="dsr-faq-heading">
        <h2 id="dsr-faq-heading">FAQ</h2>
        {dsrFaqs.map((faq) => (
          <article key={faq.question}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </article>
        ))}
      </section>

      <section className={styles.contentCard} aria-labelledby="dsr-related-heading">
        <h2 id="dsr-related-heading">관련 계산기</h2>
        <p>
          월별 상환 일정까지 자세히 보려면{" "}
          <a className="text-link" href="/calculators/loan/">
            대출 이자 계산기
          </a>
          를 함께 확인할 수 있습니다.
        </p>
      </section>

      <section className={styles.contentCard} aria-labelledby="dsr-sources-heading">
        <h2 id="dsr-sources-heading">공식 출처</h2>
        <ul className={styles.sourceList}>
          {dsrSources.map((source) => (
            <li key={source.href}>
              <a href={source.href} target="_blank" rel="noreferrer">
                {source.organization} · {source.title}
              </a>
              <p>
                {source.description} · 확인일 {source.verifiedAt}
              </p>
            </li>
          ))}
        </ul>
        <p className={styles.muted}>
          계산 결과는 참고용이며 대출 가능 확정이나 승인 보장을 의미하지
          않습니다.
        </p>
      </section>
    </div>
  );
}
