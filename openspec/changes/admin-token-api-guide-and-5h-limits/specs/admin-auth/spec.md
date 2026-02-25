## ADDED Requirements

### Requirement: Admin Bearer token access for dashboard management APIs
The system SHALL accept an admin Bearer token for dashboard management routes under `/api/*` (excluding `/api/dashboard-auth/*` and `/api/codex/usage`). The token value SHALL be configured via `CODEX_LB_ADMIN_API_TOKEN` in environment settings.

When a request includes `Authorization: Bearer <token>`:
- If the token matches `CODEX_LB_ADMIN_API_TOKEN`, the request MUST be authorized without requiring a dashboard session cookie.
- If the token is present but invalid, the request MUST be rejected with 401 using dashboard error envelope.

When no admin Bearer token is provided, existing dashboard session auth behavior SHALL remain unchanged.

#### Scenario: Valid admin token bypasses session requirement
- **WHEN** dashboard password auth is enabled and request has `Authorization: Bearer <valid-admin-token>`
- **THEN** `/api/settings` is authorized even without dashboard session cookie

#### Scenario: Invalid admin token is rejected
- **WHEN** request to `/api/accounts/import` includes `Authorization: Bearer <invalid-token>`
- **THEN** the system returns 401 dashboard error response

#### Scenario: Existing session behavior remains for tokenless requests
- **WHEN** dashboard password auth is enabled and request has no Authorization Bearer token
- **THEN** the route still requires valid dashboard session cookie as before
