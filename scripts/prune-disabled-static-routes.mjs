import { rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const privateStaticRoutes = [
  {
    pathname: "/calculators/training-certificate-cost/",
    environmentVariable:
      "NEXT_PUBLIC_ENABLE_TRAINING_CERTIFICATE_COST_CALCULATOR",
    expectedText: "국비지원 자격증 취득비용 계산기",
  },
];

export function isStaticRouteEnabled(value) {
  return value === "true";
}

function getSafeRouteSegments(pathname) {
  if (!pathname.startsWith("/") || !pathname.endsWith("/")) {
    throw new Error(`Private static route must use an absolute trailing-slash pathname: ${pathname}`);
  }

  const segments = pathname.split("/").filter(Boolean);

  if (
    segments.length === 0 ||
    segments.some((segment) => !/^[a-z0-9][a-z0-9-]*$/.test(segment))
  ) {
    throw new Error(`Private static route contains an unsafe segment: ${pathname}`);
  }

  return segments;
}

export function getStaticRouteOutputPaths(outputDirectory, pathname) {
  const outputRoot = path.resolve(outputDirectory);
  const segments = getSafeRouteSegments(pathname);
  const routePath = path.join(...segments);
  const candidates = [
    path.join(outputRoot, routePath),
    path.join(outputRoot, `${routePath}.html`),
    path.join(outputRoot, `${routePath}.txt`),
    path.join(outputRoot, `${routePath}.json`),
  ];

  for (const candidate of candidates) {
    const relativePath = path.relative(outputRoot, candidate);

    if (
      relativePath === "" ||
      relativePath.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relativePath)
    ) {
      throw new Error(`Refusing to target a path outside the static output: ${candidate}`);
    }
  }

  return candidates;
}

export async function pruneDisabledStaticRoutes({
  outputDirectory = path.join(process.cwd(), "out"),
  environment = process.env,
} = {}) {
  const removedRoutes = [];

  for (const route of privateStaticRoutes) {
    if (isStaticRouteEnabled(environment[route.environmentVariable])) {
      continue;
    }

    const [routeDirectory, ...flatRouteFiles] = getStaticRouteOutputPaths(
      outputDirectory,
      route.pathname,
    );

    await rm(routeDirectory, { recursive: true, force: true });
    await Promise.all(flatRouteFiles.map((file) => rm(file, { force: true })));
    removedRoutes.push(route.pathname);
  }

  return removedRoutes;
}

const isDirectExecution =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectExecution) {
  const removedRoutes = await pruneDisabledStaticRoutes();

  if (removedRoutes.length === 0) {
    console.log("Private static routes retained for this build.");
  } else {
    console.log(`Excluded disabled static routes: ${removedRoutes.join(", ")}`);
  }
}
