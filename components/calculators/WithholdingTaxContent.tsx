import styles from "./WithholdingTaxContent.module.css";

const faqs = [
  ["프리랜서면 무조건 3.3%를 떼나요?", "아닙니다. 이 계산기는 일반적인 국내 거주자의 원천징수 대상 인적용역 사업소득을 전제로 합니다. 실제 소득 구분과 지급 조건은 계약 및 사실관계에 따라 달라질 수 있습니다."],
  ["3.3%는 소득세가 전부인가요?", "아닙니다. 일반적으로 소득세 3%와 그 소득세의 10%인 개인지방소득세가 합쳐져 3.3%로 알려져 있습니다."],
  ["3.3%를 떼면 종합소득세 신고를 안 해도 되나요?", "원천징수는 미리 납부하는 세액입니다. 종합소득세 신고 의무와 최종 정산은 소득과 상황에 따라 별도로 확인해야 합니다."],
  ["실수령액에서 세전 금액을 역산할 수 있나요?", "가능합니다. 이 계산기는 3.3% 역산 기준 금액부터 끝수 처리까지 다시 계산해, 목표 실수령액 이상이 되도록 보여드립니다."],
  ["3.3%를 떼면 근로자가 아닌 건가요?", "아닙니다. 원천징수 방식만으로 근로자성을 판단할 수 없습니다. 업무 지휘·감독, 전속성 등 구체적 사실관계를 함께 봐야 합니다."],
  ["소액을 받아도 3.3%를 원천징수하나요?", "2024년 7월 1일 이후 지급하는 인적용역 사업소득은 소득세 원천징수액이 1,000원 미만이어도 소액부징수 예외가 적용될 수 있습니다. 이 계산기는 그 일반 안내를 반영합니다."],
] as const;

export function WithholdingTaxContent() {
  return <div className={styles.content}>
    <section><h2>3.3% 원천징수란 무엇인가요?</h2><p>일반적인 원천징수 대상 인적용역 사업소득을 지급할 때, 지급자가 소득세와 개인지방소득세를 미리 떼어 납부하는 방식을 말합니다. 통상 소득세 3%와 개인지방소득세 0.3%를 합쳐 3.3%라고 부릅니다.</p></section>
    <section><h2>소득세 3% + 개인지방소득세 0.3% 구조</h2><dl><div><dt>소득세</dt><dd>세전 지급액의 3%를 계산한 뒤 10원 미만을 버립니다.</dd></div><div><dt>개인지방소득세</dt><dd>위 소득세 원천징수액의 10%를 계산한 뒤 10원 미만을 버립니다.</dd></div><div><dt>예상 원천징수액</dt><dd>소득세와 개인지방소득세를 합한 금액입니다.</dd></div></dl></section>
    <section><h2>세전 금액과 실수령액 계산 방법</h2><p>세전 금액에서 소득세와 개인지방소득세를 각각 계산해 합산한 뒤 빼면 예상 실수령액입니다. 반대로 계산할 때는 단순히 0.967로 나누지 않고, 3.3% 역산 기준 금액부터 끝수 처리까지 적용한 forward 결과가 목표 금액 이상인지 다시 확인합니다.</p></section>
    <section><h2>3.3%가 최종 세금은 아닌 이유</h2><p>원천징수액은 지급 시점에 미리 납부하는 금액입니다. 종합소득세 신고 때 다른 소득, 필요경비와 공제 등을 반영해 최종 세액이 달라지고 정산될 수 있습니다. 이 계산기는 신고세액·환급액·필요경비를 계산하지 않습니다.</p></section>
    <section><h2>적용 전 확인할 점</h2><p>모든 프리랜서나 모든 계약에 3.3%가 적용되는 것은 아닙니다. 고용관계에 따라 근로를 제공하고 받은 대가는 근로소득이 될 수 있으며, 3.3% 원천징수 여부만으로 근로자성은 결정되지 않습니다.</p></section>
    <section><h2>자주 묻는 질문</h2><div className={styles.faqs}>{faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
    <section><h2>공식 출처</h2><p>아래 자료는 2026-08-21을 기준으로 확인했습니다. 실제 지급·신고에는 최신 법령과 관할 기관 안내가 우선합니다.</p><ul className={styles.sources}><li><a href="https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7902&mi=6622" target="_blank" rel="noopener noreferrer">국세청 사업소득 원천징수방법</a><span>원천징수 대상 사업소득금액의 3% 안내</span></li><li><a href="https://nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7701&mi=2289" target="_blank" rel="noopener noreferrer">국세청 원천징수 개요</a><span>인적용역 사업소득 소액부징수 예외 안내</span></li><li><a href="https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=280405" target="_blank" rel="noopener noreferrer">국가법령정보센터 소득세법 제129조·제86조</a><span>원천징수세율 및 소액부징수</span></li><li><a href="https://www.law.go.kr/LSW/lsLawLinkInfo.do?chrClsCd=010202&lsId=001649&lsJoLnkSeq=1000226093&print=print" target="_blank" rel="noopener noreferrer">국가법령정보센터 지방세법 제103조의13</a><span>개인지방소득세 특별징수</span></li><li><a href="https://www.law.go.kr/LSW/lsLinkCommonInfo.do?lsJoLnkSeq=1031453581" target="_blank" rel="noopener noreferrer">국가법령정보센터 국고금 관리법 제47조</a><span>국고금의 10원 미만 끝수 계산</span></li></ul></section>
    <aside>계산 결과는 일반적인 인적용역 사업소득의 입력값 기준 예상값이며, 실제 소득 구분·지급 조건·신고 결과에 따라 달라질 수 있습니다.</aside>
  </div>;
}
