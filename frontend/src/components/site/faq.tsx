const QUESTIONS = [
  {
    question: "What can a workflow actually do today?",
    answer:
      "It receives a JSON payload on its own webhook URL, optionally reshapes it with a template, and calls one action: a Discord webhook, a Telegram chat, or any HTTP API. Every run is recorded with its payload, result and timing.",
  },
  {
    question: "How are integration credentials stored?",
    answer:
      "Encrypted at rest with a key derived from the server's secret, and never returned by the API — the dashboard shows a redaction marker, not the value. Nothing sensitive reaches the browser.",
  },
  {
    question: "What happens when the destination is down?",
    answer:
      "The execution is retried up to three times with exponential backoff, but only for failures where a retry could help — a timeout, a 429 or a 5xx. A 400 is recorded once and left alone.",
  },
  {
    question: "Can I call the API from my own scripts?",
    answer:
      "Yes. Create an API key in the dashboard and send it as X-API-Key. Keys are stored as a SHA-256 digest and shown exactly once, when they are created.",
  },
  {
    question: "Is this a real product?",
    answer:
      "No. NexaFlow is a portfolio project built to demonstrate full-stack engineering: a FastAPI backend, a Next.js front end, and a workflow engine that genuinely runs. The pricing page is illustrative and there is no billing.",
  },
];

export function Faq() {
  return (
    <div className="mx-auto max-w-3xl divide-y divide-[var(--color-border)]">
      {QUESTIONS.map((item) => (
        <details key={item.question} className="group py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium">
            {item.question}
            <span
              className="text-[var(--color-ink-subtle)] transition-transform group-open:rotate-45"
              aria-hidden
            >
              +
            </span>
          </summary>
          <p className="mt-2.5 text-sm leading-relaxed text-[var(--color-ink-muted)]">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
