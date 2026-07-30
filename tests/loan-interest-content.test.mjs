import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { metadata } from "../app/calculators/loan/page.tsx";
import { serializeJsonLd } from "../components/common/JsonLdScripts.tsx";
import {
  loanInterestBreadcrumbJsonLd,
  loanInterestCalculationCriteria,
  loanInterestExampleInput,
  loanInterestExampleInputItems,
  loanInterestExampleResultItems,
  loanInterestExclusions,
  loanInterestFaqJsonLd,
  loanInterestFaqs,
  loanInterestQuickComparison,
  loanInterestSources,
  loanInterestWebApplicationJsonLd,
} from "../components/calculators/loanInterestContentData.ts";
import { calculateLoanRepaymentComparison } from "../lib/calculators/loan/loan-repayment.ts";

const pageSource = await readFile("app/calculators/loan/page.tsx", "utf8");
const contentSource = await readFile(
  "components/calculators/LoanInterestContent.tsx",
  "utf8",
);
const dataSource = await readFile(
  "components/calculators/loanInterestContentData.ts",
  "utf8",
);

test("대출 계산기 전용 SEO 메타데이터를 대표 URL 기준으로 설정한다", () => {
  const expectedTitle =
    "대출 이자 계산기·원리금 계산기 | 월 납입액·총이자 비교";
  const expectedDescription =
    "대출원금과 연이율, 기간을 입력해 원리금균등·원금균등·만기일시상환의 예상 월 납입액과 총이자를 비교하고 월별 상환 일정을 확인하세요.";
  const expectedOgTitle = expectedTitle;
  const expectedOgDescription = expectedDescription;
  const expectedOgImage = "https://gyesanbox.kr/og/loan.png";

  assert.equal(metadata.title, expectedTitle);
  assert.equal(metadata.description, expectedDescription);
  assert.deepEqual(metadata.robots, { index: true, follow: true });
  assert.equal(metadata.openGraph.title, expectedOgTitle);
  assert.equal(metadata.openGraph.description, expectedOgDescription);
  assert.equal(metadata.openGraph.type, "website");
  assert.equal(metadata.openGraph.url, "https://gyesanbox.kr/calculators/loan/");
  assert.deepEqual(metadata.openGraph.images, [
    {
      url: expectedOgImage,
      width: 1200,
      height: 630,
      alt: expectedOgTitle,
    },
  ]);
  assert.equal(metadata.twitter.card, "summary_large_image");
  assert.equal(metadata.twitter.title, expectedOgTitle);
  assert.equal(metadata.twitter.description, expectedOgDescription);
  assert.deepEqual(metadata.twitter.images, [expectedOgImage]);
  assert.deepEqual(metadata.alternates, {
    canonical: "https://gyesanbox.kr/calculators/loan/",
  });

  const metadataText = JSON.stringify(metadata);
  assert.doesNotMatch(
    metadataText,
    /localhost|127\.0\.0\.1|pages\.dev|example\.com|www\.gyesanbox\.kr/,
  );
});

test("대출 페이지 상단은 H1 하나와 고정 안내를 유지한다", () => {
  assert.equal((pageSource.match(/<CompactCalculatorHero\b/g) ?? []).length, 1);
  assert.match(pageSource, /title="대출 이자 계산기·원리금 계산기"/);
  assert.match(pageSource, /원 단위 예상 계산/);
  assert.match(pageSource, /실제 대출 가능\s+범위를 뜻하지 않습니다/);
});

test("상환방식 빠른 비교를 세 카드로 정적으로 표시한다", () => {
  assert.equal(loanInterestQuickComparison.length, 3);
  assert.match(contentSource, /loanInterestQuickComparison\.map/);
  assert.deepEqual(
    loanInterestQuickComparison.map((item) => item.title),
    ["원리금균등상환", "원금균등상환", "만기일시상환"],
  );
});

test("계산 기준·반올림·마지막 회차 보정을 설명한다", () => {
  assert.equal(loanInterestCalculationCriteria.common.length, 5);
  assert.match(
    contentSource,
    /현재 계산기는 월 이율, 원 단위 half-up 반올림, 마지막 회차 잔액\s+보정 정책/,
  );
  assert.match(dataSource, /half-up 반올림/);
  assert.match(dataSource, /마지막 회차 원금은 남은 잔액 전액으로 보정/);
  assert.match(dataSource, /0% 금리도 별도 처리/);
  assert.match(dataSource, /1개월 대출도/);
});

test("고정 예시 입력과 결과는 엔진 확정값과 일치한다", () => {
  assert.deepEqual(loanInterestExampleInput, {
    principal: 100_000_000,
    annualInterestRate: 4.5,
    termMonths: 360,
  });
  assert.deepEqual(loanInterestExampleInputItems, [
    { label: "대출원금", value: "100,000,000원" },
    { label: "연이율", value: "4.5%" },
    { label: "기간", value: "360개월" },
  ]);

  assert.deepEqual(loanInterestExampleResultItems, [
    {
      title: "원리금균등상환",
      items: [
        { label: "첫 달 납입액", value: "506,685원" },
        { label: "마지막 달 납입액", value: "506,926원" },
        { label: "총이자", value: "82,406,841원" },
        { label: "총상환액", value: "182,406,841원" },
        { label: "월 납입액 특징", value: "대체로 일정" },
      ],
    },
    {
      title: "원금균등상환",
      items: [
        { label: "첫 달 납입액", value: "652,777원" },
        { label: "마지막 달 납입액", value: "279,100원" },
        { label: "총이자", value: "67,687,688원" },
        { label: "총상환액", value: "167,687,688원" },
        { label: "월 납입액 특징", value: "점차 감소" },
      ],
    },
    {
      title: "만기일시상환",
      items: [
        { label: "첫 달 납입액", value: "375,000원" },
        { label: "마지막 달 납입액", value: "100,375,000원" },
        { label: "총이자", value: "135,000,000원" },
        { label: "총상환액", value: "235,000,000원" },
        { label: "월 납입액 특징", value: "이자만 내다가 만기 상환" },
      ],
    },
  ]);

  const response = calculateLoanRepaymentComparison(loanInterestExampleInput);

  assert.equal(response.success, true);
  if (!response.success) {
    throw new Error("고정 예시 계산이 실패했습니다.");
  }

  assert.equal(response.data.equalPayment.repaymentType, "equalPayment");
  assert.equal(response.data.equalPayment.principal, 100_000_000);
  assert.equal(response.data.equalPayment.totalInterest, 82_406_841);
  assert.equal(response.data.equalPayment.totalPayment, 182_406_841);
  assert.equal(response.data.equalPayment.termMonths, 360);
  assert.equal(response.data.equalPayment.regularMonthlyPayment, 506_685);
  assert.equal(response.data.equalPayment.firstMonthPrincipal, 131_685);
  assert.equal(response.data.equalPayment.firstMonthInterest, 375_000);
  assert.equal(response.data.equalPayment.lastMonthPrincipal, 505_032);
  assert.equal(response.data.equalPayment.lastMonthInterest, 1_894);
  assert.equal(response.data.equalPayment.lastMonthPayment, 506_926);

  assert.equal(response.data.equalPrincipal.repaymentType, "equalPrincipal");
  assert.equal(response.data.equalPrincipal.principal, 100_000_000);
  assert.equal(response.data.equalPrincipal.totalInterest, 67_687_688);
  assert.equal(response.data.equalPrincipal.totalPayment, 167_687_688);
  assert.equal(response.data.equalPrincipal.termMonths, 360);
  assert.equal(response.data.equalPrincipal.baseMonthlyPrincipal, 277_777);
  assert.equal(response.data.equalPrincipal.firstMonthPayment, 652_777);
  assert.equal(response.data.equalPrincipal.lastMonthPayment, 279_100);
  assert.equal(response.data.equalPrincipal.firstMonthInterest, 375_000);
  assert.equal(response.data.equalPrincipal.lastMonthInterest, 1_043);

  assert.equal(response.data.bullet.repaymentType, "bullet");
  assert.equal(response.data.bullet.principal, 100_000_000);
  assert.equal(response.data.bullet.totalInterest, 135_000_000);
  assert.equal(response.data.bullet.totalPayment, 235_000_000);
  assert.equal(response.data.bullet.termMonths, 360);
  assert.equal(response.data.bullet.regularMonthlyInterest, 375_000);
  assert.equal(response.data.bullet.maturityMonthPayment, 100_375_000);
  assert.equal(response.data.bullet.maturityMonthPrincipal, 100_000_000);
  assert.equal(response.data.bullet.maturityMonthInterest, 375_000);

  assert.deepEqual(response.data.lowestTotalInterestTypes, ["equalPrincipal"]);
  assert.deepEqual(response.data.lowestFirstMonthPaymentTypes, ["bullet"]);
  assert.deepEqual(response.data.levelPaymentTypes, ["equalPayment"]);
  assert.deepEqual(response.data.totalInterestDifferences, {
    equalPaymentVsEqualPrincipal: 14_719_153,
    equalPaymentVsBullet: 52_593_159,
    equalPrincipalVsBullet: 67_312_312,
  });

  assert.equal(response.data.equalPayment.schedule.length, 360);
  assert.equal(response.data.equalPrincipal.schedule.length, 360);
  assert.equal(response.data.bullet.schedule.length, 360);
  assert.deepEqual(response.data.equalPayment.schedule[0], {
    installmentNumber: 1,
    openingBalance: 100_000_000,
    principalPayment: 131_685,
    interestPayment: 375_000,
    monthlyPayment: 506_685,
    closingBalance: 99_868_315,
  });
  assert.deepEqual(response.data.equalPayment.schedule.at(-1), {
    installmentNumber: 360,
    openingBalance: 505_032,
    principalPayment: 505_032,
    interestPayment: 1_894,
    monthlyPayment: 506_926,
    closingBalance: 0,
  });

  assert.match(dataSource, /calculateLoanRepaymentComparison\(/);
  assert.match(dataSource, /if \(!loanInterestExampleResponse\.success\)/);
  assert.doesNotMatch(contentSource, /121,494,176|120,166,675|140,000,000/);
});

test("결과 해석·제외 항목·면책 문구를 제공한다", () => {
  assert.match(contentSource, /총이자와 첫 달 부담은 서로 다른 기준입니다/);
  assert.match(contentSource, /월별 현금흐름과 만기\s+부담을 함께 보고 판단/);
  assert.match(
    dataSource,
    /원금균등상환은 일반적으로 총이자가 적을 수 있지만/,
  );
  assert.match(
    contentSource,
    /대출 가입이나\s+특정 상환방식 선택을 권유하는 자료가 아닙니다/,
  );

  assert.equal(loanInterestExclusions.length, 16);
  assert.match(contentSource, /loanInterestExclusions\.map/);
});

test("FAQ 8개를 한 곳에서 관리하고 FAQPage와 순서가 일치한다", () => {
  const expectedQuestions = [
    "대출이자는 어떻게 계산하나요?",
    "원리금균등과 원금균등의 차이는 무엇인가요?",
    "총이자가 가장 적은 상환방식은 무엇인가요?",
    "월 납입액이 일정한 상환방식은 무엇인가요?",
    "만기일시상환은 마지막 달에 얼마를 내나요?",
    "0% 금리도 계산할 수 있나요?",
    "거치기간과 중도상환수수료도 반영되나요?",
    "실제 은행 상환금액과 계산 결과가 다른 이유는 무엇인가요?",
  ];

  assert.deepEqual(
    loanInterestFaqs.map((faq) => faq.question),
    expectedQuestions,
  );
  assert.equal(loanInterestFaqJsonLd.mainEntity.length, 8);
  assert.match(contentSource, /loanInterestFaqs\.map/);

  for (const [index, faq] of loanInterestFaqs.entries()) {
    assert.equal(loanInterestFaqJsonLd.mainEntity[index].name, faq.question);
    assert.equal(
      loanInterestFaqJsonLd.mainEntity[index].acceptedAnswer.text,
      faq.answer,
    );
  }
});

test("관련 계산기는 실제 내부 라우트만 링크하고 가짜 링크는 없다", () => {
  assert.match(contentSource, /href="\/calculators\/salary\/"/);
  assert.match(contentSource, /href="\/calculators\/seller-margin\/"/);
  assert.doesNotMatch(
    contentSource,
    /href="(?:#|javascript:|\/calculators\/(?:retirement|loan-other|coming-soon))/,
  );
});

test("공식 출처는 현재 접근 가능한 공식 원문만 사용한다", () => {
  assert.equal(loanInterestSources.length, 3);
  assert.match(contentSource, /loanInterestSources\.map/);
  assert.match(contentSource, /target="_blank" rel="noopener noreferrer"/);

  for (const source of loanInterestSources) {
    assert.ok(source.organization.length > 0);
    assert.ok(source.title.length > 0);
    assert.ok(source.criterion.length > 0);
    assert.equal(source.verifiedAt, "2026년 6월 22일");
    assert.match(
      source.href,
      /^https:\/\/(www\.)?(hf\.go\.kr|kinfa\.or\.kr)\//,
    );
  }
});

test("WebApplication, BreadcrumbList와 FAQPage JSON-LD가 안전하다", () => {
  const items = [
    loanInterestWebApplicationJsonLd,
    loanInterestBreadcrumbJsonLd,
    loanInterestFaqJsonLd,
  ];

  assert.deepEqual(
    items.map((item) => item["@type"]),
    ["WebApplication", "BreadcrumbList", "FAQPage"],
  );
  assert.equal(
    loanInterestWebApplicationJsonLd.applicationCategory,
    "FinanceApplication",
  );
  assert.deepEqual(
    loanInterestBreadcrumbJsonLd.itemListElement.map((item) => item.name),
    ["홈", "계산기 목록", "대출 이자 계산기·원리금 계산기"],
  );
  assert.deepEqual(
    loanInterestBreadcrumbJsonLd.itemListElement.map((item) => item.item),
    [
      "https://gyesanbox.kr/",
      "https://gyesanbox.kr/calculators/",
      "https://gyesanbox.kr/calculators/loan/",
    ],
  );

  for (const item of items) {
    const serialized = serializeJsonLd(item);
    assert.deepEqual(JSON.parse(serialized), item);
    assert.doesNotMatch(
      serialized,
      /aggregateRating|review|offers|NaN|Infinity|undefined|localhost|127\.0\.0\.1|pages\.dev|판매자 마진 계산기|연봉 실수령액 계산기/,
    );
  }
});

test("페이지는 공통 JSON-LD와 대출 콘텐츠 컴포넌트를 사용한다", () => {
  assert.match(pageSource, /<JsonLdScripts items=\{jsonLdItems\}/);
  assert.match(pageSource, /loanInterestWebApplicationJsonLd/);
  assert.match(pageSource, /loanInterestBreadcrumbJsonLd/);
  assert.match(pageSource, /loanInterestFaqJsonLd/);
  assert.match(pageSource, /<LoanInterestContent \/>/);
});
