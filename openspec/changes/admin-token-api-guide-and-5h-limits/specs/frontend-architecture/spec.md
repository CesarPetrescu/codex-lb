## ADDED Requirements

### Requirement: API guide route for admin-token workflows
The SPA SHALL expose an API guide page at `/api-guide`, linked from top-level navigation, documenting end-to-end admin-token workflows for operational management.

The page SHALL include practical request examples for:
- uploading `auth.json`
- reading primary/secondary remaining usage
- creating/listing/updating/regenerating/deleting API keys
- configuring allowed models and limit rules (weekly, `5h`, monthly) for tokens and cost

Examples MUST show `Authorization: Bearer <admin-token>` usage and be readable on desktop and mobile layouts.

#### Scenario: Navigate to API guide
- **WHEN** user clicks the API Guide navigation item
- **THEN** the SPA navigates to `/api-guide` without full page reload and renders API workflow documentation

#### Scenario: Admin token examples are present
- **WHEN** API guide page is rendered
- **THEN** it displays concrete request examples containing admin Bearer token authentication for each management operation
