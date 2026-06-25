import Link from "next/link";
import type { ReactNode } from "react";

type PolicyPageLayoutProps = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}>;

export function PolicyPageLayout({
  eyebrow,
  title,
  description,
  children,
}: PolicyPageLayoutProps) {
  return (
    <section className="page-section policy-page">
      <div className="page-heading policy-page__heading">
        <p className="page-heading__eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <div className="policy-page__content">{children}</div>

      <nav className="link-row policy-page__links" aria-label="정책 페이지 이동">
        <Link className="text-link" href="/">
          홈
        </Link>
        <Link className="text-link" href="/contact">
          문의
        </Link>
      </nav>
    </section>
  );
}
