import assert from "node:assert/strict";
import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const sourceDirectories = ["app", "components"];
const nextConfigPath = path.join(projectRoot, "next.config.ts");

const requiredStaticFiles = [
  ["out/index.html", "계산박스"],
  ["out/calculators/index.html", "계산기 목록"],
  [
    "out/calculators/seller-margin/index.html",
    "판매 조건을 입력하세요",
  ],
  [
    "out/calculators/unemployment/index.html",
    "실업급여 계산기",
  ],
];

const forbiddenStaticPaths = [
  "out/calculators/rent-vs-jeonse",
];

const forbiddenSourcePatterns = [
  {
    pattern: /["']use server["']/,
    reason: "Server Actions are not allowed.",
  },
  {
    pattern: /from\s+["']next\/(?:headers|server)["']/,
    reason: "Server-only Next.js APIs are not allowed.",
  },
  {
    pattern: /from\s+["']server-only["']/,
    reason: "The server-only package is not allowed.",
  },
  {
    pattern: /\b(?:cookies|headers|draftMode|connection)\s*\(/,
    reason: "Dynamic server functions are not allowed.",
  },
  {
    pattern: /\b(?:revalidatePath|revalidateTag|unstable_noStore)\s*\(/,
    reason: "Server revalidation APIs are not allowed.",
  },
  {
    pattern: /from\s+["']next\/image["']/,
    reason:
      "next/image requires an explicit static-export-compatible loader review.",
  },
];

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(fullPath)));
    } else if (/\.(?:ts|tsx|js|jsx|mjs)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

async function verifyNextConfig() {
  const config = await readFile(nextConfigPath, "utf8");

  assert.match(
    config,
    /output:\s*["']export["']/,
    'next.config.ts must keep output: "export".',
  );
  assert.match(
    config,
    /trailingSlash:\s*true/,
    "next.config.ts must keep trailingSlash: true.",
  );
}

async function verifySourceCompatibility() {
  const sourceFiles = (
    await Promise.all(
      sourceDirectories.map((directory) =>
        collectSourceFiles(path.join(projectRoot, directory)),
      ),
    )
  ).flat();

  for (const file of sourceFiles) {
    const relativePath = path.relative(projectRoot, file);
    const source = await readFile(file, "utf8");

    assert.ok(
      !/(?:^|[\\/])route\.(?:ts|tsx|js|jsx)$/.test(file),
      `${relativePath}: Route Handlers are not allowed in this project.`,
    );

    for (const { pattern, reason } of forbiddenSourcePatterns) {
      assert.doesNotMatch(source, pattern, `${relativePath}: ${reason}`);
    }
  }
}

async function verifyStaticOutput() {
  const outputStats = await stat(path.join(projectRoot, "out"));

  assert.ok(outputStats.isDirectory(), "The out/ directory was not created.");

  for (const [relativePath, expectedText] of requiredStaticFiles) {
    const absolutePath = path.join(projectRoot, relativePath);
    const html = await readFile(absolutePath, "utf8");

    assert.match(
      html,
      new RegExp(expectedText),
      `${relativePath} does not contain its expected page content.`,
    );
  }

  for (const relativePath of forbiddenStaticPaths) {
    const absolutePath = path.join(projectRoot, relativePath);
    await assert.rejects(
      access(absolutePath),
      `${relativePath} must not be present in production static output.`,
    );
  }
}

await verifyNextConfig();
await verifySourceCompatibility();
await verifyStaticOutput();

console.log("Cloudflare Pages static export verification passed.");
