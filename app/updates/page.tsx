import type { Metadata } from "next";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { PolicyPageLayout } from "@/components/common/PolicyPageLayout";

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

const updates = [
  {
    date: "2026년 7월 10일",
    target: "2026 4대보험 계산기",
    change: "공개 계산기 페이지와 계산 기준 설명을 추가했습니다.",
    reason: "월 급여와 비과세 금액으로 근로자 부담 보험료를 확인할 수 있도록 공개 범위를 정리했습니다.",
    evidence: "코드의 2026년 보험료 정책값과 페이지의 공식 출처·기준 확인일 표시를 함께 확인했습니다.",
    href: "/calculators/social-insurance/",
  },
  {
    date: "2026년 7월 10일",
    target: "주휴수당 계산기",
    change: "공개 계산기와 주휴시간·주휴수당 기준 설명을 추가했습니다.",
    reason: "시급과 소정근로 조건을 입력해 예상 주휴 관련 금액을 확인할 수 있도록 했습니다.",
    evidence: "페이지의 2026-07-10 기준일, 공식 출처와 계산 엔진의 대표·경계 입력 검증을 확인했습니다.",
    href: "/calculators/labor-pay/",
  },
  {
    date: "2026년 7월 10일",
    target: "부가세 계산기",
    change: "부가세 계산기 공개 페이지를 현재 공개 목록과 정적 검증 대상에 반영했습니다.",
    reason: "공급가액 또는 합계금액을 기준으로 매출세액과 예상 납부세액을 확인할 수 있게 공개 구성을 정리했습니다.",
    evidence: "현재 페이지의 10% 일반과세자 기준 설명, 공식 출처와 기준일 표시를 확인했습니다.",
    href: "/calculators/vat-profit/",
  },
  {
    date: "2026년 7월 11일",
    target: "연봉 실수령액 계산기",
    change: "국민연금 기준소득월액 하한 41만원과 상한 659만원, 2026-07-01~2027-06-30 적용 기간을 갱신했습니다.",
    reason: "2026년 7월 적용 기간에 맞춰 공제액 계산과 화면 설명을 일치시켰습니다.",
    evidence: "현재 정책 모듈과 계산기 본문에 같은 상·하한 및 확인일이 기록되어 있습니다.",
    href: "/calculators/salary/",
  },
  {
    date: "2026년 7월 11일",
    target: "실업급여 계산기",
    change: "계산 결과를 복사하고 공유할 때 결과 조건·기준일·안내를 함께 전달하도록 보완했습니다.",
    reason: "결과를 다시 확인하거나 공유할 때 계산의 전제를 잃지 않도록 하기 위해서입니다.",
    evidence: "현재 결과 화면과 클라이언트 유틸리티에 복사·공유 문자열 및 운영 canonical이 구현되어 있습니다.",
    href: "/calculators/unemployment/",
  },
  {
    date: "2026년 7월 12일",
    target: "육아휴직급여 계산기",
    change: "육아휴직급여 계산기와 일반·특례 조건, 공식 출처 및 제외 범위를 공개 목록에 반영했습니다.",
    reason: "월 통상임금과 휴직 기간에 따른 예상액의 계산 전제를 함께 확인할 수 있도록 했습니다.",
    evidence: "현재 페이지와 정책 코드에 2026-07-01 확인일과 공식 출처가 기록되어 있습니다.",
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
    evidence: "현재 about·contact 페이지와 공통 정책 페이지의 실제 문구 및 연결 구조를 확인했습니다.",
    href: "/about/",
  },
] as const;

export default function UpdatesPage() {
  return (
    <>
      <JsonLdScripts items={jsonLdItems} />
      <PolicyPageLayout
        eyebrow="Updates"
        title="계산기 변경 이력"
        description="현재 공개 페이지와 코드에서 확인할 수 있는 변경만 날짜와 대상별로 기록합니다."
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
