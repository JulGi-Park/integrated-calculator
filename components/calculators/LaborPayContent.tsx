import {
  laborPayExampleInput,
  laborPayExampleResult,
  laborPayExclusions,
  laborPayFaqs,
  laborPayFormulas,
  laborPayOfficialSources,
} from "./laborPayContentData";
import styles from "./SellerMarginContent.module.css";

export function LaborPayContent() {
  return (
    <div className={styles.content}>
      <section className={styles.section} aria-labelledby="labor-interpretation">
        <div className={styles.sectionHeading}>
          <h2 id="labor-interpretation">결과를 이렇게 해석하세요</h2>
          <p>
            주휴수당은 실제 출근시간만으로 판단하지 않고 소정근로시간과
            소정근로일 개근 여부를 함께 확인합니다.
          </p>
        </div>
        <div className={styles.interpretationGrid}>
          <article className={styles.infoCard}>
            <h3>지급 대상 여부</h3>
            <p>4주 평균 또는 1주 소정근로시간 15시간 이상과 개근 여부를 봅니다.</p>
          </article>
          <article className={styles.infoCard}>
            <h3>예상 주휴시간</h3>
            <p>40시간 기준 8시간에 비례해 계산하며 최대 8시간으로 제한합니다.</p>
          </article>
          <article className={styles.infoCard}>
            <h3>예상 주급</h3>
            <p>실제 근로시간 수당에 예상 주휴수당을 더한 참고용 금액입니다.</p>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="labor-requirements">
        <div className={styles.sectionHeading}>
          <h2 id="labor-requirements">주휴수당 발생 요건</h2>
          <p>
            주휴수당은 받을 수 있는지와 금액을 나누어 확인해야 합니다.
            계산기는 입력값으로 예상 금액을 계산하지만, 근로자성이나 실제
            지급 의무를 확정하지 않습니다.
          </p>
        </div>
        <div className={styles.interpretationGrid}>
          <article className={styles.infoCard}>
            <h3>15시간 기준</h3>
            <p>
              4주 평균 또는 해당 기간의 1주 소정근로시간이 15시간 이상인지
              먼저 확인합니다.
            </p>
          </article>
          <article className={styles.infoCard}>
            <h3>개근 조건</h3>
            <p>
              법정 주휴일은 1주 동안의 소정근로일을 개근한 근로자에게
              부여되는 것을 기준으로 설명합니다.
            </p>
          </article>
          <article className={styles.infoCard}>
            <h3>계약과 실제 근무</h3>
            <p>
              소정근로시간과 실제 근로시간이 다르면 지급 대상 판단과 지급액
              산정이 달라질 수 있습니다.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="labor-formula">
        <div className={styles.sectionHeading}>
          <h2 id="labor-formula">계산 기준과 계산식</h2>
          <p>
            2026년 최저임금 시간급 10,320원을 기준 안내값으로 표시하며,
            실제 입력한 시급으로 계산합니다.
          </p>
        </div>
        <dl className={styles.formulaList}>
          {laborPayFormulas.map(({ title, formula }) => (
            <div key={title}>
              <dt>{title}</dt>
              <dd>{formula}</dd>
            </div>
          ))}
        </dl>
        <p className={styles.roundingNote}>
          금액은 원 단위로 반올림합니다. 월 환산액은 주 40시간, 월 209시간
          기준 안내값이며 고정 월급 산정 결과가 아닙니다.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="labor-boundary">
        <div className={styles.sectionHeading}>
          <h2 id="labor-boundary">15시간 경계와 월급제 안내</h2>
          <p>
            정확히 주 15시간은 계산기에서 대상 가능 상태로 계산하고, 15시간
            미만은 주휴수당을 0원으로 표시합니다.
          </p>
        </div>
        <ul className={styles.exclusionList}>
          <li>
            주 40시간 미만 단시간 근로자는 40시간 기준 8시간에 비례해
            주휴시간을 계산합니다.
          </li>
          <li>
            주 40시간 이상 입력은 주휴시간을 8시간으로 제한해 계산합니다.
          </li>
          <li>
            월급제 근로자는 주휴수당이 월급에 이미 포함되어 있을 수 있으므로
            임금 항목과 근로계약서를 함께 확인해야 합니다.
          </li>
          <li>
            퇴사하는 주, 결근, 지각·조퇴, 휴업, 근무표 변경은 사업장 기준과
            실제 근로관계에 따라 판단이 달라질 수 있습니다.
          </li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="labor-example">
        <div className={styles.sectionHeading}>
          <h2 id="labor-example">계산 예시</h2>
          <p>아래 예시는 2026년 최저임금과 주 20시간 개근을 가정한 사례입니다.</p>
        </div>
        <div className={styles.exampleGrid}>
          <article className={styles.exampleCard}>
            <h3>예시 입력</h3>
            <dl>
              {laborPayExampleInput.map(({ label, value }) => (
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
              {laborPayExampleResult.map(({ label, value }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="labor-exclusions">
        <div className={styles.sectionHeading}>
          <h2 id="labor-exclusions">실제 지급액이 달라지는 이유</h2>
          <p>
            아래 조건은 계산기가 자동으로 판단하지 않습니다. 결과가 급여명세서
            금액과 다르면 먼저 이 항목을 확인해 주세요.
          </p>
        </div>
        <ul className={styles.exclusionList}>
          {laborPayExclusions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="labor-sources">
        <div className={styles.sectionHeading}>
          <h2 id="labor-sources">공식 출처</h2>
          <p>계산 기준 문구는 아래 공식 자료를 2026년 7월 10일 확인해 정리했습니다.</p>
        </div>
        <ul className={styles.exclusionList}>
          {laborPayOfficialSources.map((source) => (
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

      <section className={styles.section} aria-labelledby="labor-related">
        <div className={styles.sectionHeading}>
          <h2 id="labor-related">관련 계산기</h2>
        </div>
        <div className={styles.interpretationGrid}>
          <a className={styles.infoCard} href="/calculators/salary/">
            <h3>연봉 실수령액 계산기</h3>
            <p>월급제 또는 연봉제 근로자의 공제 후 실수령액을 확인합니다.</p>
          </a>
          <a className={styles.infoCard} href="/calculators/social-insurance/">
            <h3>4대보험 계산기</h3>
            <p>월 급여 기준 4대보험 근로자 부담액을 따로 계산합니다.</p>
          </a>
          <a className={styles.infoCard} href="/calculators/severance/">
            <h3>퇴직금 계산기</h3>
            <p>근속기간과 평균임금 기준 예상 퇴직금을 확인합니다.</p>
          </a>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="labor-faq">
        <div className={styles.sectionHeading}>
          <h2 id="labor-faq">자주 묻는 질문</h2>
        </div>
        <div className={styles.faqList}>
          {laborPayFaqs.map(({ question, answer }) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <aside className={styles.disclaimer} aria-label="계산 결과 안내">
        계산 결과는 입력값을 바탕으로 한 참고용 예상값입니다. 임금 체불,
        분쟁, 신고 여부처럼 중요한 판단은 고용노동부 또는 노무 전문가 확인을
        권장합니다.
      </aside>
    </div>
  );
}
