import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { LanguageTabs } from "@/components/site/docs-content";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Quick start, authentication, webhooks, workflows, API keys and the full API reference for NexaFlow.",
};

const SECTIONS = [
  { id: "quick-start", label: "Quick start" },
  { id: "authentication", label: "Authentication" },
  { id: "webhooks", label: "Webhooks" },
  { id: "workflows", label: "Workflows" },
  { id: "api-keys", label: "API keys" },
  { id: "api-reference", label: "API reference" },
  { id: "errors", label: "Errors" },
];

const ENDPOINTS: { method: string; path: string; note: string }[] = [
  { method: "POST", path: "/api/auth/register", note: "Create an account" },
  { method: "POST", path: "/api/auth/login", note: "Sign in, sets the session cookie" },
  { method: "GET", path: "/api/auth/me", note: "Current account" },
  { method: "GET", path: "/api/workflows", note: "List your workflows" },
  { method: "POST", path: "/api/workflows", note: "Create one; returns the webhook URL" },
  { method: "GET", path: "/api/workflows/{id}", note: "Detail, with secrets redacted" },
  { method: "PATCH", path: "/api/workflows/{id}", note: "Partial update" },
  { method: "DELETE", path: "/api/workflows/{id}", note: "Delete the workflow and its history" },
  { method: "POST", path: "/api/workflows/{id}/test", note: "Run it with a sample payload" },
  { method: "GET", path: "/api/workflows/{id}/executions", note: "History for one workflow" },
  { method: "GET", path: "/api/executions", note: "History across all workflows" },
  { method: "GET", path: "/api/executions/{id}", note: "One execution in full" },
  { method: "GET", path: "/api/integrations", note: "Available and planned actions" },
  { method: "GET", path: "/api/keys", note: "List API keys" },
  { method: "POST", path: "/api/keys", note: "Create one; the raw key is shown once" },
  { method: "POST", path: "/hooks/{token}", note: "Trigger a workflow" },
];

export default function DocsPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
        <div className="lg:grid lg:grid-cols-[14rem_1fr] lg:gap-12">
          <nav aria-label="Documentation sections" className="mb-8 lg:sticky lg:top-24 lg:mb-0 lg:self-start">
            <p className="mb-3 text-xs font-semibold tracking-wide text-[var(--color-ink-subtle)] uppercase">
              Documentation
            </p>
            <ul className="flex flex-wrap gap-1 lg:block lg:space-y-1">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="block rounded-lg px-3 py-1.5 text-sm text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 space-y-14">
            <section id="quick-start" className="scroll-mt-24">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Documentation</h1>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                NexaFlow turns an incoming webhook into an action somewhere else. A workflow has
                one trigger, an optional JSON transform, and one action. This page covers the
                whole surface — it is short because the product is.
              </p>

              <h2 className="mt-8 text-base font-semibold">Quick start</h2>
              <ol className="mt-3 space-y-2 text-sm text-[var(--color-ink-muted)]">
                <li>
                  1. <Link href="/register" className="text-[var(--color-accent)] hover:underline">Create an account</Link>{" "}
                  and open the dashboard.
                </li>
                <li>2. Build a workflow: pick the action, paste its credential, write the message template.</li>
                <li>3. Copy the generated webhook URL and send it a JSON payload.</li>
                <li>4. Watch the execution appear, with the payload and the destination&apos;s answer.</li>
              </ol>
              <div className="mt-5">
                <LanguageTabs variant="trigger" />
              </div>
            </section>

            <section id="authentication" className="scroll-mt-24">
              <h2 className="text-base font-semibold">Authentication</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                There are two credentials, and they do different jobs.
              </p>
              <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--color-border)]">
                <table className="w-full min-w-[34rem] text-left text-sm">
                  <thead className="text-[11px] uppercase tracking-wide text-[var(--color-ink-subtle)]">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Surface</th>
                      <th className="px-4 py-2.5 font-medium">Credential</th>
                      <th className="px-4 py-2.5 font-medium">Used by</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--color-ink-muted)]">
                    <tr className="border-t border-[var(--color-border)]">
                      <td className="px-4 py-2.5 font-mono text-xs">/api/*</td>
                      <td className="px-4 py-2.5 text-xs">Session cookie or X-API-Key</td>
                      <td className="px-4 py-2.5 text-xs">Dashboard, scripts, CI</td>
                    </tr>
                    <tr className="border-t border-[var(--color-border)]">
                      <td className="px-4 py-2.5 font-mono text-xs">/hooks/{"{token}"}</td>
                      <td className="px-4 py-2.5 text-xs">The workflow token itself</td>
                      <td className="px-4 py-2.5 text-xs">Whatever service triggers the workflow</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-[var(--color-ink-subtle)]">
                The session is an HttpOnly cookie holding a signed JWT; passwords are hashed with
                scrypt. A workflow token can trigger its workflow and nothing else — it cannot
                read or change your account.
              </p>
            </section>

            <section id="webhooks" className="scroll-mt-24">
              <h2 className="text-base font-semibold">Webhooks</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                Each workflow owns one endpoint. The call returns immediately with an execution
                id; the action runs in the background with up to three attempts.
              </p>
              <div className="mt-4">
                <CodeBlock
                  label="Response"
                  value={`202 Accepted

{
  "accepted": true,
  "execution_id": 5821,
  "workflow": "Order notifications",
  "status": "processing"
}`}
                />
              </div>
              <h3 className="mt-6 text-sm font-medium">Signed requests</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                Turn on signing and NexaFlow gives you a secret once. Sign the exact request body
                and send the digest as <code className="font-mono text-xs">X-Signature-256</code>.
              </p>
              <div className="mt-3">
                <CodeBlock
                  value={`BODY='{"order_id":1024}'
SIG="sha256=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SIGNING_SECRET" -r | cut -d' ' -f1)"

curl -X POST https://api.nexaflow.dev/hooks/$WORKFLOW_TOKEN \\
  -H 'Content-Type: application/json' \\
  -H "X-Signature-256: $SIG" \\
  -d "$BODY"`}
                />
              </div>
            </section>

            <section id="workflows" className="scroll-mt-24">
              <h2 className="text-base font-semibold">Workflows</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                A workflow is created with an action type, that action&apos;s configuration, and an
                optional transform template. Placeholders use dotted paths:{" "}
                <code className="font-mono text-xs">{"{{order.id}}"}</code>,{" "}
                <code className="font-mono text-xs">{"{{items.0.sku}}"}</code>. Missing paths render
                empty and are listed in the execution result, so a typo is visible rather than silent.
              </p>
              <div className="mt-4">
                <CodeBlock
                  label="Create a workflow"
                  value={`curl -X POST https://api.nexaflow.dev/api/workflows \\
  -H "X-API-Key: $NEXAFLOW_KEY" -H 'Content-Type: application/json' \\
  -d '{
    "name": "Order notifications",
    "action_type": "discord",
    "action_config": {
      "webhook_url": "https://discord.com/api/webhooks/…",
      "message_template": "New order #{{order_id}} — {{customer}}"
    },
    "transform_template": null,
    "enabled": true
  }'`}
                />
              </div>
            </section>

            <section id="api-keys" className="scroll-mt-24">
              <h2 className="text-base font-semibold">API keys</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                Create a key in the dashboard to use the management API from a script. Keys are
                stored as a SHA-256 digest and shown exactly once, when they are created.
              </p>
              <div className="mt-4">
                <LanguageTabs variant="key" />
              </div>
            </section>

            <section id="api-reference" className="scroll-mt-24">
              <h2 className="text-base font-semibold">API reference</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                The API is documented with OpenAPI: run the backend and open{" "}
                <code className="font-mono text-xs">/docs</code> or{" "}
                <code className="font-mono text-xs">/redoc</code>.
              </p>
              <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--color-border)]">
                <table className="w-full min-w-[34rem] text-left text-sm">
                  <tbody>
                    {ENDPOINTS.map((endpoint) => (
                      <tr
                        key={endpoint.method + endpoint.path}
                        className="border-b border-[var(--color-border)] last:border-0"
                      >
                        <td className="px-4 py-2.5">
                          <Badge tone={endpoint.method === "DELETE" ? "danger" : "accent"}>
                            {endpoint.method}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs">{endpoint.path}</td>
                        <td className="px-4 py-2.5 text-xs text-[var(--color-ink-muted)]">
                          {endpoint.note}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="errors" className="scroll-mt-24">
              <h2 className="text-base font-semibold">Errors</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                Every failure — including validation — uses one envelope, so a client needs one
                branch to handle them all.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <CodeBlock
                  label="404 · unknown workflow"
                  value={`{
  "error": {
    "code": "unknown_workflow",
    "message": "No workflow for this token."
  }
}`}
                />
                <CodeBlock
                  label="409 · paused workflow"
                  value={`{
  "error": {
    "code": "workflow_paused",
    "message": "This workflow is paused."
  }
}`}
                />
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
