# Curated Knowledge SEO (Preview only)

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
- No Production binding/gate changes; curated rendering also explicitly requires Preview.

Metadata requires exact SHA-256 matches for title, raw question body, raw official
answer, category and their combined JSON fingerprint. Missing identities, invalid
manifests, unavailable reads, new user questions and stale content use existing
deterministic metadata without exposing review diagnostics. Ten
`REVIEW_BEFORE_APPLY` records retain fallback metadata even if fingerprints match.

Related links use only approved candidates, resolving sourceKeys through Preview
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
