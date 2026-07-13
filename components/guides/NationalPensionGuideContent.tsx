import Link from "next/link";
import {
  nationalPensionGuideFaqs,
  nationalPensionGuideSources,
} from "./nationalPensionGuideData";
import styles from "./NationalPensionGuide.module.css";

const reasons = [
  ["보험료율 변경", "2025년 공제액과 비교한다면 2026년부터의 보험료율 변화가 원인일 수 있습니다. 7월 상한 변경과는 적용 시점이 다릅니다."],
  ["상한·하한 변경", "2026년 7월부터 기준소득월액 범위가 41만원~659만원으로 바뀌었습니다. 기존 상한 637만원을 넘는 구간에서만 상한 자체가 공제액 변화의 직접 원인이 될 수 있습니다."],
  ["7월 정기결정", "사업장가입자는 전년도 해당 사업장에서 받은 소득총액을 기준으로 산정한 기준소득월액을 7월부터 다음 해 6월까지 적용할 수 있습니다."],
  ["상여·성과급과 과세수당", "지급 항목과 사업장 신고 방식에 따라 전년도 소득총액이나 신고 기준에 영향을 줄 수 있습니다. 한 달의 기본급만 보고 제외 여부를 판단하기 어렵습니다."],
  ["신고소득 변경", "입사·복직·보수 변경 등으로 사업장이 신고한 기준소득월액이 실제 이번 달 월급과 다를 수 있습니다."],
  ["소급공제·정산", "이전 월의 변경분이나 정산이 한 번에 반영되면 같은 월급에서도 공제액이 평소와 달라 보일 수 있습니다."],
  ["가입 유형 차이", "직장가입자와 지역가입자·임의가입자는 부담 방식과 산정에 쓰는 정보가 다릅니다. 지역가입자의 소득·재산 반영은 이 가이드의 직장가입자 사례로 판단할 수 없습니다."],
] as const;

const cases = [
  {
    title: "기존 상한 이하",
    income: "기준소득월액 600만원",
    before: "637만원 상한 적용 전: 285,000원",
    after: "659만원 상한 적용 후: 285,000원",
    change: "변화 0원",
    reason: "600만원은 기존 상한보다 낮아 상한이 바뀌어도 산정 기준이 그대로입니다. 공제액이 달랐다면 정기결정이나 신고 기준을 먼저 확인해야 합니다.",
  },
  {
    title: "기존·신규 상한 사이",
    income: "기준소득월액 650만원",
    before: "637만원 상한 적용 전: 302,570원",
    after: "659만원 상한 적용 후: 308,750원",
    change: "변화 +6,180원",
    reason: "기존에는 637만원까지만 산정했지만, 7월 이후에는 650만원이 새 상한 안에 들어와 본인 부담액이 늘어날 수 있습니다.",
  },
  {
    title: "신규 상한 이상",
    income: "기준소득월액 700만원",
    before: "637만원 상한 적용 전: 302,570원",
    after: "659만원 상한 적용 후: 313,020원",
    change: "변화 +10,450원",
    reason: "두 시점 모두 상한이 적용되지만 상한 자체가 22만원 올라 새로운 상한 기준의 본인 부담액까지 증가할 수 있습니다.",
  },
] as const;

export function NationalPensionGuideContent() {
  return (
    <div className={styles.content}>
      <section className={styles.section} aria-labelledby="guide-summary-title">
        <div className={styles.sectionHeading}>
          <h2 id="guide-summary-title">먼저 이렇게 구분하세요</h2>
        </div>
        <div className={styles.summary}>
          <p>2026년 7월에 국민연금 보험료율이 다시 오른 것은 아닙니다. 2026년 요율 변화와 7월 기준소득월액 상·하한 변경은 시점과 원인이 다릅니다.</p>
          <p>7월 명세서에서는 상한 변경뿐 아니라 기준소득월액 정기결정이 함께 보일 수 있습니다. 실제 월급이 같아도 신고된 기준소득월액이 달라지면 공제액은 달라질 수 있습니다.</p>
          <p>따라서 월급 액수 하나만 보지 말고 적용 월, 기준소득월액, 소급·정산 항목을 순서대로 확인하는 것이 좋습니다.</p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="timing-title">
        <div className={styles.sectionHeading}>
          <h2 id="timing-title">2026년 변경 시점은 두 번으로 나눠 봅니다</h2>
          <p>1월의 보험료율과 7월의 기준소득월액 범위를 하나의 인상으로 합치면 명세서 변화의 원인을 잘못 짚을 수 있습니다.</p>
        </div>
        <div className={styles.timeline}>
          <article>
            <h3>2026년 1월: 보험료율</h3>
            <p>총 보험료율은 9%에서 9.5%로 바뀌었고, 사업장가입자는 가입자와 사용자가 절반씩 부담하는 구조입니다. 일반적인 근로자 본인 부담률은 4.5%에서 4.75%가 됩니다.</p>
            <strong>비교 대상: 2025년 명세서와 2026년 1월 이후 명세서</strong>
          </article>
          <article>
            <h3>2026년 7월: 기준소득월액 상·하한</h3>
            <p>상한은 637만원에서 659만원으로, 하한은 40만원에서 41만원으로 바뀌었습니다. 이 범위는 2027년 6월 30일까지 적용됩니다.</p>
            <strong>비교 대상: 2026년 6월과 7월 이후 명세서</strong>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="range-title">
        <div className={styles.sectionHeading}>
          <h2 id="range-title">상한 변경이 직접 영향을 주는 구간</h2>
          <p>아래 구분은 직장가입자의 신고 기준소득월액을 중심으로 한 판단 보조입니다. 실제 월급과 같다고 가정하면 안 됩니다.</p>
        </div>
        <dl className={styles.impactList}>
          <div><dt>637만원 이하</dt><dd>기존 상한 안에 있던 구간입니다. 7월 상한 변경만으로 공제액이 늘지는 않습니다. 금액이 달라졌다면 정기결정·상여·신고소득·정산을 확인해야 합니다.</dd></div>
          <div><dt>637만원 초과~659만원 미만</dt><dd>기존에는 637만원까지만 산정했지만, 새 상한 안에서는 실제 신고 기준소득월액이 더 반영될 수 있습니다. 이 구간은 7월 상한 변경의 직접 영향을 받을 수 있습니다.</dd></div>
          <div><dt>659만원 이상</dt><dd>기존과 새 기준 모두 상한이 적용되지만, 상한 자체가 659만원으로 높아졌습니다. 이후 월급이 더 높아져도 같은 신고 기준이 유지되면 새 상한을 넘는 부분까지 계속 비례하지는 않습니다.</dd></div>
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="salary-base-title">
        <div className={styles.sectionHeading}>
          <h2 id="salary-base-title">실제 월급과 기준소득월액이 다른 이유</h2>
          <p>급여명세서의 지급총액은 이번 달에 지급한 금액이고, 기준소득월액은 국민연금 보험료 산정을 위해 신고·결정된 금액입니다.</p>
        </div>
        <ul className={styles.checkList}>
          <li>사업장가입자는 전년도 해당 사업장에서 얻은 소득총액을 기준으로 산정한 금액을 7월부터 다음 해 6월까지 적용할 수 있습니다.</li>
          <li>상여금·성과급·과세수당이 전년도 소득총액 또는 사업장 신고에 영향을 줄 수 있습니다.</li>
          <li>입사·복직·보수 변경 시에는 사업장이 공단에 신고한 예상 가능한 근로소득이 기준이 될 수 있습니다.</li>
          <li>명세서에서는 국민연금 공제 줄, 기준소득월액 또는 보수월액 표기, 적용 월, 소급·정산 항목을 함께 확인하세요.</li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="reasons-title">
        <div className={styles.sectionHeading}>
          <h2 id="reasons-title">공제액이 달라지는 원인별 체크</h2>
          <p>한 가지 원인만 찾기보다 비교한 월과 신고 기준을 먼저 고정한 뒤 아래 항목을 좁혀 가는 편이 안전합니다.</p>
        </div>
        <div className={styles.reasonGrid}>
          {reasons.map(([title, description]) => <article key={title}><h3>{title}</h3><p>{description}</p></article>)}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="cases-title">
        <div className={styles.sectionHeading}>
          <h2 id="cases-title">숫자로 보는 7월 상한 변경 사례</h2>
          <p>아래는 기준소득월액에 근로자 부담률 4.75%를 적용하고, 연봉 실수령액 계산기의 1,000원 단위 기준소득월액·10원 미만 절사 순서를 따라 검산한 예상 사례입니다. 실제 고지액은 사업장 신고와 공단 결정이 우선합니다.</p>
        </div>
        <div className={styles.caseGrid}>
          {cases.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <dl className={styles.caseList}>
                <div><dt>입력 기준</dt><dd>{item.income}</dd></div>
                <div><dt>적용 전</dt><dd>{item.before}</dd></div>
                <div><dt>적용 후</dt><dd>{item.after}</dd></div>
                <div><dt>본인 부담 변화</dt><dd className={styles.caseChange}>{item.change}</dd></div>
              </dl>
              <p>{item.reason}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="under-cap-title">
        <div className={styles.sectionHeading}>
          <h2 id="under-cap-title">637만원 이하인데도 공제액이 달라졌다면</h2>
          <p>상한 변경의 직접 대상이 아니어도 금액은 달라질 수 있습니다. 아래 항목을 확인하면 원인을 분류하는 데 도움이 됩니다.</p>
        </div>
        <ul className={styles.checkList}>
          <li>2026년 7월분을 2026년 6월분과 비교했는지, 또는 2025년·2026년 1월분과 비교했는지 구분합니다.</li>
          <li>7월 정기결정으로 기준소득월액이 바뀌었는지 확인합니다.</li>
          <li>전년도 소득총액, 상여금·성과급·과세수당과 사업장 신고소득 변동을 살펴봅니다.</li>
          <li>소급공제·정산 항목이 별도 줄로 있거나 한 달에 합산됐는지 확인합니다.</li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="payslip-title">
        <div className={styles.sectionHeading}>
          <h2 id="payslip-title">급여명세서 확인 순서</h2>
          <p>명세서를 보면서 다음 순서로 체크하면 상한 변경과 개인별 사유를 구분하기 쉽습니다.</p>
        </div>
        <ol className={styles.checkList}>
          <li>국민연금 공제가 적용된 월이 2026년 7월 이후인지 확인합니다.</li>
          <li>명세서나 회사 급여 담당자에게 기준소득월액 또는 신고 보수월액을 확인합니다.</li>
          <li>근로자 부담률 4.75% 적용분인지, 2025년 9% 총요율과 비교한 것은 아닌지 확인합니다.</li>
          <li>상여금·성과급·과세수당과 전년도 소득총액에 변동이 있었는지 봅니다.</li>
          <li>소급공제·정산·입퇴사 또는 휴직 관련 항목이 있는지 확인합니다.</li>
          <li>사업장 신고 내용이나 공단의 개별 결정이 의심되면 급여 담당자와 국민연금공단에 문의합니다.</li>
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="calculator-title">
        <div className={styles.sectionHeading}>
          <h2 id="calculator-title">계산기로 예상값을 비교하는 방법</h2>
          <p>계산기는 입력한 월급과 공개 기준에 따른 예상값을 비교하는 데 쓰고, 명세서의 신고 기준소득월액·소급·정산까지 확정하는 도구로 사용하지는 마세요.</p>
        </div>
        <div className={styles.relatedGrid}>
          <a href="/calculators/social-insurance/"><h3>4대보험 계산기</h3><p>월 급여와 비과세 금액을 넣어 국민연금 등 근로자 부담 예상액을 확인합니다.</p></a>
          <a href="/calculators/salary/"><h3>연봉 실수령액 계산기</h3><p>연봉 기준의 국민연금·세금 공제 흐름을 함께 비교할 때 사용합니다.</p></a>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="limits-title">
        <div className={styles.sectionHeading}>
          <h2 id="limits-title">자동으로 판단할 수 없는 항목</h2>
        </div>
        <ul className={styles.checkList}>
          <li>사업장 신고 오류, 가입 이력, 소급 변경과 개별 정산</li>
          <li>납부 예외·특수 상태와 공단의 개별 결정</li>
          <li>지역가입자의 소득·재산 반영 및 직장가입자와 다른 부담 구조</li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="faq-title">
        <div className={styles.sectionHeading}><h2 id="faq-title">자주 묻는 질문</h2></div>
        <div className={styles.faqList}>
          {nationalPensionGuideFaqs.map(({ question, answer }) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="sources-title">
        <div className={styles.sectionHeading}><h2 id="sources-title">공식 출처와 확인 기준</h2></div>
        <ul className={styles.sourceList}>
          {nationalPensionGuideSources.map((source) => <li key={`${source.organization}-${source.title}`}><a href={source.href} target="_blank" rel="noopener noreferrer">{source.organization} · {source.title}</a><span>{source.appliedAt} · {source.checkedAt}</span></li>)}
        </ul>
      </section>

      <aside className={styles.notice} aria-label="가이드 확인 범위">
        <h2>확인 범위</h2>
        <p>이 가이드는 국민연금 공제 변화의 가능한 원인을 분류하기 위한 예상 확인용 콘텐츠입니다. 실제 공제는 사업장 신고와 국민연금공단 결정이 우선하며, 가입 유형·소급 변경·개별 정산과 민원·상담 결과를 대신하지 않습니다. 계산 방식의 운영 원칙은 <Link href="/methodology/">계산 방법론</Link>에서 확인할 수 있습니다.</p>
      </aside>
    </div>
  );
}
