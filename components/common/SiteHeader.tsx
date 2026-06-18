import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand" href="/" aria-label="통합 계산기 홈">
          <span className="brand__mark" aria-hidden="true">
            =
          </span>
          <span>통합 계산기</span>
        </Link>
        <nav aria-label="주요 메뉴">
          <Link className="nav-link" href="/calculators">
            계산기 목록
          </Link>
        </nav>
      </div>
    </header>
  );
}
