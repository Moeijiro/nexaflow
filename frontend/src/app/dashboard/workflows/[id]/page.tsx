"use client";

import { use, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { KeyRound, Play, Terminal, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAsync } from "@/hooks/use-async";
import { PageHeader } from "@/components/dashboard/shell";
import { ExecutionTable } from "@/components/dashboard/execution-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-block";
import { ErrorNote, Spinner } from "@/components/ui/feedback";
import { Toggle } from "@/components/ui/field";
import { Textarea } from "@/components/ui/field";
import { ACTION_LABELS, absoluteTime, samplePayloadFromTemplates } from "@/lib/utils";

export default function WorkflowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const workflowId = Number(id);
  const router = useRouter();
  const search = useSearchParams();
  const justCreated = search.get("created") === "1";

  const workflow = useAsync(() => api.workflow(workflowId), [workflowId]);
  const executions = useAsync(() => api.workflowExecutions(workflowId, 10), [workflowId]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  const [testPayload, setTestPayload] = useState<string | null>(null);

  if (workflow.loading) return <Spinner label="Loading workflow" />;
  if (workflow.error) return <ErrorNote message={workflow.error} />;
  if (!workflow.data) return null;

  const detail = workflow.data;

  const toggle = async (enabled: boolean) => {
    setBusy(true);
    setError(null);
    try {
      await api.updateWorkflow(workflowId, { enabled });
      workflow.setData({ ...detail, enabled });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const openTest = () => {
    if (testPayload === null) {
      // Prefilled from the placeholders the *first* stage reads. With a
      // transform that is the transform's paths; without one the action reads
      // the incoming payload directly. Mixing both would produce a sample that
      // fits neither.
      const sample = samplePayloadFromTemplates(
        detail.transform_template
          ? [detail.transform_template]
          : [
              String(detail.action_config.message_template ?? ""),
              String(detail.action_config.body_template ?? ""),
            ],
      );
      setTestPayload(JSON.stringify(sample, null, 2));
    }
    setTestOpen((value) => !value);
  };

  const runTest = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(testPayload ?? "{}");
      } catch {
        throw new Error("The test payload is not valid JSON.");
      }
      const result = await api.testWorkflow(workflowId, payload);
      setNotice(`Test run queued as execution #${result.execution_id}.`);
      // The action runs in the background; give it a moment before reloading.
      setTimeout(() => {
        executions.reload();
        workflow.reload();
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete "${detail.name}" and its execution history?`)) return;
    setBusy(true);
    try {
      await api.deleteWorkflow(workflowId);
      router.push("/dashboard/workflows");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title={detail.name}
        description={detail.description ?? `${ACTION_LABELS[detail.action_type]} · created ${absoluteTime(detail.created_at)}`}
        back={{ href: "/dashboard/workflows", label: "Workflows" }}
        actions={
          <>
            <Button size="sm" onClick={openTest} aria-expanded={testOpen}>
              <Play className="h-3.5 w-3.5" aria-hidden />
              Test
            </Button>
            <Button size="sm" variant="danger" onClick={remove}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Delete
            </Button>
          </>
        }
      />

      {error ? (
        <div className="mb-4">
          <ErrorNote message={error} />
        </div>
      ) : null}
      {notice ? (
        <p className="mb-4 rounded-lg border border-[#1f5241] bg-[#0d2119] px-3 py-2 text-xs text-[var(--color-positive)]">
          {notice}
        </p>
      ) : null}

      {justCreated && detail.signing_secret ? (
        <Card className="mb-4 border-[#3b3573]">
          <CardHeader
            title="Signing secret"
            description="Shown once. Sign the request body with it and send the digest as X-Signature-256."
            icon={<KeyRound className="h-4 w-4" aria-hidden />}
          />
          <CardBody>
            <CodeBlock value={detail.signing_secret} />
          </CardBody>
        </Card>
      ) : null}

      {testOpen ? (
        <Card className="mb-4">
          <CardHeader
            title="Test run"
            description="This calls the real destination and is recorded like any other execution — marked as a test."
            icon={<Play className="h-4 w-4" aria-hidden />}
          />
          <CardBody className="space-y-3">
            <Textarea
              aria-label="Test payload"
              rows={7}
              value={testPayload ?? ""}
              onChange={(event) => setTestPayload(event.target.value)}
            />
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={runTest} loading={busy}>
                Run test
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setTestOpen(false)}>
                Cancel
              </Button>
              <span className="text-[11px] text-[var(--color-ink-subtle)]">
                Prefilled from the placeholders this workflow reads.
              </span>
            </div>
          </CardBody>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Trigger"
            description="POST JSON here and the workflow runs in the background."
            icon={<Terminal className="h-4 w-4" aria-hidden />}
          />
          <CardBody className="space-y-4">
            <CodeBlock label="Webhook URL" value={detail.webhook_url} />
            <CodeBlock label="Try it" value={detail.curl_example} />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Configuration" />
          <CardBody className="space-y-4">
            <Toggle
              label="Active"
              description="Paused workflows answer 409."
              checked={detail.enabled}
              onChange={toggle}
              disabled={busy}
            />
            <dl className="space-y-2 border-t border-[var(--color-border)] pt-4 text-xs">
              <Row label="Action">{ACTION_LABELS[detail.action_type]}</Row>
              <Row label="Transform">
                {detail.transform_template ? (
                  <Badge tone="cyan">JSON template</Badge>
                ) : (
                  <span className="text-[var(--color-ink-muted)]">none</span>
                )}
              </Row>
              <Row label="Signature">
                {detail.signature_required ? (
                  <Badge tone="accent">required</Badge>
                ) : (
                  <span className="text-[var(--color-ink-muted)]">not required</span>
                )}
              </Row>
              <Row label="Executions">{detail.executions}</Row>
            </dl>

            {detail.transform_template ? (
              <CodeBlock label="Transform" value={detail.transform_template} />
            ) : null}

            <div>
              <p className="mb-1.5 text-[11px] uppercase tracking-wide text-[var(--color-ink-subtle)]">
                Action config
              </p>
              <pre className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[#06060a] p-3 font-mono text-[11px] text-[var(--color-ink-muted)]">
                {JSON.stringify(detail.action_config, null, 2)}
              </pre>
              <p className="mt-1.5 text-[11px] text-[var(--color-ink-subtle)]">
                Credentials are encrypted at rest and never returned by the API.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Recent executions"
          action={
            <Link
              href={`/dashboard/executions?workflow=${detail.id}`}
              className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            >
              All executions
            </Link>
          }
        />
        {executions.loading ? (
          <Spinner />
        ) : (
          <ExecutionTable executions={executions.data?.items ?? []} showWorkflow={false} />
        )}
      </Card>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[var(--color-ink-subtle)]">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
