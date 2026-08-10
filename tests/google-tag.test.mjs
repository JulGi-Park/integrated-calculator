import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { GOOGLE_TAG_ID } from "../components/analytics/GoogleTag.tsx";

test("GoogleTag는 hydration 이후 Google tag를 한 번 로드하도록 구성한다", async () => {
  const source = await readFile("components/analytics/GoogleTag.tsx", "utf8");

  assert.equal(GOOGLE_TAG_ID, "G-YMJFLPRFMV");
  assert.match(source, /import Script from "next\/script"/);
  assert.match(source, /googletagmanager\.com\/gtag\/js\?id=/);
  assert.match(source, /strategy="afterInteractive"/);
  assert.match(source, /id="google-tag-bootstrap"/);
  assert.match(source, /window\.dataLayer = window\.dataLayer \|\| \[\];/);
  assert.match(source, /gtag\('config', '\$\{GOOGLE_TAG_ID\}'\);/);
});
