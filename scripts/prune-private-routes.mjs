import { rm } from "node:fs/promises";
import path from "node:path";
import {
  AVERAGE_PRICE_CALCULATOR_FLAG,
  isAveragePriceCalculatorEnabled,
} from "../lib/calculators/average-price/visibility.ts";

const projectRoot = process.cwd();

const privateOutputPaths = [
  "out/calculators/average-price",
  "out/calculators/roas",
  "out/calculators/labor-pay",
  "out/calculators/vat-profit",
  "out/calculators/parental-leave",
  "out/calculators/rent-vs-jeonse",
  "out/calculators/car-cost",
  "out/calculators/savings",
];

if (isAveragePriceCalculatorEnabled()) {
  console.log(
    `${AVERAGE_PRICE_CALCULATOR_FLAG}=true, private route pruning skipped.`,
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
