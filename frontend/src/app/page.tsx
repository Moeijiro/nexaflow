import Link from "next/link";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { Hero } from "@/components/site/hero";
import { FeatureGrid } from "@/components/site/feature-grid";
import { UseCases } from "@/components/site/use-cases";
import { ApiDemo } from "@/components/site/api-demo";
import { DashboardPreview } from "@/components/site/dashboard-preview";
import { HowItWorks } from "@/components/site/how-it-works";
import { IntegrationGrid } from "@/components/site/integration-grid";
import { PricingTable } from "@/components/site/pricing-table";
import { Faq } from "@/components/site/faq";
import { Cta } from "@/components/site/cta";
import { Reveal, Section, SectionHeading } from "@/components/site/section";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />

        <Section id="integrations">
          <SectionHeading
            eyebrow="Integrations"
            title="Three destinations that actually work"
            description="Discord, Telegram and any HTTP API. Each one is an adapter with its own validated configuration — adding the next is a single module."
          />
          <div className="mt-10">
            <IntegrationGrid showPlanned={false} />
          </div>
          <Reveal className="mt-6 text-center">
            <Link href="/integrations">
              <Button variant="ghost" size="sm">
                See what else is planned
              </Button>
            </Link>
          </Reveal>
        </Section>

        <Section id="features">
          <SectionHeading
            eyebrow="Features"
            title="Everything a small automation needs, nothing it does not"
            description="No drag-and-drop canvas, no 200 half-finished connectors. One trigger, one optional transform, one action — built properly."
          />
          <div className="mt-10">
            <FeatureGrid />
          </div>
        </Section>

        <Section id="use-cases">
          <SectionHeading
            eyebrow="Use cases"
            title="Three automations you could ship today"
            description="Each one is the same pipeline with different ends: a webhook in, a transform in the middle, an action out."
          />
          <div className="mt-10">
            <UseCases />
          </div>
        </Section>

        <Section id="api">
          <SectionHeading
            eyebrow="Developer API"
            title="A webhook call, start to finish"
            description="POST a payload, get an execution id back immediately, and let the workflow run in the background."
          />
          <div className="mt-10">
            <ApiDemo />
          </div>
        </Section>

        <Section id="dashboard">
          <SectionHeading
            eyebrow="Dashboard"
            title="See what ran, and what it answered"
            description="Executions are stored with the payload at every stage — so a failed automation is a question you can answer, not a mystery."
          />
          <Reveal className="mt-10">
            <DashboardPreview />
          </Reveal>
        </Section>

        <Section id="how-it-works">
          <SectionHeading eyebrow="How it works" title="Three steps, then it runs itself" />
          <div className="mt-10">
            <HowItWorks />
          </div>
        </Section>

        <Section id="pricing">
          <SectionHeading
            eyebrow="Pricing"
            title="Plans, illustratively"
            description="NexaFlow is a portfolio project: the plans below show how the product would be packaged, but nothing is charged and no billing code exists."
          />
          <div className="mt-10">
            <PricingTable />
          </div>
        </Section>

        <Section id="faq">
          <SectionHeading eyebrow="FAQ" title="Questions worth answering up front" />
          <div className="mt-8">
            <Faq />
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
