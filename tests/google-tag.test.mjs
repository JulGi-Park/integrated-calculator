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
  assert.match(source, /gtag\('config', '\$\{GOOGLE_TAG_ID\}', \{ send_page_view: false \}\);/);
  assert.match(source, /window\.dispatchEvent\(new Event\('ga4-ready'\)\);/);
});

test("GoogleAnalyticsPageView는 최초 로드와 App Router 이동에 URL 포함 page_view를 한 번 전송한다", async () => {
  const source = await readFile("components/analytics/GoogleAnalyticsPageView.tsx", "utf8");

  assert.match(source, /"use client"/);
  assert.match(source, /usePathname\(\)/);
  assert.match(source, /window\.gtag\?\.\("event", "page_view"/);
  assert.match(source, /send_to: GOOGLE_TAG_ID/);
  assert.match(source, /page_location: window\.location\.href/);
  assert.match(source, /page_path: pathname/);
  assert.match(source, /page_title: document\.title/);
  assert.match(source, /ga4-ready/);
});
