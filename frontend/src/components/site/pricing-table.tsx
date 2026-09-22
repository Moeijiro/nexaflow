import Link from "next/link";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Illustrative plans. This is a portfolio project: there is no billing code,
 *  no payment provider, and every account behaves like the Free plan. */
const PLANS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    summary: "Everything you need to run your first automations.",
    features: [
      "3 active workflows",
      "1,000 executions / month",
      "Discord, Telegram and HTTP actions",
      "7 days of execution history",
    ],
    cta: "Start building",
    highlighted: false,
  },
  {
    name: "Developer",
    price: "$19",
    cadence: "per month",
    summary: "For side projects that have started to matter.",
    features: [
      "25 active workflows",
      "50,000 executions / month",
      "JSON transforms and signed webhooks",
      "30 days of execution history",
      "API keys for scripts and CI",
    ],
    cta: "Choose Developer",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$49",
    cadence: "per month",
    summary: "For teams running automations in production.",
    features: [
      "Unlimited workflows",
      "500,000 executions / month",
      "90 days of execution history",
      "Priority retries",
      "Email support",
    ],
    cta: "Choose Pro",
    highlighted: false,
  },
];

export function PricingTable() {
  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "relative flex flex-col rounded-2xl border p-6",
              plan.highlighted
                ? "border-[#3b3573] bg-[var(--color-surface-raised)] shadow-[0_24px_70px_-50px_rgba(123,108,255,1)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)]",
            )}
          >
            {plan.highlighted ? (
              <span className="absolute -top-2.5 left-6">
                <Badge tone="accent">Most popular</Badge>
              </span>
            ) : null}

            <h3 className="text-sm font-semibold">{plan.name}</h3>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{plan.summary}</p>

            <p className="mt-5 flex items-baseline gap-1.5">
              <span className="font-mono text-3xl tracking-tight">{plan.price}</span>
              <span className="text-xs text-[var(--color-ink-subtle)]">{plan.cadence}</span>
            </p>

            <ul className="mt-5 flex-1 space-y-2.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2 text-xs text-[var(--color-ink-muted)]">
                  <Check className="mt-px h-3.5 w-3.5 shrink-0 text-[var(--color-positive)]" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>

            <Link href="/register" className="mt-6">
              <Button variant={plan.highlighted ? "primary" : "secondary"} className="w-full">
                {plan.cta}
              </Button>
            </Link>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-6 max-w-xl text-center text-xs leading-relaxed text-[var(--color-ink-subtle)]">
        These plans are illustrative. NexaFlow is a portfolio project — there is no billing
        integration, nothing is charged, and every account runs with the same limits.
      </p>
    </div>
  );
}
