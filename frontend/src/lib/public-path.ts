function normalizePrefix(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed === "/") {
    return "";
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, "");
  return withoutTrailingSlash === "/" ? "" : withoutTrailingSlash;
}

function deriveApiPrefix(): string {
  const explicit = normalizePrefix(import.meta.env.VITE_API_BASE_PATH);
  if (explicit) {
    return explicit;
  }

  const publicBasePath = normalizePrefix(import.meta.env.VITE_PUBLIC_BASE_PATH);
  if (!publicBasePath) {
    return "";
  }

  const adminSuffix = "/admin";
  if (publicBasePath.endsWith(adminSuffix)) {
    return publicBasePath.slice(0, -adminSuffix.length);
  }

  return publicBasePath;
}

const apiPrefix = deriveApiPrefix();

export function apiPath(path: string): string {
  if (!path.startsWith("/")) {
    return path;
  }

  if (!apiPrefix) {
    return path;
  }

  if (path === apiPrefix || path.startsWith(`${apiPrefix}/`)) {
    return path;
  }

  return `${apiPrefix}${path}`;
}
