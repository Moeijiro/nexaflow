import type { Metadata } from "next";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { FeatureGrid } from "@/components/site/feature-grid";
import { WorkflowDiagram } from "@/components/site/workflow-diagram";
import { HowItWorks } from "@/components/site/how-it-works";
import { Cta } from "@/components/site/cta";
import { Reveal, Section, SectionHeading } from "@/components/site/section";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Webhooks, JSON transforms, three real actions, retries with backoff, and an execution log that records the payload at every stage.",
};

const GUARANTEES = [
  {
    title: "Retries that make sense",
    body: "A timeout, a 429 or a 5xx is retried up to three times with exponential backoff. A 400 is recorded once — repeating a request the destination already rejected helps nobody.",
  },
  {
    title: "Credentials stay server-side",
    body: "Discord webhook URLs, Telegram bot tokens and HTTP headers are encrypted at rest. The API returns a redaction marker; there is no endpoint that reads them back.",
  },
  {
    title: "Templates that cannot execute",
    body: "Transforms and messages substitute dotted paths and nothing else. A payload from the internet is data, never code.",
  },
  {
    title: "Honest failure",
    body: "When an automation fails, the execution records why: the attempt count, the status code, and the first line the destination answered.",
  },
];

export default function FeaturesPage() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Section className="border-t-0 pt-14">
          <SectionHeading
            eyebrow="Features"
            title="Small surface, serious engineering"
            description="NexaFlow does one thing: it turns an incoming webhook into an action somewhere else, and keeps a record of what happened. Everything below exists to make that dependable."
          />
          <Reveal className="mt-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-4 sm:p-6">
            <WorkflowDiagram />
          </Reveal>
        </Section>

        <Section>
          <SectionHeading eyebrow="Capabilities" title="What you get" align="left" />
          <div className="mt-10">
            <FeatureGrid />
          </div>
        </Section>

        <Section>
          <SectionHeading
            eyebrow="Design decisions"
            title="The parts that decide whether you can trust it"
            align="left"
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {GUARANTEES.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.05}>
                <Card className="h-full p-5">
                  <h3 className="text-sm font-medium">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink-muted)]">
                    {item.body}
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
        </Section>

        <Section>
          <SectionHeading eyebrow="How it works" title="Three steps, then it runs itself" />
          <div className="mt-10">
            <HowItWorks />
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
