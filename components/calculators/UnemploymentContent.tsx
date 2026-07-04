import { UNEMPLOYMENT_POLICY_2026 } from "@/lib/calculators/unemployment/policy";
import {
  unemploymentBasisSummary,
  unemploymentChecklist,
  unemploymentCriteriaRows,
  unemploymentExampleInputItems,
  unemploymentExampleResultItems,
  unemploymentExcludedItems,
  unemploymentFaqs,
  unemploymentInterpretationCards,
  unemploymentQuickCheckRows,
  unemploymentRelatedCalculators,
  unemploymentSources,
} from "./unemploymentContentData";
import styles from "./UnemploymentContent.module.css";

function formatKoreanDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

export function UnemploymentContent() {
  return (
    <div className={styles.content}>
      <section className={styles.section} aria-labelledby="precheck-title">
        <div className={styles.sectionHeading}>
          <h2 id="precheck-title">실업급여 계산 전 먼저 확인할 항목</h2>
          <p>
            실업급여는 금액 산식만으로 결정되지 않습니다. 계산 전에 고용보험
            이력, 퇴직 사유, 이직확인서와 실업인정 절차를 함께 확인해야 합니다.
          </p>
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.dataTable}>
            <caption>빠른 판단표</caption>
            <thead>
              <tr>
                <th scope="col">확인 항목</th>
                <th scope="col">왜 중요한지</th>
                <th scope="col">계산기에 반영되는지</th>
                <th scope="col">추가 확인 필요 여부</th>
              </tr>
            </thead>
            <tbody>
              {unemploymentQuickCheckRows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td>{row.importance}</td>
                  <td>{row.calculatorCoverage}</td>
                  <td>{row.additionalCheck}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="basis-title">
        <div className={styles.sectionHeading}>
          <h2 id="basis-title">2026년 실업급여 계산 기준</h2>
          <p>{unemploymentBasisSummary}</p>
        </div>
        <aside className={styles.policyNotice} aria-label="공식 기준 재확인 안내">
          <strong>2026년 공식 금액 기준 반영</strong>
          <p>
            {UNEMPLOYMENT_POLICY_2026.sourceNote} 법령·제도 변경이나 개인별
            이력에 따라 실제 수급 여부와 지급 시점은 달라질 수 있으므로 신청
            전 고용24 또는 고용센터에서 본인 기준을 확인해 주세요.
          </p>
        </aside>
      </section>

      <section className={styles.section} aria-labelledby="formula-title">
        <div className={styles.sectionHeading}>
          <h2 id="formula-title">1일 구직급여액 계산 방식</h2>
          <p>
            현재 계산기는 월급 기준 입력 시 월급을 30으로 나누어 1일 평균임금을
            추정하고, 직접 입력 시 입력한 1일 평균임금을 그대로 사용합니다.
          </p>
        </div>
        <dl className={styles.criteriaList}>
          <div>
            <dt>기본 산식</dt>
            <dd>추정 1일 평균임금 × 60% = 계산 전 기준 급여액</dd>
          </div>
          <div>
            <dt>상한액·하한액 적용 방식</dt>
            <dd>
              계산 전 기준 급여액이 현재 계산기의 상한액보다 높으면 상한액,
              하한액보다 낮으면 하한액을 1일 구직급여액으로 표시합니다.
            </dd>
          </div>
          <div>
            <dt>고용보험 가입기간과 소정급여일수</dt>
            <dd>
              가입기간이 길수록, 50세 이상 및 장애인 구간일수록 더 긴
              소정급여일수가 적용될 수 있습니다.
            </dd>
          </div>
          <div>
            <dt>나이 구간별 수급기간 차이</dt>
            <dd>
              현재 계산기는 50세 미만과 50세 이상 및 장애인 구간을 나누어
              120일부터 270일까지 예상 일수를 계산합니다.
            </dd>
          </div>
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="criteria-table-title">
        <div className={styles.sectionHeading}>
          <h2 id="criteria-table-title">계산 기준 요약표</h2>
          <p>
            아래 표는 화면 결과와 같은 계산 기준을 설명합니다. 수급자격 판단은
            공식 절차에서 별도로 확인해야 합니다.
          </p>
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.dataTable}>
            <caption>계산 기준 요약표</caption>
            <thead>
              <tr>
                <th scope="col">항목</th>
                <th scope="col">현재 계산기 기준</th>
                <th scope="col">공식 확인 지점</th>
              </tr>
            </thead>
            <tbody>
              {unemploymentCriteriaRows.map((row) => (
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

      <section className={styles.section} aria-labelledby="reason-title">
        <div className={styles.sectionHeading}>
          <h2 id="reason-title">자발적 퇴사와 예외 인정 가능성</h2>
          <p>
            자발적 퇴사는 일반적으로 제한될 수 있지만, 임금체불, 질병, 통근
            곤란 등 정당한 이직 사유가 인정될 가능성이 있는 경우에는 증빙과
            고용센터 확인이 필요합니다.
          </p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="procedure-title">
        <div className={styles.sectionHeading}>
          <h2 id="procedure-title">이직확인서와 실업인정 절차</h2>
          <p>
            고용24 안내에 따르면 퇴직한 회사의 상실 신고와 이직확인서 제출,
            구직 등록, 사전 교육, 수급자격 인정 신청, 실업인정 절차가 이어집니다.
            계산 결과는 이 절차를 대신하지 않습니다.
          </p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="example-title">
        <div className={styles.sectionHeading}>
          <h2 id="example-title">계산 예시</h2>
          <p>
            월급 330만원, 고용보험 가입기간 36개월, 50세 미만, 비자발적 퇴사
            입력을 현재 계산기 기준으로 계산한 예시입니다.
          </p>
        </div>
        <div className={styles.exampleGrid}>
          <article className={styles.exampleCard}>
            <h3>예시 입력</h3>
            <dl>
              {unemploymentExampleInputItems.map(({ label, value }) => (
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
              {unemploymentExampleResultItems.map(({ label, value }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="interpretation-title">
        <div className={styles.sectionHeading}>
          <h2 id="interpretation-title">결과 해석 방법</h2>
          <p>
            화면에 표시되는 결과는 예상 계산입니다. 실제 지급 여부는 고용보험
            이력, 퇴직 사유, 이직확인서, 실업인정 절차에 따라 달라질 수 있습니다.
          </p>
        </div>
        <div className={styles.interpretationGrid}>
          {unemploymentInterpretationCards.map(({ title, description }) => (
            <article className={styles.infoCard} key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="excluded-title">
        <div className={styles.sectionHeading}>
          <h2 id="excluded-title">이 계산기에 포함되지 않는 항목</h2>
          <p>
            다음 항목은 현재 계산기가 자동 판단하지 않는 영역입니다. 신청 전
            공식 기관에서 확인해 주세요.
          </p>
        </div>
        <ul className={styles.exclusionList}>
          {unemploymentExcludedItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="checklist-title">
        <div className={styles.sectionHeading}>
          <h2 id="checklist-title">신청 전 체크리스트</h2>
        </div>
        <ol className={styles.checkList}>
          {unemploymentChecklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="faq-title">
        <div className={styles.sectionHeading}>
          <h2 id="faq-title">자주 묻는 질문</h2>
        </div>
        <div className={styles.faqList}>
          {unemploymentFaqs.map(({ question, answer }) => (
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
          {unemploymentRelatedCalculators.map(({ href, title, description }) => (
            <a
              className={`${styles.relatedCard} ${styles.relatedLink}`}
              href={href}
              key={href}
            >
              <h3>{title}</h3>
              <p>{description}</p>
            </a>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="sources-title">
        <div className={styles.sectionHeading}>
          <h2 id="sources-title">공식 출처</h2>
          <p>
            {formatKoreanDate(UNEMPLOYMENT_POLICY_2026.basisDate)} 기준으로
            아래 공식 기관 자료를 확인했습니다.
          </p>
        </div>
        <ul className={styles.sourceList}>
          {unemploymentSources.map(
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
        법률 자문이나 고용센터 심사 결과를 대신하지 않습니다. 공식 기준은 변경될
        수 있으므로 신청 전 고용보험, 고용24 또는 관할 고용센터에서 최신 기준과
        본인 이력을 확인해 주세요.
      </aside>
    </div>
  );
}
