import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm, mkdir, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  getStaticRouteOutputPaths,
  privateStaticRoutes,
  pruneDisabledStaticRoutes,
} from "../scripts/prune-disabled-static-routes.mjs";

test("공개 계산기는 환경변수로 정적 산출물에서 제외하지 않는다", async () => {
  assert.deepEqual(privateStaticRoutes.map(r=>r.pathname), ["/knowledge/"]);
  const outputDirectory=await mkdtemp(path.join(tmpdir(),"knowledge-route-gate-"));
  try {
    const calculator=path.join(outputDirectory,"calculators","training-certificate-cost");
    await mkdir(calculator,{recursive:true});
    assert.deepEqual(await pruneDisabledStaticRoutes({outputDirectory,
      environment:{NEXT_PUBLIC_ENABLE_TRAINING_CERTIFICATE_COST_CALCULATOR:"false"}}),["/knowledge/"]);
    await access(calculator);
    for(const environment of [{NEXT_PUBLIC_ENABLE_KNOWLEDGE_PREVIEW:"true"},
      {KNOWLEDGE_ENV:"production",KNOWLEDGE_PUBLIC_ENABLED:"true"}]) {
      assert.deepEqual(await pruneDisabledStaticRoutes({outputDirectory,environment}),[]);
    }
  } finally {await rm(outputDirectory,{recursive:true,force:true});}
});

test("출력 디렉터리 밖을 가리키는 route 정의를 거부한다", () => {
  assert.throws(
    () => getStaticRouteOutputPaths("out", "/calculators/../private/"),
    /unsafe segment/,
  );
});
