import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./PolicyPageLayout.module.css";

const guidePages = [
  ["/about/", "소개"],
  ["/methodology/", "계산 방법론"],
  ["/updates/", "변경 이력"],
  ["/contact/", "문의"],
  ["/privacy-policy/", "개인정보처리방침"],
  ["/terms/", "이용약관"],
  ["/disclaimer/", "면책문구"],
] as const;

type GuidePath = (typeof guidePages)[number][0];

function GuideLinks({ current }: { current: GuidePath }) {
  return (
    <nav className={styles.guideLinks} aria-label="계산박스 안내">
      {guidePages.map(([href, label]) => (
        <Link key={href} href={href} aria-current={href === current ? "page" : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

type PolicyPageLayoutProps = Readonly<{
  current: GuidePath;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}>;

export function PolicyPageLayout({
  current,
  eyebrow,
  title,
  description,
  children,
}: PolicyPageLayoutProps) {
  return (
    <section className={`page-section policy-page ${styles.shell}`}>
      <div className={`page-heading policy-page__heading ${styles.heading}`}>
        <p className="page-heading__eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <div className={styles.grid}>
        <aside className={styles.desktopGuide}>
          <p>계산박스 안내</p>
          <GuideLinks current={current} />
        </aside>
        <details className={styles.mobileGuide}>
          <summary>다른 안내 페이지</summary>
          <GuideLinks current={current} />
        </details>
        <article className={`policy-page__content ${styles.document}`} data-guide={current}>
          {children}
        </article>
      </div>

      <nav className="link-row policy-page__links" aria-label="정책 페이지 이동">
        <Link className="text-link" href="/">
          홈
        </Link>
        <a className="text-link" href="/contact/">
          문의
        </a>
      </nav>
    </section>
  );
}
