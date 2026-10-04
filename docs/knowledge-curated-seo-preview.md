# Curated Knowledge SEO and fail-closed Production gates

Runtime source: `pages-functions/data/knowledge-seo-enhancement-261004.json`.
This is the byte-identical reviewed artifact, not a regenerated mapping.

- JSON SHA-256: `e317c85418c416e53b3f2745c67b1b370e186a5503315ba49ec0925c072cf27b`
- Original CSV SHA-256: `18b59b461372b46e86c31d0f7562c493615e8b6c90952c7be5bd4ed8bcdc0830`
- Original report SHA-256: `04f9aa5ed822c9589af5e28caf18fcfabd7b93dd6a18bde960bd99b7230ff84c`

Only the Pages Function imports the manifest. Next/browser modules and public
Knowledge APIs must never import it. Historical UUID evidence in the artifact is
not runtime identity. Editorial source indices are converted to sourceKeys during
validation; environment UUIDs come only from that environment's `knowledge_imports`.

Preview Pages configuration:

- Project: `integrated-calculator`; environment: `preview` only.
- D1 binding: `KNOWLEDGE_SEO_IDENTITY_DB`.
- Dedicated Preview D1: `gyesanbox-knowledge-preview` (`a4f1f029-4a2d-4984-b155-3b2970210a38`).
- Application access is SELECT-only. The platform D1 binding is not an inherently
  read-only credential; `IdentityDatabase` exposes no write methods and the resolver
  prepares only a parameterized, minimal identity SELECT.
- No Production binding/gate changes in this implementation task.
- Preview uses `NEXT_PUBLIC_ENABLE_KNOWLEDGE_PREVIEW=true` and is always noindex.
- Production runtime requires the `gyesanbox.kr` hostname, `KNOWLEDGE_ENV=production`,
  `KNOWLEDGE_PUBLIC_ENABLED=true`, and an explicitly configured Knowledge API base.
- `KNOWLEDGE_INDEX_ENABLED=true` is the single new index environment binding for the
  existing `productionIndexEnabled` helper; no earlier index env binding existed.
  Indexing additionally requires public ON; missing values remain OFF. The Preview
  build flag must not be set in Production (it forces noindex).
- Curated permission derives from the explicit public gate, independently of index.
  Both environments still require their own identity binding and exact fingerprints.
  Production environment alone never enables curated metadata or indexing.
- Static list build metadata and route pruning use the same gate helper. A list-only
  Pages Function reapplies the runtime public/index decision to the final HTML,
  fails closed when static robots markup is missing/ambiguous, and prevents stale
  build metadata from enabling Preview indexing. Production public OFF returns 404;
  public ON/index OFF allows noindex detail/list but keeps the sitemap at 404.

Metadata requires exact SHA-256 matches for title, raw question body, raw official
answer, category and their combined JSON fingerprint. Missing identities, invalid
manifests, unavailable reads, new user questions and stale content use existing
deterministic metadata without exposing review diagnostics. Ten
`REVIEW_BEFORE_APPLY` records retain fallback metadata even if fingerprints match.

Related links use only approved candidates, resolving sourceKeys through environment
imports and re-reading each published target via the public API. Missing/private,
self, duplicate or changed-title targets are omitted, never filled from global or
category lists. At most five links are rendered. Calculator links remain entirely
driven by existing public relatedServices; manifest ADD/REMOVE suggestions are ignored.

Read-only verification:

```powershell
node --import tsx scripts/knowledge/verify-curated-preview.mjs <preview-origin> <private-import-identity-snapshot.json>
```

The identity snapshot must be obtained from the dedicated Preview D1 with SELECT,
not reconstructed by title or copied from historical Community UUIDs. It is a QA
input outside the repository, not a deployed runtime mapping.
