import type { Metadata } from "next";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { PolicyPageLayout } from "@/components/common/PolicyPageLayout";
import {
  isTrainingCertificateCostCalculatorEnabled,
  TRAINING_CERTIFICATE_COST_PUBLICATION,
} from "@/lib/calculators/training-certificate-cost/publication";

const canonical = "https://gyesanbox.kr/updates/";
const title = "계산기 변경 이력 | 계산박스";
const description =
  "계산박스 공개 계산기와 신뢰 페이지에서 확인 가능한 기준·기능 변경 이력을 안내합니다.";
const ogImage = "https://gyesanbox.kr/og/policy.png";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: {
    title,
    description,
    url: canonical,
    type: "website",
    images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
  },
  twitter: { card: "summary_large_image", title, description, images: [ogImage] },
};

const jsonLdItems = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "계산박스", item: "https://gyesanbox.kr/" },
      { "@type": "ListItem", position: 2, name: "변경 이력", item: canonical },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    url: canonical,
    description,
  },
];

const trainingCertificateCostReleaseUpdate = {
  date: "2026년 8월 12일",
  target: "국비지원 자격증 취득비용 계산기 공개",
  change:
    "훈련비 본인부담금과 시험 응시료, 교재·재료·교통비 등 추가 비용을 합산하고 재응시 횟수별 예상비용을 비교하는 계산기를 추가했습니다.",
  reason:
    "내일배움카드 과정의 지원 자격을 판정하지 않고, 사용자가 확인한 훈련비와 자격증 취득 과정의 추가 비용을 한 번에 비교할 수 있도록 하기 위해서입니다.",
  evidence:
    "계산기 페이지에서 입력 항목, 총 본인부담 예상액, 국비지원 예상액, 재응시 비용 비교와 공식 출처를 확인할 수 있습니다.",
  href: TRAINING_CERTIFICATE_COST_PUBLICATION.path,
} as const;

const baseUpdates = [
  {
    date: "2026년 8월 13일",
    target: "계산박스 상표등록출원 및 브랜드 식별 신호",
    change: "계산박스 상표등록출원을 완료하고, 홈페이지의 브랜드·공식 도메인 안내와 WebSite·Organization 구조화 데이터를 정리했습니다.",
    reason: "계산박스와 공식 웹사이트 gyesanbox.kr의 관계를 일관되게 안내하고 검색 서비스가 사이트의 브랜드 식별 신호를 이해하는 데 참고할 수 있도록 하기 위해서입니다.",
    evidence: "홈페이지·소개·이용약관의 브랜드 안내와 상표 출원 중 표시, 홈페이지 구조화 데이터에서 확인할 수 있습니다. 이 변경은 검색 노출 또는 사이트명 반영을 보장하지 않습니다.",
    href: "/",
  },
  {
    date: "2026년 8월 9일",
    target: "신규 계산기 10개 공개",
    change: "ROAS, 예금·적금, 물타기·평단가, 카드 할부, 부동산 중개보수, 자동차 유지비, 연장·야간·휴일근로수당, 청년미래적금, DSR, 근로·자녀장려금 계산기를 공개해 제공 계산기를 총 20개로 확대했습니다.",
    reason: "생활·금융·근로·사업·주거 영역에서 자주 찾는 계산을 공개 계산기 목록과 사이트맵에서 바로 이용할 수 있도록 공개 범위를 확장했습니다.",
    evidence: "현재 계산기 목록과 홈의 공개 목록, 각 계산기 페이지에서 20개 계산기의 입력·결과·기준 설명을 확인할 수 있습니다.",
    href: "/calculators/",
  },
  {
    date: "2026년 8월 9일",
    target: "DSR 공식 부채 산정·스트레스 DSR 정책",
    change: "대출별 공식 부채 산정 방식과 2026년 하반기 스트레스 DSR 정책 기준을 계산기에 반영했습니다.",
    reason: "기존·신규 대출의 산정만기와 스트레스 금리를 구분해 예상 DSR 결과의 계산 전제를 명확히 하기 위해서입니다.",
    evidence: "DSR 계산기 페이지의 정책 기준일, 적용 범위와 공식 출처, 대출별 부채 산정 결과를 확인할 수 있습니다.",
    href: "/calculators/dsr/",
  },
  {
    date: "2026년 8월 9일",
    target: "연장·야간·휴일근로수당 가산수당 합계",
    change: "가산수당 합계에서 통상임금 기본분을 제외하고 실제 법정 가산분만 표시하도록 계산을 수정했습니다.",
    reason: "총 예상 지급액과 가산수당 합계를 구분해 중복·과대 표시를 제거하기 위해서입니다.",
    evidence: "연장·야간·휴일근로 중복 입력 대표 fixture에서 총 예상 지급액 200,000원, 가산수당 합계 80,000원을 확인할 수 있습니다.",
    href: "/calculators/overtime-pay/",
  },
  {
    date: "2026년 8월 9일",
    target: "부동산 중개보수 공식 출처·적용 범위",
    change: "거래 유형과 중개사무소 소재지 관할 시·도 기준, 상한보수·실제 지급액·부가세 구분과 공식 출처를 보강했습니다.",
    reason: "지역별 조례와 거래 유형에 따라 달라지는 중개보수 계산의 적용 범위를 결과와 함께 확인할 수 있도록 하기 위해서입니다.",
    evidence: "중개보수 계산기에서 거래 유형별 상한액, 부가세 안내와 공식 출처 링크를 확인할 수 있습니다.",
    href: "/calculators/brokerage-fee/",
  },
  {
    date: "2026년 7월 27일",
    target: "전세 vs 월세 비교 계산기 기준금리·전환율",
    change: "한국은행 기준금리 기본값을 연 2.50%에서 2.75%로, 법정 참고 전환율을 연 4.50%에서 4.75%로 갱신했습니다.",
    reason: "2026년 7월 16일 한국은행 통화정책방향 결정과 시행령상 가산 이율·법정 상한 구조를 현재 기준으로 반영하기 위해서입니다.",
    evidence: "사이트 기준 확인일은 2026년 7월 27일이며, 한국은행 기준금리 결정일은 2026년 7월 16일입니다. 시행령상 가산 이율 2.00%와 법정 상한율 10.00%는 유지했고, 비교 계산 구조와 사용자가 입력하는 전세대출금리는 변경하지 않았습니다.",
    href: "/calculators/rent-vs-jeonse/",
  },
  {
    date: "2026년 7월 13일",
    target: "4대보험 국민연금 절사·보험료율 표시",
    change: "국민연금 기준소득월액 산정과 보험료율 표시를 보완했습니다.",
    reason: "계산 결과와 기준 설명이 적용 규칙 및 표시 수치와 일치하도록 하기 위해서입니다.",
    evidence: "신고 소득월액 1,000원 미만 절사와 근로자 국민연금 보험료 10원 미만 절사를 적용하고, 2026년 7월 기준 하한 410,000원·상한 6,590,000원을 확인했습니다. 장기요양보험료율은 13.14%, 고용보험 근로자 부담률은 0.9%로 표시하도록 정규화했습니다.",
    href: "/calculators/social-insurance/",
  },
  {
    date: "2026년 7월 12일",
    target: "육아휴직급여 계산기",
    change: "육아휴직급여 계산기와 일반·특례 조건, 공식 출처 및 제외 범위를 공개 목록에 반영했습니다.",
    reason: "월 통상임금과 휴직 기간에 따른 예상액의 계산 전제를 함께 확인할 수 있도록 했습니다.",
    evidence: "계산기 페이지에 2026-07-01 기준일과 공식 출처가 기록되어 있습니다.",
    href: "/calculators/parental-leave/",
  },
  {
    date: "2026년 7월 12일",
    target: "전세 vs 월세 비교 계산기",
    change: "전세·월세 비교 계산기와 기준 설명, 공식 출처를 공개 목록에 반영했습니다.",
    reason: "보증금 기회비용과 대출 이자·월세·관리비를 같은 기간 기준으로 비교할 수 있도록 했습니다.",
    evidence: "현재 페이지에 2026-07-12 기준일과 확인한 공식 자료가 표시됩니다.",
    href: "/calculators/rent-vs-jeonse/",
  },
  {
    date: "2026년 7월 12일",
    target: "소개·문의 등 신뢰 페이지",
    change: "계산 기준, 참고용 결과, 오류 제보와 운영 범위를 설명하는 콘텐츠를 보강했습니다.",
    reason: "계산 결과의 전제와 수정 요청 경로를 공개 페이지에서 확인할 수 있도록 하기 위해서입니다.",
    evidence: "현재 소개·문의 페이지에서 계산 기준, 오류 제보 방법과 운영 범위를 확인할 수 있습니다.",
    href: "/about/",
  },
  {
    date: "2026년 7월 11일",
    target: "연봉 실수령액 계산기",
    change: "국민연금 기준소득월액 하한 41만원과 상한 659만원, 2026-07-01~2027-06-30 적용 기간을 갱신했습니다.",
    reason: "2026년 7월 적용 기간에 맞춰 공제액 계산과 화면 설명을 일치시켰습니다.",
    evidence: "현재 계산 기준과 계산기 본문에 같은 상·하한, 적용 기간 및 확인일이 기록되어 있습니다.",
    href: "/calculators/salary/",
  },
  {
    date: "2026년 7월 11일",
    target: "실업급여 계산기",
    change: "계산 결과를 복사하고 공유할 때 결과 조건·기준일·안내를 함께 전달하도록 보완했습니다.",
    reason: "결과를 다시 확인하거나 공유할 때 계산의 전제를 잃지 않도록 하기 위해서입니다.",
    evidence: "현재 결과 화면에서 복사·공유 내용에 입력 조건, 계산 결과, 기준일과 공개 페이지 주소가 포함되는 것을 확인했습니다.",
    href: "/calculators/unemployment/",
  },
  {
    date: "2026년 7월 10일",
    target: "2026 4대보험 계산기",
    change: "공개 계산기 페이지와 계산 기준 설명을 추가했습니다.",
    reason: "월 급여와 비과세 금액으로 근로자 부담 보험료를 확인할 수 있도록 공개 범위를 정리했습니다.",
    evidence: "계산기에 적용된 2026년 보험료 기준과 페이지의 공식 출처·기준 확인일 표시를 함께 확인했습니다.",
    href: "/calculators/social-insurance/",
  },
  {
    date: "2026년 7월 10일",
    target: "주휴수당 계산기",
    change: "공개 계산기와 주휴시간·주휴수당 기준 설명을 추가했습니다.",
    reason: "시급과 소정근로 조건을 입력해 예상 주휴 관련 금액을 확인할 수 있도록 했습니다.",
    evidence: "페이지의 2026-07-10 기준일과 공식 출처, 14시간·15시간 경계 및 주휴시간 상한 검사를 확인했습니다.",
    href: "/calculators/labor-pay/",
  },
  {
    date: "2026년 7월 10일",
    target: "부가세 계산기",
    change: "부가세 계산기를 홈·계산기 목록·공개 사이트맵에 반영했습니다.",
    reason: "공급가액 또는 합계금액을 기준으로 매출세액과 예상 납부세액을 확인할 수 있게 공개 구성을 정리했습니다.",
    evidence: "현재 페이지의 10% 일반과세자 기준 설명, 공식 출처와 기준일 표시를 확인했습니다.",
    href: "/calculators/vat-profit/",
  },
  {
    date: "2026년 6월 25일",
    target: "퇴직금 계산기",
    change: "평균임금·통상임금 기준 설명과 공식 예제 재현 내용을 계산기 페이지에 추가했습니다.",
    reason: "예상 퇴직금의 계산 전제와 산정 과정을 결과 화면과 함께 확인할 수 있도록 했습니다.",
    evidence: "입사일·퇴직일과 퇴직 전 임금 입력을 사용하는 계산 화면에 기준 설명과 공식 예제가 함께 반영된 변경을 확인했습니다.",
    href: "/calculators/severance/",
  },
  {
    date: "2026년 6월 22일",
    target: "대출 이자 계산기",
    change: "상환 방식별 계산 기준 설명과 월별 상환 일정 안내를 보완했습니다.",
    reason: "원리금균등·원금균등·만기일시상환 결과의 차이와 계산 전제를 페이지에서 확인할 수 있도록 했습니다.",
    evidence: "세 가지 상환 방식의 설명, 계산 기준일, 상세 안내와 검색·공유 정보가 같은 변경에서 추가된 것을 확인했습니다.",
    href: "/calculators/loan/",
  },
  {
    date: "2026년 6월 19일",
    target: "판매자 마진 계산기",
    change: "판매자 마진 계산 기능과 입력·결과 화면, 계산 기준 설명을 공개 페이지에 반영했습니다.",
    reason: "판매 가격과 비용 항목을 입력해 예상 정산금액과 세전 순이익을 확인할 수 있도록 했습니다.",
    evidence: "판매단가·수량·원가·할인·배송비·수수료·광고비를 반영하는 계산 화면과 기준 콘텐츠가 기존 안내 페이지를 대체한 변경을 확인했습니다.",
    href: "/calculators/seller-margin/",
  },
] as const;

const updates = isTrainingCertificateCostCalculatorEnabled()
  ? [trainingCertificateCostReleaseUpdate, ...baseUpdates]
  : baseUpdates;

export default function UpdatesPage() {
  return (
    <>
      <JsonLdScripts items={jsonLdItems} />
      <PolicyPageLayout
        eyebrow="Updates"
        title="계산기 변경 이력"
        description="계산박스의 주요 계산기 공개와 계산 기준·기능 변경 중 현재 공개 페이지와 코드에서 확인할 수 있는 내용을 기록합니다."
      >
        {updates.map((update) => (
          <section key={`${update.date}-${update.target}`}>
            <h2>{update.target}</h2>
            <p><strong>확인·적용 날짜:</strong> {update.date}</p>
            <p><strong>변경한 내용:</strong> {update.change}</p>
            <p><strong>변경 이유:</strong> {update.reason}</p>
            <p><strong>확인 기준:</strong> {update.evidence}</p>
            <p><a href={update.href}>상세 페이지 보기</a></p>
          </section>
        ))}
      </PolicyPageLayout>
    </>
  );
}
