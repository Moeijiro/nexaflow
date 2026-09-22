"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Bell, Repeat, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Three worked examples. The steps are the real pipeline stages, so the
 *  diagram matches what the backend actually does. */
const CASES = [
  {
    id: "leads",
    icon: UserPlus,
    title: "Lead notification",
    summary: "A form submission reaches the sales channel in under a second.",
    steps: ["Website form", "Webhook", "NexaFlow", "Discord message"],
    payload: '{ "name": "Alex Rivera", "email": "alex@example.com", "plan": "pro" }',
    result: "**New lead** — Alex Rivera · pro",
  },
  {
    id: "api",
    icon: Repeat,
    title: "API processing",
    summary: "Reshape a shop webhook and forward it to your billing API.",
    steps: ["Shop webhook", "NexaFlow", "Transform", "Billing API"],
    payload: '{ "order": { "id": "A-1042", "amount": 129.5 } }',
    result: 'POST /v1/orders { "order": "A-1042", "total": 129.5 }',
  },
  {
    id: "alerts",
    icon: Bell,
    title: "Alert automation",
    summary: "Monitoring pages the on-call chat instead of an inbox nobody reads.",
    steps: ["Monitoring", "Webhook", "NexaFlow", "Telegram alert"],
    payload: '{ "service": "checkout-api", "status": "degraded" }',
    result: "🚨 checkout-api is degraded (eu-central)",
  },
];

export function UseCases() {
  const [active, setActive] = useState(CASES[0]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_1fr]">
      <div role="tablist" aria-label="Use cases" className="flex gap-2 lg:flex-col">
        {CASES.map((item) => {
          const selected = active.id === item.id;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(item)}
              className={cn(
                "flex-1 rounded-xl border px-4 py-3.5 text-left transition-colors lg:flex-none",
                selected
                  ? "border-[var(--color-border-strong)] bg-[var(--color-surface-raised)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]",
              )}
            >
              <span className="flex items-center gap-2.5">
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    selected ? "text-[var(--color-accent)]" : "text-[var(--color-ink-subtle)]",
                  )}
                  aria-hidden
                />
                <span className="text-sm font-medium">{item.title}</span>
              </span>
              <span className="mt-1.5 hidden text-xs leading-relaxed text-[var(--color-ink-muted)] lg:block">
                {item.summary}
              </span>
            </button>
          );
        })}
      </div>

      <motion.div
        key={active.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
      >
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-2">
          {active.steps.map((step, index) => (
            <li key={step} className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs",
                  index === 2
                    ? "border-[#3b3573] bg-[var(--color-accent-soft)] text-[#c4beff]"
                    : "border-[var(--color-border-strong)] bg-[var(--color-canvas)] text-[var(--color-ink-muted)]",
                )}
              >
                {step}
              </span>
              {index < active.steps.length - 1 ? (
                <span className="text-[var(--color-ink-subtle)]" aria-hidden>
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-[11px] uppercase tracking-wide text-[var(--color-ink-subtle)]">
              Incoming payload
            </p>
            <pre className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[#06060a] p-3 font-mono text-[11px] text-[var(--color-ink-muted)]">
              {active.payload}
            </pre>
          </div>
          <div>
            <p className="mb-1.5 text-[11px] uppercase tracking-wide text-[var(--color-ink-subtle)]">
              What the action sends
            </p>
            <pre className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[#06060a] p-3 font-mono text-[11px] text-[var(--color-ink-muted)]">
              {active.result}
            </pre>
          </div>
        </div>
        <p className="mt-3 text-xs text-[var(--color-ink-muted)] lg:hidden">{active.summary}</p>
      </motion.div>
    </div>
  );
}
