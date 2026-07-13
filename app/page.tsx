import type { Metadata } from "next";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";

const siteUrl = "https://gyesanbox.kr/";
const homeTitle = "계산박스 | 생활·금융·근로 계산기 모음";
const homeDescription =
  "계산박스는 판매자 마진, 부가세, 연봉 실수령액, 4대보험, 주휴수당, 대출 이자, 퇴직금, 실업급여, 육아휴직급여, 전세·월세 비교 등 생활 계산을 한 곳에서 확인할 수 있는 참고용 계산 서비스입니다.";
const ogTitle = "계산박스 - 생활 계산기 모음";
const ogDescription =
  "부가세, 연봉, 대출, 퇴직금, 육아휴직급여, 전세·월세 비교 등 실생활에 필요한 계산기를 한곳에서 확인할 수 있습니다.";
const ogImage = "https://gyesanbox.kr/og/home.png";

const calculators = [
  {
    name: "판매자 마진 계산기",
    href: "/calculators/seller-margin/",
    url: "https://gyesanbox.kr/calculators/seller-margin/",
    description:
      "판매가, 원가, 수수료, 배송비를 기준으로 주문별 예상 마진과 세전 순이익을 확인할 때 사용합니다.",
  },
  {
    name: "부가세 계산기",
    href: "/calculators/vat-profit/",
    url: "https://gyesanbox.kr/calculators/vat-profit/",
    description:
      "공급가액 또는 합계금액을 기준으로 매출세액과 매입세액 차감 후 예상 납부세액을 확인할 때 사용합니다.",
  },
  {
    name: "연봉 실수령액 계산기",
    href: "/calculators/salary/",
    url: "https://gyesanbox.kr/calculators/salary/",
    description:
      "연봉 또는 월급 기준으로 예상 공제액과 월 실수령액을 비교할 때 사용합니다.",
  },
  {
    name: "4대보험 계산기",
    href: "/calculators/social-insurance/",
    url: "https://gyesanbox.kr/calculators/social-insurance/",
    description:
      "월 급여와 비과세 금액을 기준으로 국민연금, 건강보험, 장기요양보험, 고용보험 근로자 부담액을 확인할 때 사용합니다.",
  },
  {
    name: "주휴수당 계산기",
    href: "/calculators/labor-pay/",
    url: "https://gyesanbox.kr/calculators/labor-pay/",
    description:
      "시급, 소정근로시간, 실제 근로시간, 개근 여부를 기준으로 예상 주휴수당과 주휴 포함 주급을 확인할 때 사용합니다.",
  },
  {
    name: "대출 이자 계산기",
    href: "/calculators/loan/",
    url: "https://gyesanbox.kr/calculators/loan/",
    description:
      "원금, 금리, 기간, 상환 방식에 따른 예상 월 상환액과 총이자를 확인할 때 사용합니다.",
  },
  {
    name: "퇴직금 계산기",
    href: "/calculators/severance/",
    url: "https://gyesanbox.kr/calculators/severance/",
    description:
      "근속기간과 평균임금을 바탕으로 예상 퇴직금과 계산 기준을 확인할 때 사용합니다.",
  },
  {
    name: "실업급여 계산기",
    href: "/calculators/unemployment/",
    url: "https://gyesanbox.kr/calculators/unemployment/",
    description:
      "고용보험 가입기간과 임금 정보를 바탕으로 예상 지급액과 지급 기간을 참고할 때 사용합니다.",
  },
  {
    name: "육아휴직급여 계산기",
    href: "/calculators/parental-leave/",
    url: "https://gyesanbox.kr/calculators/parental-leave/",
    description:
      "월 통상임금과 휴직 기간, 특례 조건을 기준으로 월별 예상 육아휴직급여와 총액을 확인할 때 사용합니다.",
  },
  {
    name: "전세 vs 월세 비교 계산기",
    href: "/calculators/rent-vs-jeonse/",
    url: "https://gyesanbox.kr/calculators/rent-vs-jeonse/",
    description:
      "전세대출 이자, 월세, 관리비와 보증금 기회비용을 기준으로 거주기간 총비용을 비교합니다.",
  },
] as const;

const servicePrinciples = [
  {
    title: "계산 기준 공개",
    description:
      "각 계산기 본문에 계산식, 적용 기준일, 자동 반영되지 않는 항목을 가능한 범위에서 정리합니다.",
  },
  {
    title: "공식 기준 확인",
    description:
      "공식 기관 자료나 공신력 있는 기준을 확인하고, 법령·요율·세율 변경이 확인되면 설명과 기준일을 갱신합니다.",
  },
  {
    title: "브라우저 중심 계산",
    description:
      "입력값은 계산 결과를 보여주기 위해 브라우저에서 처리되며, 로그인이나 서버 저장 없이 이용할 수 있습니다.",
  },
  {
    title: "참고용 결과 안내",
    description:
      "세금, 보험료, 급여, 대출, 고용 관련 결과는 실제 기관 기준과 개인 조건에 따라 달라질 수 있음을 안내합니다.",
  },
  {
    title: "운영 문의 창구",
    description:
      "계산 오류, 기준 변경, 출처 수정 요청은 문의 페이지에서 확인할 수 있습니다.",
  },
] as const;

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  keywords: [
    "계산박스",
    "계산기",
    "판매자 마진 계산기",
    "부가세 계산기",
    "연봉 실수령액 계산기",
    "4대보험 계산기",
    "주휴수당 계산기",
    "대출 이자 계산기",
    "퇴직금 계산기",
    "실업급여 계산기",
    "육아휴직급여 계산기",
    "전세 vs 월세 비교 계산기",
  ],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: ogTitle,
    description: ogDescription,
    url: siteUrl,
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: ogTitle,
      },
    ],
    siteName: "계산박스",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: ogTitle,
    description: ogDescription,
    images: [ogImage],
  },
};

export default function Home() {
  const jsonLdItems = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "계산박스",
      url: siteUrl,
      description: "생활·금융·근로 계산기 모음 서비스",
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "계산박스",
      url: siteUrl,
      contactPoint: {
        "@type": "ContactPoint",
        url: `${siteUrl}contact/`,
        contactType: "customer support",
        availableLanguage: "ko",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "계산박스",
          item: siteUrl,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "계산박스 계산기 목록",
      itemListElement: calculators.map((calculator, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: calculator.name,
        url: calculator.url,
      })),
    },
  ];

  return (
    <>
      <JsonLdScripts items={jsonLdItems} />
      <section className="hero">
        <div className="hero__eyebrow">생활과 사업에 필요한 계산을 한곳에서</div>
        <h1>계산박스</h1>
        <p className="hero__description">
          판매자 마진, 부가세, 연봉 실수령액, 대출 이자, 퇴직금, 실업급여처럼
          자주 필요한 무료 계산 도구를 빠르게 찾아보세요. 각 계산기는
          입력값 기준의 예상 결과와 계산 기준, 입력값 설명, 유의사항을 함께
          제공합니다. 입력한 값은 서버에 저장하지 않으며, 결과는 실제
          지급액·세금·대출 심사·정산 결과와 다를 수 있는 참고값입니다.
        </p>
        <a className="button button--primary" href="/calculators/">
          계산기 목록 보기
          <span aria-hidden="true">→</span>
        </a>
      </section>

      <section className="home-calculators" aria-labelledby="home-calculators-title">
        <div>
          <p className="page-heading__eyebrow">Calculators</p>
          <h2 id="home-calculators-title">바로가기</h2>
        </div>
        <div className="home-calculators__links">
          {calculators.map((calculator) => (
            <a className="calculator-card" key={calculator.href} href={calculator.href}>
              <div>
                <h3>{calculator.name}</h3>
                <p>{calculator.description}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="home-calculators" aria-labelledby="home-principles-title">
        <div>
          <p className="page-heading__eyebrow">Principles</p>
          <h2 id="home-principles-title">운영 기준</h2>
        </div>
        <div className="home-calculators__links">
          {servicePrinciples.map((principle) => (
            <article className="calculator-card" key={principle.title}>
              <div>
                <h3>{principle.title}</h3>
                <p>{principle.description}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="home-principles__link">
          <a className="text-link" href="/methodology/">
            계산 방법론과 검수 절차 보기 →
          </a>
        </p>
      </section>
    </>
  );
}
