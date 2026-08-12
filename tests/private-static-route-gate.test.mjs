import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  getStaticRouteOutputPaths,
  isStaticRouteEnabled,
  pruneDisabledStaticRoutes,
} from "../scripts/prune-disabled-static-routes.mjs";

const featureEnvironmentVariable =
  "NEXT_PUBLIC_ENABLE_TRAINING_CERTIFICATE_COST_CALCULATOR";

async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

test("정확한 소문자 true만 정적 route를 활성화한다", () => {
  assert.equal(isStaticRouteEnabled("true"), true);

  for (const value of [undefined, "", "false", "TRUE", "1", "yes"]) {
    assert.equal(isStaticRouteEnabled(value), false, String(value));
  }
});

test("비활성 route 산출물만 제거하고 공개 산출물은 보존한다", async () => {
  const outputDirectory = await mkdtemp(
    path.join(os.tmpdir(), "cal-private-static-route-"),
  );
  const [privateRouteDirectory, ...flatPrivateRouteFiles] =
    getStaticRouteOutputPaths(
      outputDirectory,
      "/calculators/training-certificate-cost/",
    );
  const publicRouteFile = path.join(
    outputDirectory,
    "calculators",
    "salary",
    "index.html",
  );

  try {
    await mkdir(privateRouteDirectory, { recursive: true });
    await mkdir(path.dirname(publicRouteFile), { recursive: true });
    await writeFile(path.join(privateRouteDirectory, "index.html"), "private");
    await Promise.all(
      flatPrivateRouteFiles.map((file) => writeFile(file, "private")),
    );
    await writeFile(publicRouteFile, "public");

    const removedRoutes = await pruneDisabledStaticRoutes({
      outputDirectory,
      environment: { [featureEnvironmentVariable]: "false" },
    });

    assert.deepEqual(removedRoutes, [
      "/calculators/training-certificate-cost/",
    ]);
    for (const targetPath of [
      privateRouteDirectory,
      ...flatPrivateRouteFiles,
    ]) {
      assert.equal(await pathExists(targetPath), false, targetPath);
    }
    assert.equal(await pathExists(publicRouteFile), true);
  } finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
});

test("활성 route 산출물은 제거하지 않는다", async () => {
  const outputDirectory = await mkdtemp(
    path.join(os.tmpdir(), "cal-private-static-route-"),
  );
  const [privateRouteDirectory] = getStaticRouteOutputPaths(
    outputDirectory,
    "/calculators/training-certificate-cost/",
  );
  const privateRouteFile = path.join(privateRouteDirectory, "index.html");

  try {
    await mkdir(privateRouteDirectory, { recursive: true });
    await writeFile(privateRouteFile, "private");

    const removedRoutes = await pruneDisabledStaticRoutes({
      outputDirectory,
      environment: { [featureEnvironmentVariable]: "true" },
    });

    assert.deepEqual(removedRoutes, []);
    assert.equal(await pathExists(privateRouteFile), true);
  } finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
});

test("출력 디렉터리 밖을 가리키는 route 정의를 거부한다", () => {
  assert.throws(
    () => getStaticRouteOutputPaths("out", "/calculators/../private/"),
    /unsafe segment/,
  );
});
