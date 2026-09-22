"use client";

import { Globe, MessageCircle, Plug, Send } from "lucide-react";
import { api } from "@/lib/api";
import { useAsync } from "@/hooks/use-async";
import { PageHeader } from "@/components/dashboard/shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ErrorNote, Spinner } from "@/components/ui/feedback";

const ICONS: Record<string, typeof Plug> = {
  discord: MessageCircle,
  telegram: Send,
  http: Globe,
};

export default function IntegrationsPage() {
  const { data, error, loading } = useAsync(() => api.integrations());

  return (
    <>
      <PageHeader
        title="Integrations"
        description="Served from the backend's action registry, so this page cannot drift from what the code supports."
      />

      {error ? <ErrorNote message={error} /> : null}
      {loading ? <Spinner label="Loading integrations" /> : null}

      {data ? (
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-xs font-semibold tracking-wide text-[var(--color-ink-subtle)] uppercase">
              Available ({data.counts.available})
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {data.available.map((integration) => {
                const Icon = ICONS[integration.type] ?? Plug;
                return (
                  <Card key={integration.type} interactive className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-canvas)]">
                        <Icon className="h-4 w-4 text-[var(--color-accent)]" aria-hidden />
                      </span>
                      <Badge tone="positive">Available</Badge>
                    </div>
                    <h3 className="mt-3 text-sm font-medium">{integration.label}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-ink-muted)]">
                      {integration.description}
                    </p>
                    {integration.secret_fields && integration.secret_fields.length > 0 ? (
                      <p className="mt-3 font-mono text-[10px] text-[var(--color-ink-subtle)]">
                        encrypted: {integration.secret_fields.join(", ")}
                      </p>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-semibold tracking-wide text-[var(--color-ink-subtle)] uppercase">
              Not built yet ({data.counts.planned})
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {data.planned.map((integration) => (
                <Card key={integration.type} className="p-4 opacity-60">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]">
                      <Plug className="h-4 w-4 text-[var(--color-ink-subtle)]" aria-hidden />
                    </span>
                    <Badge tone="neutral">Planned</Badge>
                  </div>
                  <h3 className="mt-3 text-sm font-medium">{integration.label}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-ink-muted)]">
                    {integration.description}
                  </p>
                </Card>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
