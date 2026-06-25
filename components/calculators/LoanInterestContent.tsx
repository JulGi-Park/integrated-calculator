import Link from "next/link";
import {
  loanInterestCalculationCriteria,
  loanInterestExampleInputItems,
  loanInterestExampleResultItems,
  loanInterestExclusions,
  loanInterestFaqs,
  loanInterestInterpretationCards,
  loanInterestInterpretationNotes,
  loanInterestPolicySummary,
  loanInterestQuickComparison,
  loanInterestSources,
} from "./loanInterestContentData";
import styles from "./LoanInterestContent.module.css";

export function LoanInterestContent() {
  return (
    <div className={styles.content}>
      <section className={styles.section} aria-labelledby="quick-compare-title">
        <div className={styles.sectionHeading}>
          <h2 id="quick-compare-title">상환방식 빠른 비교</h2>
          <p>
            세 방식은 월별 부담 구조가 다릅니다. 같은 금리와 기간이라도 총이자와
            초기 납입액이 다를 수 있습니다.
          </p>
        </div>
        <div className={styles.cardGrid}>
          {loanInterestQuickComparison.map(({ title, points }) => (
            <article className={styles.infoCard} key={title}>
              <h3>{title}</h3>
              <ul className={styles.pointList}>
                {points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="criteria-title">
        <div className={styles.sectionHeading}>
          <h2 id="criteria-title">계산 기준과 계산식</h2>
          <p>
            현재 계산기는 월 이율, 원 단위 half-up 반올림, 마지막 회차 잔액
            보정 정책을 사용합니다.
          </p>
        </div>

        <div className={styles.criteriaBlock}>
          <h3>공통 기준</h3>
          <dl className={styles.criteriaList}>
            {loanInterestCalculationCriteria.common.map(({ title, description }) => (
              <div key={title}>
                <dt>{title}</dt>
                <dd>{description}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className={styles.criteriaColumns}>
          <article className={styles.criteriaCard}>
            <h3>원리금균등상환</h3>
            <ul className={styles.pointList}>
              {loanInterestCalculationCriteria.equalPayment.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className={styles.criteriaCard}>
            <h3>원금균등상환</h3>
            <ul className={styles.pointList}>
              {loanInterestCalculationCriteria.equalPrincipal.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className={styles.criteriaCard}>
            <h3>만기일시상환</h3>
            <ul className={styles.pointList}>
              {loanInterestCalculationCriteria.bullet.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>

        <aside className={styles.note} aria-label="특수 조건 안내">
          <strong>특수 조건</strong>
          <ul className={styles.pointList}>
            {loanInterestCalculationCriteria.special.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>
      </section>

      <section className={styles.section} aria-labelledby="example-title">
        <div className={styles.sectionHeading}>
          <h2 id="example-title">엔진 기반 계산 예시</h2>
          <p>
            아래 예시는 고정 입력값을 현재 계산 엔진에 적용해 정적 빌드 시
            생성한 결과입니다.
          </p>
        </div>
        <div className={styles.exampleGrid}>
          <article className={styles.exampleCard}>
            <h3>예시 입력</h3>
            <dl>
              {loanInterestExampleInputItems.map(({ label, value }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </article>

          <div className={styles.exampleResultStack}>
            {loanInterestExampleResultItems.map(({ title, items }) => (
              <article className={styles.exampleCard} key={title}>
                <h3>{title}</h3>
                <dl>
                  {items.map(({ label, value }) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="interpretation-title">
        <div className={styles.sectionHeading}>
          <h2 id="interpretation-title">결과를 이렇게 해석하세요</h2>
          <p>
            총이자와 첫 달 부담은 서로 다른 기준입니다. 월별 현금흐름과 만기
            부담을 함께 보고 판단해야 합니다.
          </p>
        </div>
        <div className={styles.cardGrid}>
          {loanInterestInterpretationCards.map(({ title, description }) => (
            <article className={styles.infoCard} key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
        <ul className={styles.interpretationNotes}>
          {loanInterestInterpretationNotes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="exclusion-title">
        <div className={styles.sectionHeading}>
          <h2 id="exclusion-title">자동 반영되지 않는 항목과 예외</h2>
          <p>
            다음 항목은 현재 계산기에 포함되지 않으며, 실제 금융회사 결과는
            상품 조건에 따라 달라질 수 있습니다.
          </p>
        </div>
        <ul className={styles.exclusionList}>
          {loanInterestExclusions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="faq-title">
        <div className={styles.sectionHeading}>
          <h2 id="faq-title">자주 묻는 질문</h2>
        </div>
        <div className={styles.faqList}>
          {loanInterestFaqs.map(({ question, answer }) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="related-title">
        <div className={styles.sectionHeading}>
          <h2 id="related-title">관련 계산기</h2>
        </div>
        <div className={styles.relatedGrid}>
          <Link
            className={`${styles.relatedCard} ${styles.relatedLink}`}
            href="/calculators/salary"
          >
            <h3>연봉 실수령액 계산기</h3>
            <p>월 급여 공제와 예상 실수령액을 함께 확인합니다.</p>
          </Link>
          <Link
            className={`${styles.relatedCard} ${styles.relatedLink}`}
            href="/calculators/seller-margin"
          >
            <h3>판매자 마진 계산기</h3>
            <p>수수료와 비용을 반영한 예상 순이익을 계산합니다.</p>
          </Link>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="sources-title">
        <div className={styles.sectionHeading}>
          <h2 id="sources-title">공식 출처</h2>
          <p>
            {loanInterestPolicySummary.verifiedAt} 현재 실제 접근 가능한 공식
            원문만 확인해 정리했습니다.
          </p>
        </div>
        <ul className={styles.sourceList}>
          {loanInterestSources.map(
            ({ organization, title, criterion, verifiedAt, href }) => (
              <li key={href}>
                <div>
                  <strong>{organization}</strong>
                  <span>{criterion}</span>
                  <span>확인일: {verifiedAt}</span>
                </div>
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {title} 원문 보기
                </a>
              </li>
            ),
          )}
        </ul>
      </section>

      <aside className={styles.disclaimer} aria-label="계산 결과 안내">
        계산 결과는 입력값과 현재 계산 정책에 따른 예상치입니다. 실제
        금융회사 결과는 실행일, 납부일, 일수, 반올림 방식과 상품 조건에 따라
        달라질 수 있으며 인지세, 보증료와 수수료가 별도로 발생할 수 있습니다.
        이 결과는 금융회사의 최종 상환계획표를 대체하지 않으며, 대출 가입이나
        특정 상환방식 선택을 권유하는 자료가 아닙니다.
      </aside>
    </div>
  );
}
