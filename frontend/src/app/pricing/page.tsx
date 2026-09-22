import type { Metadata } from "next";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { PricingTable } from "@/components/site/pricing-table";
import { Faq } from "@/components/site/faq";
import { Section, SectionHeading } from "@/components/site/section";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Illustrative plans for NexaFlow. This is a portfolio project: there is no billing integration and nothing is charged.",
};

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Section className="border-t-0 pt-14">
          <SectionHeading
            eyebrow="Pricing"
            title="What this would cost, if it were a product"
            description="NexaFlow is a portfolio project. The plans below show how it would be packaged — there is no payment provider wired in, nothing is charged, and every account runs with the same limits."
          />
          <div className="mt-12">
            <PricingTable />
          </div>
        </Section>

        <Section>
          <SectionHeading eyebrow="FAQ" title="Before you ask" />
          <div className="mt-8">
            <Faq />
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
