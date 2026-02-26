import { get, put } from "@/lib/api-client";
import { apiPath } from "@/lib/public-path";
import {
  DashboardSettingsSchema,
  SettingsUpdateRequestSchema,
} from "@/features/settings/schemas";

const SETTINGS_PATH = apiPath("/api/settings");

export function getSettings() {
  return get(SETTINGS_PATH, DashboardSettingsSchema);
}

export function updateSettings(payload: unknown) {
  const validated = SettingsUpdateRequestSchema.parse(payload);
  return put(SETTINGS_PATH, DashboardSettingsSchema, {
    body: validated,
  });
}
