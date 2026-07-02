import { rm } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const outputRoot = path.join(projectRoot, "out");

const privateCalculatorOutputDirectories = [
  "calculators/roas",
  "calculators/labor-pay",
  "calculators/vat-profit",
  "calculators/parental-leave",
  "calculators/rent-vs-jeonse",
  "calculators/car-cost",
];

function getOutputPath(relativePath) {
  const absolutePath = path.resolve(outputRoot, relativePath);
  const relativeToOutput = path.relative(outputRoot, absolutePath);

  if (
    relativeToOutput === "" ||
    relativeToOutput.startsWith("..") ||
    path.isAbsolute(relativeToOutput)
  ) {
    throw new Error(`Refusing to prune outside out/: ${relativePath}`);
  }

  return absolutePath;
}

for (const relativePath of privateCalculatorOutputDirectories) {
  await rm(getOutputPath(relativePath), { recursive: true, force: true });
}

console.log("Private calculator static export pruning passed.");
