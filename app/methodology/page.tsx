import type { Metadata } from "next";
import Link from "next/link";
import { JsonLdScripts } from "@/components/common/JsonLdScripts";
import { PolicyPageLayout } from "@/components/common/PolicyPageLayout";

const canonical = "https://gyesanbox.kr/methodology/";
const title = "계산 방법론 | 계산박스";
const description =
  "계산박스가 공식 기준을 확인하고 계산식을 구현·검수하며 변경과 오류를 반영하는 방법을 안내합니다.";
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
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
};

const jsonLdItems = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "계산박스", item: "https://gyesanbox.kr/" },
      { "@type": "ListItem", position: 2, name: "계산 방법론", item: canonical },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    url: canonical,
    description,
    isPartOf: { "@type": "WebSite", name: "계산박스", url: "https://gyesanbox.kr/" },
  },
];

export default function MethodologyPage() {
  return (
    <>
      <JsonLdScripts items={jsonLdItems} />
      <PolicyPageLayout
        eyebrow="Methodology"
        title="계산 방법론"
        description="계산박스가 계산 기준을 조사하고 결과를 검수·갱신하는 방법을 공개합니다."
      >
        <section>
          <h2>계산박스의 목적</h2>
          <p>
            계산박스는 생활·금융·근로·사업과 관련된 숫자를 입력해 예상 결과와
            그 전제를 함께 살펴보도록 돕습니다. 결과를 확정해 주는 기관 서비스가
            아니라, 공개된 기준을 읽고 비교하기 위한 브라우저 중심 도구입니다.
          </p>
        </section>

        <section>
          <h2>공식 출처 우선순위</h2>
          <p>
            법령과 시행령·고시를 먼저 확인하고, 그 다음 해당 제도를 집행하는
            공공기관의 안내를 대조합니다. 금융 계산에서는 금융기관이나 한국은행
            등 공식 금융자료를 우선 확인하며, 요약 자료는 원문을 찾기 위한
            보조 자료로만 사용합니다.
          </p>
          <p>
            계산 기준일은 자료를 확인한 날짜이고 적용일은 그 기준이 실제로
            적용되는 기간의 시작 또는 종료일입니다. 두 날짜가 다를 수 있으므로
            계산기에는 확인일과 적용 범위를 구분해 표시합니다.
          </p>
        </section>

        <section>
          <h2>계산 엔진과 숫자 처리</h2>
          <p>
            화면 설명과 계산 엔진이 같은 정책값을 사용하도록 기준값을 한곳에서
            관리하고, 입력값의 단위와 계산 순서를 명시합니다. 법령이나 공식
            안내에 상한·하한이 있으면 해당 범위를 적용하고, 소수점 처리 규칙은
            원문 또는 계산기 페이지의 설명에 맞춰 반올림·절사합니다. 중간 계산의
            처리 순서가 결과에 영향을 주는 경우에도 같은 순서를 유지합니다.
          </p>
          <p>
            대표 입력 사례로 정상 결과를 확인하고, 상한·하한의 경계와 바로 안팎의
            값도 자동 테스트합니다. 빈 값, 음수, 숫자가 아닌 값, 날짜 순서 오류와
            같이 계산할 수 없는 입력은 결과를 만들지 않고 화면에서 확인하도록
            검증합니다.
          </p>
        </section>

        <section>
          <h2>자동 반영하지 않는 예외</h2>
          <p>
            회사별 임금 항목, 개인의 가입·수급 이력, 신청 서류와 기관의 심사처럼
            개인별 예외는 공개된 입력만으로 자동 확정할 수 없습니다. 이런 조건은
            계산기에서 제외하거나 별도 안내로 남기며, 실제 적용 여부는 관련
            기관과 고용주·금융기관의 자료를 확인해야 합니다.
          </p>
        </section>

        <section>
          <h2>변경과 오류 수정</h2>
          <p>
            정책 변경이 확인되면 공식 원문과 시행 시점을 다시 대조하고, 정책값·
            계산 설명·대표 사례와 경계값 테스트를 함께 갱신합니다. 확인 가능한
            공개 변경은 <Link href="/updates/">변경 이력</Link>에 대상과 이유를
            기록합니다.
          </p>
          <p>
            오류 제보에는 계산기 이름, 입력 조건, 화면 결과, 참고한 공식 자료와
            확인일을 적어 주세요. 재현 가능한 입력을 먼저 확인하고 원인에 따라
            계산식, 기준 표시 또는 설명을 수정합니다. 주민등록번호나 계좌번호 등
            민감정보는 보내지 않아도 됩니다.
          </p>
        </section>

        <section>
          <h2>브라우저 계산과 참고용 결과</h2>
          <p>
            입력값은 결과를 계산하고 화면에 표시하는 데 필요한 범위에서 브라우저
            중심으로 처리합니다. 결과는 입력값과 공개된 기준에 따른 예상값이며,
            개인별 사실관계·기관의 최신 판단·신고 자료를 대신하지 않습니다.
          </p>
        </section>
      </PolicyPageLayout>
    </>
  );
}
