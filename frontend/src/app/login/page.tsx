import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/site/auth-form";
import { Spinner } from "@/components/ui/feedback";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your NexaFlow dashboard.",
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <main id="main">
      <Suspense fallback={<Spinner label="Loading" />}>
        <AuthForm mode="login" />
      </Suspense>
    </main>
  );
}
