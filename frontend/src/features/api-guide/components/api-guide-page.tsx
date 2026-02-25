import {
  BarChart3,
  CheckSquare,
  Eye,
  List,
  KeyRound,
  RefreshCcw,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Upload,
  Wrench,
} from "lucide-react";
import type { ComponentType } from "react";

import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type GuideStep = {
  id: string;
  title: string;
  description: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "SHELL";
  icon: ComponentType<{ className?: string }>;
  command: string;
  outcome?: string;
  notes?: string;
};

type GuideSection = {
  id: string;
  title: string;
  description: string;
  steps: GuideStep[];
};

const BOOTSTRAP_COMMAND = `export BASE_URL="http://localhost:8000"
export ADMIN_TOKEN="<your CODEX_LB_ADMIN_API_TOKEN>"

# optional helpers populated later
export KEY_ID=""
export CLIENT_KEY=""`;

const ENV_SETUP_COMMAND = `# .env (server)
CODEX_LB_ADMIN_API_TOKEN="<strong-random-admin-token>"

# restart codex-lb after changing .env`;

const VERIFY_ADMIN_TOKEN_COMMAND = `curl -sS "$BASE_URL/api/settings" \\
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq`;

const COVERAGE_ITEMS = [
  "Upload account auth.json",
  "See primary + secondary remaining quota",
  "Enable API Key Auth for /v1/*",
  "Create keys with allowed models + limits",
  "List all keys",
  "Inspect per-key usage + price counters",
  "Edit key name, active state, and policies",
  "Reset usage counters",
  "Regenerate key secret",
  "Delete keys",
] as const;

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "accounts-usage",
    title: "1) Account Setup + Usage",
    description: "Import account auth and read current primary/secondary remaining quota.",
    steps: [
      {
        id: "upload-auth-json",
        title: "Upload auth.json",
        description: "Import one account into the load balancer.",
        endpoint: "/api/accounts/import",
        method: "POST",
        icon: Upload,
        command: `curl -sS -X POST "$BASE_URL/api/accounts/import" \\
  -H "Authorization: Bearer $ADMIN_TOKEN" \\
  -F "auth_json=@./auth.json;type=application/json" | jq`,
        outcome: "Account is imported and available to routing + usage APIs.",
      },
      {
        id: "usage-remaining",
        title: "Read primary and secondary remaining",
        description: "Equivalent to dashboard usage cards.",
        endpoint: "/api/usage/summary",
        method: "GET",
        icon: BarChart3,
        command: `curl -sS "$BASE_URL/api/usage/summary" \\
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '{
    primaryRemainingPercent: .primaryWindow.remainingPercent,
    secondaryRemainingPercent: (if .secondaryWindow then .secondaryWindow.remainingPercent else null end),
    primaryResetAt: .primaryWindow.resetAt,
    secondaryResetAt: (if .secondaryWindow then .secondaryWindow.resetAt else null end)
  }'`,
        outcome: "You get exact remaining percentages for both usage windows.",
      },
    ],
  },
  {
    id: "api-key-auth",
    title: "2) API Key Auth Mode",
    description: "Enable API-key enforcement for incoming /v1/* requests.",
    steps: [
      {
        id: "enable-api-key-auth",
        title: "Enable API Key Auth",
        description: "This powers the same toggle in Settings → API Keys.",
        endpoint: "/api/settings",
        method: "SHELL",
        icon: ShieldCheck,
        command: `CURRENT_SETTINGS=$(curl -sS "$BASE_URL/api/settings" \\
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "$CURRENT_SETTINGS" | jq

echo "$CURRENT_SETTINGS" | jq '.apiKeyAuthEnabled = true' | \\
curl -sS -X PUT "$BASE_URL/api/settings" \\
  -H "Authorization: Bearer $ADMIN_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d @- | jq`,
        outcome: "Incoming `/v1/*` calls now require client API keys.",
      },
    ],
  },
  {
    id: "api-key-lifecycle",
    title: "3) API Key Lifecycle",
    description: "Create, list, edit, inspect usage/price, reset usage, regenerate, delete.",
    steps: [
      {
        id: "create-api-key",
        title: "Create API key (allowed models + token/cost limits)",
        description: "Includes weekly, 5h, and monthly windows. cost_usd maxValue is micro-dollars.",
        endpoint: "/api/api-keys/",
        method: "POST",
        icon: KeyRound,
        command: `CREATE_OUTPUT=$(curl -sS -X POST "$BASE_URL/api/api-keys/" \\
  -H "Authorization: Bearer $ADMIN_TOKEN" \\
  -H "Content-Type: application/json" \\
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
export CLIENT_KEY=$(echo "$CREATE_OUTPUT" | jq -r '.key')`,
        outcome: "A key record is created and the plain key value is returned once.",
        notes: "The plain key is only returned once at creation/regeneration.",
      },
      {
        id: "list-api-keys",
        title: "See/list all keys",
        description: "Returns every key with metadata and limit counters.",
        endpoint: "/api/api-keys/",
        method: "GET",
        icon: List,
        command: `curl -sS "$BASE_URL/api/api-keys/" \\
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '[.[] | {
    id,
    name,
    keyPrefix,
    isActive,
    allowedModels,
    expiresAt
  }]'`,
        outcome: "You can audit all keys in one call.",
      },
      {
        id: "usage-price-per-key",
        title: "See per-key usage and price counters",
        description: "Inspect limit counters for one key (tokens + USD).",
        endpoint: "/api/api-keys/",
        method: "GET",
        icon: Eye,
        command: `curl -sS "$BASE_URL/api/api-keys/" \\
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
    }'`,
        outcome: "You get usage and price counters for a single key.",
      },
      {
        id: "edit-key-details",
        title: "Edit key details",
        description: "Rename key, change allowed models, or disable/enable it.",
        endpoint: "/api/api-keys/{id}",
        method: "PATCH",
        icon: Wrench,
        command: `curl -sS -X PATCH "$BASE_URL/api/api-keys/$KEY_ID" \\
  -H "Authorization: Bearer $ADMIN_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "ops-key-renamed",
    "allowedModels": ["gpt-5.1", "o3-pro"],
    "isActive": true
  }' | jq`,
        outcome: "Key metadata is updated without changing current counters.",
      },
      {
        id: "edit-usage-policy",
        title: "Modify usage policy in detail",
        description: "Set max tokens/cost by weekly, 5h, monthly windows.",
        endpoint: "/api/api-keys/{id}",
        method: "PATCH",
        icon: SlidersHorizontal,
        command: `curl -sS -X PATCH "$BASE_URL/api/api-keys/$KEY_ID" \\
  -H "Authorization: Bearer $ADMIN_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "limits": [
      { "limitType": "total_tokens", "limitWindow": "5h", "maxValue": 300000 },
      { "limitType": "total_tokens", "limitWindow": "weekly", "maxValue": 2000000 },
      { "limitType": "cost_usd", "limitWindow": "monthly", "maxValue": 40000000 }
    ]
  }' | jq`,
        outcome: "Usage ceilings are changed for this key only.",
        notes: "For `cost_usd`, maxValue/currentValue are micro-dollars (1 USD = 1,000,000).",
      },
      {
        id: "reset-usage",
        title: "Reset usage counters",
        description: "Keep policy but zero-out usage counters (same as edit toggle).",
        endpoint: "/api/api-keys/{id}",
        method: "PATCH",
        icon: RefreshCcw,
        command: `curl -sS -X PATCH "$BASE_URL/api/api-keys/$KEY_ID" \\
  -H "Authorization: Bearer $ADMIN_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{ "resetUsage": true }' | jq`,
        outcome: "All counters for this key are reset to 0.",
      },
      {
        id: "regenerate-api-key",
        title: "Regenerate key value",
        description: "Rotates secret and returns new plain key once.",
        endpoint: "/api/api-keys/{id}/regenerate",
        method: "POST",
        icon: RefreshCcw,
        command: `REGEN_OUTPUT=$(curl -sS -X POST "$BASE_URL/api/api-keys/$KEY_ID/regenerate" \\
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "$REGEN_OUTPUT" | jq
export CLIENT_KEY=$(echo "$REGEN_OUTPUT" | jq -r '.key')`,
        outcome: "Old key secret stops working; new secret is issued once.",
      },
      {
        id: "test-client-key",
        title: "Verify client key works for /v1/*",
        description: "Use the created/regenerated client key as downstream caller.",
        endpoint: "/v1/models",
        method: "GET",
        icon: Shield,
        command: `curl -sS "$BASE_URL/v1/models" \\
  -H "Authorization: Bearer $CLIENT_KEY" | jq`,
        outcome: "Confirms API Key Auth is enforced and key is valid.",
      },
      {
        id: "delete-api-key",
        title: "Delete key",
        description: "Permanently remove key.",
        endpoint: "/api/api-keys/{id}",
        method: "DELETE",
        icon: Trash2,
        command: `curl -sS -X DELETE "$BASE_URL/api/api-keys/$KEY_ID" \\
  -H "Authorization: Bearer $ADMIN_TOKEN" -i`,
        outcome: "The key is removed and cannot authenticate anymore.",
      },
    ],
  },
];

function MethodBadge({ method }: { method: GuideStep["method"] }) {
  const variant = method === "DELETE" ? "destructive" : method === "SHELL" ? "secondary" : "outline";
  return (
    <Badge variant={variant} className="font-mono text-[10px] uppercase tracking-wider">
      {method}
    </Badge>
  );
}

function CommandBlock({ command }: { command: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-3 text-xs leading-relaxed text-foreground">
      <code>{command}</code>
    </pre>
  );
}

function GuideStepCard({ step }: { step: GuideStep }) {
  const Icon = step.icon;
  return (
    <Card className="gap-4">
      <CardHeader className="pb-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Icon className="h-4 w-4 text-primary" />
              {step.title}
            </CardTitle>
            <CardDescription>{step.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <MethodBadge method={step.method} />
            <span className="max-w-[20rem] truncate rounded-md border px-2 py-1 font-mono text-[10px] text-muted-foreground">
              {step.endpoint}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {step.outcome ? <p className="mb-1 text-xs text-primary">Result: {step.outcome}</p> : null}
        {step.notes ? <p className="mb-2 text-xs text-muted-foreground">{step.notes}</p> : null}
        <div className="mb-2 flex justify-end">
          <CopyButton value={step.command} label="Copy command" />
        </div>
        <CommandBlock command={step.command} />
      </CardContent>
    </Card>
  );
}

export function ApiGuidePage() {
  return (
    <div className="animate-fade-in-up space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">API Guide</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete tutorial for Settings → API Keys workflows with admin-token authenticated API calls.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coverage</CardTitle>
          <CardDescription>Everything required for full API key lifecycle management.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {COVERAGE_ITEMS.map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span>{item}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Start</CardTitle>
          <CardDescription>
            Set `CODEX_LB_ADMIN_API_TOKEN` in `.env`, restart server, then export helpers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-xs text-muted-foreground">
            Every `/api/*` route accepts either dashboard session cookie auth or `Authorization: Bearer $ADMIN_TOKEN`.
          </p>
          <div className="mb-2 flex justify-end">
            <CopyButton value={ENV_SETUP_COMMAND} label="Copy .env setup" />
          </div>
          <CommandBlock command={ENV_SETUP_COMMAND} />
          <div className="my-4 h-px bg-border" />
          <div className="mb-2 flex justify-end">
            <CopyButton value={BOOTSTRAP_COMMAND} label="Copy setup" />
          </div>
          <CommandBlock command={BOOTSTRAP_COMMAND} />
          <div className="my-4 h-px bg-border" />
          <div className="mb-2 flex justify-end">
            <CopyButton value={VERIFY_ADMIN_TOKEN_COMMAND} label="Copy auth check" />
          </div>
          <CommandBlock command={VERIFY_ADMIN_TOKEN_COMMAND} />
        </CardContent>
      </Card>

      {GUIDE_SECTIONS.map((section) => (
        <section key={section.id} className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </h2>
            <div className="h-px flex-1 bg-border" />
          </div>
          <p className="text-sm text-muted-foreground">{section.description}</p>
          <div className="grid gap-4">
            {section.steps.map((step) => (
              <GuideStepCard key={step.id} step={step} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
