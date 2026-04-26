"use client";

import { EmptyState } from "~/components/empty-state";
import { ErrorState } from "~/components/error-state";
import { LoadingState } from "~/components/loading-state";
import { Button, Card, CardBody, CardHeader } from "~/components/ui";
import { api } from "~/trpc/react";

import { SourceStatusCard } from "./source-status-card";

export function SourceStatusScreen() {
  const sourcesQuery = api.sources.status.useQuery();
  const utils = api.useUtils();
  const refreshMutation = api.sources.refresh.useMutation({
    onSuccess: async () => {
      await utils.sources.status.invalidate();
    },
  });
  const retryEnrichmentMutation = api.sources.retryEnrichment.useMutation({
    onSuccess: async () => {
      await utils.sources.status.invalidate();
    },
  });
  const refreshAllMutation = api.sources.refreshAll.useMutation({
    onSuccess: async () => {
      await utils.sources.status.invalidate();
    },
  });

  if (sourcesQuery.isLoading) {
    return <LoadingState label="Loading source health." />;
  }

  if (sourcesQuery.error) {
    return (
      <ErrorState
        title="Unable to load source status"
        description={sourcesQuery.error.message}
        actionLabel="Retry"
        onAction={() => void sourcesQuery.refetch()}
      />
    );
  }

  if (!sourcesQuery.data || sourcesQuery.data.length === 0) {
    return (
      <EmptyState
        title="No configured sources"
        description="Add RSS or Reddit sources to the local config and refresh the app."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200">
            Sources
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
            Source health and refresh controls
          </h1>
        </CardHeader>
        <CardBody>
          <Button
            type="button"
            onClick={() => refreshAllMutation.mutate()}
            disabled={refreshAllMutation.isPending}
          >
            Refresh all enabled sources
          </Button>
        </CardBody>
      </Card>

      <div className="space-y-4">
        {sourcesQuery.data.map((source) => (
          <SourceStatusCard
            key={source.id}
            source={source}
            onRefresh={() => refreshMutation.mutate({ sourceId: source.id })}
            onRetryEnrichment={() =>
              retryEnrichmentMutation.mutate({ sourceId: source.id })
            }
            refreshDisabled={
              refreshMutation.isPending &&
              refreshMutation.variables?.sourceId === source.id
            }
            retryEnrichmentDisabled={
              retryEnrichmentMutation.isPending &&
              retryEnrichmentMutation.variables?.sourceId === source.id
            }
          />
        ))}
      </div>
    </div>
  );
}
