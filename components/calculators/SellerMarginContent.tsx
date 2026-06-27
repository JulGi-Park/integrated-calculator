import Link from "next/link";
import {
  sellerMarginExampleInput,
  sellerMarginExampleResult,
  sellerMarginExclusions,
  sellerMarginFaqs,
  sellerMarginFormulas,
} from "./sellerMarginContentData";
import styles from "./SellerMarginContent.module.css";

export function SellerMarginContent() {
  return (
    <div className={styles.content}>
      <section className={styles.section} aria-labelledby="interpretation-title">
        <div className={styles.sectionHeading}>
          <h2 id="interpretation-title">결과를 이렇게 해석하세요</h2>
          <p>
            결과는 입력한 주문 조건을 설명하는 지표이며, 수익성의 적정 수준을
            판단하거나 사업 결정을 권유하는 값은 아닙니다.
          </p>
        </div>
        <div className={styles.interpretationGrid}>
          <article className={styles.infoCard}>
            <h3>순이익률</h3>
            <p>결제금액 중 예상 순이익이 차지하는 비율입니다.</p>
          </article>
          <article className={styles.infoCard}>
            <h3>원가율</h3>
            <p>상품 판매금액 중 상품 원가 총액이 차지하는 비율입니다.</p>
          </article>
          <article className={styles.infoCard}>
            <h3>총수수료율</h3>
            <p>
              결제금액 중 플랫폼 수수료와 결제 수수료 합계가 차지하는
              비율입니다.
            </p>
          </article>
        </div>
        <p className={styles.roundingNote}>
          예상 순이익이 0원보다 크면 흑자, 작으면 적자, 같으면 손익분기로
          표시됩니다. 실제 정산액은 플랫폼 정책과 정산 기준에 따라 달라질 수
          있습니다.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="formula-title">
        <div className={styles.sectionHeading}>
          <h2 id="formula-title">계산 기준과 계산식</h2>
          <p>
            수수료율은 퍼센트 단위로 입력하며, 각 수수료를 원 단위로 반올림한
            뒤 정산금액과 순이익을 계산합니다.
          </p>
        </div>
        <dl className={styles.formulaList}>
          {sellerMarginFormulas.map(({ title, formula }) => (
            <div key={title}>
              <dt>{title}</dt>
              <dd>{formula}</dd>
            </div>
          ))}
        </dl>
        <p className={styles.roundingNote}>
          반환되는 금액은 원 단위 정수, 비율은 소수점 둘째 자리까지
          반올림합니다. 플랫폼별 절사·반올림 정책은 자동 반영하지 않습니다.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="example-title">
        <div className={styles.sectionHeading}>
          <h2 id="example-title">계산 예시</h2>
          <p>아래 예시는 주문 1건을 기준으로 한 고정 계산 사례입니다.</p>
        </div>
        <div className={styles.exampleGrid}>
          <article className={styles.exampleCard}>
            <h3>예시 입력</h3>
            <dl>
              {sellerMarginExampleInput.map(({ label, value }) => (
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
              {sellerMarginExampleResult.map(({ label, value }) => (
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
          <p>
            아래 항목은 계산기가 자동으로 확인하거나 적용하지 않습니다.
          </p>
        </div>
        <ul className={styles.exclusionList}>
          {sellerMarginExclusions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="faq-title">
        <div className={styles.sectionHeading}>
          <h2 id="faq-title">자주 묻는 질문</h2>
        </div>
        <div className={styles.faqList}>
          {sellerMarginFaqs.map(({ question, answer }) => (
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
            href="/calculators"
          >
            <h3>전체 계산기 목록</h3>
            <p>현재 이용할 수 있는 계산기를 확인합니다.</p>
          </Link>
          <Link
            className={`${styles.relatedCard} ${styles.relatedLink}`}
            href="/calculators/loan"
          >
            <h3>대출 이자 계산기</h3>
            <p>사업 자금 대출의 월 납입액과 총이자를 비교합니다.</p>
          </Link>
          <Link
            className={`${styles.relatedCard} ${styles.relatedLink}`}
            href="/calculators/salary"
          >
            <h3>연봉 실수령액 계산기</h3>
            <p>급여 공제와 월 예상 실수령액을 함께 확인합니다.</p>
          </Link>
        </div>
      </section>

      <aside className={styles.disclaimer} aria-label="계산 결과 안내">
        계산 결과는 사용자가 입력한 값을 기준으로 한 예상값이며 플랫폼 정책과
        실제 정산 기준이 우선합니다. 세무 신고나 회계 판단을 위한 확정 자료가
        아니므로, 중요한 정산·가격·세무 결정 전에는 플랫폼 정산 내역이나 관련
        전문가의 확인을 권장합니다.
      </aside>
    </div>
  );
}
