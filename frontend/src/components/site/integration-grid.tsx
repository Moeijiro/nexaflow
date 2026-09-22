import { Globe, MessageCircle, Send, Table2, Mail, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/site/section";

/** Mirrors the backend's /api/integrations catalogue. "Planned" entries are
 *  labelled as such — nothing here claims to work when it does not. */
const AVAILABLE = [
  {
    type: "discord",
    icon: MessageCircle,
    label: "Discord",
    description: "Post a rendered message to a channel webhook.",
  },
  {
    type: "telegram",
    icon: Send,
    label: "Telegram",
    description: "Send a message to a chat through the Bot API.",
  },
  {
    type: "http",
    icon: Globe,
    label: "HTTP request",
    description: "Call any API with a templated body and headers.",
  },
];

const PLANNED = [
  { type: "slack", icon: Hash, label: "Slack", description: "Post to a Slack channel." },
  { type: "email", icon: Mail, label: "Email", description: "Send a templated email." },
  { type: "sheets", icon: Table2, label: "Google Sheets", description: "Append a row to a sheet." },
];

export function IntegrationGrid({ showPlanned = true }: { showPlanned?: boolean }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {AVAILABLE.map((item, index) => (
          <Reveal key={item.type} delay={index * 0.05}>
            <Card interactive className="h-full p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-canvas)]">
                  <item.icon className="h-4 w-4 text-[var(--color-accent)]" aria-hidden />
                </span>
                <Badge tone="positive">Available</Badge>
              </div>
              <h3 className="mt-4 text-sm font-medium">{item.label}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-ink-muted)]">
                {item.description}
              </p>
            </Card>
          </Reveal>
        ))}
      </div>

      {showPlanned ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {PLANNED.map((item) => (
            <Card key={item.type} className="h-full p-5 opacity-60">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]">
                  <item.icon className="h-4 w-4 text-[var(--color-ink-subtle)]" aria-hidden />
                </span>
                <Badge tone="neutral">Not built yet</Badge>
              </div>
              <h3 className="mt-4 text-sm font-medium">{item.label}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-ink-muted)]">
                {item.description}
              </p>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
