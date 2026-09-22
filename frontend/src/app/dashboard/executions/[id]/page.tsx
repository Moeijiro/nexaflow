"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useAsync } from "@/hooks/use-async";
import { PageHeader } from "@/components/dashboard/shell";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ErrorNote, Spinner } from "@/components/ui/feedback";
import { ACTION_LABELS, absoluteTime, duration } from "@/lib/utils";

/** The execution detail reads like a trace: what came in, what the transform
 *  made of it, what the action sent, and what came back. */
export default function ExecutionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const execution = useAsync(() => api.execution(Number(id)), [id]);

  if (execution.loading) return <Spinner label="Loading execution" />;
  if (execution.error) return <ErrorNote message={execution.error} />;
  if (!execution.data) return null;

  const run = execution.data;
  const stages = [
    { label: "Trigger", value: run.trigger_payload, note: "Incoming webhook payload" },
    {
      label: "Transform",
      value: run.transformed_payload,
      note: run.transformed_payload ? "What the action received" : "No transform on this workflow",
    },
    { label: "Action result", value: run.action_result, note: `${ACTION_LABELS[run.action_type]} response` },
  ];

  return (
    <>
      <PageHeader
        title={`Execution #${run.id}`}
        description={absoluteTime(run.started_at)}
        back={{ href: "/dashboard/executions", label: "Executions" }}
        actions={
          <Link href={`/dashboard/workflows/${run.workflow_id}`}>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-strong)] px-3 py-1.5 text-xs transition-colors hover:bg-[var(--color-surface-raised)]">
              {run.workflow_name}
              <ArrowRight className="h-3 w-3" aria-hidden />
            </span>
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <Card className="px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-subtle)]">Status</p>
          <div className="mt-1.5 flex items-center gap-2">
            <StatusBadge status={run.status} />
            {run.is_test ? <Badge tone="neutral">test</Badge> : null}
          </div>
        </Card>
        <Card className="px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-subtle)]">Duration</p>
          <p className="mt-1 font-mono text-sm tabular-nums">{duration(run.duration_ms)}</p>
        </Card>
        <Card className="px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-subtle)]">Attempts</p>
          <p className="mt-1 font-mono text-sm tabular-nums">{run.attempts}</p>
        </Card>
        <Card className="px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-subtle)]">Finished</p>
          <p className="mt-1 text-xs">{run.finished_at ? absoluteTime(run.finished_at) : "—"}</p>
        </Card>
      </div>

      {run.error ? (
        <div className="mb-4">
          <ErrorNote message={run.error} />
        </div>
      ) : null}

      <div className="space-y-4">
        {stages.map((stage) => (
          <Card key={stage.label}>
            <CardHeader title={stage.label} description={stage.note} />
            <CardBody>
              <pre className="max-h-80 overflow-auto rounded-lg border border-[var(--color-border)] bg-[#06060a] p-3.5 font-mono text-[11.5px] leading-relaxed text-[var(--color-ink-muted)]">
                {stage.value ? JSON.stringify(stage.value, null, 2) : "—"}
              </pre>
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  );
}
