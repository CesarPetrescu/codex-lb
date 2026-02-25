import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Lock } from "lucide-react";
import { useForm } from "react-hook-form";

import { AlertMessage } from "@/components/alert-message";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AdminTokenLoginRequestSchema, LoginRequestSchema } from "@/features/auth/schemas";
import { useAuthStore } from "@/features/auth/hooks/use-auth";

export function LoginForm() {
  const login = useAuthStore((state) => state.login);
  const loginWithAdminToken = useAuthStore((state) => state.loginWithAdminToken);
  const passwordRequired = useAuthStore((state) => state.passwordRequired);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const passwordForm = useForm({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: { password: "" },
  });
  const tokenForm = useForm({
    resolver: zodResolver(AdminTokenLoginRequestSchema),
    defaultValues: { token: "" },
  });

  const handlePasswordSubmit = async (values: { password: string }) => {
    clearError();
    await login(values.password);
  };

  const handleTokenSubmit = async (values: { token: string }) => {
    clearError();
    await loginWithAdminToken(values.token);
  };

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-[var(--shadow-md)]">
      <div className="space-y-1.5">
        <h2 className="text-base font-semibold tracking-tight">Sign in</h2>
        <p className="text-sm text-muted-foreground">
          {passwordRequired ? "Use password auth or admin API token." : "Sign in with admin API token."}
        </p>
      </div>

      {passwordRequired ? (
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
            <FormField
              control={passwordForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">Password</FormLabel>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" aria-hidden="true" />
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        autoComplete="current-password"
                        placeholder="Enter password"
                        disabled={loading}
                        className="pl-9"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="press-scale w-full" disabled={loading}>
              {loading ? <Spinner size="sm" className="mr-2" /> : null}
              Sign In With Password
            </Button>
          </form>
        </Form>
      ) : null}

      {passwordRequired ? (
        <div className="flex items-center gap-2 py-1">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>
      ) : null}

      <Form {...tokenForm}>
        <form onSubmit={tokenForm.handleSubmit(handleTokenSubmit)} className="space-y-4">
          <FormField
            control={tokenForm.control}
            name="token"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">Admin API token</FormLabel>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" aria-hidden="true" />
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="off"
                      placeholder="Enter CODEX_LB_ADMIN_API_TOKEN"
                      disabled={loading}
                      className="pl-9 font-mono text-xs sm:text-sm"
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" variant="secondary" className="press-scale w-full" disabled={loading}>
            {loading ? <Spinner size="sm" className="mr-2" /> : null}
            Sign In With Admin Token
          </Button>
        </form>
      </Form>

      {error ? <AlertMessage variant="error">{error}</AlertMessage> : null}
    </div>
  );
}
