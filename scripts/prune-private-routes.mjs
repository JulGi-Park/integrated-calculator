import { rm } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const projectRootWithSeparator = `${projectRoot}${path.sep}`;

const privateRoutes = [
  {
    route: "calculators/roas",
    enabled: process.env.NEXT_PUBLIC_ENABLE_ROAS_CALCULATOR === "true",
  },
  {
    route: "calculators/labor-pay",
    enabled: process.env.NEXT_PUBLIC_ENABLE_LABOR_PAY_CALCULATOR === "true",
  },
  {
    route: "calculators/vat-profit",
    enabled: process.env.NEXT_PUBLIC_ENABLE_VAT_PROFIT_CALCULATOR === "true",
  },
  {
    route: "calculators/parental-leave",
    enabled: process.env.NEXT_PUBLIC_ENABLE_PARENTAL_LEAVE_CALCULATOR === "true",
  },
  {
    route: "calculators/rent-vs-jeonse",
    enabled: process.env.NEXT_PUBLIC_ENABLE_RENT_VS_JEONSE_CALCULATOR === "true",
  },
  {
    route: "calculators/car-cost",
    enabled: process.env.NEXT_PUBLIC_ENABLE_CAR_COST_CALCULATOR === "true",
  },
  {
    route: "calculators/savings",
    enabled: process.env.NEXT_PUBLIC_ENABLE_SAVINGS_CALCULATOR === "true",
  },
  {
    route: "calculators/average-price",
    enabled: process.env.NEXT_PUBLIC_ENABLE_AVERAGE_PRICE_CALCULATOR === "true",
  },
  {
    route: "calculators/brokerage-fee",
    enabled: process.env.NEXT_PUBLIC_ENABLE_BROKERAGE_FEE_CALCULATOR === "true",
  },
  {
    route: "calculators/card-installment",
    enabled:
      process.env.NEXT_PUBLIC_ENABLE_CARD_INSTALLMENT_CALCULATOR === "true",
  },
  {
    route: "calculators/overtime-pay",
    enabled:
      process.env.NEXT_PUBLIC_ENABLE_OVERTIME_PAY_CALCULATOR === "true",
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
