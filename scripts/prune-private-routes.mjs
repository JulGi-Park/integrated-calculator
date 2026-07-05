import { rm } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const projectRootWithSeparator = `${projectRoot}${path.sep}`;

const privateRoutes = [
  {
    route: "calculators/card-installment",
    enabled:
      process.env.NEXT_PUBLIC_ENABLE_CARD_INSTALLMENT_CALCULATOR === "true",
  },
];

async function removeIfExists(relativePath) {
  const absolutePath = path.resolve(projectRoot, relativePath);

  if (
    absolutePath !== projectRoot &&
    !absolutePath.startsWith(projectRootWithSeparator)
  ) {
    throw new Error(`Refusing to prune outside project: ${absolutePath}`);
  }

  await rm(absolutePath, { recursive: true, force: true });
}

for (const { route, enabled } of privateRoutes) {
  if (enabled) {
    continue;
  }

  await removeIfExists(path.join("out", route));
  await removeIfExists(path.join("out", `${route}.html`));
}

console.log("Private route pruning completed.");
