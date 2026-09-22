"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { absoluteTime, duration, relativeTime } from "@/lib/utils";
import type { Execution } from "@/lib/types";

/** The execution feed, shared by the overview, a workflow and the logs page. */
export function ExecutionTable({
  executions,
  showWorkflow = true,
}: {
  executions: Execution[];
  showWorkflow?: boolean;
}) {
  if (executions.length === 0) {
    return (
      <EmptyState
        title="No executions yet"
        hint="Trigger a workflow's webhook — or press Test on the workflow page — and the run appears here."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[38rem] border-collapse text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--color-ink-subtle)]">
            <th className="px-5 py-2.5 font-medium">Status</th>
            {showWorkflow ? <th className="px-5 py-2.5 font-medium">Workflow</th> : null}
            <th className="px-5 py-2.5 font-medium">Result</th>
            <th className="px-5 py-2.5 font-medium">Took</th>
            <th className="px-5 py-2.5 text-right font-medium">When</th>
            <th className="px-5 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {executions.map((execution) => (
            <tr
              key={execution.id}
              className="border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-raised)]/50"
            >
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <StatusBadge status={execution.status} />
                  {execution.is_test ? <Badge tone="neutral">test</Badge> : null}
                </div>
              </td>
              {showWorkflow ? (
                <td className="max-w-[12rem] truncate px-5 py-3">{execution.workflow_name}</td>
              ) : null}
              <td className="max-w-[16rem] truncate px-5 py-3 text-xs text-[var(--color-ink-muted)]">
                {execution.error ??
                  (execution.action_result?.detail as string | undefined) ??
                  "—"}
              </td>
              <td className="px-5 py-3 font-mono text-xs tabular-nums text-[var(--color-ink-muted)]">
                {duration(execution.duration_ms)}
              </td>
              <td
                className="whitespace-nowrap px-5 py-3 text-right text-xs text-[var(--color-ink-muted)]"
                title={absoluteTime(execution.started_at)}
              >
                {relativeTime(execution.started_at)}
              </td>
              <td className="px-5 py-3 text-right">
                <Link
                  href={`/dashboard/executions/${execution.id}`}
                  aria-label={`Open execution ${execution.id}`}
                  className="inline-flex rounded-md p-1 text-[var(--color-ink-subtle)] transition-colors hover:text-[var(--color-ink)]"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
