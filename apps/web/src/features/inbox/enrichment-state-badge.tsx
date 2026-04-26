import { Badge } from "~/components/ui";

const stateLabels = {
  pending: { label: "Pending", tone: "info" as const },
  complete: { label: "Complete", tone: "success" as const },
  needs_review: { label: "Needs review", tone: "warning" as const },
  failed: { label: "Failed", tone: "danger" as const },
};

export function EnrichmentStateBadge({
  state,
}: {
  state: keyof typeof stateLabels;
}) {
  const meta = stateLabels[state];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
