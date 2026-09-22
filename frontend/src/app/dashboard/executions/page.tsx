"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAsync } from "@/hooks/use-async";
import { PageHeader } from "@/components/dashboard/shell";
import { ExecutionTable } from "@/components/dashboard/execution-table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ErrorNote, Spinner } from "@/components/ui/feedback";
import { Select } from "@/components/ui/field";

const PAGE_SIZE = 25;

function ExecutionsView() {
  const params = useSearchParams();
  const workflowFilter = params.get("workflow") ?? "";
  const [status, setStatus] = useState("");
  const [offset, setOffset] = useState(0);

  const workflows = useAsync(() => api.workflows(), []);
  const page = useAsync(
    () =>
      api.executions({
        limit: PAGE_SIZE,
        offset,
        status: status || undefined,
        workflow_id: workflowFilter ? Number(workflowFilter) : undefined,
      }),
    [offset, status, workflowFilter],
  );

  const total = page.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <>
      <PageHeader
        title="Executions"
        description="Every run of every workflow, newest first — including the ones that failed."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Select
          aria-label="Filter by status"
          className="w-40"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setOffset(0);
          }}
        >
          <option value="">Any status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="processing">Processing</option>
        </Select>
        <Select
          aria-label="Filter by workflow"
          className="w-52"
          value={workflowFilter}
          onChange={(event) => {
            const value = event.target.value;
            const url = value ? `/dashboard/executions?workflow=${value}` : "/dashboard/executions";
            window.history.replaceState(null, "", url);
            setOffset(0);
          }}
        >
          <option value="">All workflows</option>
          {workflows.data?.map((workflow) => (
            <option key={workflow.id} value={workflow.id}>
              {workflow.name}
            </option>
          ))}
        </Select>
      </div>

      {page.error ? <ErrorNote message={page.error} /> : null}

      <Card>
        <CardHeader title={`${total} execution${total === 1 ? "" : "s"}`} />
        {page.loading ? <Spinner /> : <ExecutionTable executions={page.data?.items ?? []} />}
      </Card>

      {pages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-xs text-[var(--color-ink-muted)]">
          <span>
            Page {current} of {pages}
          </span>
          <div className="flex gap-2">
            <Button size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
              Previous
            </Button>
            <Button size="sm" disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)}>
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function ExecutionsPage() {
  return (
    <Suspense fallback={<Spinner label="Loading executions" />}>
      <ExecutionsView />
    </Suspense>
  );
}
