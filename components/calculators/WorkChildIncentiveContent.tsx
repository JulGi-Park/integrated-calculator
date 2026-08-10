import {
  formatKoreanDate,
  workChildIncentiveCriteria,
  workChildIncentiveExampleItems,
  workChildIncentiveExceptions,
  workChildIncentiveFaqs,
  workChildIncentivePolicySummary,
  workChildIncentiveSources,
} from "./workChildIncentiveContentData";
import styles from "./WorkChildIncentiveContent.module.css";

export function WorkChildIncentiveContent() {
  return (
    <div className={styles.content}>
      <section className={styles.section} aria-labelledby="work-child-criteria">
        <div className={styles.sectionHeading}>
          <h2 id="work-child-criteria">2026년 신청 기준</h2>
          <p>
            기준일은 {formatKoreanDate(workChildIncentivePolicySummary.verifiedAt)}
            이며, 2026년 신청은 {workChildIncentivePolicySummary.incomeYear}과
            2025년 6월 1일 재산을 기준으로 확인합니다.
          </p>
        </div>
        <dl className={styles.criteriaList}>
          {workChildIncentiveCriteria.map(({ title, description }) => (
            <div key={title}>
              <dt>{title}</dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="work-child-example">
        <div className={styles.sectionHeading}>
          <h2 id="work-child-example">계산 예시</h2>
          <p>예시는 현재 계산 엔진에 고정 입력을 적용해 생성한 예상값입니다.</p>
        </div>
        <dl className={styles.exampleList}>
          {workChildIncentiveExampleItems.map(({ label, value }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="work-child-filing">
        <div className={styles.sectionHeading}>
          <h2 id="work-child-filing">2026년 신청 시기</h2>
          <p>{workChildIncentivePolicySummary.filingPeriod}</p>
        </div>
        <p>
          기한 후 신청은 정기신청 기준 예상액의 95%를 반영합니다. 근로소득자 대상
          반기신청은 2026년 발생 소득을 바탕으로 이후 정산하므로 이 계산기의 2025년
          귀속 정기·기한 후 예상액과 같은 의미가 아닙니다.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="work-child-exceptions">
        <div className={styles.sectionHeading}>
          <h2 id="work-child-exceptions">자동 반영되지 않는 항목</h2>
          <p>다음 항목은 실제 심사 자료와 홈택스 안내를 통해 별도로 확인해야 합니다.</p>
        </div>
        <ul className={styles.exclusionList}>
          {workChildIncentiveExceptions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="work-child-faq">
        <div className={styles.sectionHeading}>
          <h2 id="work-child-faq">자주 묻는 질문</h2>
        </div>
        <div className={styles.faqList}>
          {workChildIncentiveFaqs.map(({ question, answer }) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="work-child-related">
        <div className={styles.sectionHeading}>
          <h2 id="work-child-related">관련 계산기</h2>
        </div>
        <div className={styles.relatedGrid}>
          <a className={styles.relatedCard} href="/calculators/salary/">
            <h3>연봉 실수령액 계산기</h3>
            <p>급여와 공제 내역을 함께 확인할 때 참고할 수 있습니다.</p>
          </a>
          <a className={styles.relatedCard} href="/calculators/unemployment/">
            <h3>실업급여 계산기</h3>
            <p>고용보험 가입기간과 평균임금 기준 예상 구직급여를 계산합니다.</p>
          </a>
          <a className={styles.relatedCard} href="/calculators/severance/">
            <h3>퇴직금 계산기</h3>
            <p>퇴직 전 임금과 재직기간으로 예상 퇴직금을 확인합니다.</p>
          </a>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="work-child-sources">
        <div className={styles.sectionHeading}>
          <h2 id="work-child-sources">공식 출처</h2>
          <p>홈택스는 계산 흐름 참고용으로만 확인했고 자동화 접근은 하지 않았습니다.</p>
        </div>
        <ul className={styles.sourceList}>
          {workChildIncentiveSources.map(({ organization, title, criterion, href }) => (
            <li key={href}>
              <div>
                <strong>{organization}</strong>
                <span>{criterion}</span>
              </div>
              <a href={href} target="_blank" rel="noopener noreferrer">
                {title} 원문 보기
              </a>
            </li>
          ))}
        </ul>
      </section>

      <aside className={styles.disclaimer} aria-label="계산 결과 안내">
        이 계산기는 신청 전 자가진단과 예상 계산을 돕기 위한 도구입니다. 실제 지급
        여부와 지급액은 국세청의 가구·소득·재산 심사 결과에 따라 달라질 수 있으며,
        신청 안내문 수령 여부와 실제 신청 가능 여부가 다를 수 있습니다.
      </aside>
    </div>
  );
}
