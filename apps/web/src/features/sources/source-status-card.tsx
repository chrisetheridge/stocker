import { Badge, Button, Card, CardBody, CardHeader } from "~/components/ui";
import { formatTimestamp } from "~/lib/format";

import type { SourceRecord } from "@stocker/db";

export function SourceStatusCard({
  source,
  onRefresh,
  onRetryEnrichment,
  refreshDisabled,
  retryEnrichmentDisabled,
}: {
  source: SourceRecord;
  onRefresh: () => void;
  onRetryEnrichment: () => void;
  refreshDisabled?: boolean;
  retryEnrichmentDisabled?: boolean;
}) {
  const healthy = !source.lastErrorMessage;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={source.enabled ? "success" : "muted"}>
              {source.enabled ? "Enabled" : "Disabled"}
            </Badge>
            <Badge tone="muted">{source.type}</Badge>
            <Badge tone={healthy ? "success" : "danger"}>
              {healthy ? "Healthy" : "Error"}
            </Badge>
          </div>
          <h3 className="text-lg font-semibold text-slate-50">{source.name}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onRefresh}
            disabled={refreshDisabled}
          >
            Refresh source
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onRetryEnrichment}
            disabled={retryEnrichmentDisabled}
          >
            Retry all enrichment
          </Button>
        </div>
        <p className="text-xs text-slate-400">
          Retry queues item enrichment jobs in batches of 4.
        </p>
      </CardHeader>
      <CardBody className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Last fetched
          </p>
          <p>{formatTimestamp(source.lastFetchedAt)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Last success
          </p>
          <p>{formatTimestamp(source.lastSuccessAt)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Last error
          </p>
          <p>{formatTimestamp(source.lastErrorAt)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Last error message
          </p>
          <p className="text-slate-100">{source.lastErrorMessage ?? "None"}</p>
        </div>
      </CardBody>
    </Card>
  );
}
