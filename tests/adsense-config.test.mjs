import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import test from "node:test";
import { AdSenseScript } from "../components/ads/AdSenseScript.tsx";
import {
  ADSENSE_CLIENT,
  getConfiguredAdSenseClient,
  getValidAdSenseClient,
  hasValidAdSenseClient,
} from "../lib/adsense.ts";

test("AdSense client 검증은 비어 있거나 잘못된 값을 차단한다", () => {
  const invalidValues = [
    undefined,
    null,
    "",
    " ",
    "pub-123",
    "ca-pub-",
    "ca-pub-test",
    "ca-pub-123",
    "ca-pub-123456789012345",
    "ca-pub-12345678901234567",
    "ca-pub-1234567890123456 ",
    " google.com",
    "<script>alert(1)</script>",
  ];

  for (const value of invalidValues) {
    assert.equal(getValidAdSenseClient(value), null);
    assert.equal(hasValidAdSenseClient(value), false);
  }
});

test("AdSense client 검증은 실제 형식의 ca-pub ID만 허용한다", () => {
  const client = "ca-pub-1234567890123456";

  assert.equal(getValidAdSenseClient(client), client);
  assert.equal(hasValidAdSenseClient(client), true);
});

test("AdSense 설정값은 제공된 실제 publisher ID를 기본값으로 사용한다", () => {
  assert.equal(ADSENSE_CLIENT, "ca-pub-4273771596550595");
  assert.equal(getConfiguredAdSenseClient(undefined), ADSENSE_CLIENT);
  assert.equal(getConfiguredAdSenseClient(""), ADSENSE_CLIENT);
  assert.equal(getConfiguredAdSenseClient("pub-123"), ADSENSE_CLIENT);
  assert.equal(getConfiguredAdSenseClient("G-YMJFLPRFMV"), ADSENSE_CLIENT);
  assert.equal(getConfiguredAdSenseClient("ca-pub-1234567890123456"), "ca-pub-1234567890123456");
});

test("AdSenseScript는 기본 publisher ID로 전역 연결 스크립트를 렌더링한다", () => {
  const markup = renderToStaticMarkup(React.createElement(AdSenseScript));

  assert.match(markup, /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/);
  assert.match(markup, /client=ca-pub-4273771596550595/);
  assert.match(markup, /crossorigin="anonymous"/);
});
