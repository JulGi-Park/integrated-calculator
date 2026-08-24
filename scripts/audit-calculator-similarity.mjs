import { readFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const outputRoot = path.join(projectRoot, "out", "calculators");
const routes = [
  "average-price",
  "brokerage-fee",
  "car-cost",
  "card-installment",
  "dsr",
  "labor-pay",
  "loan",
  "overtime-pay",
  "parental-leave",
  "rent-vs-jeonse",
  "roas",
  "salary",
  "savings",
  "seller-margin",
  "severance",
  "social-insurance",
  "training-certificate-cost",
  "unemployment",
  "vat-profit",
  "work-child-incentive",
  "youth-future-savings",
];

function decodeEntities(value) {
  return value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    );
}

function extractMainText(html) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
  return decodeEntities(
    main
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function shingles(text, size = 5) {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}%]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const found = new Set();
  for (let index = 0; index <= words.length - size; index += 1) {
    found.add(words.slice(index, index + size).join(" "));
  }
  return found;
}

function jaccard(left, right) {
  let intersection = 0;
  for (const value of left) {
    if (right.has(value)) intersection += 1;
  }
  return intersection / (left.size + right.size - intersection || 1);
}

const pages = [];
for (const route of routes) {
  const html = await readFile(path.join(outputRoot, route, "index.html"), "utf8");
  const text = extractMainText(html);
  pages.push({ route, text, shingles: shingles(text) });
}

const pairs = [];
for (let left = 0; left < pages.length; left += 1) {
  for (let right = left + 1; right < pages.length; right += 1) {
    pairs.push({
      left: pages[left].route,
      right: pages[right].route,
      similarity: jaccard(pages[left].shingles, pages[right].shingles),
    });
  }
}
pairs.sort((a, b) => b.similarity - a.similarity);

const repeatedSentences = new Map();
for (const page of pages) {
  const sentences = new Set(
    page.text
      .split(/(?<=[.!?。]|다\.)\s+/u)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length >= 35),
  );
  for (const sentence of sentences) {
    const owners = repeatedSentences.get(sentence) ?? [];
    owners.push(page.route);
    repeatedSentences.set(sentence, owners);
  }
}

const repeated = [...repeatedSentences.entries()]
  .filter(([, owners]) => owners.length >= 3)
  .sort((a, b) => b[1].length - a[1].length || b[0].length - a[0].length);

console.log("Calculator content similarity diagnostic (manual review required; not a quality score)");
console.log("Top 10 pairs by five-word-shingle Jaccard similarity:");
for (const pair of pairs.slice(0, 10)) {
  console.log(`- ${pair.left} <> ${pair.right}: ${(pair.similarity * 100).toFixed(2)}%`);
}
console.log(`Repeated sentences of 35+ characters across 3+ calculators: ${repeated.length}`);
for (const [sentence, owners] of repeated.slice(0, 20)) {
  console.log(`- [${owners.join(", ")}] ${sentence}`);
}
