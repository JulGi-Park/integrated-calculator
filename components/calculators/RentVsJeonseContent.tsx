import {
  rentVsJeonseCriteria,
  rentVsJeonseExample,
  rentVsJeonseExclusions,
  rentVsJeonseFaqs,
  rentVsJeonseLegalReferencePoints,
  rentVsJeonsePolicySummary,
  rentVsJeonseSources,
} from "./rentVsJeonseContentData";
import styles from "./RentVsJeonseContent.module.css";

export function RentVsJeonseContent() {
  return (
    <div className={styles.content}>
      <section className={styles.section} aria-labelledby="criteria-title">
        <div className={styles.sectionHeading}>
          <h2 id="criteria-title">계산 기준</h2>
          <p>
            계약서 금액만 다시 적는 계산이 아니라, 보증금에 묶이는 돈과 월별
            현금흐름을 함께 비교합니다.
          </p>
        </div>
        <ul className={styles.pointList}>
          {rentVsJeonseCriteria.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="legal-rate-title">
        <div className={styles.sectionHeading}>
          <h2 id="legal-rate-title">법정 전월세전환율 참고</h2>
          <p>
            {rentVsJeonsePolicySummary.referenceDateText} 기준 참고값입니다.
            기준금리 변동 시 입력값을 직접 바꿔 계산해야 합니다.
          </p>
        </div>
        <div className={styles.cardGrid}>
          <article className={styles.infoCard}>
            <h3>기본 참고값</h3>
            <p>
              한국은행 기준금리 {rentVsJeonsePolicySummary.baseRate} +
              시행령상 가산 이율 {rentVsJeonsePolicySummary.legalAdditionalRate}
              = 기본 참고 전환율 {rentVsJeonsePolicySummary.legalReferenceRate}
            </p>
          </article>
          <article className={styles.infoCard}>
            <h3>상한 구조</h3>
            <p>
              법정 상한율 {rentVsJeonsePolicySummary.maxLegalRate}와
              기준금리 + 가산 이율 중 낮은 비율을 참고값으로 사용합니다.
            </p>
          </article>
        </div>
        <ul className={styles.pointList}>
          {rentVsJeonseLegalReferencePoints.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="example-title">
        <div className={styles.sectionHeading}>
          <h2 id="example-title">계산 예시</h2>
          <p>
            예시는 설명용입니다. 실제 판단에는 계약 조건과 대출 가능 여부를
            따로 확인해야 합니다.
          </p>
        </div>
        <div className={styles.exampleGrid}>
          <article className={styles.exampleCard}>
            <h3>예시 조건</h3>
            <dl>
              <div>
                <dt>전세</dt>
                <dd>보증금 2억 원, 대출 1억 5천만 원</dd>
              </div>
              <div>
                <dt>월세</dt>
                <dd>보증금 5천만 원, 월세 70만 원</dd>
              </div>
              <div>
                <dt>공통</dt>
                <dd>관리비 10만 원, 기회비용 연 2.5%, 24개월</dd>
              </div>
            </dl>
          </article>
          <article className={styles.exampleCard}>
            <h3>비교 포인트</h3>
            {rentVsJeonseExample.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="exclusion-title">
        <div className={styles.sectionHeading}>
          <h2 id="exclusion-title">자동 반영되지 않는 항목</h2>
          <p>
            아래 항목은 현재 계산에 포함되지 않습니다. 필요한 경우 별도 비용을
            더해 비교해야 합니다.
          </p>
        </div>
        <ul className={styles.exclusionList}>
          {rentVsJeonseExclusions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="faq-title">
        <div className={styles.sectionHeading}>
          <h2 id="faq-title">자주 묻는 질문</h2>
        </div>
        <div className={styles.faqList}>
          {rentVsJeonseFaqs.map(({ question, answer }) => (
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
          <p>{rentVsJeonsePolicySummary.referenceDateText} 기준으로 정리했습니다.</p>
        </div>
        <ul className={styles.sourceList}>
          {rentVsJeonseSources.map(
            ({ organization, title, criterion, verifiedAt, href }) => (
              <li key={href}>
                <div>
                  <strong>{organization}</strong>
                  <span>{criterion}</span>
                  <span>확인일: {verifiedAt}</span>
                </div>
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {title}
                </a>
              </li>
            ),
          )}
        </ul>
      </section>

      <aside className={styles.disclaimer} aria-label="계산 결과 안내">
        본 계산 결과는 사용자가 입력한 값을 기준으로 한 참고용 예상 계산입니다.
        실제 계약 조건, 대출 조건, 세금 혜택, 중개보수, 이사비, 보증금 반환
        위험, 분쟁 여부에 따라 결과가 달라질 수 있습니다. 법률 판단이나 분쟁
        해결을 대신하지 않으며, 중요한 계약 전에는 공인중개사, 금융기관,
        임대차분쟁조정위원회 등 공식 기관을 통해 확인해야 합니다.
      </aside>
    </div>
  );
}
