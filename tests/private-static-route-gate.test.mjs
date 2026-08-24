import assert from "node:assert/strict";
import test from "node:test";
import {
  getStaticRouteOutputPaths,
  privateStaticRoutes,
  pruneDisabledStaticRoutes,
} from "../scripts/prune-disabled-static-routes.mjs";

test("공개 계산기는 환경변수로 정적 산출물에서 제외하지 않는다", async () => {
  assert.deepEqual(privateStaticRoutes, []);
  assert.deepEqual(
    await pruneDisabledStaticRoutes({
      outputDirectory: "out",
      environment: { NEXT_PUBLIC_ENABLE_TRAINING_CERTIFICATE_COST_CALCULATOR: "false" },
    }),
    [],
  );
});

test("출력 디렉터리 밖을 가리키는 route 정의를 거부한다", () => {
  assert.throws(
    () => getStaticRouteOutputPaths("out", "/calculators/../private/"),
    /unsafe segment/,
  );
});
