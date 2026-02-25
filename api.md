# API Runbook

This file documents the dashboard/admin API workflow for codex-lb.

`/api/*` routes accept either:
- Dashboard session cookie auth
- `Authorization: Bearer <CODEX_LB_ADMIN_API_TOKEN>`

## Quick Start

Set admin token in `.env` and restart codex-lb:

```bash
# .env (server)
CODEX_LB_ADMIN_API_TOKEN="<strong-random-admin-token>"
```

Bootstrap shell variables:

```bash
export BASE_URL="http://127.0.0.1:2455"
export ADMIN_TOKEN="<your CODEX_LB_ADMIN_API_TOKEN>"

# optional helpers populated later
export KEY_ID=""
export CLIENT_KEY=""
```

Auth check:

```bash
curl -sS "$BASE_URL/api/settings" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

## 1) Account Setup + Usage

Upload `auth.json`:

```bash
curl -sS -X POST "$BASE_URL/api/accounts/import" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "auth_json=@./auth.json;type=application/json" | jq
```

Read primary and secondary remaining:

```bash
curl -sS "$BASE_URL/api/usage/summary" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '{
    primaryRemainingPercent: .primaryWindow.remainingPercent,
    secondaryRemainingPercent: (if .secondaryWindow then .secondaryWindow.remainingPercent else null end),
    primaryResetAt: .primaryWindow.resetAt,
    secondaryResetAt: (if .secondaryWindow then .secondaryWindow.resetAt else null end)
  }'
```

## 2) API Key Auth Mode

Enable API key enforcement for incoming `/v1/*` requests:

```bash
CURRENT_SETTINGS=$(curl -sS "$BASE_URL/api/settings" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "$CURRENT_SETTINGS" | jq '.apiKeyAuthEnabled = true' | \
curl -sS -X PUT "$BASE_URL/api/settings" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d @- | jq
```

## 3) API Key Lifecycle

Create key:

```bash
CREATE_OUTPUT=$(curl -sS -X POST "$BASE_URL/api/api-keys/" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ops-key",
    "allowedModels": ["gpt-5.1", "o3-pro"],
    "limits": [
      { "limitType": "total_tokens", "limitWindow": "weekly", "maxValue": 2500000 },
      { "limitType": "total_tokens", "limitWindow": "5h", "maxValue": 500000 },
      { "limitType": "cost_usd", "limitWindow": "monthly", "maxValue": 25000000 }
    ]
  }')

echo "$CREATE_OUTPUT" | jq
export KEY_ID=$(echo "$CREATE_OUTPUT" | jq -r '.id')
export CLIENT_KEY=$(echo "$CREATE_OUTPUT" | jq -r '.key')
```

List all keys:

```bash
curl -sS "$BASE_URL/api/api-keys/" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '[.[] | {
    id,
    name,
    keyPrefix,
    isActive,
    allowedModels,
    expiresAt
  }]'
```

See per-key usage and price:

```bash
curl -sS "$BASE_URL/api/api-keys/" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq --arg key "$KEY_ID" '
    .[] | select(.id == $key) | {
      id,
      name,
      limits: (.limits | map(
        if .limitType == "cost_usd" then
          {
            type: .limitType,
            window: .limitWindow,
            model: (.modelFilter // "all"),
            currentUsd: (.currentValue / 1000000),
            maxUsd: (.maxValue / 1000000)
          }
        else
          {
            type: .limitType,
            window: .limitWindow,
            model: (.modelFilter // "all"),
            current: .currentValue,
            max: .maxValue
          }
        end
      ))
    }'
```

Edit key details:

```bash
curl -sS -X PATCH "$BASE_URL/api/api-keys/$KEY_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ops-key-renamed",
    "allowedModels": ["gpt-5.1", "o3-pro"],
    "isActive": true
  }' | jq
```

Modify usage policy (weekly / 5h / monthly):

```bash
curl -sS -X PATCH "$BASE_URL/api/api-keys/$KEY_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "limits": [
      { "limitType": "total_tokens", "limitWindow": "5h", "maxValue": 300000 },
      { "limitType": "total_tokens", "limitWindow": "weekly", "maxValue": 2000000 },
      { "limitType": "cost_usd", "limitWindow": "monthly", "maxValue": 40000000 }
    ]
  }' | jq
```

Reset usage counters:

```bash
curl -sS -X PATCH "$BASE_URL/api/api-keys/$KEY_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "resetUsage": true }' | jq
```

Regenerate key:

```bash
REGEN_OUTPUT=$(curl -sS -X POST "$BASE_URL/api/api-keys/$KEY_ID/regenerate" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "$REGEN_OUTPUT" | jq
export CLIENT_KEY=$(echo "$REGEN_OUTPUT" | jq -r '.key')
```

Verify key on `/v1/*`:

```bash
curl -sS "$BASE_URL/v1/models" \
  -H "Authorization: Bearer $CLIENT_KEY" | jq
```

Delete key:

```bash
curl -sS -X DELETE "$BASE_URL/api/api-keys/$KEY_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" -i
```

## Notes

- `cost_usd` values are micro-dollars (`1 USD = 1,000,000`).
- Plain API key values are returned only on create/regenerate.
