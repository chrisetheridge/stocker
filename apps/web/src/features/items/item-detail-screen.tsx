"use client";

import { useEffect, useRef } from "react";

import type { ItemDetailViewRecord } from "@stocker/core";

import { EmptyState } from "~/components/empty-state";
import { ErrorState } from "~/components/error-state";
import { LoadingState } from "~/components/loading-state";
import { Badge, Card, CardBody, CardHeader } from "~/components/ui";
import { api } from "~/trpc/react";
import { formatTimestamp } from "~/lib/format";

import { CompanyCard } from "./company-card";
import { EnrichmentActions } from "./enrichment-actions";
import { ExternalLinkButton } from "./external-link-button";

export function ItemDetailView({
  detail,
  onToggleSaved,
  onRetryEnrichment,
  onRefreshStock,
  onApplyCorrection,
}: {
  detail: ItemDetailViewRecord;
  onToggleSaved: () => void;
  onRetryEnrichment: () => void;
  onRefreshStock: () => void;
  onApplyCorrection: (input: {
    companyName: string;
    ticker: string;
    exchange?: string;
    notes?: string;
  }) => Promise<void> | void;
}) {
  const snapshotByTicker = new Map(
    detail.snapshots.map((snapshot) => [snapshot.ticker, snapshot]),
  );
  const enrichmentState =
    detail.item.enrichmentState === "failed"
      ? "failed"
      : detail.item.enrichmentState === "pending"
        ? "pending"
        : "complete";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="muted">
              {detail.source?.name ?? detail.item.sourceId}
            </Badge>
            <Badge tone="muted">{detail.item.readState}</Badge>
            <Badge
              tone={
                enrichmentState === "failed"
                  ? "danger"
                  : enrichmentState === "complete"
                    ? "success"
                    : "info"
              }
            >
              {enrichmentState.replaceAll("_", " ")}
            </Badge>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
                {detail.item.title}
              </h1>
              <p className="text-sm text-slate-400">
                {formatTimestamp(
                  detail.item.publishedAt ?? detail.item.fetchedAt,
                )}
              </p>
            </div>
            <ExternalLinkButton href={detail.item.canonicalUrl}>
              Open original
            </ExternalLinkButton>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="max-w-4xl text-sm leading-7 text-slate-300">
            {detail.item.summary ??
              detail.enrichment?.summary ??
              "No summary available."}
          </p>
          <EnrichmentActions
            saved={detail.item.savedForResearch}
            onToggleSaved={onToggleSaved}
            onRetry={onRetryEnrichment}
            onRefreshStock={onRefreshStock}
            retryDisabled={detail.item.enrichmentState === "pending"}
          />
          {detail.enrichment?.errorMessage ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
              {detail.enrichment.errorMessage}
            </div>
          ) : null}
          {detail.item.sourceMetadata &&
          Object.keys(detail.item.sourceMetadata).length > 0 ? (
            <details className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-200">
                Source metadata
              </summary>
              <pre className="mt-3 overflow-auto text-xs leading-6 text-slate-400">
                {JSON.stringify(detail.item.sourceMetadata, null, 2)}
              </pre>
            </details>
          ) : null}
        </CardBody>
      </Card>

      {detail.companies.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-50">
            Detected companies
          </h2>
          <div className="space-y-4">
            {detail.companies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                snapshot={
                  company.ticker ? snapshotByTicker.get(company.ticker) : null
                }
                onApplyCorrection={onApplyCorrection}
              />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          title="No companies detected"
          description="The LLM did not produce any candidate companies for this item yet."
        />
      )}
    </div>
  );
}

export function ItemDetailScreen({ itemId }: { itemId: string }) {
  const detailQuery = api.items.detail.useQuery({ itemId });
  const utils = api.useUtils();
  const retryMutation = api.items.retryEnrichment.useMutation({
    onSuccess: async () => {
      await utils.items.detail.invalidate({ itemId });
    },
  });
  const refreshMutation = api.items.refreshStockData.useMutation({
    onSuccess: async () => {
      await utils.items.detail.invalidate({ itemId });
    },
  });
  const saveMutation = api.items.saveForResearch.useMutation({
    onSuccess: async () => {
      await utils.items.detail.invalidate({ itemId });
      await utils.inbox.list.invalidate();
    },
  });
  const correctionMutation = api.corrections.applyCorrection.useMutation({
    onSuccess: async () => {
      await utils.items.detail.invalidate({ itemId });
      await utils.inbox.list.invalidate();
    },
  });
  const autoRefreshRequested = useRef<string | null>(null);
  const detail = detailQuery.data;

  useEffect(() => {
    if (!detail) {
      return;
    }

    const hasTickers = detail.companies.some((company) => company.ticker);
    if (!hasTickers || autoRefreshRequested.current === itemId) {
      return;
    }

    autoRefreshRequested.current = itemId;
    refreshMutation.mutate({ itemId });
  }, [detail, itemId, refreshMutation]);

  if (detailQuery.isLoading) {
    return <LoadingState label="Loading item detail." />;
  }

  if (detailQuery.error) {
    return (
      <ErrorState
        title="Unable to load item"
        description={detailQuery.error.message}
        actionLabel="Retry"
        onAction={() => void detailQuery.refetch()}
      />
    );
  }

  if (!detail) {
    return (
      <EmptyState
        title="Item not found"
        description="The selected item no longer exists or the link is stale."
      />
    );
  }

  return (
    <ItemDetailView
      detail={detail}
      onToggleSaved={() =>
        saveMutation.mutate({
          itemId,
          saved: !detail.item.savedForResearch,
        })
      }
      onRetryEnrichment={() => retryMutation.mutate({ itemId })}
      onRefreshStock={() => refreshMutation.mutate({ itemId })}
      onApplyCorrection={async (input) => {
        await correctionMutation.mutateAsync(input);
      }}
    />
  );
}
