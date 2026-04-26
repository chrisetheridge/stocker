import Link from "next/link";

import type { InboxItemRecord } from "@stocker/core";

import { Badge, Card, CardBody, CardHeader } from "~/components/ui";
import { formatTimestamp } from "~/lib/format";

import { EnrichmentStateBadge } from "./enrichment-state-badge";
import { SavedResearchToggle } from "./saved-research-toggle";
import { StockChip } from "./stock-chip";

function isNeedsReview(item: InboxItemRecord): boolean {
  return (
    item.item.enrichmentState === "needs_review" ||
    item.companies.some((company) => company.matchStatus === "needs_review")
  );
}

function toEnrichmentState(value: string) {
  if (
    value === "pending" ||
    value === "complete" ||
    value === "needs_review" ||
    value === "failed"
  ) {
    return value;
  }

  return "pending";
}

export function InboxItemCard({
  item,
  onToggleSaved,
}: {
  item: InboxItemRecord;
  onToggleSaved: () => void;
}) {
  const sourceName = item.source?.name ?? item.item.sourceId;
  const summary = item.item.summary ?? item.enrichment?.summary ?? "No summary available";

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <EnrichmentStateBadge state={toEnrichmentState(item.item.enrichmentState)} />
            {item.item.savedForResearch ? <Badge tone="info">Saved</Badge> : null}
            {isNeedsReview(item) ? <Badge tone="warning">Needs review</Badge> : null}
            <Badge tone="muted">{sourceName}</Badge>
          </div>
          <Link
            href={`/items/${item.item.id}`}
            className="text-lg font-semibold leading-tight text-slate-50 transition-colors hover:text-amber-200"
          >
            {item.item.title}
          </Link>
          <p className="text-sm text-slate-400">
            {formatTimestamp(item.item.publishedAt ?? item.item.fetchedAt)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <SavedResearchToggle
            saved={item.item.savedForResearch}
            onToggle={onToggleSaved}
          />
          <a
            href={item.item.canonicalUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-white/8 px-3 py-2 text-sm font-medium text-slate-100 ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/12"
          >
            Open original
          </a>
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        <p className="max-w-4xl text-sm leading-7 text-slate-300">{summary}</p>

        {item.companies.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {item.companies.map((company) => {
              const snapshot = item.snapshots.find(
                (entry) => entry.ticker === company.ticker,
              );
              return company.matchStatus === "validated" && company.ticker ? (
                <StockChip
                  key={company.id}
                  snapshot={snapshot}
                  companyName={company.companyName}
                />
              ) : (
                <Badge key={company.id} tone="warning">
                  {company.companyName} needs review
                </Badge>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No companies detected yet.</p>
        )}
      </CardBody>
    </Card>
  );
}
