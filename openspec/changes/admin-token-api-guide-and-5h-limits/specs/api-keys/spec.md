## ADDED Requirements

### Requirement: 5-hour API key limit window support
The system SHALL support `5h` as a valid `limitWindow` value for API key limits in both create and update payloads, alongside existing `daily`, `weekly`, and `monthly` windows.

The limit reset strategy for `5h` MUST advance by 5-hour intervals when lazy reset logic is applied.

#### Scenario: Create key with 5h token limit
- **WHEN** admin submits `POST /api/api-keys` with `limits: [{"limitType":"total_tokens","limitWindow":"5h","maxValue":10000}]`
- **THEN** the key is created and returned with the `5h` limit rule

#### Scenario: Update key to 5h cost limit
- **WHEN** admin submits `PATCH /api/api-keys/{id}` with `limits: [{"limitType":"cost_usd","limitWindow":"5h","maxValue":2500000}]`
- **THEN** the key reflects the updated `5h` rule

#### Scenario: Lazy reset advances in 5-hour increments
- **WHEN** a `5h` limit reset timestamp is in the past during validation
- **THEN** `reset_at` is advanced forward in 5-hour steps until it is in the future
