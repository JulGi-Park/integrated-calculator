import type { Metadata } from "next";
import Link from "next/link";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import styles from "@/components/guides/GuideIndex.module.css";

const canonical = "https://gyesanbox.kr/guides/";
const title = "생활·근로 기준 가이드 | 계산박스";
const description =
  "계산 결과가 달라지는 이유와 공식 기준을 이해하기 위한 계산박스의 생활·근로 기준 가이드입니다.";
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
    "@type": "CollectionPage",
    name: title,
    url: canonical,
    description,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "2026년 7월 국민연금 공제액 변화",
          url: "https://gyesanbox.kr/guides/national-pension-july-2026/",
        },
      ],
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "계산박스", item: "https://gyesanbox.kr/" },
      { "@type": "ListItem", position: 2, name: "가이드", item: canonical },
    ],
  },
];

export default function GuidesPage() {
  return (
    <section className="page-section">
      <JsonLdScripts items={jsonLdItems} />
      <div className={`page-heading ${styles.intro}`}>
        <p className="page-heading__eyebrow">Guides</p>
        <h1>계산 결과를 이해하는 가이드</h1>
        <p>
          계산기 사용법을 모아 둔 목록이 아니라, 계산 결과가 달라지는 이유와
          공식 기준을 읽는 방법을 설명하는 콘텐츠입니다.
        </p>
      </div>

      <div className={styles.guideList} aria-label="계산박스 가이드 목록">
        <Link className={styles.guideCard} href="/guides/national-pension-july-2026/">
          <p className={styles.eyebrow}>2026 국민연금</p>
          <h2>2026년 7월 국민연금 공제액이 달라진 이유</h2>
          <p>
            보험료율, 기준소득월액 상한, 7월 정기결정과 급여명세서의 신고
            기준을 구분해 공제액 변화 원인을 확인합니다.
          </p>
          <span>가이드 읽기 →</span>
        </Link>
      </div>

      <nav className="link-row seller-margin-links" aria-label="가이드 페이지 이동">
        <Link className="text-link" href="/methodology/">계산 방법론 보기</Link>
        <Link className="text-link" href="/">홈으로</Link>
      </nav>
    </section>
  );
}
