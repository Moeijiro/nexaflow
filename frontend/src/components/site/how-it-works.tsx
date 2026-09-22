const STEPS = [
  {
    number: "01",
    title: "Create a workflow",
    body: "Pick a trigger, optionally reshape the payload, and choose the action. NexaFlow generates the webhook URL and a curl command you can paste straight into a terminal.",
  },
  {
    number: "02",
    title: "Point your service at it",
    body: "Any system that can send a webhook — a shop, a form, CI, a monitor — can trigger the workflow. Signed requests are supported when you want them.",
  },
  {
    number: "03",
    title: "Watch what happened",
    body: "Every run is recorded: the incoming payload, what the transform produced, what the destination answered, how long it took, and the error if it failed.",
  },
];

export function HowItWorks() {
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {STEPS.map((step) => (
        <div key={step.number} className="relative pl-12">
          <span className="absolute top-0 left-0 font-mono text-sm text-[var(--color-accent)]">
            {step.number}
          </span>
          <h3 className="text-sm font-medium">{step.title}</h3>
          <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink-muted)]">{step.body}</p>
        </div>
      ))}
    </div>
  );
}
