<!--
About
Codex/ChatGPT account load balancer & proxy with usage tracking, dashboard, and OpenCode-compatible endpoints

Topics
python oauth sqlalchemy dashboard load-balancer openai rate-limit api-proxy codex fastapi usage-tracking chatgpt opencode

Resources
-->

# codex-lb

Load balancer for ChatGPT accounts. Pool multiple accounts, track usage, manage API keys, view everything in a dashboard.

| ![dashboard](docs/screenshots/dashboard.jpg) | ![accounts](docs/screenshots/accounts.jpg) |
|:---:|:---:|

<details>
<summary>More screenshots</summary>

| Settings | Login |
|:---:|:---:|
| ![settings](docs/screenshots/settings.jpg) | ![login](docs/screenshots/login.jpg) |

| Dashboard (dark) | Accounts (dark) | Settings (dark) |
|:---:|:---:|:---:|
| ![dashboard-dark](docs/screenshots/dashboard-dark.jpg) | ![accounts-dark](docs/screenshots/accounts-dark.jpg) | ![settings-dark](docs/screenshots/settings-dark.jpg) |

</details>

## Features

<table>
<tr>
<td><b>Account Pooling</b><br>Load balance across multiple ChatGPT accounts</td>
<td><b>Usage Tracking</b><br>Per-account tokens, cost, 28-day trends</td>
<td><b>API Keys</b><br>Per-key rate limits by token, cost, window, model</td>
</tr>
<tr>
<td><b>Dashboard Auth</b><br>Password + optional TOTP</td>
<td><b>OpenAI-compatible</b><br>Codex CLI, OpenCode, any OpenAI client</td>
<td><b>Auto Model Sync</b><br>Available models fetched from upstream</td>
</tr>
</table>

## Quick Start

```bash
# Docker (recommended)
docker volume create codex-lb-data
docker run -d --name codex-lb \
  -p 2455:2455 -p 1455:1455 \
  -v codex-lb-data:/var/lib/codex-lb \
  ghcr.io/soju06/codex-lb:latest

# or uvx
uvx codex-lb
```

Open [localhost:2455](http://localhost:2455) → Add account → Done.

## Client Setup

Point any OpenAI-compatible client at codex-lb. If [API key auth](#api-key-authentication) is enabled, pass a key from the dashboard as a Bearer token.

| Logo | Client | Endpoint | Config |
|---|--------|----------|--------|
| <img src="https://avatars.githubusercontent.com/u/14957082?s=200" width="32" alt="OpenAI"> | **Codex CLI** | `http://127.0.0.1:2455/backend-api/codex` | `~/.codex/config.toml` |
| <img src="https://avatars.githubusercontent.com/u/208539476?s=200" width="32" alt="OpenCode"> | **OpenCode** | `http://127.0.0.1:2455/v1` | `~/.config/opencode/opencode.json` |
| <img src="https://avatars.githubusercontent.com/u/252820863?s=200" width="32" alt="OpenClaw"> | **OpenClaw** | `http://127.0.0.1:2455/v1` | `~/.openclaw/openclaw.json` |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" width="32" alt="Python"> | **OpenAI Python SDK** | `http://127.0.0.1:2455/v1` | Code |

<details>
<summary><img src="https://avatars.githubusercontent.com/u/14957082?s=200" width="20" align="center" alt="OpenAI">&ensp;<b>Codex CLI / IDE Extension</b></summary>
<br>

`~/.codex/config.toml`:

```toml
model = "gpt-5.3-codex"
model_reasoning_effort = "xhigh"
model_provider = "codex-lb"

[model_providers.codex-lb]
name = "OpenAI"  # MUST be "OpenAI" - enables /compact endpoint
base_url = "http://127.0.0.1:2455/backend-api/codex"
wire_api = "responses"
requires_openai_auth = true
```

**With API key auth:**

```toml
model = "gpt-5.3-codex"
model_reasoning_effort = "xhigh"
model_provider = "codex-lb"

[model_providers.codex-lb]
name = "OpenAI"  # MUST be "OpenAI" - enables /compact endpoint
base_url = "http://127.0.0.1:2455/backend-api/codex"
wire_api = "responses"
env_key = "CODEX_LB_API_KEY"
```

```bash
export CODEX_LB_API_KEY="sk-clb-..."   # key from dashboard
codex
```

</details>

<details>
<summary><img src="https://avatars.githubusercontent.com/u/208539476?s=200" width="20" align="center" alt="OpenCode">&ensp;<b>OpenCode</b></summary>
<br>

`~/.config/opencode/opencode.json`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "codex-lb": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "codex-lb",
      "options": {
        "baseURL": "http://127.0.0.1:2455/v1"
      },
      "models": {
        "gpt-5.3-codex": { "name": "GPT-5.3 Codex", "reasoning": true, "interleaved": { "field": "reasoning_details" } }
      }
    }
  },
  "model": "codex-lb/gpt-5.3-codex"
}
```

This keeps OpenCode's default providers/connections available and adds `codex-lb` as an extra selectable provider.

If you use `enabled_providers`, include every provider you want to keep plus `codex-lb`; otherwise non-listed providers are hidden.

**With API key auth:**

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "codex-lb": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "codex-lb",
      "options": {
        "baseURL": "http://127.0.0.1:2455/v1",
        "apiKey": "{env:CODEX_LB_API_KEY}"   // reads from env var
      },
      "models": {
        "gpt-5.3-codex": { "name": "GPT-5.3 Codex", "reasoning": true, "interleaved": { "field": "reasoning_details" } }
      }
    }
  },
  "model": "codex-lb/gpt-5.3-codex"
}
```

```bash
export CODEX_LB_API_KEY="sk-clb-..."   # key from dashboard
opencode
```

</details>

<details>
<summary><img src="https://avatars.githubusercontent.com/u/252820863?s=200" width="20" align="center" alt="OpenClaw">&ensp;<b>OpenClaw</b></summary>
<br>

`~/.openclaw/openclaw.json`:

```jsonc
{
  "agents": {
    "defaults": {
      "model": { "primary": "codex-lb/gpt-5.3-codex" }
    }
  },
  "models": {
    "mode": "merge",
    "providers": {
      "codex-lb": {
        "baseUrl": "http://127.0.0.1:2455/v1",
        "apiKey": "${CODEX_LB_API_KEY}",   // or "dummy" if API key auth is disabled
        "api": "openai-completions",
        "models": [
          { "id": "gpt-5.3-codex", "name": "GPT-5.3 Codex" },
          { "id": "gpt-5.3-codex-spark", "name": "GPT-5.3 Codex Spark" }
        ]
      }
    }
  }
}
```

Set the env var or replace `${CODEX_LB_API_KEY}` with a key from the dashboard. If API key auth is disabled, any value works.

</details>

<details>
<summary><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" width="20" align="center" alt="Python">&ensp;<b>OpenAI Python SDK</b></summary>
<br>

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://127.0.0.1:2455/v1",
    api_key="sk-clb-...",  # from dashboard, or any string if auth is disabled
)

response = client.chat.completions.create(
    model="gpt-5.3-codex",
    messages=[{"role": "user", "content": "Hello!"}],
)
print(response.choices[0].message.content)
```

</details>

## API Key Authentication

API key auth is **disabled by default** — the proxy is open to any client. Enable it in **Settings → API Key Auth** on the dashboard.

When enabled, clients must pass a valid API key as a Bearer token:

```
Authorization: Bearer sk-clb-...
```

**Creating keys**: Dashboard → API Keys → Create. The full key is shown **only once** at creation. Keys support optional expiration, model restrictions, and rate limits (tokens / cost per day / week / month).

## Admin API (All Dashboard Routes)

All dashboard management routes live under `/api/*`.

Auth modes for `/api/*`:

- Dashboard session cookie (password/TOTP login via web UI)
- `Authorization: Bearer <CODEX_LB_ADMIN_API_TOKEN>`

If `CODEX_LB_ADMIN_API_TOKEN` is configured, anonymous direct access to `/api/*` is blocked.

### Quick start

```bash
# server .env
CODEX_LB_ADMIN_API_TOKEN="<strong-random-admin-token>"

# restart codex-lb after .env update
```

```bash
export BASE_URL="http://127.0.0.1:2455"
export ADMIN_TOKEN="<your CODEX_LB_ADMIN_API_TOKEN>"
export KEY_ID=""
export CLIENT_KEY=""
```

```bash
# auth check
curl -sS "$BASE_URL/api/settings" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

### Endpoint map

- Accounts: `GET /api/accounts`, `POST /api/accounts/import`, `POST /api/accounts/{id}/pause`, `POST /api/accounts/{id}/reactivate`, `DELETE /api/accounts/{id}`
- Usage: `GET /api/usage/summary`, `GET /api/usage/history`, `GET /api/usage/window`
- Settings: `GET /api/settings`, `PUT /api/settings`
- API Keys: `GET/POST /api/api-keys/`, `PATCH/DELETE /api/api-keys/{id}`, `POST /api/api-keys/{id}/regenerate`
- Dashboard data: `GET /api/dashboard/overview`, `GET /api/models`, `GET /api/request-logs`, `GET /api/request-logs/options`
- OAuth helper: `POST /api/oauth/start`, `GET /api/oauth/status`, `POST /api/oauth/complete`

### Full API key lifecycle (copy/paste)

```bash
# 1) import one auth.json account
curl -sS -X POST "$BASE_URL/api/accounts/import" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "auth_json=@./auth.json;type=application/json" | jq
```

```bash
# 2) read primary/secondary remaining
curl -sS "$BASE_URL/api/usage/summary" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '{
    primaryRemainingPercent: .primaryWindow.remainingPercent,
    secondaryRemainingPercent: (if .secondaryWindow then .secondaryWindow.remainingPercent else null end),
    primaryResetAt: .primaryWindow.resetAt,
    secondaryResetAt: (if .secondaryWindow then .secondaryWindow.resetAt else null end)
  }'
```

```bash
# 3) enable API-key enforcement for /v1/*
CURRENT_SETTINGS=$(curl -sS "$BASE_URL/api/settings" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "$CURRENT_SETTINGS" | jq '.apiKeyAuthEnabled = true' | \
curl -sS -X PUT "$BASE_URL/api/settings" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d @- | jq
```

```bash
# 4) create key with allowed models + limits (weekly / 5h / monthly)
CREATE_OUTPUT=$(curl -sS -X POST "$BASE_URL/api/api-keys/" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ops-key",
    "allowedModels": ["gpt-5.2"],
    "limits": [
      { "limitType": "total_tokens", "limitWindow": "weekly", "maxValue": 2500000 },
      { "limitType": "total_tokens", "limitWindow": "5h", "maxValue": 500000 },
      { "limitType": "cost_usd", "limitWindow": "monthly", "maxValue": 10000000 }
    ]
  }')

echo "$CREATE_OUTPUT" | jq
export KEY_ID=$(echo "$CREATE_OUTPUT" | jq -r '.id')
export CLIENT_KEY=$(echo "$CREATE_OUTPUT" | jq -r '.key')
```

```bash
# 5) list all keys
curl -sS "$BASE_URL/api/api-keys/" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '[.[] | {
    id, name, keyPrefix, isActive, allowedModels, expiresAt
  }]'
```

```bash
# 6) inspect per-key usage + price counters
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

```bash
# 7) edit key metadata
curl -sS -X PATCH "$BASE_URL/api/api-keys/$KEY_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ops-key-renamed",
    "allowedModels": ["gpt-5.2"],
    "isActive": true
  }' | jq
```

```bash
# 8) modify usage policy in detail
curl -sS -X PATCH "$BASE_URL/api/api-keys/$KEY_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "limits": [
      { "limitType": "total_tokens", "limitWindow": "5h", "maxValue": 300000 },
      { "limitType": "total_tokens", "limitWindow": "weekly", "maxValue": 2000000 },
      { "limitType": "cost_usd", "limitWindow": "monthly", "maxValue": 12000000 }
    ]
  }' | jq
```

```bash
# 9) reset usage counters
curl -sS -X PATCH "$BASE_URL/api/api-keys/$KEY_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "resetUsage": true }' | jq
```

```bash
# 10) regenerate key (old secret invalid, new secret returned once)
REGEN_OUTPUT=$(curl -sS -X POST "$BASE_URL/api/api-keys/$KEY_ID/regenerate" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "$REGEN_OUTPUT" | jq
export CLIENT_KEY=$(echo "$REGEN_OUTPUT" | jq -r '.key')
```

```bash
# 11) verify new client key against /v1/*
curl -sS "$BASE_URL/v1/models" \
  -H "Authorization: Bearer $CLIENT_KEY" | jq
```

```bash
# 12) delete key
curl -sS -X DELETE "$BASE_URL/api/api-keys/$KEY_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" -i
```

Notes:

- `cost_usd` is micro-dollars (`1 USD = 1,000,000`)
- Plain client API key is returned only on create/regenerate
- For a separate runbook file, see [`api.md`](./api.md)

## Configuration

Environment variables with `CODEX_LB_` prefix or `.env.local`. See [`.env.example`](.env.example).
Dashboard auth is configured in Settings.

## Data

| Environment | Path |
|-------------|------|
| Local / uvx | `~/.codex-lb/` |
| Docker | `/var/lib/codex-lb/` |

Backup this directory to preserve your data.

## Development

```bash
# Docker
docker compose watch

# Local
uv sync && cd frontend && bun install && cd ..
uv run fastapi run app/main.py --reload        # backend :2455
cd frontend && bun run dev                     # frontend :5173
```

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):
<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Soju06"><img src="https://avatars.githubusercontent.com/u/34199905?v=4?s=100" width="100px;" alt="Soju06"/><br /><sub><b>Soju06</b></sub></a><br /><a href="https://github.com/Soju06/codex-lb/commits?author=Soju06" title="Code">💻</a> <a href="https://github.com/Soju06/codex-lb/commits?author=Soju06" title="Tests">⚠️</a> <a href="#maintenance-Soju06" title="Maintenance">🚧</a> <a href="#infra-Soju06" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://jonas.kamsker.at/"><img src="https://avatars.githubusercontent.com/u/11245306?v=4?s=100" width="100px;" alt="Jonas Kamsker"/><br /><sub><b>Jonas Kamsker</b></sub></a><br /><a href="https://github.com/Soju06/codex-lb/commits?author=JKamsker" title="Code">💻</a> <a href="https://github.com/Soju06/codex-lb/issues?q=author%3AJKamsker" title="Bug reports">🐛</a> <a href="#maintenance-JKamsker" title="Maintenance">🚧</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Quack6765"><img src="https://avatars.githubusercontent.com/u/5446230?v=4?s=100" width="100px;" alt="Quack"/><br /><sub><b>Quack</b></sub></a><br /><a href="https://github.com/Soju06/codex-lb/commits?author=Quack6765" title="Code">💻</a> <a href="https://github.com/Soju06/codex-lb/issues?q=author%3AQuack6765" title="Bug reports">🐛</a> <a href="#maintenance-Quack6765" title="Maintenance">🚧</a> <a href="#design-Quack6765" title="Design">🎨</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/hhsw2015"><img src="https://avatars.githubusercontent.com/u/103614420?v=4?s=100" width="100px;" alt="Jill Kok, San Mou"/><br /><sub><b>Jill Kok, San Mou</b></sub></a><br /><a href="https://github.com/Soju06/codex-lb/commits?author=hhsw2015" title="Code">💻</a> <a href="https://github.com/Soju06/codex-lb/commits?author=hhsw2015" title="Tests">⚠️</a> <a href="#maintenance-hhsw2015" title="Maintenance">🚧</a> <a href="https://github.com/Soju06/codex-lb/issues?q=author%3Ahhsw2015" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/pcy06"><img src="https://avatars.githubusercontent.com/u/44970486?v=4?s=100" width="100px;" alt="PARK CHANYOUNG"/><br /><sub><b>PARK CHANYOUNG</b></sub></a><br /><a href="https://github.com/Soju06/codex-lb/commits?author=pcy06" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/choi138"><img src="https://avatars.githubusercontent.com/u/84369321?v=4?s=100" width="100px;" alt="Choi138"/><br /><sub><b>Choi138</b></sub></a><br /><a href="https://github.com/Soju06/codex-lb/commits?author=choi138" title="Code">💻</a> <a href="https://github.com/Soju06/codex-lb/issues?q=author%3Achoi138" title="Bug reports">🐛</a> <a href="https://github.com/Soju06/codex-lb/commits?author=choi138" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dwnmf"><img src="https://avatars.githubusercontent.com/u/56194792?v=4?s=100" width="100px;" alt="LYA⚚CAP⚚OCEAN"/><br /><sub><b>LYA⚚CAP⚚OCEAN</b></sub></a><br /><a href="https://github.com/Soju06/codex-lb/commits?author=dwnmf" title="Code">💻</a> <a href="https://github.com/Soju06/codex-lb/commits?author=dwnmf" title="Tests">⚠️</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/azkore"><img src="https://avatars.githubusercontent.com/u/7746783?v=4?s=100" width="100px;" alt="Eugene Korekin"/><br /><sub><b>Eugene Korekin</b></sub></a><br /><a href="https://github.com/Soju06/codex-lb/commits?author=azkore" title="Code">💻</a> <a href="https://github.com/Soju06/codex-lb/issues?q=author%3Aazkore" title="Bug reports">🐛</a> <a href="https://github.com/Soju06/codex-lb/commits?author=azkore" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/JordxnBN"><img src="https://avatars.githubusercontent.com/u/259802500?v=4?s=100" width="100px;" alt="jordan"/><br /><sub><b>jordan</b></sub></a><br /><a href="https://github.com/Soju06/codex-lb/commits?author=JordxnBN" title="Code">💻</a> <a href="https://github.com/Soju06/codex-lb/issues?q=author%3AJordxnBN" title="Bug reports">🐛</a> <a href="https://github.com/Soju06/codex-lb/commits?author=JordxnBN" title="Tests">⚠️</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
