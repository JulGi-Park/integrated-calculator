# Knowledge public transport contract

Pages uses one canonical binding: `KNOWLEDGE_SERVICE`, targeting the dedicated
Knowledge Worker **named entrypoint `KnowledgePublicEntrypoint`**, not the default
entrypoint and not `KnowledgeImportEntrypoint`. Preview and Production must target
their respective dedicated Workers. This document is not a deployment instruction
or authorization: no live binding or gate is changed in this code-only task.

Browser components take an `enabled` flag, not an API origin. They call
`/api/knowledge/v1` on the current Pages origin. The Pages catch-all function checks
the runtime public gate and the shared visitor allowlist before invoking the binding.
SEO detail, related-question reads and runtime sitemap use the same binding helper.
There is no URL-based fallback, including in development; local tests/development
must explicitly supply a binding implementation. Missing binding is 503 when public
is enabled; disabled public routes remain 404. Responses are no-store.

Allowed surface:

- `GET /services`
- `GET, POST /questions`
- `GET, PATCH, DELETE /questions/{v4 UUID}`
- `POST /questions/{v4 UUID}/verify-password`

All paths above are relative to `/api/knowledge/v1`. Administrative, import,
internal, unknown paths and other methods are denied at both Pages and the named
Worker entrypoint. Mutation Origin must equal the Pages request origin, and the
Worker independently retains its allowed-Origin checks. Only Accept, Content-Type,
Idempotency-Key, Origin and edge-supplied CF-Connecting-IP are forwarded. Cookies,
Access JWTs, Authorization and arbitrary trust/forwarded-IP headers are not sent.
Password, Turnstile, spam and rate limits remain in the existing Worker pipeline.

Binding requests use an internal placeholder URL; the named entrypoint dispatches
through the existing Worker host check using its configured host. No DNS/HTTPS
request to that host is made. Upstream redirects and transport failures are rejected;
an eight-second deadline bounds requests. Status/body/content type and retry/request
ID headers are preserved, except cookies/CORS/cache/index headers are not forwarded.

Public/index gating remains separate: Preview is always noindex; Production public
OFF denies the API, list and detail regardless of index; public ON/index OFF is
noindex; both explicitly ON allow HTML indexing. APIs are always noindex. Import
RPC, import gate and administrator authentication are unchanged. The curated identity
D1 read-only binding is also unchanged; it is not a visitor transport.

Next step requires separate approval: deploy this SHA to Preview and connect the
Preview binding to the named entrypoint, then run real same-origin lifecycle smoke.
