import assert from "node:assert/strict";
import { test } from "node:test";
import { onRequest as probe } from "../functions/api/internal/knowledge-binding-probe.ts";
import { onRequest as publicProxy } from "../functions/api/knowledge/v1/[[path]].ts";

const url = "https://gyesanbox.kr/api/internal/knowledge-binding-probe";
const token = "test-only-probe-token-with-enough-entropy";
const invoke = (env, headers = {}, method = "GET", requestUrl = url) => probe({ request: new Request(requestUrl, { method, headers }), env });

test("binding probe fails closed when secret is absent, missing, wrong, or request is not production GET", async () => {
  let calls = 0;
  const binding = { async probe() { calls += 1; return "knowledge-binding-probe-v1"; } };
  for (const [env, headers, method, requestUrl] of [
    [{ KNOWLEDGE_SERVICE: binding }, { "X-Knowledge-Binding-Probe-Token": token }, "GET", url],
    [{ KNOWLEDGE_BINDING_PROBE_TOKEN: token, KNOWLEDGE_SERVICE: binding }, {}, "GET", url],
    [{ KNOWLEDGE_BINDING_PROBE_TOKEN: token, KNOWLEDGE_SERVICE: binding }, { "X-Knowledge-Binding-Probe-Token": "wrong" }, "GET", url],
    [{ KNOWLEDGE_BINDING_PROBE_TOKEN: token, KNOWLEDGE_SERVICE: binding }, { "X-Knowledge-Binding-Probe-Token": token }, "GET", "https://preview.integrated-calculator.pages.dev/api/internal/knowledge-binding-probe"],
    [{ KNOWLEDGE_BINDING_PROBE_TOKEN: token, KNOWLEDGE_SERVICE: binding }, { "X-Knowledge-Binding-Probe-Token": token }, "POST", url],
  ]) {
    const response = await invoke(env, headers, method, requestUrl);
    assert.equal(response.status, 404);
    assert.equal(await response.text(), "Not found");
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
  assert.equal(calls, 0);
});

test("valid secret invokes only the named read-only RPC and returns no Worker payload", async () => {
  let calls = 0;
  const response = await invoke({ KNOWLEDGE_ENV: "production", KNOWLEDGE_BINDING_PROBE_TOKEN: token,
    KNOWLEDGE_SERVICE: { async probe() { calls += 1; return "knowledge-binding-probe-v1"; } } },
  { "X-Knowledge-Binding-Probe-Token": token });
  assert.equal(response.status, 204);
  assert.equal(await response.text(), "");
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow, noarchive");
  assert.equal(calls, 1);
});

test("missing, failed, or unexpected binding results fail closed without details", async () => {
  const env = (service) => ({ KNOWLEDGE_ENV: "production", KNOWLEDGE_BINDING_PROBE_TOKEN: token, KNOWLEDGE_SERVICE: service });
  const header = { "X-Knowledge-Binding-Probe-Token": token };
  for (const value of [
    env(undefined),
    env({ async probe() { throw new Error("secret and stack must not escape"); } }),
    env({ async probe() { return "unexpected-internal-value"; } }),
  ]) {
    const response = await invoke(value, header);
    assert.equal(response.status, 503);
    assert.equal(await response.text(), "");
  }
});

test("ordinary public API remains 404 with public gate off and does not call the binding", async () => {
  let calls = 0;
  const response = await publicProxy({ request: new Request("https://gyesanbox.kr/api/knowledge/v1/services"),
    env: { KNOWLEDGE_ENV: "production", KNOWLEDGE_PUBLIC_ENABLED: "false",
      KNOWLEDGE_BINDING_PROBE_TOKEN: token, KNOWLEDGE_SERVICE: { async fetch() { calls += 1; return Response.json({ data: [] }); } } } });
  assert.equal(response.status, 404);
  assert.equal(calls, 0);
});
