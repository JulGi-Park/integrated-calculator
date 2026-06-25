import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "계산박스 - 연봉·퇴직금·실업급여·대출 이자 계산기",
  description:
    "계산박스에서 판매자 마진, 연봉 실수령액, 대출 이자, 퇴직금, 실업급여 계산기를 빠르게 이용하세요.",
};

export default function Home() {
  return (
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
  );
}
