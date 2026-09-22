"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Plug,
  Settings,
  Workflow,
  X,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";
import { Logo } from "@/components/site/logo";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/workflows", label: "Workflows", icon: Workflow },
  { href: "/dashboard/executions", label: "Executions", icon: Activity },
  { href: "/dashboard/integrations", label: "Integrations", icon: Plug },
  { href: "/dashboard/keys", label: "API keys", icon: KeyRound },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

/** Guards the dashboard and provides its chrome. The API enforces the same
 *  rules again on every request — this is convenience, not security. */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then((value) => !cancelled && setUser(value))
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) router.replace("/login");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => setOpen(false), [pathname]);

  if (loading) return <Spinner label="Checking session" />;
  if (!user) return null;

  const signOut = async () => {
    await api.logout().catch(() => undefined);
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside
        className={cn(
          "shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)]/70 lg:w-60 lg:border-r lg:border-b-0",
        )}
      >
        <div className="flex items-center justify-between px-4 py-3.5 lg:py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="text-sm font-semibold tracking-tight">NexaFlow</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="dashboard-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="rounded-lg p-2 text-[var(--color-ink-muted)] lg:hidden"
          >
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>

        <div
          id="dashboard-nav"
          className={cn("px-3 pb-4 lg:block lg:pb-6", open ? "block" : "hidden")}
        >
          <nav aria-label="Dashboard">
            <ul className="space-y-0.5">
              {NAV.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-[var(--color-surface-raised)] text-[var(--color-ink)]"
                          : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-raised)]/60 hover:text-[var(--color-ink)]",
                      )}
                    >
                      <item.icon className="h-4 w-4" aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-6 rounded-lg border border-[var(--color-border)] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{user.name ?? user.email}</p>
                <p className="truncate text-[11px] text-[var(--color-ink-subtle)]">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={signOut}
                aria-label="Sign out"
                className="rounded-md p-1.5 text-[var(--color-ink-subtle)] transition-colors hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-ink)]"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
            {user.is_demo ? (
              <div className="mt-2">
                <Badge tone="warning">Demo account</Badge>
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      <main id="main" className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-10">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-6">
      {back ? (
        <Link
          href={back.href}
          className="mb-2 inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)]"
        >
          ← {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
