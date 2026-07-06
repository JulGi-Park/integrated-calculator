import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const layoutSource = await readFile("app/layout.tsx", "utf8");
const calculatorMetadataCases = [
  {
    slug: "seller-margin",
    modulePath: "../app/calculators/seller-margin/page.tsx",
    title: "판매자 마진 계산기 - 판매가·수수료·원가 기준 순이익 확인",
    description:
      "판매가, 원가, 플랫폼 수수료, 배송비, 광고비를 입력하면 예상 마진율과 순이익을 계산할 수 있습니다.",
  },
  {
    slug: "salary",
    modulePath: "../app/calculators/salary/page.tsx",
    title: "연봉 실수령액 계산기 - 세금 공제 후 실제 월급 확인",
    description:
      "연봉을 입력하면 국민연금, 건강보험, 고용보험, 소득세 등을 반영해 예상 월 실수령액을 확인할 수 있습니다.",
  },
  {
    slug: "loan",
    modulePath: "../app/calculators/loan/page.tsx",
    title: "대출 이자 계산기 - 원리금·원금균등 상환액 확인",
    description:
      "대출금, 금리, 기간, 상환 방식을 입력하면 월 상환액과 총 이자 부담을 계산할 수 있습니다.",
  },
  {
    slug: "severance",
    modulePath: "../app/calculators/severance/page.tsx",
    title: "퇴직금 계산기 - 평균임금 기준 예상 퇴직금 확인",
    description:
      "입사일, 퇴사일, 임금 정보를 입력하면 평균임금 기준의 예상 퇴직금을 계산할 수 있습니다.",
  },
  {
    slug: "unemployment",
    modulePath: "../app/calculators/unemployment/page.tsx",
    title: "실업급여 계산기 - 구직급여 예상 금액·수급기간 확인",
    description:
      "퇴사 전 임금과 고용보험 가입 기간을 기준으로 실업급여 예상 금액과 수급기간을 확인할 수 있습니다.",
  },
];

function readPngDimensions(buffer) {
  assert.equal(buffer.readUInt32BE(0), 0x89504e47);
  assert.equal(buffer.readUInt32BE(4), 0x0d0a1a0a);
  assert.equal(buffer.toString("ascii", 12, 16), "IHDR");
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test("루트 layout metadata에 아이콘과 기본 공유 이미지가 연결되어 있다", () => {
  assert.match(layoutSource, /icons:\s*\{\s*icon:\s*"\/icon\.png",\s*apple:\s*"\/apple-icon\.png"/s);
  assert.match(layoutSource, /openGraph:\s*\{\s*images:\s*\[\s*\{\s*url:\s*"\/og-default\.png"/s);
  assert.match(layoutSource, /card:\s*"summary_large_image"/);
  assert.match(layoutSource, /images:\s*\["\/og-default\.png"\]/);
});

test("아이콘과 OG 이미지는 정적 파일로 존재하고 권장 크기를 따른다", async () => {
  const [icon, appleIcon, ogImage] = await Promise.all([
    readFile("app/icon.png"),
    readFile("app/apple-icon.png"),
    readFile("public/og-default.png"),
  ]);

  assert.deepEqual(readPngDimensions(icon), {
    width: 512,
    height: 512,
  });
  assert.deepEqual(readPngDimensions(appleIcon), {
    width: 180,
    height: 180,
  });
  assert.deepEqual(readPngDimensions(ogImage), {
    width: 1200,
    height: 630,
  });
});

test("공개 계산기 5개는 지정된 Open Graph와 Twitter 이미지를 사용한다", async () => {
  for (const item of calculatorMetadataCases) {
    const pageModule = await import(item.modulePath);
    const metadata = pageModule.metadata;
    const url = `https://gyesanbox.kr/calculators/${item.slug}/`;
    const image = `https://gyesanbox.kr/og/${item.slug}.png`;

    assert.equal(metadata.alternates.canonical, url);
    assert.equal(metadata.openGraph.type, "website");
    assert.equal(metadata.openGraph.title, item.title);
    assert.equal(metadata.openGraph.description, item.description);
    assert.equal(metadata.openGraph.url, url);
    assert.deepEqual(metadata.openGraph.images, [
      {
        url: image,
        width: 1200,
        height: 630,
        alt: item.title,
      },
    ]);
    assert.equal(metadata.twitter.card, "summary_large_image");
    assert.equal(metadata.twitter.title, item.title);
    assert.equal(metadata.twitter.description, item.description);
    assert.deepEqual(metadata.twitter.images, [image]);
  }
});

test("공개 계산기 OG 이미지는 1200x630 정적 PNG로 존재한다", async () => {
  const images = await Promise.all(
    calculatorMetadataCases.map((item) => readFile(`public/og/${item.slug}.png`)),
  );

  for (const image of images) {
    assert.deepEqual(readPngDimensions(image), {
      width: 1200,
      height: 630,
    });
  }
});
