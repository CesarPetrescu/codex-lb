import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/features/auth/components/login-form";
import { useAuthStore } from "@/features/auth/hooks/use-auth";

describe("LoginForm", () => {
  beforeEach(() => {
    useAuthStore.setState({
      passwordRequired: true,
      loading: false,
      error: null,
    });
  });

  it("renders and submits password", async () => {
    const user = userEvent.setup();
    const clearError = vi.fn();
    const login = vi.fn().mockResolvedValue(undefined);
    const loginWithAdminToken = vi.fn().mockResolvedValue(undefined);

    useAuthStore.setState({
      clearError,
      login,
      loginWithAdminToken,
      loading: false,
      error: null,
    });

    render(<LoginForm />);

    await user.type(screen.getByLabelText("Password"), "secret-pass");
    await user.click(screen.getByRole("button", { name: "Sign In With Password" }));

    expect(clearError).toHaveBeenCalledTimes(1);
    expect(login).toHaveBeenCalledWith("secret-pass");
    expect(loginWithAdminToken).not.toHaveBeenCalled();
  });

  it("renders and submits admin token", async () => {
    const user = userEvent.setup();
    const clearError = vi.fn();
    const login = vi.fn().mockResolvedValue(undefined);
    const loginWithAdminToken = vi.fn().mockResolvedValue(undefined);

    useAuthStore.setState({
      clearError,
      login,
      loginWithAdminToken,
      loading: false,
      error: null,
    });

    render(<LoginForm />);

    await user.type(screen.getByLabelText("Admin API token"), "adm-token");
    await user.click(screen.getByRole("button", { name: "Sign In With Admin Token" }));

    expect(clearError).toHaveBeenCalledTimes(1);
    expect(loginWithAdminToken).toHaveBeenCalledWith("adm-token");
    expect(login).not.toHaveBeenCalled();
  });

  it("shows error message when present", () => {
    useAuthStore.setState({
      error: "Invalid credentials",
      loading: false,
    });

    render(<LoginForm />);
    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
  });

  it("disables input and submit while loading", () => {
    useAuthStore.setState({
      passwordRequired: true,
      loading: true,
      error: null,
    });

    render(<LoginForm />);
    expect(screen.getByLabelText("Password")).toBeDisabled();
    expect(screen.getByLabelText("Admin API token")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Sign In With Password" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Sign In With Admin Token" })).toBeDisabled();
  });

  it("shows only token login when password is not required", () => {
    useAuthStore.setState({
      passwordRequired: false,
      loading: false,
      error: null,
    });

    render(<LoginForm />);
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Admin API token")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign In With Password" })).not.toBeInTheDocument();
  });
});
