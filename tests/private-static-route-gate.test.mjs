import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  getStaticRouteOutputPaths,
  privateStaticRoutes,
  pruneDisabledStaticRoutes,
} from "../scripts/prune-disabled-static-routes.mjs";

test("비공개 주택 취득세 계산기는 기본값에서 정적 산출물에서 제외한다", async () => {
  assert.deepEqual(privateStaticRoutes, [
    {
      pathname: "/calculators/housing-acquisition-tax/",
      environmentVariable: "NEXT_PUBLIC_ENABLE_HOUSING_ACQUISITION_TAX_CALCULATOR",
    },
  ]);
  assert.deepEqual(
    await pruneDisabledStaticRoutes({
      outputDirectory: "out",
      environment: {},
    }),
    ["/calculators/housing-acquisition-tax/"],
  );
});

test("출력 디렉터리 밖을 가리키는 route 정의를 거부한다", () => {
  assert.throws(
    () => getStaticRouteOutputPaths("out", "/calculators/../private/"),
    /unsafe segment/,
  );
});

test("발행 감사는 비공개 정적 경로를 sitemap 기대 목록에서 제외한다", async () => {
  const source = await readFile("scripts/audit-publisher-content.mjs", "utf8");
  assert.match(source, /privateStaticRoutes/);
  assert.match(source, /privateRoutePaths\.has\(pathname\)/);
});
