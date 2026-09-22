"use client";

import { PageHeader } from "@/components/dashboard/shell";
import { WorkflowBuilder } from "@/components/dashboard/workflow-builder";

export default function NewWorkflowPage() {
  return (
    <>
      <PageHeader
        title="New workflow"
        description="Five steps: trigger, transform, action, review, activate."
        back={{ href: "/dashboard/workflows", label: "Workflows" }}
      />
      <WorkflowBuilder />
    </>
  );
}
