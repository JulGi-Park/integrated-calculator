import type { Metadata } from "next";
import { ContactEmail } from "@/components/common/ContactEmail";
import { PolicyPageLayout } from "@/components/common/PolicyPageLayout";

const ogTitle = "계산박스 소개 - 생활 계산을 쉽게";
const ogDescription =
  "계산박스는 실생활에 필요한 계산을 쉽고 빠르게 돕는 웹서비스입니다.";
const ogUrl = "https://gyesanbox.kr/about/";
const ogImage = "https://gyesanbox.kr/og/about.png";

export const metadata: Metadata = {
  title: "계산박스 소개 | 계산박스",
  description:
    "계산박스는 판매자 마진, 부가세, 연봉 실수령액, 4대보험, 주휴수당, 대출 이자, 퇴직금, 실업급여, 육아휴직급여, 전세·월세 비교 등 생활·금융·근로·사업·판매·주거 계산기를 제공하는 온라인 계산기 모음입니다.",
  alternates: {
    canonical: ogUrl,
  },
  openGraph: {
    title: ogTitle,
    description: ogDescription,
    url: ogUrl,
    type: "website",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: ogTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: ogTitle,
    description: ogDescription,
    images: [ogImage],
  },
};

export default function AboutPage() {
  return (
    <PolicyPageLayout
      eyebrow="About"
      title="계산박스 소개"
      description="계산박스는 대한민국 사용자를 위한 생활·금융·근로·사업·판매·주거 계산기 모음 서비스입니다."
    >
      <section>
        <h2>서비스 목적</h2>
        <p>
          계산박스는 일상과 업무에서 자주 확인하는 계산을 한곳에서 빠르게
          살펴볼 수 있도록 만든 온라인 계산기 모음입니다. 사용자가 숫자를
          입력하면 결과만 던져주는 화면이 아니라, 어떤 입력값이 필요한지와
          어떤 기준으로 계산되는지를 함께 확인할 수 있도록 운영합니다.
        </p>
      </section>

      <section>
        <h2>현재 제공 중인 계산기</h2>
        <ul>
          <li><a href="/calculators/seller-margin/">판매자 마진 계산기</a></li>
          <li><a href="/calculators/salary/">연봉 실수령액 계산기</a></li>
          <li><a href="/calculators/loan/">대출 이자 계산기</a></li>
          <li><a href="/calculators/severance/">퇴직금 계산기</a></li>
          <li><a href="/calculators/unemployment/">실업급여 계산기</a></li>
          <li><a href="/calculators/social-insurance/">2026 4대보험 계산기</a></li>
          <li><a href="/calculators/labor-pay/">주휴수당 계산기</a></li>
          <li><a href="/calculators/vat-profit/">부가세 계산기</a></li>
          <li><a href="/calculators/parental-leave/">육아휴직급여 계산기</a></li>
          <li><a href="/calculators/rent-vs-jeonse/">전세 vs 월세 계산기</a></li>
        </ul>
      </section>

      <section>
        <h2>계산식 검증 원칙</h2>
        <p>
          계산식이 정책, 법령, 공식 기관 안내와 연결되는 경우에는 각 계산기
          페이지에 기준일과 참고 출처를 표시합니다. 반올림, 상한·하한, 제외
          항목처럼 결과에 영향을 주는 조건은 가능한 한 본문에 풀어 적고,
          공식 기준 변경이 확인되면 계산 로직과 설명을 함께 수정하는 것을
          원칙으로 합니다.
        </p>
        <p>
          법령, 제도, 보험료율, 세율, 금융기관 기준이 바뀌면 같은 입력값이라도
          결과가 달라질 수 있습니다. 계산박스는 주요 기준을 확인한 날짜와
          적용 범위를 함께 안내해 사용자가 결과의 전제를 이해할 수 있도록
          관리합니다.
        </p>
      </section>

      <section>
        <h2>이용 전 안내</h2>
        <p>
          계산 결과는 참고용이며 실제 세금, 보험료, 급여, 대출 조건,
          퇴직금과 실업급여 판단은 개인 상황과 기관 기준에 따라 달라질 수
          있습니다. 중요한 의사결정 전에는 관련 기관 또는 전문가의 확인이
          필요합니다.
        </p>
        <p>
          계산박스는 특정 금융상품, 세무 처리, 고용보험 수급 판단 또는
          사업상 가격 결정을 권유하지 않습니다. 입력값이 부정확하거나 회사,
          플랫폼, 기관의 세부 기준이 다른 경우 결과도 달라질 수 있습니다.
        </p>
      </section>

      <section>
        <h2>운영 연락처</h2>
        <p>
          서비스 관련 문의는{" "}
          <a href="/contact/">
            <ContactEmail />
          </a>
          로
          보내 주세요. 자세한 문의 항목은{" "}
          <a href="/contact/">문의 페이지</a>에서 확인할 수 있습니다.
        </p>
        <p>
          오류 제보를 받을 때는 계산기 이름, 입력 조건, 확인한 결과, 참고한
          공식 기준과 기준일을 중심으로 확인합니다. 주민등록번호, 계좌번호,
          급여명세서 원본처럼 민감한 개인정보는 보내지 않는 것이 좋습니다.
        </p>
      </section>
    </PolicyPageLayout>
  );
}
