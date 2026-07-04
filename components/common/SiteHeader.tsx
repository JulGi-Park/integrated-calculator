import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand" href="/" aria-label="계산박스 홈">
          <span className="brand__mark" aria-hidden="true">
            =
          </span>
          <span>계산박스</span>
        </Link>
        <nav aria-label="주요 메뉴">
          <a className="nav-link" href="/calculators/">
            계산기 목록
          </a>
          <a className="nav-link" href="/about/">
            소개
          </a>
          <a className="nav-link" href="/contact/">
            문의
          </a>
        </nav>
      </div>
    </header>
  );
}
