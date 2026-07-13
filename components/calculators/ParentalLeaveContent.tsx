import {
  parentalLeaveBasisSummary,
  parentalLeaveCriteriaRows,
  parentalLeaveExample,
  parentalLeaveExcludedItems,
  parentalLeaveFaqs,
  parentalLeaveSpecialPolicySummary,
  parentalLeaveSources,
} from "./parentalLeaveContentData";
import styles from "./ParentalLeaveContent.module.css";

function formatKoreanDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

export function ParentalLeaveContent() {
  return (
    <div className={styles.content}>
      <section className={styles.section} aria-labelledby="basis-title">
        <div className={styles.sectionHeading}>
          <h2 id="basis-title">계산 기준 설명</h2>
          <p>{parentalLeaveBasisSummary}</p>
        </div>
        <aside className={styles.policyNotice} aria-label="확정 지급액 아님 안내">
          <strong>확정 지급액이 아닌 예상값</strong>
          <p>
            육아휴직급여는 육아휴직 개시일 기준 통상임금에 비례하지만, 실제
            지급은 고용보험 가입 기간, 육아휴직 사용 요건, 신청 기한, 고용센터
            심사 결과에 따라 달라질 수 있습니다.
          </p>
        </aside>
      </section>

      <section className={styles.section} aria-labelledby="special-policy-title">
        <div className={styles.sectionHeading}>
          <h2 id="special-policy-title">특례 적용 범위와 계산 방식</h2>
          <p>{parentalLeaveSpecialPolicySummary}</p>
          <p>
            일반 육아휴직급여, 부모 함께 육아휴직제 6+6, 한부모 특례 중
            사용자가 선택한 계산 모드와 조건을 기준으로 예상액을 계산합니다.
            계산기가 가장 유리한 특례를 임의로 확정하거나 자격을 판정하지
            않으며, 실제 지급 여부는 고용24 또는 관할 기관에서 확인해야
            합니다.
          </p>
          <p>
            특례가 중복될 수 있는 경우에는 고용센터 확인이 필요합니다. 이
            계산기는 임의로 더 유리한 특례를 자동 선택하지 않습니다.
          </p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="criteria-title">
        <div className={styles.sectionHeading}>
          <h2 id="criteria-title">구간별 계산 기준</h2>
          <p>
            일반 육아휴직급여는 월별 구간에 따라 지급률, 상한액, 하한액을
            적용합니다. 6+6 또는 한부모 특례 모드를 선택하면 선택한 조건에
            맞는 특례 예상액과 일반 기준 구간을 구분해 표시합니다.
          </p>
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.dataTable}>
            <caption>육아휴직급여 계산 기준 요약</caption>
            <thead>
              <tr>
                <th scope="col">항목</th>
                <th scope="col">현재 계산기 기준</th>
                <th scope="col">공식 확인 지점</th>
              </tr>
            </thead>
            <tbody>
              {parentalLeaveCriteriaRows.map((row) => (
                <tr key={row.item}>
                  <th scope="row">{row.item}</th>
                  <td>{row.currentCalculatorBasis}</td>
                  <td>{row.officialCheck}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="example-title">
        <div className={styles.sectionHeading}>
          <h2 id="example-title">계산 예시</h2>
          <p>
            월 통상임금 300만원, 육아휴직 사용 개월 수 12개월을 입력한 예시입니다.
          </p>
        </div>
        <div className={styles.exampleGrid}>
          <article className={styles.exampleCard}>
            <h3>예시 입력</h3>
            <dl>
              {parentalLeaveExample.input.map(({ label, value }) => (
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
              {parentalLeaveExample.result.map(({ label, value }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="excluded-title">
        <div className={styles.sectionHeading}>
          <h2 id="excluded-title">적용되지 않는 예외</h2>
          <p>
            다음 항목은 1차 계산 범위에서 제외합니다. 개인별 요건과 특례 적용은
            공식 기관에서 확인해 주세요.
          </p>
        </div>
        <ul className={styles.exclusionList}>
          {parentalLeaveExcludedItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="related-title">
        <div className={styles.sectionHeading}>
          <h2 id="related-title">관련 계산기</h2>
          <p>
            휴직 전후의 급여와 고용보험 관련 금액을 함께 살펴보세요.
          </p>
        </div>
        <div className={styles.relatedGrid}>
          <a className={`${styles.relatedCard} ${styles.relatedLink}`} href="/calculators/salary/">
            <h3>연봉 실수령액 계산기</h3>
            <p>휴직 전 월 급여와 평소 공제 후 금액을 참고합니다.</p>
          </a>
          <a className={`${styles.relatedCard} ${styles.relatedLink}`} href="/calculators/social-insurance/">
            <h3>4대보험 계산기</h3>
            <p>월 급여 기준 근로자 보험료 부담액을 확인합니다.</p>
          </a>
          <a className={`${styles.relatedCard} ${styles.relatedLink}`} href="/calculators/unemployment/">
            <h3>실업급여 계산기</h3>
            <p>고용보험 가입기간에 따른 예상 구직급여를 확인합니다.</p>
          </a>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="faq-title">
        <div className={styles.sectionHeading}>
          <h2 id="faq-title">자주 묻는 질문</h2>
        </div>
        <div className={styles.faqList}>
          {parentalLeaveFaqs.map(({ question, answer }) => (
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
            {formatKoreanDate("2026-07-01")} 기준으로 고용24와
            국가법령정보센터 자료를 확인했습니다.
          </p>
        </div>
        <ul className={styles.sourceList}>
          {parentalLeaveSources.map(
            ({ organization, title, checkedAt, href, criterion }) => (
              <li key={href}>
                <div>
                  <strong>{organization}</strong>
                  <span>{title}</span>
                  <span>
                    확인 기준일: {formatKoreanDate(checkedAt)} · {criterion}
                  </span>
                </div>
                <a href={href} target="_blank" rel="noopener noreferrer">
                  원문 보기
                </a>
              </li>
            ),
          )}
        </ul>
      </section>

      <aside className={styles.disclaimer} aria-label="면책 문구">
        면책 문구: 이 페이지는 입력값 기준의 예상 계산과 일반 안내를 제공합니다.
        법적 판단, 회사 규정 검토, 고용센터 심사 결과 또는 확정 지급액을 대신하지
        않습니다. 신청 전 고용보험, 고용24 또는 관할 고용센터에서 최신 기준과
        본인 이력을 확인해 주세요.
      </aside>
    </div>
  );
}
