import { Braces, KeyRound, ScrollText, Terminal, Webhook, Workflow } from "lucide-react";
import { Reveal } from "@/components/site/section";
import { Card } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Webhook,
    title: "Webhooks",
    description:
      "Every workflow gets its own endpoint with a 32-byte token, an optional HMAC signature and a payload size limit.",
  },
  {
    icon: Braces,
    title: "Transforms",
    description:
      "Reshape an incoming payload with a JSON template. Paths are substituted — nothing is evaluated.",
  },
  {
    icon: Workflow,
    title: "Workflow automation",
    description:
      "Trigger, optional transform, action. Runs in the background with up to three attempts and backoff.",
  },
  {
    icon: ScrollText,
    title: "Execution logs",
    description:
      "Payload in, transform out, what the destination answered, how long it took, and the error if it failed.",
  },
  {
    icon: KeyRound,
    title: "Secure credentials",
    description:
      "Integration secrets are encrypted at rest and never returned by the API — not even to their owner.",
  },
  {
    icon: Terminal,
    title: "Developer friendly",
    description:
      "One error shape, OpenAPI docs, API keys for scripts, and a curl command generated for every workflow.",
  },
];

export function FeatureGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((feature, index) => (
        <Reveal key={feature.title} delay={index * 0.05}>
          <Card interactive className="h-full p-5">
            <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-canvas)]">
              <feature.icon className="h-4 w-4 text-[var(--color-accent)]" aria-hidden />
            </span>
            <h3 className="text-sm font-medium">{feature.title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink-muted)]">
              {feature.description}
            </p>
          </Card>
        </Reveal>
      ))}
    </div>
  );
}
