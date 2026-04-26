"use client";

import { Button, Input, Select } from "~/components/ui";

import type { InboxListFilters } from "@stocker/core";

const EMPTY = "";

export type InboxFilterState = InboxListFilters;

export function InboxFilters({
  filters,
  onChange,
  onClear,
}: {
  filters: InboxFilterState;
  onChange: (next: InboxFilterState) => void;
  onClear: () => void;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <label className="space-y-2">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
          Source
        </span>
        <Input
          placeholder="source id"
          value={filters.sourceId ?? EMPTY}
          onChange={(event) =>
            onChange({
              ...filters,
              sourceId: event.target.value || undefined,
            })
          }
        />
      </label>

      <label className="space-y-2">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
          Company or ticker
        </span>
        <Input
          placeholder="ACME or Acme Corp"
          value={filters.company ?? filters.ticker ?? EMPTY}
          onChange={(event) =>
            onChange({
              ...filters,
              company: event.target.value || undefined,
              ticker: event.target.value || undefined,
            })
          }
        />
      </label>

      <label className="space-y-2">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
          Query
        </span>
        <Input
          placeholder="search title, summary, author"
          value={filters.query ?? EMPTY}
          onChange={(event) =>
            onChange({
              ...filters,
              query: event.target.value || undefined,
            })
          }
        />
      </label>

      <label className="space-y-2">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
          Read state
        </span>
        <Select
          value={filters.readState ?? EMPTY}
          onChange={(event) =>
            onChange({
              ...filters,
              readState: (event.target.value || undefined) as
                | InboxFilterState["readState"]
                | undefined,
            })
          }
        >
          <option value="">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </Select>
      </label>

      <label className="space-y-2">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
          Saved
        </span>
        <Select
          value={
            typeof filters.savedForResearch === "boolean"
              ? filters.savedForResearch
                ? "true"
                : "false"
              : ""
          }
          onChange={(event) =>
            onChange({
              ...filters,
              savedForResearch:
                event.target.value === ""
                  ? undefined
                  : event.target.value === "true",
            })
          }
        >
          <option value="">All</option>
          <option value="true">Saved</option>
          <option value="false">Not saved</option>
        </Select>
      </label>

      <label className="space-y-2">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
          Enrichment
        </span>
        <Select
          value={filters.enrichmentState ?? EMPTY}
          onChange={(event) =>
            onChange({
              ...filters,
              enrichmentState: (event.target.value || undefined) as
                | InboxFilterState["enrichmentState"]
                | undefined,
            })
          }
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="complete">Complete</option>
          <option value="failed">Failed</option>
        </Select>
      </label>

      <div className="flex items-end gap-2 lg:col-span-3">
        <Button type="button" variant="secondary" onClick={onClear}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}
