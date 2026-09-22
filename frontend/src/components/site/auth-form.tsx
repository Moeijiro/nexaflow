"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { ErrorNote } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/field";

const DEMO = { email: "demo@nexaflow.dev", password: "nexaflow-demo-1234" };

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const wantsDemo = params.get("demo") === "1";

  const [email, setEmail] = useState(wantsDemo ? DEMO.email : "");
  const [password, setPassword] = useState(wantsDemo ? DEMO.password : "");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") await api.login(email, password);
      else await api.register(email, password, name);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-5 py-16">
      <div className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 glow-accent" aria-hidden />

      <div className="relative w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <Logo />
          <span className="text-sm font-semibold tracking-tight">NexaFlow</span>
        </Link>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h1 className="text-lg font-semibold tracking-tight">
            {mode === "login" ? "Sign in" : "Create your account"}
          </h1>
          <p className="mt-1.5 text-xs text-[var(--color-ink-muted)]">
            {mode === "login"
              ? "Welcome back. Your workflows are where you left them."
              : "One account, unlimited local workflows. No card, no trial timer."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {error ? <ErrorNote message={error} /> : null}

            {mode === "register" ? (
              <Field label="Name" htmlFor="name" hint="Optional — used to greet you.">
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Alex Rivera"
                  autoComplete="name"
                />
              </Field>
            ) : null}

            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </Field>

            <Field
              label="Password"
              htmlFor="password"
              hint={mode === "register" ? "At least 10 characters." : undefined}
            >
              <Input
                id="password"
                type="password"
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>

            <Button type="submit" variant="primary" className="w-full" loading={busy}>
              {mode === "login" ? "Sign in" : "Create account"}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </form>

          {mode === "login" ? (
            <button
              type="button"
              onClick={() => {
                setEmail(DEMO.email);
                setPassword(DEMO.password);
              }}
              className="mt-4 w-full rounded-lg border border-dashed border-[var(--color-border-strong)] px-3 py-2 text-xs text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)]"
            >
              Use the demo account — created by{" "}
              <code className="font-mono">python -m app.seed</code>
            </button>
          ) : null}
        </div>

        <p className="mt-5 text-center text-xs text-[var(--color-ink-muted)]">
          {mode === "login" ? (
            <>
              No account yet?{" "}
              <Link href="/register" className="text-[var(--color-accent)] hover:underline">
                Create one
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="text-[var(--color-accent)] hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
