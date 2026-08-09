import {
  brokerageFeeExampleInput,
  brokerageFeeExampleResult,
  brokerageFeeExclusions,
  brokerageFeeFaqs,
  brokerageFeeFormulas,
  brokerageFeePolicySources,
  brokerageFeePolicySummary,
} from "@/lib/calculators/brokerage-fee/content";
import styles from "./SellerMarginContent.module.css";

export function BrokerageFeeContent() {
  return (
    <div className={styles.content}>
      <section className={styles.section} aria-labelledby="interpretation-title">
        <div className={styles.sectionHeading}>
          <h2 id="interpretation-title">결과를 이렇게 해석하세요</h2>
          <p>
            결과는 부동산 중개보수 상한액과 부가세 포함 예상 금액을 설명하는
            참고 계산입니다. 실제 지급액은 계약 내용과 협의요율, 부가세 청구
            여부를 함께 확인해야 합니다.
          </p>
        </div>
        <div className={styles.interpretationGrid}>
          <article className={styles.infoCard}>
            <h3>부가세 별도 상한보수</h3>
            <p>주택 거래금액과 적용 구간의 상한요율로 계산한 금액입니다.</p>
          </article>
          <article className={styles.infoCard}>
            <h3>부가세 포함 예상 금액</h3>
            <p>부가세 별도 보수에 10%를 더한 단순 예상 금액입니다.</p>
          </article>
          <article className={styles.infoCard}>
            <h3>협의요율</h3>
            <p>적용 상한요율 이하로 입력하면 협의보수를 따로 비교합니다.</p>
          </article>
        </div>
        <p className={styles.roundingNote}>
          중개보수는 중개의뢰인과 개업공인중개사가 상한요율 범위에서 협의할 수
          있습니다. 이 계산기는 확정 청구액을 정하지 않습니다.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="scope-title">
        <div className={styles.sectionHeading}>
          <h2 id="scope-title">이 계산기의 적용 범위</h2>
          <p>
            주택 매매·교환, 전세, 월세의 거래금액별 중개보수 상한액을
            계산합니다. 실제 중개보수는 상한요율 이내에서 협의해 정합니다.
          </p>
        </div>
        <div className={styles.interpretationGrid}>
          <article className={styles.infoCard}>
            <h3>지원 거래</h3>
            <p>주택 매매·교환, 전세, 월세의 한쪽 당 상한보수를 계산합니다.</p>
          </article>
          <article className={styles.infoCard}>
            <h3>지역 기준</h3>
            <p>
              중개대상물 주소가 아닌 중개사무소 소재지 관할 시·도 조례 기준을
              적용합니다.
            </p>
          </article>
          <article className={styles.infoCard}>
            <h3>계산하지 않는 거래</h3>
            <p>상가·토지·분양권과 지원 범위 밖 오피스텔은 자동 계산하지 않습니다.</p>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="formula-title">
        <div className={styles.sectionHeading}>
          <h2 id="formula-title">계산 기준과 계산식</h2>
          <p>
            {brokerageFeePolicySummary.verifiedAt}의 주택 중개보수 상한요율을
            기준으로 매매 복비, 전세 중개수수료, 월세 복비를 계산합니다.
          </p>
        </div>
        <dl className={styles.formulaList}>
          {brokerageFeeFormulas.map(({ title, formula }) => (
            <div key={title}>
              <dt>{title}</dt>
              <dd>{formula}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="example-title">
        <div className={styles.sectionHeading}>
          <h2 id="example-title">계산 예시</h2>
          <p>월세 보증금과 월세를 입력했을 때의 환산 거래금액 사례입니다.</p>
        </div>
        <div className={styles.exampleGrid}>
          <article className={styles.exampleCard}>
            <h3>예시 입력</h3>
            <dl>
              {brokerageFeeExampleInput.map(({ label, value }) => (
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
              {brokerageFeeExampleResult.map(({ label, value }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="source-title">
        <div className={styles.sectionHeading}>
          <h2 id="source-title">공식 기준 확인</h2>
          <p>
            공인중개사 수수료는 법령과 시·도 조례를 함께 확인해야 합니다. 아래
            기준을 바탕으로 주택 중개보수 상한요율을 반영했습니다.
          </p>
        </div>
        <ul className={styles.exclusionList}>
          {brokerageFeePolicySources.map((source) => (
            <li key={source.href}>
              <a href={source.href} target="_blank" rel="noreferrer">
                {source.title}
              </a>
              <span>
                {" "}— {source.description} · 확인일: {source.verifiedAt}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="exclusion-title">
        <div className={styles.sectionHeading}>
          <h2 id="exclusion-title">1차 계산에 포함하지 않는 항목</h2>
          <p>아래 항목은 이 계산기가 자동으로 판단하거나 계산하지 않습니다.</p>
        </div>
        <ul className={styles.exclusionList}>
          {brokerageFeeExclusions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="faq-title">
        <div className={styles.sectionHeading}>
          <h2 id="faq-title">자주 묻는 질문</h2>
        </div>
        <div className={styles.faqList}>
          {brokerageFeeFaqs.map(({ question, answer }) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <aside className={styles.disclaimer} aria-label="계산 결과 안내">
        이 부동산 중개보수 계산기는 주택 거래의 상한보수와 부가세 포함 예상
        금액을 계산하는 참고 도구입니다. 실제 지급액, 부가세 청구 여부, 실비,
        분쟁 또는 환불 가능 여부는 계약 내용과 관계 법령, 지역 조례를 별도로
        확인해야 합니다.
      </aside>
    </div>
  );
}
