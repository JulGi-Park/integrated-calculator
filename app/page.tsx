import type { Metadata } from "next";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { KnowledgeLatestQuestions } from "@/components/knowledge/KnowledgeLatestQuestions";
import knowledgeHomeCases from "@/lib/knowledge/home-cases.json";
import { knowledgeHomePublicEnabled } from "@/lib/knowledge/gates";

import { CALCULATOR_REGISTRY, type CalculatorCategory } from "@/lib/calculatorRegistry";
import styles from "./Home.module.css";

const categoryColumns = [
  [{ name: "급여", id: "pay", icon: "M7 7V4h10v3M3 12h18M10 12v3h4v-3M3 7h18v14H3z" }],
  [
    { name: "금융", id: "finance", icon: "m3 10 9-6 9 6M5 11v8m7-8v8m7-8v8M3 20h18" },
    { name: "주거", id: "housing", icon: "m3 11 9-8 9 8M5 10v11h14V10M10 21v-7h4v7" },
  ],
  [
    { name: "사업", id: "business", icon: "M4 5h16v14H4zM4 10h16M8 15h3m3 0h2" },
    { name: "투자", id: "investment", icon: "M4 20V4m0 16h16M7 15l5-5 4 3 5-7m-5 0h5v5" },
    { name: "생활", id: "living", icon: "m4 10 8-6 8 6v10H4zM8 14h8m-8 3h5" },
  ],
] as const satisfies readonly (readonly { name: CalculatorCategory; id: string; icon: string }[])[];

const siteUrl = "https://gyesanbox.kr/";
const homeTitle = "계산박스 | 기준·공식·해석을 함께 제공하는 생활 계산 서비스";
const homeDescription =
  "계산박스는 판매자 마진, 부가세, 연봉 실수령액, 4대보험, 주휴수당, 대출 이자, 퇴직금, 실업급여, 육아휴직급여, 전세·월세 비교 등 생활 계산을 한 곳에서 확인할 수 있는 참고용 계산 서비스입니다.";
const ogTitle = "계산박스 - 계산 기준과 결과 해석을 함께 확인하는 서비스";
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
  {
    name: "ROAS 계산기",
    href: "/calculators/roas/",
    url: "https://gyesanbox.kr/calculators/roas/",
    description: "광고비와 매출, 마진을 기준으로 ROAS와 손익분기 ROAS를 비교합니다.",
  },
  {
    name: "예금·적금 계산기",
    href: "/calculators/savings/",
    url: "https://gyesanbox.kr/calculators/savings/",
    description: "예치·납입 조건과 금리, 과세 방식에 따른 만기 예상액을 계산합니다.",
  },
  {
    name: "물타기 계산기",
    href: "/calculators/average-price/",
    url: "https://gyesanbox.kr/calculators/average-price/",
    description: "기존 보유분과 추가 매수분을 합산해 평균단가와 손익분기 가격을 계산합니다.",
  },
  {
    name: "카드 할부 계산기",
    href: "/calculators/card-installment/",
    url: "https://gyesanbox.kr/calculators/card-installment/",
    description: "할부 원금과 수수료율을 기준으로 월 납입액과 총 수수료를 계산합니다.",
  },
  {
    name: "부동산 중개보수 계산기",
    href: "/calculators/brokerage-fee/",
    url: "https://gyesanbox.kr/calculators/brokerage-fee/",
    description: "주택 매매·전세·월세 거래금액별 중개보수 상한을 계산합니다.",
  },
  {
    name: "자동차 유지비 계산기",
    href: "/calculators/car-cost/",
    url: "https://gyesanbox.kr/calculators/car-cost/",
    description: "연료비, 보험료, 세금과 정비비를 합산해 월·연간 차량 비용을 계산합니다.",
  },
  {
    name: "연장·야간·휴일근로수당 계산기",
    href: "/calculators/overtime-pay/",
    url: "https://gyesanbox.kr/calculators/overtime-pay/",
    description: "시급과 근로시간을 기준으로 연장·야간·휴일근로 예상 지급액을 계산합니다.",
  },
  {
    name: "청년미래적금 계산기",
    href: "/calculators/youth-future-savings/",
    url: "https://gyesanbox.kr/calculators/youth-future-savings/",
    description: "월 납입액과 금리, 정부기여금 유형에 따른 예상 만기수령액을 계산합니다.",
  },
  {
    name: "DSR 계산기",
    href: "/calculators/dsr/",
    url: "https://gyesanbox.kr/calculators/dsr/",
    description: "연소득과 대출 원리금, 스트레스 금리를 입력해 예상 DSR 비율을 비교합니다.",
  },
  {
    name: "근로·자녀장려금 계산기",
    href: "/calculators/work-child-incentive/",
    url: "https://gyesanbox.kr/calculators/work-child-incentive/",
    description: "가구·소득·재산 조건과 법정 산식으로 장려금 신청 가능성과 예상액을 확인합니다.",
  },
  {
    name: "국비지원 자격증 취득비용 계산기",
    href: "/calculators/training-certificate-cost/",
    url: "https://gyesanbox.kr/calculators/training-certificate-cost/",
    description:
      "내일배움카드 훈련비 본인부담금과 시험·교재·재료비 등을 합산해 자격증 취득 예상비용을 계산합니다.",
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
  const knowledgeEnabled = knowledgeHomePublicEnabled(process.env);
  const jsonLdItems = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${siteUrl}#website`,
      name: "계산박스",
      alternateName: "gyesanbox.kr",
      url: siteUrl,
      description: "생활·금융·근로 계산의 기준과 결과 해석을 함께 제공하는 정보 서비스",
      publisher: { "@id": `${siteUrl}#organization` },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${siteUrl}#organization`,
      name: "계산박스",
      url: siteUrl,
      logo: `${siteUrl}icon.png`,
      description:
        "계산박스는 생활·금융·근로 계산의 기준, 공식, 사례와 결과 해석을 함께 제공하는 계산 전문 정보 서비스입니다.",
      sameAs: [
        "https://www.instagram.com/gyesanbox/",
        "https://www.threads.com/@gyesanbox",
      ],
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
      <div className={styles.home}>
        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>생활과 사업에 필요한 계산을 한곳에서</p>
            <h1>계산박스</h1>
            <p className={styles.intro}>
          계산박스는 gyesanbox.kr에서 운영하는 생활·금융·근로 계산 서비스입니다.
          판매자 마진, 부가세, 연봉 실수령액, 대출 이자, 퇴직금, 실업급여처럼
          자주 필요한 계산 도구를 빠르게 찾아보세요. 각 계산기는 입력값 기준의
          예상 결과와 계산 기준, 입력값 설명, 유의사항을 함께 제공합니다. 입력한
          값은 서버에 저장하지 않으며, 결과는 실제 지급액·세금·대출 심사·정산
          결과와 다를 수 있는 참고값입니다.
            </p>
          </div>
          <div className={styles.summary}>
            <strong>{CALCULATOR_REGISTRY.length}개 계산기</strong>
            <p>급여부터 금융·주거·사업까지</p>
          </div>
        </section>

        <nav className={styles.jump} aria-label="계산기 분야">
          <a href="#home-directory">전체 {CALCULATOR_REGISTRY.length}</a>
          {categoryColumns.flat().map(({ name, id }) => (
            <a href={`#home-${id}`} key={id}>{name}</a>
          ))}
        </nav>

        <section id="home-directory" className={styles.anchor} aria-labelledby="home-calculators-title">
          <div className={styles.sectionHeading}>
            <h2 id="home-calculators-title">계산기 바로가기</h2>
            <a href="/calculators/">전체 목록 보기 <span aria-hidden="true">→</span></a>
          </div>
          <div className={styles.directory}>
            {categoryColumns.map((column) => (
              <div className={styles.column} key={column[0].id}>
                {column.map(({ name, id, icon }) => {
                  const items = calculators.filter(({ href }) =>
                    CALCULATOR_REGISTRY.some((item) => item.path === href && item.category === name),
                  );
                  return (
                    <section className={styles.group} id={`home-${id}`} key={id} aria-labelledby={`home-${id}-heading`}>
                      <div className={styles.groupHeading}>
                        <span className={styles.icon} aria-hidden="true">
                          <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                            <path d={icon} />
                          </svg>
                        </span>
                        <h3 id={`home-${id}-heading`}>{name}</h3>
                        <span className={styles.count}>{items.length}개</span>
                      </div>
                      <ul>
                        {items.map(({ href, name, description }) => (
                          <li key={href}>
                            <a href={href}>
                              <span><strong>{name}</strong><small>{description}</small></span>
                              <span className={styles.arrow} aria-hidden="true">›</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        {knowledgeEnabled ? (
          <div className={styles.latest}><KnowledgeLatestQuestions enabled /></div>
        ) : null}

        {knowledgeEnabled && process.env.KNOWLEDGE_ENV === "production" ? (
          <section className={styles.section} aria-labelledby="home-cases-title">
            <div className={styles.sectionHeading}><h2 id="home-cases-title">계산 사례</h2></div>
            <div className={styles.cases}>
              {knowledgeHomeCases.map(({ href, title, description }) => (
                <a className={styles.card} key={href} href={href}>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <span className={styles.cardLink}>사례 보기 <span aria-hidden="true">→</span></span>
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <section className={styles.section} aria-labelledby="home-principles-title">
          <div className={styles.sectionHeading}>
            <h2 id="home-principles-title">운영 기준</h2>
            <a href="/methodology/">계산 방법론과 검수 절차 보기 <span aria-hidden="true">→</span></a>
          </div>
          <div className={styles.principles}>
            {servicePrinciples.map(({ title, description }) => (
              <article className={styles.card} key={title}>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
