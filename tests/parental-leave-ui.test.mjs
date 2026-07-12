import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("육아휴직급여 UI는 필수 문구와 제외 범위를 표시한다", async () => {
  const [calculatorSource, contentSource, dataSource] = await Promise.all([
    readFile("components/calculators/ParentalLeaveCalculator.tsx", "utf8"),
    readFile("components/calculators/ParentalLeaveContent.tsx", "utf8"),
    readFile("components/calculators/parentalLeaveContentData.ts", "utf8"),
  ]);
  const source = [calculatorSource, contentSource, dataSource].join("\n");

  for (const pattern of [
    /육아휴직급여 계산기/,
    /계산 기준일/,
    /월 통상임금/,
    /육아휴직 사용 개월 수/,
    /총 예상 수령액/,
    /월별 예상 육아휴직급여/,
    /부모 함께 육아휴직제 6\+6/,
    /한부모 육아휴직 특례/,
    /특례 조건/,
    /임의로 더 유리한 특례를 자동 선택하지 않습니다/,
    /확정 지급액이 아닌 예상값/,
    /고용센터 심사/,
    /결과 복사/,
    /결과 공유/,
  ]) {
    assert.match(source, pattern);
  }
});

test("육아휴직급여 콘텐츠는 FAQ, 공식 출처, 면책 문구를 포함한다", async () => {
  const source = await readFile(
    "components/calculators/parentalLeaveContentData.ts",
    "utf8",
  );
  const faqCount = [...source.matchAll(/question:/g)].length;

  assert.ok(faqCount >= 6, "FAQ는 최소 6개 이상이어야 합니다.");
  assert.match(source, /고용24/);
  assert.match(source, /국가법령정보센터/);
  assert.match(source, /고용보험법 시행령 제95조/);
});
