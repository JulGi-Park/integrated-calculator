import {
  vatProfitBaseDate,
  vatProfitExampleInput,
  vatProfitExampleResult,
  vatProfitExclusions,
  vatProfitFaqs,
  vatProfitFormulas,
  vatProfitOfficialSources,
  vatProfitRateText,
} from "./vatProfitContentData";
import styles from "./SellerMarginContent.module.css";

export function VatProfitContent() {
  return (
    <div className={styles.content}>
      <section className={styles.section} aria-labelledby="vat-interpretation">
        <div className={styles.sectionHeading}>
          <h2 id="vat-interpretation">결과를 이렇게 해석하세요</h2>
          <p>
            부가세 계산기는 일반과세자 기본 세율을 기준으로 매출세액과 입력한
            매입세액 차감 후 예상 납부세액을 보여주는 참고 도구입니다.
          </p>
        </div>
        <div className={styles.interpretationGrid}>
          <article className={styles.infoCard}>
            <h3>공급가액</h3>
            <p>부가세를 제외한 매출 기준 금액입니다.</p>
          </article>
          <article className={styles.infoCard}>
            <h3>매출세액</h3>
            <p>공급가액에 10%를 적용한 기본 부가가치세입니다.</p>
          </article>
          <article className={styles.infoCard}>
            <h3>예상 납부세액</h3>
            <p>매출세액에서 사용자가 입력한 매입세액을 뺀 금액입니다.</p>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="vat-formula">
        <div className={styles.sectionHeading}>
          <h2 id="vat-formula">계산 기준과 계산식</h2>
          <p>
            {vatProfitRateText}를 사용합니다. 기준 확인일은{" "}
            {vatProfitBaseDate}입니다.
          </p>
        </div>
        <dl className={styles.formulaList}>
          {vatProfitFormulas.map(({ title, formula }) => (
            <div key={title}>
              <dt>{title}</dt>
              <dd>{formula}</dd>
            </div>
          ))}
        </dl>
        <p className={styles.roundingNote}>
          금액은 원 단위로 반올림합니다. 실제 신고 과정에서는 과세유형,
          세액공제, 불공제 매입세액, 가산세와 신고서 조정에 따라 달라질 수
          있습니다.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="vat-example">
        <div className={styles.sectionHeading}>
          <h2 id="vat-example">계산 예시</h2>
          <p>아래 예시는 공급가액 1,000,000원과 매입세액 30,000원을 입력한 사례입니다.</p>
        </div>
        <div className={styles.exampleGrid}>
          <article className={styles.exampleCard}>
            <h3>예시 입력</h3>
            <dl>
              {vatProfitExampleInput.map(({ label, value }) => (
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
              {vatProfitExampleResult.map(({ label, value }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="vat-exclusions">
        <div className={styles.sectionHeading}>
          <h2 id="vat-exclusions">실제 신고 결과와 달라지는 이유</h2>
          <p>
            아래 항목은 자동으로 판단하지 않습니다. 세무 신고 전에는 사업자
            유형과 증빙을 함께 확인해야 합니다.
          </p>
        </div>
        <ul className={styles.exclusionList}>
          {vatProfitExclusions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="vat-sources">
        <div className={styles.sectionHeading}>
          <h2 id="vat-sources">공식 출처</h2>
          <p>계산 기준 문구는 아래 공식 자료를 {vatProfitBaseDate} 확인해 정리했습니다.</p>
        </div>
        <ul className={styles.exclusionList}>
          {vatProfitOfficialSources.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                {source.organization} - {source.title}
              </a>
              <br />
              <span>{source.supports}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="vat-related">
        <div className={styles.sectionHeading}>
          <h2 id="vat-related">관련 계산기</h2>
        </div>
        <div className={styles.relatedGrid}>
          <a
            className={`${styles.relatedCard} ${styles.relatedLink}`}
            href="/calculators/seller-margin/"
          >
            <h3>판매자 마진 계산기</h3>
            <p>판매가와 비용을 기준으로 세전 순이익을 먼저 확인합니다.</p>
          </a>
          <a
            className={`${styles.relatedCard} ${styles.relatedLink}`}
            href="/calculators/salary/"
          >
            <h3>연봉 실수령액 계산기</h3>
            <p>개인 급여 공제와 사업 관련 세금 계산을 구분해 확인합니다.</p>
          </a>
          <a
            className={`${styles.relatedCard} ${styles.relatedLink}`}
            href="/calculators/"
          >
            <h3>전체 계산기 목록</h3>
            <p>현재 공개된 계산기를 한 번에 확인합니다.</p>
          </a>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="vat-faq">
        <div className={styles.sectionHeading}>
          <h2 id="vat-faq">자주 묻는 질문</h2>
        </div>
        <div className={styles.faqList}>
          {vatProfitFaqs.map(({ question, answer }) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <aside className={styles.disclaimer} aria-label="계산 결과 안내">
        계산 결과는 입력값을 바탕으로 한 참고용 예상값입니다. 실제 신고,
        환급, 공제 가능 여부와 세무 판단은 국세청 안내 또는 세무 전문가 확인을
        권장합니다.
      </aside>
    </div>
  );
}
