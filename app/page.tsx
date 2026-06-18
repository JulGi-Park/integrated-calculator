import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "통합 계산기 서비스",
  description: "대한민국 사용자를 위한 생활·사업 계산기 서비스입니다.",
};

export default function Home() {
  return (
    <section className="hero">
      <div className="hero__eyebrow">생활과 사업에 필요한 계산을 한곳에서</div>
      <h1>복잡한 숫자를<br />더 간단하게.</h1>
      <p className="hero__description">
        대한민국 사용자를 위한 생활·사업 계산기 서비스입니다.
        필요한 계산기를 빠르게 찾아보세요.
      </p>
      <Link className="button button--primary" href="/calculators">
        계산기 목록 보기
        <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
