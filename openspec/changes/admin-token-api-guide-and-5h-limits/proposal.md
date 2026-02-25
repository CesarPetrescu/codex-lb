## Why

Operational users need complete dashboard/admin API control from scripts and automation, not only browser session cookies. Today many management endpoints are available, but they are gated by dashboard session auth and there is no single in-app guide that documents end-to-end API usage patterns.

Additionally, API key limit windows currently support daily/weekly/monthly, but users also need a 5-hour window option for short-cycle controls.

## What Changes

- Add admin Bearer-token access for dashboard management APIs, configured via `.env` (`CODEX_LB_ADMIN_API_TOKEN`).
- Keep existing dashboard session behavior, while allowing a valid admin token to satisfy `/api/*` dashboard auth guards.
- Add support for API key limit window `5h` in create/update payloads and enforcement reset logic.
- Add a dedicated SPA page (`/api-guide`) that documents practical API workflows with concrete request examples:
  - upload `auth.json`
  - read primary/secondary remaining usage
  - create/list/update/regenerate/delete API keys
  - configure per-key model allow-lists and token/cost limits (weekly, 5h, monthly)

## Capabilities

### Modified Capabilities

- `admin-auth`: allow admin Bearer token auth path for dashboard APIs.
- `api-keys`: add `5h` limit window support.
- `frontend-architecture`: add API guide route and navigation entry.

## Impact

- **Backend code**: dashboard auth dependency, settings env config, router dependencies, API key limit schema/service logic.
- **Frontend code**: router/nav updates and new API guide page.
- **Tests**: integration tests for admin token access and 5h limits; unit/schema tests for new limit window.
