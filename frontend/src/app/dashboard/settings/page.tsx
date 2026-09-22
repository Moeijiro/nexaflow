"use client";

import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { api } from "@/lib/api";
import { useAsync } from "@/hooks/use-async";
import { PageHeader } from "@/components/dashboard/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/feedback";
import { absoluteTime } from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  const user = useAsync(() => api.me());
  const stats = useAsync(() => api.stats());

  if (user.loading) return <Spinner label="Loading account" />;

  return (
    <>
      <PageHeader title="Settings" description="Your account and how this instance behaves." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Account" icon={<ShieldCheck className="h-4 w-4" aria-hidden />} />
          <CardBody className="space-y-3 text-xs">
            <Row label="Email">{user.data?.email}</Row>
            <Row label="Name">{user.data?.name ?? "—"}</Row>
            <Row label="Member since">{absoluteTime(user.data?.created_at ?? null)}</Row>
            <Row label="Password">
              <Badge tone="positive">scrypt, salted</Badge>
            </Row>
            <Row label="Session">HttpOnly cookie, signed JWT</Row>
            {user.data?.is_demo ? (
              <p className="leading-relaxed text-[var(--color-ink-muted)]">
                This is the demo account created by{" "}
                <code className="font-mono">python -m app.seed</code>. Its workflows point at a
                local sink, and its executions are real runs of the engine — no rows were
                fabricated.
              </p>
            ) : null}
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                await api.logout().catch(() => undefined);
                router.replace("/login");
              }}
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              Sign out
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Execution behaviour" icon={<SlidersHorizontal className="h-4 w-4" aria-hidden />} />
          <CardBody className="space-y-3 text-xs">
            <Row label="Attempts">3, with exponential backoff</Row>
            <Row label="Retried on">timeouts, 429 and 5xx responses</Row>
            <Row label="Payload limit">64 KiB per request</Row>
            <Row label="Outbound targets">public hosts only (SSRF guard)</Row>
            <Row label="Workflows">
              {stats.data ? `${stats.data.active_workflows} active of ${stats.data.workflows}` : "—"}
            </Row>
            <p className="leading-relaxed text-[var(--color-ink-muted)]">
              These are server settings, configured through environment variables rather than the
              dashboard — the values above are what this instance is running with.
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-2.5 last:border-0">
      <span className="text-[var(--color-ink-subtle)]">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}
