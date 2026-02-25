import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import App from "@/App";
import { renderWithProviders } from "@/test/utils";
import { server } from "@/test/mocks/server";

describe("auth flow integration", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("flows from login to totp to dashboard", async () => {
    const user = userEvent.setup({ delay: null });

    server.use(
      http.get("/api/dashboard-auth/session", () =>
        HttpResponse.json({
          authenticated: false,
          passwordRequired: true,
          totpRequiredOnLogin: false,
          totpConfigured: true,
        }),
      ),
      http.post("/api/dashboard-auth/password/login", () =>
        HttpResponse.json({
          authenticated: false,
          passwordRequired: true,
          totpRequiredOnLogin: true,
          totpConfigured: true,
        }),
      ),
      http.post("/api/dashboard-auth/totp/verify", () =>
        HttpResponse.json({
          authenticated: true,
          passwordRequired: true,
          totpRequiredOnLogin: false,
          totpConfigured: true,
        }),
      ),
    );

    window.history.pushState({}, "", "/dashboard");
    renderWithProviders(<App />);

    expect(await screen.findByText("Sign in")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Password"), "secret-password");
    await user.click(screen.getByRole("button", { name: "Sign In With Password" }));

    expect(await screen.findByText("Two-factor verification")).toBeInTheDocument();

    await user.type(screen.getByLabelText("TOTP code"), "123456");
    const verifyButton = screen.queryByRole("button", { name: "Verify" });
    if (verifyButton) {
      await user.click(verifyButton);
    }

    expect(
      await screen.findByRole("heading", { name: "Dashboard" }, { timeout: 5000 }),
    ).toBeInTheDocument();
  });

  it("allows dashboard login via admin token", async () => {
    const user = userEvent.setup({ delay: null });

    server.use(
      http.get("/api/dashboard-auth/session", () =>
        HttpResponse.json({
          authenticated: false,
          passwordRequired: true,
          totpRequiredOnLogin: false,
          totpConfigured: true,
        }),
      ),
      http.get("/api/settings", ({ request }) => {
        const authorization = request.headers.get("Authorization");
        if (authorization !== "Bearer adm-token") {
          return HttpResponse.json(
            { error: { code: "invalid_admin_token", message: "Invalid admin API token" } },
            { status: 401 },
          );
        }
        return HttpResponse.json({
          stickyThreadsEnabled: true,
          preferEarlierResetAccounts: false,
          importWithoutOverwrite: true,
          totpRequiredOnLogin: false,
          totpConfigured: true,
          apiKeyAuthEnabled: true,
        });
      }),
    );

    window.history.pushState({}, "", "/dashboard");
    renderWithProviders(<App />);

    expect(await screen.findByText("Sign in")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Admin API token"), "adm-token");
    await user.click(screen.getByRole("button", { name: "Sign In With Admin Token" }));

    expect(
      await screen.findByRole("heading", { name: "Dashboard" }, { timeout: 5000 }),
    ).toBeInTheDocument();
  });
});
