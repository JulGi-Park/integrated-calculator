import Link from "next/link";

const footerLinks = [
  { href: "/about", label: "소개" },
  { href: "/contact", label: "문의" },
  { href: "/privacy-policy", label: "개인정보처리방침" },
  { href: "/terms", label: "이용약관" },
  { href: "/disclaimer", label: "면책문구" },
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <p>계산박스</p>
          <p>
            문의:{" "}
            <a className="site-footer__link" href="mailto:contact@gyesanbox.kr">
              contact@gyesanbox.kr
            </a>
          </p>
          <p className="site-footer__copyright">
            © 2026 계산박스. All rights reserved.
          </p>
          <nav className="site-footer__nav" aria-label="사이트 정책">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="site-footer__note">
          계산 결과는 참고용입니다. 실제 세금, 보험료, 급여, 대출 조건,
          고용보험 판단은 개인 상황과 기관 기준에 따라 달라질 수 있으며,
          정확한 판단은 관련 기관 또는 전문가 확인이 필요합니다.
        </p>
      </div>
    </footer>
  );
}
