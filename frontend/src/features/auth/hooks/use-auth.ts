import { setAuthToken, setUnauthorizedHandler } from "@/lib/api-client";
import { create } from "zustand";

import {
  getAuthSession,
  loginPassword,
  logout as logoutRequest,
  validateAdminToken,
  verifyTotp as verifyTotpRequest,
} from "@/features/auth/api";
import type { AuthSession } from "@/features/auth/schemas";

const ADMIN_TOKEN_STORAGE_KEY = "codex_lb_admin_api_token";

type AuthMethod = "session" | "admin_token" | null;

type AuthState = {
  passwordRequired: boolean;
  authenticated: boolean;
  totpRequiredOnLogin: boolean;
  totpConfigured: boolean;
  authMethod: AuthMethod;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  refreshSession: () => Promise<AuthSession>;
  login: (password: string) => Promise<AuthSession>;
  loginWithAdminToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyTotp: (code: string) => Promise<AuthSession>;
  clearError: () => void;
};

function getLocalStorageSafe(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readStoredAdminToken(): string | null {
  const storage = getLocalStorageSafe();
  if (!storage) {
    return null;
  }
  const value = storage.getItem(ADMIN_TOKEN_STORAGE_KEY);
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function storeAdminToken(token: string): void {
  const storage = getLocalStorageSafe();
  if (!storage) {
    return;
  }
  storage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
}

function clearStoredAdminToken(): void {
  const storage = getLocalStorageSafe();
  if (!storage) {
    return;
  }
  storage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
}

function applySession(
  set: (next: Partial<AuthState>) => void,
  session: AuthSession,
  authMethod: AuthMethod = session.authenticated ? "session" : null,
): AuthSession {
  set({
    passwordRequired: session.passwordRequired,
    authenticated: session.authenticated,
    totpRequiredOnLogin: session.totpRequiredOnLogin,
    totpConfigured: session.totpConfigured,
    authMethod,
    initialized: true,
    error: null,
  });
  return session;
}

export const useAuthStore = create<AuthState>((set) => ({
  passwordRequired: false,
  authenticated: false,
  totpRequiredOnLogin: false,
  totpConfigured: false,
  authMethod: null,
  loading: false,
  initialized: false,
  error: null,
  refreshSession: async () => {
    set({ loading: true, error: null });
    try {
      const session = await getAuthSession();
      const hasPasswordSession = session.passwordRequired && session.authenticated;
      if (hasPasswordSession) {
        setAuthToken(null);
        clearStoredAdminToken();
        return applySession(set, session, "session");
      }

      const storedToken = readStoredAdminToken();
      if (storedToken) {
        setAuthToken(storedToken);
        try {
          await validateAdminToken();
          const tokenSession: AuthSession = {
            ...session,
            authenticated: true,
            totpRequiredOnLogin: false,
          };
          return applySession(set, tokenSession, "admin_token");
        } catch {
          setAuthToken(null);
          clearStoredAdminToken();
        }
      } else {
        setAuthToken(null);
      }

      if (!session.passwordRequired) {
        return applySession(
          set,
          {
            ...session,
            authenticated: false,
            totpRequiredOnLogin: false,
          },
          null,
        );
      }

      return applySession(set, session, null);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to refresh session",
      });
      throw error;
    } finally {
      set({ loading: false, initialized: true });
    }
  },
  login: async (password) => {
    set({ loading: true, error: null });
    try {
      const session = await loginPassword({ password });
      setAuthToken(null);
      clearStoredAdminToken();
      return applySession(set, session, session.authenticated ? "session" : null);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Login failed",
      });
      throw error;
    } finally {
      set({ loading: false, initialized: true });
    }
  },
  loginWithAdminToken: async (token) => {
    set({ loading: true, error: null });
    const normalized = token.trim();
    if (normalized.length === 0) {
      const validationError = new Error("Admin API token is required");
      set({ loading: false, initialized: true, error: validationError.message });
      throw validationError;
    }

    setAuthToken(normalized);
    try {
      await validateAdminToken();
      storeAdminToken(normalized);

      try {
        const session = await getAuthSession();
        applySession(
          set,
          {
            ...session,
            authenticated: true,
            totpRequiredOnLogin: false,
          },
          "admin_token",
        );
      } catch {
        set((state) => ({
          authenticated: true,
          passwordRequired: state.passwordRequired,
          totpRequiredOnLogin: false,
          authMethod: "admin_token",
          initialized: true,
          error: null,
        }));
      }
    } catch (error) {
      setAuthToken(null);
      clearStoredAdminToken();
      set({
        error: error instanceof Error ? error.message : "Admin token login failed",
        authMethod: null,
      });
      throw error;
    } finally {
      set({ loading: false, initialized: true });
    }
  },
  logout: async () => {
    set({ loading: true, error: null });
    setAuthToken(null);
    clearStoredAdminToken();
    try {
      await logoutRequest();
      set({
        authenticated: false,
        totpRequiredOnLogin: false,
        authMethod: null,
      });
      await useAuthStore.getState().refreshSession();
    } finally {
      set({ loading: false });
    }
  },
  verifyTotp: async (code) => {
    set({ loading: true, error: null });
    try {
      const session = await verifyTotpRequest({ code });
      setAuthToken(null);
      clearStoredAdminToken();
      return applySession(set, session, session.authenticated ? "session" : null);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "TOTP verification failed",
      });
      throw error;
    } finally {
      set({ loading: false, initialized: true });
    }
  },
  clearError: () => {
    set({ error: null });
  },
}));

setUnauthorizedHandler(() => {
  setAuthToken(null);
  clearStoredAdminToken();
  useAuthStore.setState({
    authenticated: false,
    authMethod: null,
    initialized: true,
    error: null,
  });
});
