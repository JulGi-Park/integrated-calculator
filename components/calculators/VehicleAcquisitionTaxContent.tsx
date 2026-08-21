import { VEHICLE_ACQUISITION_TAX_POLICY } from "@/lib/calculators/vehicle-acquisition-tax";
import styles from "./VehicleAcquisitionTaxContent.module.css";

const sources = [
  ["지방세법 제10조의3·제10조의5", "https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1031046525"],
  ["지방세법 제12조·시행령 제23조", "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=131397"],
  ["지방세특례제한법 제66조·제67조·제180조", "https://www.law.go.kr/LSW/lsInfoP.do?ancYnChk=0&chrClsCd=010202&efYd=20260331&lsiSeq=281907&urlMode=lsInfoP"],
  ["2026년도 지방세 시가표준액 조사산정 업무요령", "https://mois.go.kr/frt/bbs/type001/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000012&nttId=123083"],
] as const;

export const vehicleAcquisitionTaxFaqs = [
  ["3천만원 자동차 취득세는 얼마인가요?", "비영업용 일반 승용차로 보고 과세표준 3천만원에 7%를 적용하면 산출 취득세는 210만원입니다. 감면 대상 여부는 별도로 확인해야 합니다."],
  ["중고차는 실제 구매가격으로만 계산하나요?", "유상승계취득 차량은 실제 취득가격 신고가액이 시가표준액보다 낮거나 신고가 없으면 시가표준액을 취득당시가액으로 봅니다. 이 계산기는 두 값 중 높은 금액을 사용합니다."],
  ["경차 취득세는 무조건 0원인가요?", "아닙니다. 비영업용 경형 승용은 2027년 12월 31일까지 75만원 한도 감면을 예상 반영하며, 적용 요건은 실제 등록 시 확인해야 합니다."],
  ["전기차 취득세 감면은 2026년에도 있나요?", "전기자동차는 2026년 12월 31일까지 취득세 140만원 한도 감면 규정을 기준으로 계산합니다. 고시 대상 차량인지 확인이 필요합니다."],
  ["하이브리드 취득세 감면은 2026년에도 있나요?", "과거 하이브리드 감면 규정을 현재 기준과 혼동하지 않도록 이 계산기는 하이브리드 자동 감면을 적용하지 않습니다."],
] as const;

export function VehicleAcquisitionTaxContent() {
  return <div className={styles.content}>
    <section><p className={styles.eyebrow}>자동차 취득세 안내</p><h2>자동차 취득세란?</h2><p>자동차를 취득할 때 과세표준과 차량 구분에 따라 계산하는 지방세입니다. 흔히 취등록세라고 부르기도 하지만, 이 페이지는 현재 세목인 취득세 예상액만 다룹니다.</p></section>
    <section><p className={styles.eyebrow}>2026 기본 세율</p><h2>차량 유형별 기본 취득세율</h2><div className={styles.grid}><p><strong>일반 승용차 7%</strong>비영업용 일반 승용자동차</p><p><strong>경형 승용차 4%</strong>비영업용 경형 승용자동차</p><p><strong>승합·화물 등 5%</strong>비영업용 승용차 외 자동차</p><p><strong>영업용 4%</strong>영업용 자동차</p></div></section>
    <section><h2>과세표준과 중고차 계산</h2><p>신차의 판매가격을 언제나 법적 과세표준과 동일하다고 단정하지 않습니다. 중고차 유상취득은 실제 취득가격과 차량 시가표준액을 함께 입력해 높은 금액을 예상 과세표준으로 사용합니다. 사고·화재에 따른 가치 하락이나 법인의 특수관계 거래 등 예외는 자동 판정하지 않습니다.</p></section>
    <section><h2>차량 자체 감면</h2><ul><li>전기자동차: {VEHICLE_ACQUISITION_TAX_POLICY.reliefs.electric.expiresAt}까지 140만원 한도 예상 감면</li><li>수소전기자동차: {VEHICLE_ACQUISITION_TAX_POLICY.reliefs.hydrogen.expiresAt}까지 140만원 한도 예상 감면</li><li>비영업용 경형 승용차: {VEHICLE_ACQUISITION_TAX_POLICY.reliefs.lightPassenger.expiresAt}까지 75만원 한도 예상 감면</li><li>경형 승합·화물차: 해당 법정 요건을 전제로 같은 기한까지 면제 규정을 예상 반영</li></ul><p>같은 차량에 감면 규정이 둘 이상 적용될 수 있으면 가장 큰 하나만 반영합니다. 다자녀·장애인·국가유공자 감면은 별도 조건이므로 이번 계산 범위에서 제외합니다.</p></section>
    <section><h2>FAQ</h2><div className={styles.faq}>{vehicleAcquisitionTaxFaqs.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>
    <section><p className={styles.eyebrow}>공식 출처</p><h2>적용 기준과 확인일</h2><p>정책 확인일: <time dateTime={VEHICLE_ACQUISITION_TAX_POLICY.checkedAt}>{VEHICLE_ACQUISITION_TAX_POLICY.checkedAt}</time></p><ul>{sources.map(([name,href])=><li key={href}><a href={href} target="_blank" rel="noreferrer">{name}</a></li>)}</ul><p className={styles.notice}>실제 납부세액은 등록 서류, 차량 분류, 감면 요건과 지방자치단체 확인에 따라 달라질 수 있습니다. 번호판·공채·보험료·자동차세 등 부대비용은 포함하지 않습니다.</p></section>
  </div>;
}
