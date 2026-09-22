"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Braces, Radio, Send, Webhook, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The interactive pipeline shown in the hero.
 *
 * Nodes are real elements (focusable, hoverable, announced) rather than
 * pictures, and the connectors are small SVGs that fill the gap between them —
 * which means the same component works as a row on desktop and a column on
 * mobile without measuring anything.
 */

type NodeKind = "trigger" | "process" | "action";

interface FlowNode {
  id: string;
  kind: NodeKind;
  title: string;
  subtitle: string;
  icon: typeof Webhook;
  detail: { label: string; value: string }[];
}

interface Scenario {
  id: string;
  label: string;
  nodes: FlowNode[];
}

const CORE: FlowNode = {
  id: "core",
  kind: "process",
  title: "NexaFlow",
  subtitle: "Validate & queue",
  icon: Zap,
  detail: [
    { label: "Checks", value: "payload size, JSON shape, signature" },
    { label: "Queue", value: "execution recorded, then run in background" },
    { label: "Retries", value: "up to 3 attempts with backoff" },
  ],
};

const SCENARIOS: Scenario[] = [
  {
    id: "orders",
    label: "Order → Discord",
    nodes: [
      {
        id: "webhook",
        kind: "trigger",
        title: "Webhook",
        subtitle: "POST /hooks/…",
        icon: Webhook,
        detail: [
          { label: "Trigger", value: "Incoming webhook" },
          { label: "Payload", value: '{ "order_id": 1024, "customer": "Alex" }' },
          { label: "Auth", value: "Per-workflow token, optional HMAC" },
        ],
      },
      CORE,
      {
        id: "transform",
        kind: "process",
        title: "Transform",
        subtitle: "Reshape JSON",
        icon: Braces,
        detail: [
          { label: "Template", value: '{ "id": "{{order_id}}", "who": "{{customer}}" }' },
          { label: "Engine", value: "Path substitution only — no code is evaluated" },
        ],
      },
      {
        id: "discord",
        kind: "action",
        title: "Discord",
        subtitle: "Send message",
        icon: Send,
        detail: [
          { label: "Action", value: "Discord webhook" },
          { label: "Message", value: "New order #1024 — Alex" },
          { label: "Credentials", value: "Encrypted at rest, never returned by the API" },
        ],
      },
    ],
  },
  {
    id: "alerts",
    label: "Alert → Telegram",
    nodes: [
      {
        id: "monitor",
        kind: "trigger",
        title: "Monitoring",
        subtitle: "Alert webhook",
        icon: Radio,
        detail: [
          { label: "Trigger", value: "Incoming webhook" },
          { label: "Payload", value: '{ "service": "checkout-api", "status": "degraded" }' },
        ],
      },
      CORE,
      {
        id: "transform-alert",
        kind: "process",
        title: "Transform",
        subtitle: "Format alert",
        icon: Braces,
        detail: [{ label: "Template", value: '{ "text": "{{service}} is {{status}}" }' }],
      },
      {
        id: "telegram",
        kind: "action",
        title: "Telegram",
        subtitle: "Notify on-call",
        icon: Send,
        detail: [
          { label: "Action", value: "Telegram Bot API" },
          { label: "Chat", value: "On-call group" },
          { label: "Credentials", value: "Bot token encrypted at rest" },
        ],
      },
    ],
  },
];

const KIND_STYLES: Record<NodeKind, { ring: string; chip: string; label: string }> = {
  trigger: {
    ring: "hover:border-[#3b3573]",
    chip: "bg-[var(--color-accent-soft)] text-[#b5aeff]",
    label: "Trigger",
  },
  process: {
    ring: "hover:border-[#1d4e58]",
    chip: "bg-[#0c2026] text-[var(--color-cyan)]",
    label: "Process",
  },
  action: {
    ring: "hover:border-[#1f5241]",
    chip: "bg-[#0d2119] text-[var(--color-positive)]",
    label: "Action",
  },
};

export function WorkflowDiagram() {
  const [scenario, setScenario] = useState(SCENARIOS[0]);
  const [selected, setSelected] = useState<FlowNode>(SCENARIOS[0].nodes[0]);
  const reduceMotion = useReducedMotion();

  return (
    <div className="w-full">
      <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
        {SCENARIOS.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setScenario(item);
              setSelected(item.nodes[0]);
            }}
            aria-pressed={scenario.id === item.id}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              scenario.id === item.id
                ? "border-[#3b3573] bg-[var(--color-accent-soft)] text-[#c4beff]"
                : "border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-stretch gap-0 lg:flex-row lg:items-center">
        {scenario.nodes.map((node, index) => (
          <div key={node.id} className="contents">
            <FlowNodeCard
              node={node}
              active={selected.id === node.id}
              onSelect={() => setSelected(node)}
            />
            {index < scenario.nodes.length - 1 ? (
              <Connector index={index} animate={!reduceMotion} />
            ) : null}
          </div>
        ))}
      </div>

      <NodeDetail node={selected} />
    </div>
  );
}

function FlowNodeCard({
  node,
  active,
  onSelect,
}: {
  node: FlowNode;
  active: boolean;
  onSelect: () => void;
}) {
  const style = KIND_STYLES[node.kind];
  const Icon = node.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onSelect}
      aria-pressed={active}
      className={cn(
        "group relative flex-1 rounded-xl border bg-[var(--color-surface)] px-4 py-3.5 text-left transition-all",
        "hover:-translate-y-0.5",
        style.ring,
        active
          ? "border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] shadow-[0_12px_40px_-24px_rgba(123,108,255,0.8)]"
          : "border-[var(--color-border)]",
      )}
    >
      <span
        className={cn(
          "mb-2 inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
          style.chip,
        )}
      >
        {style.label}
      </span>
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-canvas)]">
          <Icon className="h-4 w-4 text-[var(--color-ink)]" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{node.title}</span>
          <span className="block truncate font-mono text-[11px] text-[var(--color-ink-subtle)]">
            {node.subtitle}
          </span>
        </span>
      </div>
    </button>
  );
}

/**
 * The line between two nodes: vertical on small screens, horizontal from lg up.
 * The travelling dot is an SVG `animateMotion`, so it costs no JavaScript per
 * frame — and it is simply not rendered when the visitor asked for less motion.
 */
function Connector({ index, animate }: { index: number; animate: boolean }) {
  const delay = `${index * 0.45}s`;
  return (
    <>
      {/* Mobile / tablet: vertical */}
      <div className="flex h-8 items-center justify-center lg:hidden" aria-hidden>
        <svg width="12" height="32" viewBox="0 0 12 32" fill="none">
          <path d="M6 0 V32" stroke="var(--color-border-strong)" strokeWidth="1.5" />
          {animate ? (
            <circle r="2.5" fill="var(--color-accent)">
              <animateMotion dur="1.8s" begin={delay} repeatCount="indefinite" path="M6 0 V32" />
            </circle>
          ) : null}
        </svg>
      </div>
      {/* Desktop: horizontal */}
      <div className="hidden w-10 shrink-0 items-center justify-center lg:flex" aria-hidden>
        <svg width="40" height="12" viewBox="0 0 40 12" fill="none">
          <path d="M0 6 H40" stroke="var(--color-border-strong)" strokeWidth="1.5" />
          {animate ? (
            <circle r="2.5" fill="var(--color-accent)">
              <animateMotion dur="1.8s" begin={delay} repeatCount="indefinite" path="M0 6 H40" />
            </circle>
          ) : null}
        </svg>
      </div>
    </>
  );
}

function NodeDetail({ node }: { node: FlowNode }) {
  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-4 py-3"
      aria-live="polite"
    >
      <div className="mb-2 flex items-center gap-2 text-xs">
        <span className="font-medium">{node.title}</span>
        <ArrowRight className="h-3 w-3 text-[var(--color-ink-subtle)]" aria-hidden />
        <span className="text-[var(--color-ink-muted)]">{KIND_STYLES[node.kind].label} node</span>
      </div>
      <dl className="grid gap-1.5 text-[11.5px] sm:grid-cols-[8rem_1fr]">
        {node.detail.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-[var(--color-ink-subtle)]">{row.label}</dt>
            <dd className="font-mono break-words text-[var(--color-ink-muted)]">{row.value}</dd>
          </div>
        ))}
      </dl>
    </motion.div>
  );
}
