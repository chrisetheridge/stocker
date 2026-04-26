import { Badge } from "~/components/ui";

const stateLabels = {
  pending: { label: "Pending", tone: "info" as const },
  complete: { label: "Complete", tone: "success" as const },
  failed: { label: "Failed", tone: "danger" as const },
};

function normalizeState(state: string): keyof typeof stateLabels {
  return state === "pending" || state === "failed" ? state : "complete";
}

export function EnrichmentStateBadge({
  state,
}: {
  state: string;
}) {
  const meta = stateLabels[normalizeState(state)];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
