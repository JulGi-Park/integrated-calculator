import type { Metadata } from "next";
import Link from "next/link";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";

const siteUrl = "https://gyesanbox.kr/";
const homeTitle = "계산박스 | 생활·금융·근로 계산기 모음";
const homeDescription =
  "계산박스는 판매자 마진, 연봉 실수령액, 대출 이자, 퇴직금, 실업급여 등 생활·금융·근로 계산을 한 곳에서 확인할 수 있는 온라인 계산기 모음입니다.";
const socialDescription =
  "계산박스는 판매자 마진, 연봉 실수령액, 대출 이자, 퇴직금, 실업급여 등 자주 찾는 계산기를 제공하는 온라인 계산기 모음입니다.";

const calculators = [
  {
    name: "판매자 마진 계산기",
    href: "/calculators/seller-margin",
    url: "https://gyesanbox.kr/calculators/seller-margin",
  },
  {
    name: "연봉 실수령액 계산기",
    href: "/calculators/salary",
    url: "https://gyesanbox.kr/calculators/salary",
  },
  {
    name: "대출 이자 계산기",
    href: "/calculators/loan",
    url: "https://gyesanbox.kr/calculators/loan",
  },
  {
    name: "퇴직금 계산기",
    href: "/calculators/severance",
    url: "https://gyesanbox.kr/calculators/severance",
  },
  {
    name: "실업급여 계산기",
    href: "/calculators/unemployment",
    url: "https://gyesanbox.kr/calculators/unemployment",
  },
] as const;

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  keywords: [
    "계산박스",
    "계산기",
    "판매자 마진 계산기",
    "연봉 실수령액 계산기",
    "대출 이자 계산기",
    "퇴직금 계산기",
    "실업급여 계산기",
  ],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: homeTitle,
    description: socialDescription,
    url: siteUrl,
    siteName: "계산박스",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary",
    title: homeTitle,
    description: socialDescription,
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
      email: "contact@gyesanbox.kr",
      contactPoint: {
        "@type": "ContactPoint",
        email: "contact@gyesanbox.kr",
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
          판매자 마진, 연봉 실수령액, 대출 이자, 퇴직금, 실업급여처럼
          자주 필요한 계산기를 빠르게 찾아보세요.
        </p>
        <Link className="button button--primary" href="/calculators">
          계산기 목록 보기
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section className="home-calculators" aria-labelledby="home-calculators-title">
        <div>
          <p className="page-heading__eyebrow">Ready to use</p>
          <h2 id="home-calculators-title">바로가기</h2>
        </div>
        <div className="home-calculators__links">
          {calculators.map((calculator) => (
            <Link key={calculator.href} href={calculator.href}>
              {calculator.name}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
