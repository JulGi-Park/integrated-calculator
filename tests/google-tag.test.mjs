import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import test from "node:test";
import { GoogleTag, GOOGLE_TAG_ID } from "../components/analytics/GoogleTag.tsx";

test("GoogleTag는 요청된 Google tag ID를 한 번 렌더링한다", () => {
  const markup = renderToStaticMarkup(React.createElement(GoogleTag));

  assert.equal(GOOGLE_TAG_ID, "G-YMJFLPRFMV");
  assert.match(markup, /https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-YMJFLPRFMV/);
  assert.match(markup, /window\.dataLayer = window\.dataLayer \|\| \[\];/);
  assert.match(markup, /gtag\('config', 'G-YMJFLPRFMV'\);/);
  assert.equal((markup.match(/googletagmanager\.com/g) ?? []).length, 1);
  assert.equal((markup.match(/G-YMJFLPRFMV/g) ?? []).length, 2);
});
