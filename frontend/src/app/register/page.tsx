import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/site/auth-form";
import { Spinner } from "@/components/ui/feedback";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a NexaFlow account and build your first workflow.",
  robots: { index: false, follow: true },
};

export default function RegisterPage() {
  return (
    <main id="main">
      <Suspense fallback={<Spinner label="Loading" />}>
        <AuthForm mode="register" />
      </Suspense>
    </main>
  );
}
