import { Badge, Button } from "~/components/ui";

import { SavedResearchToggle } from "../inbox/saved-research-toggle";

export function EnrichmentActions({
  saved,
  onToggleSaved,
  onRetry,
  onRefreshStock,
  retryDisabled,
  refreshDisabled,
}: {
  saved: boolean;
  onToggleSaved: () => void;
  onRetry: () => void;
  onRefreshStock: () => void;
  retryDisabled?: boolean;
  refreshDisabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SavedResearchToggle saved={saved} onToggle={onToggleSaved} />
      <Button type="button" variant="secondary" onClick={onRetry} disabled={retryDisabled}>
        Retry enrichment
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={onRefreshStock}
        disabled={refreshDisabled}
      >
        Refresh stock data
      </Button>
      {saved ? <Badge tone="info">Saved for research</Badge> : null}
    </div>
  );
}
