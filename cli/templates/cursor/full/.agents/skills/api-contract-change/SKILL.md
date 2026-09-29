---
name: api-contract-change
description: Procedure for changing an API or RPC contract — request/response fields, error codes, auth — without breaking existing clients. Use when adding or modifying an endpoint, cloud function or message payload.
---

# API Contract Change

1. **Contract first** — update `docs/contracts/backend_rpc.md` (request, response, error codes, auth requirement) before touching code.
2. **Shared types** — update the server-side type definitions, then every client model that mirrors them.
3. **Compatibility** — adding optional fields is safe; renaming, removing or changing a field's meaning is breaking. For a breaking change, version the endpoint or keep the old shape until all clients have shipped.
4. **Find every caller** — use `.agents/dependency-map.md` and `.agents/context-index.md` to list clients on every platform; update each.
5. **Errors** — new error codes must be handled (or at least surfaced) by every client.
6. **Index** — register a new endpoint in `.agents/context-index.md`.
7. Run the `verify` skill.
