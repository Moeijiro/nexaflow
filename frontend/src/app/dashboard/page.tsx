"use client";

import Link from "next/link";
import { Activity, ArrowRight, CheckCircle2, Clock, Plus, Workflow } from "lucide-react";
import { api } from "@/lib/api";
import { useAsync } from "@/hooks/use-async";
import { PageHeader } from "@/components/dashboard/shell";
import { StatTile } from "@/components/dashboard/stat-tile";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { ExecutionTable } from "@/components/dashboard/execution-table";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, ErrorNote, Spinner } from "@/components/ui/feedback";
import { StatusDot } from "@/components/ui/badge";
import { ACTION_LABELS, relativeTime } from "@/lib/utils";

export default function OverviewPage() {
  const stats = useAsync(() => api.stats());
  const executions = useAsync(() => api.executions({ limit: 6 }));
  const workflows = useAsync(() => api.workflows());

  return (
    <>
      <PageHeader
        title="Overview"
        description="Every figure below is a query over your own executions — nothing is seeded into these numbers."
        actions={
          <Link href="/dashboard/workflows/new">
            <Button variant="primary" size="sm">
              <Plus className="h-3.5 w-3.5" aria-hidden />
              New workflow
            </Button>
          </Link>
        }
      />

      {stats.error ? <ErrorNote message={stats.error} /> : null}
      {stats.loading ? <Spinner label="Loading dashboard" /> : null}

      {stats.data ? (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Active workflows"
              value={stats.data.active_workflows}
              hint={`${stats.data.workflows} total`}
              icon={<Workflow className="h-3 w-3" aria-hidden />}
            />
            <StatTile
              label="Executions today"
              value={stats.data.executions_today}
              hint={`${stats.data.executions_total} all time`}
              icon={<Activity className="h-3 w-3" aria-hidden />}
            />
            <StatTile
              label="Successful"
              value={stats.data.succeeded}
              hint={
                stats.data.success_rate !== null
                  ? `${stats.data.success_rate}% success rate`
                  : "no runs yet"
              }
              icon={<CheckCircle2 className="h-3 w-3" aria-hidden />}
            />
            <StatTile
              label="Failed"
              value={stats.data.failed}
              hint={
                stats.data.avg_duration_ms !== null
                  ? `avg ${stats.data.avg_duration_ms} ms`
                  : undefined
              }
              icon={<Clock className="h-3 w-3" aria-hidden />}
            />
          </div>

          <Card className="mb-4">
            <CardHeader
              title="Executions per hour"
              description="The last 24 hours. Failed runs are stacked in red."
            />
            <CardBody>
              <UsageChart series={stats.data.series} />
            </CardBody>
          </Card>
        </>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Recent activity"
            action={
              <Link
                href="/dashboard/executions"
                className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              >
                All executions
              </Link>
            }
          />
          {executions.loading ? (
            <Spinner />
          ) : (
            <ExecutionTable executions={executions.data?.items ?? []} />
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Workflows"
            action={
              <Link
                href="/dashboard/workflows"
                className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              >
                Manage
              </Link>
            }
          />
          {workflows.loading ? <Spinner /> : null}
          {workflows.data && workflows.data.length === 0 ? (
            <EmptyState
              title="No workflows yet"
              hint="Create one to get a webhook URL and a curl command."
              action={
                <Link href="/dashboard/workflows/new">
                  <Button variant="primary" size="sm">
                    Build your first
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </Link>
              }
            />
          ) : null}
          {workflows.data && workflows.data.length > 0 ? (
            <div className="divide-y divide-[var(--color-border)]">
              {workflows.data.slice(0, 5).map((workflow) => (
                <Link
                  key={workflow.id}
                  href={`/dashboard/workflows/${workflow.id}`}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--color-surface-raised)]/50"
                >
                  <StatusDot tone={workflow.enabled ? "positive" : "neutral"} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{workflow.name}</span>
                    <span className="block truncate text-[11px] text-[var(--color-ink-subtle)]">
                      {ACTION_LABELS[workflow.action_type]} · last run{" "}
                      {relativeTime(workflow.last_execution_at)}
                    </span>
                  </span>
                  <span className="font-mono text-xs tabular-nums text-[var(--color-ink-muted)]">
                    {workflow.executions}
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </Card>
      </div>
    </>
  );
}
