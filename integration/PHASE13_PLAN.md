# Phase 13 Integration Plan

## Step 1 — Normalize configuration

Create a single Pro configuration loader that:

- parses booleans strictly,
- validates numeric limits,
- validates URLs,
- rejects unsafe production configuration,
- keeps secrets in environment variables.

## Step 2 — Unify dry-run

Introduce one dry-run contract shared by:

- CLI,
- list sync,
- rule creation/deletion,
- list deletion,
- GitHub Actions.

## Step 3 — Harden API boundary

Add:

- HTTP status validation,
- Cloudflare `success` validation,
- structured API errors,
- request correlation IDs,
- bounded retries,
- safe logging.

## Step 4 — Wrap existing sync

Preserve the proven `synchronizeZeroTrustLists()` behavior and expose it
through a Pro adapter.

Do not duplicate synchronization algorithms unnecessarily.

## Step 5 — Add regression tests

Tests must cover:

- normalization,
- allowlist precedence,
- duplicates,
- redundant subdomains,
- list chunking,
- additions,
- removals,
- dry-run,
- deletion safety,
- API failures,
- rollback.

## Step 6 — Wire observability

Connect:

- source reputation,
- run history,
- dashboard,
- notifications,
- health state.

## Step 7 — Final production gate

Only after all previous steps pass should the project be eligible for
`v1.0.0`.

Production confirmation remains disabled by default.
