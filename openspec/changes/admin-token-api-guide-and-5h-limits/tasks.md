## 1. Backend Admin Token Access

- [x] 1.1 Add canonical env config for admin API token (`CODEX_LB_ADMIN_API_TOKEN`)
- [x] 1.2 Add dashboard auth dependency path that accepts valid admin Bearer token or existing dashboard session
- [x] 1.3 Apply the new dependency to dashboard management routers (`/api/accounts`, `/api/usage`, `/api/settings`, `/api/api-keys`, `/api/dashboard`, `/api/request-logs`, `/api/oauth`)
- [x] 1.4 Add integration tests for valid/invalid admin token behavior when password auth is enabled

## 2. API Key Limit Window

- [x] 2.1 Extend limit window contracts/schemas to support `5h`
- [x] 2.2 Update API key service reset logic to treat `5h` as a 5-hour rolling window
- [x] 2.3 Add tests for create/update acceptance and reset behavior with `5h` window

## 3. Frontend API Guide

- [x] 3.1 Add new SPA route and nav entry for an API guide page
- [x] 3.2 Implement API guide content covering auth.json upload, usage remaining checks, full API key lifecycle, and limits/allowed models via admin token
- [x] 3.3 Ensure mobile + desktop readability and copy-friendly command examples

## 4. Spec Delta

- [x] 4.1 Add `admin-auth` requirement delta for admin Bearer token dashboard access
- [x] 4.2 Add `api-keys` requirement delta for `5h` limit window
- [x] 4.3 Add `frontend-architecture` requirement delta for API guide route/page
- [ ] 4.4 Validate specs locally with `openspec validate --specs` (CLI unavailable in this environment)
