import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { TRAINING_CERTIFICATE_COST_PUBLICATION } from "../lib/calculators/training-certificate-cost/publication.ts";
import sitemapModule from "../app/sitemap.ts";

const path = "/calculators/training-certificate-cost/";
const canonical = `https://gyesanbox.kr${path}`;

test("국비지원 자격증 취득비용 계산기는 조건 없이 공개 경로를 유지한다", () => {
  assert.deepEqual(TRAINING_CERTIFICATE_COST_PUBLICATION, {
    name: "국비지원 자격증 취득비용 계산기",
    slug: "training-certificate-cost",
    path,
    url: canonical,
    category: "생활",
    description:
      "내일배움카드 훈련비 본인부담금과 시험·교재·재료비 등을 합산해 자격증 취득 예상비용을 계산합니다.",
    releasedAt: "2026-08-12",
  });
  assert.ok(sitemapModule.default().some((entry) => entry.url === canonical));
});

test("모든 공개 진입점은 환경변수 가드 없이 같은 공개 경로를 제공한다", async () => {
  for (const file of [
    "app/calculators/training-certificate-cost/page.tsx",
    "app/page.tsx",
    "lib/calculatorRegistry.ts",
    "lib/site/publicRoutes.ts",
    "app/about/page.tsx",
    "app/updates/page.tsx",
    "lib/favorites.ts",
  ]) {
    const source = await readFile(file, "utf8");
    assert.match(source, /training-certificate-cost/);
    assert.doesNotMatch(source, /NEXT_PUBLIC_ENABLE_TRAINING_CERTIFICATE_COST_CALCULATOR|notFound\(|isTrainingCertificateCostCalculatorEnabled/);
  }
});

test("공개 변경 이력과 관련 계산기는 기능 범위를 과장하지 않는다", async () => {
  const updates = await readFile("app/updates/page.tsx", "utf8");
  const contentData = await readFile(
    "components/calculators/trainingCertificateCostContentData.ts",
    "utf8",
  );

  assert.match(updates, /2026년 8월 12일/);
  assert.match(updates, /국비지원 자격증 취득비용 계산기 공개/);
  assert.match(updates, /지원 자격을 판정하지 않고/);
  assert.match(updates, /재응시 횟수별 예상비용/);
  assert.equal(
    (contentData.match(/href: "\/calculators\/(?:unemployment|salary|work-child-incentive)\/"/g) ?? []).length,
    3,
  );
});
