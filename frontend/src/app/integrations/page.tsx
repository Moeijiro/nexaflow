import type { Metadata } from "next";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { IntegrationGrid } from "@/components/site/integration-grid";
import { Cta } from "@/components/site/cta";
import { Section, SectionHeading } from "@/components/site/section";
import { CodeBlock } from "@/components/ui/code-block";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Integrations",
  description:
    "Discord, Telegram and generic HTTP actions — each an adapter with its own validated configuration. Planned integrations are labelled as planned.",
};

const ADAPTER_SNIPPET = `class DiscordAction(Action):
    type = "discord"
    label = "Discord"
    config_model = DiscordConfig
    secret_fields = ("webhook_url",)

    async def run(self, config, context) -> ActionOutcome:
        rendered = render(config.message_template, context.payload)
        url = validate_target(config.webhook_url, require_https=True)
        ...`;

export default function IntegrationsPage() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Section className="border-t-0 pt-14">
          <SectionHeading
            eyebrow="Integrations"
            title="Three that work, three that are honest about not existing yet"
            description="Every available integration is backed by an adapter in the codebase with a validated configuration and its own secret handling. Nothing on this page claims to work when it does not."
          />
          <div className="mt-12">
            <IntegrationGrid />
          </div>
        </Section>

        <Section>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Adding an integration"
                description="One module, one registry entry. The config form, the catalogue endpoint and the secret handling all follow from the adapter."
              />
              <CardBody>
                <CodeBlock value={ADAPTER_SNIPPET} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader
                title="How credentials are handled"
                description="The same rules apply to every adapter."
              />
              <CardBody className="space-y-3 text-xs leading-relaxed text-[var(--color-ink-muted)]">
                <p>
                  <span className="text-[var(--color-ink)]">Encrypted at rest.</span> Fields an
                  adapter marks as secret are encrypted with a key derived from the server secret
                  before they are written to the database.
                </p>
                <p>
                  <span className="text-[var(--color-ink)]">Never returned.</span> The API answers
                  with a redaction marker. There is no endpoint that decrypts a credential back to
                  its owner, so a compromised session cannot exfiltrate them.
                </p>
                <p>
                  <span className="text-[var(--color-ink)]">Never logged.</span> A Telegram bot
                  token is part of the request URL, so the adapter reports the chat it posted to,
                  never the URL it used.
                </p>
                <p>
                  <span className="text-[var(--color-ink)]">Outbound calls are checked.</span>
                  {" "}
                  Destinations are resolved before the request; private, loopback and link-local
                  addresses are refused, and redirects are not followed.
                </p>
              </CardBody>
            </Card>
          </div>
        </Section>

        <Section className="border-t-0">
          <Cta />
        </Section>
      </main>
      <Footer />
    </>
  );
}
