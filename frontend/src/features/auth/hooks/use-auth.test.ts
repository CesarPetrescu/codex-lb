import { beforeEach, describe, expect, it, vi } from "vitest";

const { setAuthTokenMock, setUnauthorizedHandlerMock } = vi.hoisted(() => ({
  setAuthTokenMock: vi.fn(),
  setUnauthorizedHandlerMock: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
  setAuthToken: setAuthTokenMock,
  setUnauthorizedHandler: setUnauthorizedHandlerMock,
}));

import {
  getAuthSession,
  loginPassword,
  logout as logoutRequest,
  validateAdminToken,
  verifyTotp as verifyTotpRequest,
} from "@/features/auth/api";
import { useAuthStore } from "@/features/auth/hooks/use-auth";
import type { AuthSession } from "@/features/auth/schemas";

vi.mock("@/features/auth/api", () => ({
  getAuthSession: vi.fn(),
  loginPassword: vi.fn(),
  logout: vi.fn(),
  validateAdminToken: vi.fn(),
  verifyTotp: vi.fn(),
}));

const sessionBase: AuthSession = {
  authenticated: true,
  passwordRequired: true,
  totpRequiredOnLogin: false,
  totpConfigured: true,
};

function resetAuthStore(): void {
  useAuthStore.setState({
    passwordRequired: false,
    authenticated: false,
    totpRequiredOnLogin: false,
    totpConfigured: false,
    authMethod: null,
    loading: false,
    initialized: false,
    error: null,
  });
}

describe("useAuthStore actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    resetAuthStore();
  });

  it("refreshSession updates auth state", async () => {
    vi.mocked(getAuthSession).mockResolvedValue({
      ...sessionBase,
      authenticated: false,
      totpRequiredOnLogin: true,
    });

    await useAuthStore.getState().refreshSession();

    const next = useAuthStore.getState();
    expect(next.initialized).toBe(true);
    expect(next.authenticated).toBe(false);
    expect(next.totpRequiredOnLogin).toBe(true);
    expect(next.loading).toBe(false);
    expect(next.authMethod).toBeNull();
  });

  it("refreshSession requires explicit login when password auth is disabled", async () => {
    vi.mocked(getAuthSession).mockResolvedValue({
      authenticated: true,
      passwordRequired: false,
      totpRequiredOnLogin: false,
      totpConfigured: false,
    });

    await useAuthStore.getState().refreshSession();

    const next = useAuthStore.getState();
    expect(next.authenticated).toBe(false);
    expect(next.passwordRequired).toBe(false);
    expect(next.authMethod).toBeNull();
  });

  it("refreshSession keeps authenticated password session", async () => {
    vi.mocked(getAuthSession).mockResolvedValue({
      authenticated: true,
      passwordRequired: true,
      totpRequiredOnLogin: false,
      totpConfigured: true,
    });

    await useAuthStore.getState().refreshSession();

    const next = useAuthStore.getState();
    expect(next.authenticated).toBe(true);
    expect(next.authMethod).toBe("session");
  });

  it("login updates session state", async () => {
    vi.mocked(loginPassword).mockResolvedValue(sessionBase);

    await useAuthStore.getState().login("secret-pass");

    const next = useAuthStore.getState();
    expect(loginPassword).toHaveBeenCalledWith({ password: "secret-pass" });
    expect(next.authenticated).toBe(true);
    expect(next.error).toBeNull();
    expect(next.authMethod).toBe("session");
    expect(setAuthTokenMock).toHaveBeenCalledWith(null);
  });

  it("logout clears auth and refreshes session", async () => {
    useAuthStore.setState({
      authenticated: true,
      passwordRequired: true,
      initialized: true,
    });

    vi.mocked(logoutRequest).mockResolvedValue({ status: "ok" });
    vi.mocked(getAuthSession).mockResolvedValue({
      ...sessionBase,
      authenticated: false,
      totpRequiredOnLogin: false,
    });

    await useAuthStore.getState().logout();

    const next = useAuthStore.getState();
    expect(logoutRequest).toHaveBeenCalledTimes(1);
    expect(getAuthSession).toHaveBeenCalledTimes(1);
    expect(next.authenticated).toBe(false);
    expect(next.loading).toBe(false);
    expect(next.authMethod).toBeNull();
    expect(setAuthTokenMock).toHaveBeenCalledWith(null);
  });

  it("verifyTotp updates state transitions", async () => {
    vi.mocked(verifyTotpRequest).mockResolvedValue({
      ...sessionBase,
      authenticated: true,
      totpRequiredOnLogin: false,
    });

    await useAuthStore.getState().verifyTotp("123456");

    const next = useAuthStore.getState();
    expect(verifyTotpRequest).toHaveBeenCalledWith({ code: "123456" });
    expect(next.authenticated).toBe(true);
    expect(next.totpRequiredOnLogin).toBe(false);
    expect(next.loading).toBe(false);
    expect(next.authMethod).toBe("session");
  });

  it("refreshSession promotes stored admin token to authenticated state", async () => {
    window.localStorage.setItem("codex_lb_admin_api_token", "adm-token");
    vi.mocked(getAuthSession).mockResolvedValue({
      authenticated: false,
      passwordRequired: true,
      totpRequiredOnLogin: true,
      totpConfigured: true,
    });
    vi.mocked(validateAdminToken).mockResolvedValue({});

    await useAuthStore.getState().refreshSession();

    const next = useAuthStore.getState();
    expect(validateAdminToken).toHaveBeenCalledTimes(1);
    expect(setAuthTokenMock).toHaveBeenCalledWith("adm-token");
    expect(next.authenticated).toBe(true);
    expect(next.totpRequiredOnLogin).toBe(false);
    expect(next.authMethod).toBe("admin_token");
  });

  it("loginWithAdminToken validates and persists token", async () => {
    vi.mocked(validateAdminToken).mockResolvedValue({});
    vi.mocked(getAuthSession).mockResolvedValue({
      authenticated: false,
      passwordRequired: true,
      totpRequiredOnLogin: false,
      totpConfigured: true,
    });

    await useAuthStore.getState().loginWithAdminToken("  adm-token  ");

    const next = useAuthStore.getState();
    expect(validateAdminToken).toHaveBeenCalledTimes(1);
    expect(setAuthTokenMock).toHaveBeenCalledWith("adm-token");
    expect(window.localStorage.getItem("codex_lb_admin_api_token")).toBe("adm-token");
    expect(next.authenticated).toBe(true);
    expect(next.authMethod).toBe("admin_token");
  });

  it("loginWithAdminToken clears token on validation failure", async () => {
    vi.mocked(validateAdminToken).mockRejectedValue(new Error("Invalid admin API token"));

    await expect(useAuthStore.getState().loginWithAdminToken("bad-token")).rejects.toThrow(
      "Invalid admin API token",
    );

    const next = useAuthStore.getState();
    expect(window.localStorage.getItem("codex_lb_admin_api_token")).toBeNull();
    expect(next.authenticated).toBe(false);
    expect(next.authMethod).toBeNull();
    expect(next.error).toBe("Invalid admin API token");
    expect(setAuthTokenMock).toHaveBeenCalledWith("bad-token");
    expect(setAuthTokenMock).toHaveBeenCalledWith(null);
  });
});
