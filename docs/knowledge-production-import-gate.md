# Knowledge Production Import Gate

`KNOWLEDGE_IMPORT_ENABLED` is a runtime-only, Production import permission. It is
not configured in Wrangler and must remain unset until an independently approved
Production import operation.

- Preview keeps the existing import behavior when
  `KNOWLEDGE_ADMIN_ENABLED=true`.
- Production import operations are denied by default. They are enabled only when
  `ENVIRONMENT=production`, `KNOWLEDGE_ADMIN_ENABLED=true`, and
  `KNOWLEDGE_IMPORT_ENABLED=1` exactly. Missing, `0`, other values, and unknown
  environments fail closed.
- The import gate is independent of `KNOWLEDGE_PUBLIC_ENABLED` and
  `KNOWLEDGE_INDEX_ENABLED`; enabling import does not publish questions or make
  pages indexable.
- HTTP import routes remain behind `requireAdmin` and the existing Cloudflare
  Access identity check. Visitor routes do not expose import operations.
- The `KnowledgeImportEntrypoint` RPC is reachable only through an explicitly
  configured Cloudflare Service Binding. Only the separately authorized import
  operator should receive that binding. Cloudflare Access identity does not
  propagate through Service Bindings, so the binding configuration is the RPC
  trust boundary; the import gate is an additional fail-closed control.
- Keep the Production import gate unset while creating infrastructure and
  validating the release. Configure it only for a separately authorized,
  bounded import window, then turn it back off.

This contract does not create Production resources, set Production variables, or
run imports.
