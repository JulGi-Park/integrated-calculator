import { rm } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();

const localOnlyOutputDirectories = [
  "out/calculators/rent-vs-jeonse",
];

for (const relativePath of localOnlyOutputDirectories) {
  const absolutePath = path.resolve(projectRoot, relativePath);
  const outputRoot = path.resolve(projectRoot, "out");

  if (!absolutePath.startsWith(`${outputRoot}${path.sep}`)) {
    throw new Error(`Refusing to prune outside out/: ${relativePath}`);
  }

  await rm(absolutePath, { recursive: true, force: true });
}

console.log("Local-only route output pruning passed.");
