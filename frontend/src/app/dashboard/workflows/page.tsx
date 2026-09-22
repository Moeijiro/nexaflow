"use client";

import Link from "next/link";
import { ChevronRight, Plus, Workflow as WorkflowIcon } from "lucide-react";
import { api } from "@/lib/api";
import { useAsync } from "@/hooks/use-async";
import { PageHeader } from "@/components/dashboard/shell";
import { Badge, StatusBadge, StatusDot } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorNote, Spinner } from "@/components/ui/feedback";
import { ACTION_LABELS, relativeTime } from "@/lib/utils";

export default function WorkflowsPage() {
  const { data, error, loading } = useAsync(() => api.workflows(), []);

  return (
    <>
      <PageHeader
        title="Workflows"
        description="One trigger, an optional transform, one action. Each workflow owns a webhook URL."
        actions={
          <Link href="/dashboard/workflows/new">
            <Button variant="primary" size="sm">
              <Plus className="h-3.5 w-3.5" aria-hidden />
              New workflow
            </Button>
          </Link>
        }
      />

      {error ? <ErrorNote message={error} /> : null}
      {loading ? <Spinner label="Loading workflows" /> : null}

      {data && data.length === 0 ? (
        <Card>
          <EmptyState
            icon={<WorkflowIcon className="h-6 w-6" aria-hidden />}
            title="No workflows yet"
            hint="A workflow turns an incoming webhook into a Discord, Telegram or HTTP action."
            action={
              <Link href="/dashboard/workflows/new">
                <Button variant="primary" size="sm">
                  Build your first workflow
                </Button>
              </Link>
            }
          />
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {data?.map((workflow) => (
          <Link key={workflow.id} href={`/dashboard/workflows/${workflow.id}`} className="block">
            <Card interactive className="h-full p-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">{workflow.name}</p>
                    <Badge tone="neutral">{ACTION_LABELS[workflow.action_type]}</Badge>
                    {workflow.transform_template ? <Badge tone="cyan">transform</Badge> : null}
                    {workflow.signature_required ? <Badge tone="accent">signed</Badge> : null}
                  </div>
                  {workflow.description ? (
                    <p className="mt-1 truncate text-xs text-[var(--color-ink-muted)]">
                      {workflow.description}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[var(--color-ink-muted)]">
                    <span className="flex items-center gap-1.5">
                      <StatusDot tone={workflow.enabled ? "positive" : "neutral"} pulse={workflow.enabled} />
                      {workflow.enabled ? "Active" : "Paused"}
                    </span>
                    <span>{workflow.executions} runs</span>
                    <span>last {relativeTime(workflow.last_execution_at)}</span>
                    {workflow.last_status ? <StatusBadge status={workflow.last_status} /> : null}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-ink-subtle)]" aria-hidden />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
