import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다 | 계산박스",
  description: "요청한 계산박스 페이지를 찾을 수 없습니다.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="page-heading__eyebrow">404</p>
        <h1>페이지를 찾을 수 없습니다</h1>
        <p>
          주소가 변경되었거나 존재하지 않는 페이지입니다. 계산 결과나 오류
          안내만을 위한 별도 페이지는 운영하지 않습니다.
        </p>
      </div>
      <nav className="link-row" aria-label="오류 페이지 이동">
        <Link className="button button--primary" href="/">
          홈으로 이동
        </Link>
        <Link className="text-link" href="/calculators/">
          공개 계산기 목록 보기
        </Link>
      </nav>
    </section>
  );
}
