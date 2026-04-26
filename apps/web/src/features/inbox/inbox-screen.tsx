"use client";

import { useMemo, useState } from "react";

import { type InboxListFilters } from "@stocker/core";

import { EmptyState } from "~/components/empty-state";
import { ErrorState } from "~/components/error-state";
import { LoadingState } from "~/components/loading-state";
import { Card, CardBody, CardHeader } from "~/components/ui";
import { api } from "~/trpc/react";

import { InboxFilters } from "./inbox-filters";
import { InboxItemCard } from "./inbox-item-card";

function hasActiveFilters(filters: InboxListFilters): boolean {
  return (
    [
      filters.sourceId,
      filters.ticker,
      filters.company,
      filters.readState,
      filters.enrichmentState,
      filters.query,
    ].some(Boolean) || typeof filters.savedForResearch === "boolean"
  );
}

export function InboxScreen() {
  const [filters, setFilters] = useState<InboxListFilters>({});
  const utils = api.useUtils();

  const inboxQuery = api.inbox.list.useQuery(filters);
  const saveMutation = api.items.saveForResearch.useMutation({
    onSuccess: async () => {
      await utils.inbox.list.invalidate(filters);
    },
  });

  const items = inboxQuery.data ?? [];
  const activeFilters = useMemo(() => hasActiveFilters(filters), [filters]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.3em] text-amber-200 uppercase">
            Inbox
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
            Combined intelligence inbox
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-400">
            Review source items, compare companies, and save the pieces worth
            revisiting for stock research.
          </p>
        </CardHeader>
        <CardBody>
          <InboxFilters
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters({})}
          />
        </CardBody>
      </Card>

      {inboxQuery.isLoading ? (
        <LoadingState label="Loading inbox items." />
      ) : inboxQuery.error ? (
        <ErrorState
          title="Unable to load inbox"
          description={inboxQuery.error.message}
          actionLabel="Retry"
          onAction={() => void inboxQuery.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title={
            activeFilters ? "No items match these filters" : "Inbox is empty"
          }
          description={
            activeFilters
              ? "Clear filters to see every configured source item."
              : "Add RSS or Reddit sources in the local config and refresh them to populate the inbox."
          }
          actionLabel={activeFilters ? "Clear filters" : undefined}
          onAction={activeFilters ? () => setFilters({}) : undefined}
          tone={activeFilters ? "warning" : "info"}
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <InboxItemCard
              key={item.item.id}
              item={item}
              onToggleSaved={() =>
                saveMutation.mutate({
                  itemId: item.item.id,
                  saved: !item.item.savedForResearch,
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
