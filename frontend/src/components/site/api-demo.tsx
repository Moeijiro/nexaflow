"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Check, Play, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Phase = "idle" | "sending" | "processing" | "done";

const STEPS: { phase: Phase; label: string }[] = [
  { phase: "sending", label: "Request sent" },
  { phase: "processing", label: "Workflow queued" },
  { phase: "done", label: "Action delivered" },
];

/**
 * A scripted walk-through of what a webhook call does, for visitors who have
 * not signed up yet. It is labelled as a simulation on purpose — the same
 * call against a real workflow happens in the dashboard, not here.
 */
export function ApiDemo() {
  const [phase, setPhase] = useState<Phase>("idle");

  const run = () => {
    setPhase("sending");
    setTimeout(() => setPhase("processing"), 550);
    setTimeout(() => setPhase("done"), 1250);
  };

  const reached = (target: Phase) => {
    const order: Phase[] = ["idle", "sending", "processing", "done"];
    return order.indexOf(phase) >= order.indexOf(target);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="mb-3 flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
          <Terminal className="h-3.5 w-3.5" aria-hidden />
          Trigger a workflow
        </div>
        <pre className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[#06060a] p-3.5 font-mono text-[11.5px] leading-relaxed text-[var(--color-ink-muted)]">
{`curl -X POST https://api.nexaflow.dev/hooks/wf_9f3a2b… \\
  -H 'Content-Type: application/json' \\
  -d '{"order_id": 1024, "customer": "Alex"}'`}
        </pre>
        <div className="mt-4 flex items-center gap-3">
          <Button variant="primary" size="sm" onClick={run} loading={phase === "sending"}>
            <Play className="h-3.5 w-3.5" aria-hidden />
            Send request
          </Button>
          <span className="text-[11px] text-[var(--color-ink-subtle)]">
            Simulated — the real call is one click away in the dashboard
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <ol className="space-y-2.5" aria-live="polite">
          {STEPS.map((step) => {
            const active = reached(step.phase);
            return (
              <li key={step.phase} className="flex items-center gap-2.5 text-xs">
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
                    active
                      ? "border-[#1f5241] bg-[#0d2119] text-[var(--color-positive)]"
                      : "border-[var(--color-border-strong)] text-[var(--color-ink-subtle)]",
                  )}
                >
                  {active ? <Check className="h-3 w-3" aria-hidden /> : null}
                </span>
                <span className={active ? "text-[var(--color-ink)]" : "text-[var(--color-ink-subtle)]"}>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>

        <motion.pre
          key={phase}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[#06060a] p-3.5 font-mono text-[11.5px] leading-relaxed text-[var(--color-ink-muted)]"
        >
          {phase === "idle"
            ? "// response will appear here"
            : phase === "done"
              ? `202 Accepted

{
  "accepted": true,
  "execution_id": 5821,
  "workflow": "Order notifications",
  "status": "processing"
}`
              : "…"}
        </motion.pre>
      </div>
    </div>
  );
}
