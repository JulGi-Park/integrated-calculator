import styles from "./SeveranceContent.module.css";

export const overtimePayFaqs = [
  {
    question: "야간근로 시간은 연장근로 시간과 따로 입력하나요?",
    answer:
      "네. 야간근로는 추가 가산 시간으로 봅니다. 연장근로 2시간이 모두 야간이면 연장 2시간과 야간 2시간을 함께 입력해 총 2.0배 구조로 계산합니다.",
  },
  {
    question: "5인 미만 사업장도 같은 방식으로 계산되나요?",
    answer:
      "상시근로자 수에 따라 법정 가산수당 적용 기준이 달라질 수 있습니다. 이 계산기는 5인 이상 사업장 적용 가능성을 전제로 참고값을 보여줍니다.",
  },
  {
    question: "포괄임금제도 결과를 그대로 쓰면 되나요?",
    answer:
      "포괄임금제는 근로계약, 임금 항목, 실제 근무 기록에 따라 산정 방식 확인이 필요합니다. 급여명세서와 근로계약서를 함께 확인하세요.",
  },
  {
    question: "휴게시간이나 주휴일 판정도 자동 반영되나요?",
    answer:
      "아니요. 이번 계산기는 입력한 시간만 계산하며 휴게시간 자동 차감, 주휴일 자동 판정, 출퇴근 시간 분해는 포함하지 않습니다.",
  },
] as const;

const criteria = [
  ["기준일", "2026년 7월 5일 기준으로 근로기준법 제56조의 연장·야간 및 휴일근로 가산 기준을 참고합니다."],
  ["연장근로", "입력한 연장근로 시간에 시급의 1.5배를 곱해 계산합니다."],
  ["야간근로", "오후 10시부터 다음 날 오전 6시 사이 근로의 추가 가산분으로 보고 시급의 0.5배를 곱합니다."],
  ["휴일근로", "8시간 이내는 1.5배, 8시간 초과분은 2.0배로 나누어 계산합니다."],
] as const;

const examples = [
  ["시급 10,000원, 연장 2시간", "연장근로수당 30,000원"],
  ["시급 10,000원, 연장 2시간과 야간 2시간", "연장 30,000원 + 야간가산 10,000원 = 40,000원"],
  ["시급 10,000원, 휴일근로 8시간", "휴일근로 8시간 이내 수당 120,000원"],
] as const;

const cautions = [
  "근로계약, 취업규칙, 단체협약에 따라 실제 지급액이 달라질 수 있습니다.",
  "포괄임금제는 실제 산정 방식 확인이 필요합니다.",
  "감시·단속적 근로자는 예외가 있을 수 있습니다.",
  "5인 미만 사업장은 적용 기준이 다를 수 있습니다.",
  "특례 업종, 휴게시간, 주휴일 판단에 따라 달라질 수 있습니다.",
  "실제 통상임금 산정 방식에 따라 달라질 수 있습니다.",
  "급여명세서와 근로계약서를 함께 확인해야 합니다.",
] as const;

export const overtimePayWebApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "연장·야간·휴일근로수당 계산기",
  url: "https://gyesanbox.kr/calculators/overtime-pay/",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description:
    "시급과 연장·야간·휴일근로 시간을 입력해 예상 근로수당을 계산합니다.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "KRW",
  },
} as const;

export const overtimePayBreadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈", item: "https://gyesanbox.kr/" },
    {
      "@type": "ListItem",
      position: 2,
      name: "계산기 목록",
      item: "https://gyesanbox.kr/calculators/",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "연장·야간·휴일근로수당 계산기",
      item: "https://gyesanbox.kr/calculators/overtime-pay/",
    },
  ],
} as const;

export const overtimePayFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: overtimePayFaqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
} as const;

export function OvertimePayContent() {
  return (
    <div className={styles.content}>
      <section className={styles.section} aria-labelledby="overtime-criteria">
        <div className={styles.sectionHeading}>
          <h2 id="overtime-criteria">계산 기준</h2>
          <p>
            근로기준법 제56조 연장ㆍ야간 및 휴일 근로 기준을 참고해 입력한
            시간별 예상 수당을 분리 계산합니다.
          </p>
        </div>
        <dl className={styles.criteriaList}>
          {criteria.map(([title, description]) => (
            <div key={title}>
              <dt>{title}</dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="overtime-example">
        <div className={styles.sectionHeading}>
          <h2 id="overtime-example">계산 예시</h2>
          <p>야간근로는 추가 가산 시간으로 입력하는 방식입니다.</p>
        </div>
        <div className={styles.exampleGrid}>
          {examples.map(([input, result]) => (
            <article className={styles.exampleCard} key={input}>
              <h3>{input}</h3>
              <p>{result}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="overtime-cautions">
        <div className={styles.sectionHeading}>
          <h2 id="overtime-cautions">적용되지 않는 예외</h2>
          <p>다음 항목은 자동 판정하지 않으므로 실제 임금 자료와 함께 확인해 주세요.</p>
        </div>
        <ul className={styles.exclusionList}>
          {cautions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="overtime-faq">
        <div className={styles.sectionHeading}>
          <h2 id="overtime-faq">자주 묻는 질문</h2>
        </div>
        <div className={styles.faqList}>
          {overtimePayFaqs.map(({ question, answer }) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="overtime-related">
        <div className={styles.sectionHeading}>
          <h2 id="overtime-related">관련 계산기</h2>
        </div>
        <div className={styles.relatedGrid}>
          <a className={`${styles.relatedCard} ${styles.relatedLink}`} href="/calculators/salary/">
            <h3>연봉 실수령액 계산기</h3>
            <p>월급과 공제액을 함께 확인할 수 있습니다.</p>
          </a>
          <a className={`${styles.relatedCard} ${styles.relatedLink}`} href="/calculators/severance/">
            <h3>퇴직금 계산기</h3>
            <p>평균임금 기준 예상 퇴직금을 계산합니다.</p>
          </a>
          <a className={`${styles.relatedCard} ${styles.relatedLink}`} href="/calculators/unemployment/">
            <h3>실업급여 계산기</h3>
            <p>구직급여 예상액과 수급기간을 확인합니다.</p>
          </a>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="overtime-sources">
        <div className={styles.sectionHeading}>
          <h2 id="overtime-sources">공식 출처</h2>
          <p>2026년 7월 5일 기준 근로기준법 제56조를 참고했습니다.</p>
        </div>
        <ul className={styles.sourceList}>
          <li>
            <div>
              <strong>국가법령정보센터</strong>
              <span>근로기준법 제56조 연장ㆍ야간 및 휴일 근로</span>
            </div>
            <a href="https://www.law.go.kr/법령/근로기준법/제56조" target="_blank" rel="noopener noreferrer">
              원문 보기
            </a>
          </li>
        </ul>
      </section>

      <aside className={styles.disclaimer} aria-label="면책 문구">
        본 계산기는 입력값 기준 참고 계산기이며 법률 자문을 제공하지 않습니다.
        실제 지급액은 사업장 규모, 통상임금 산정 방식, 근로계약, 취업규칙,
        단체협약, 휴게시간과 주휴일 판단에 따라 달라질 수 있습니다.
      </aside>
    </div>
  );
}
