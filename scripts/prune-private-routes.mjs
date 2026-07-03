import { rm } from "node:fs/promises";
import path from "node:path";
import { isBrokerageFeeCalculatorEnabled } from "../lib/calculators/brokerage-fee/visibility.ts";

const projectRoot = process.cwd();

const privateOutputPaths = [
  "out/calculators/roas",
  "out/calculators/labor-pay",
  "out/calculators/vat-profit",
  "out/calculators/parental-leave",
  "out/calculators/rent-vs-jeonse",
  "out/calculators/car-cost",
  "out/calculators/savings",
  "out/calculators/average-price",
  "out/calculators/brokerage-fee",
];

if (isBrokerageFeeCalculatorEnabled()) {
  console.log(
    "NEXT_PUBLIC_ENABLE_BROKERAGE_FEE_CALCULATOR=true, private route pruning skipped.",
  );
} else {
  for (const relativePath of privateOutputPaths) {
    await rm(path.join(projectRoot, relativePath), {
      force: true,
      recursive: true,
    });
  }

  console.log("Private calculator output pruning completed.");
}
