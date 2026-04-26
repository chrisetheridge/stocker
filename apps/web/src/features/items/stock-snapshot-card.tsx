import { Badge, Card, CardBody } from "~/components/ui";
import { formatCurrency, formatSignedNumber, formatTimestamp } from "~/lib/format";

import type { ItemDetailViewRecord } from "@stocker/core";

function isStale(staleAfter: string, now = new Date().toISOString()): boolean {
  return new Date(staleAfter).getTime() <= new Date(now).getTime();
}

export function StockSnapshotCard({
  snapshot,
  now,
}: {
  snapshot: ItemDetailViewRecord["snapshots"][number];
  now?: string;
}) {
  const stale = isStale(snapshot.staleAfter, now);

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-50">{snapshot.ticker}</p>
            <p className="text-xs text-slate-400">{snapshot.companyName ?? "Market snapshot"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {stale ? <Badge tone="warning">Stale cache</Badge> : <Badge tone="success">Fresh</Badge>}
            <Badge tone="muted">{snapshot.provider}</Badge>
          </div>
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-xl bg-black/20 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Price</p>
            <p className="mt-1 font-medium text-slate-50">
              {formatCurrency(snapshot.price, snapshot.currency ?? "USD")}
            </p>
          </div>
          <div className="rounded-xl bg-black/20 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Daily change</p>
            <p className="mt-1 font-medium text-slate-50">
              {formatSignedNumber(snapshot.dailyChange)} ({formatSignedNumber(snapshot.dailyChangePercent)}%)
            </p>
          </div>
          <div className="rounded-xl bg-black/20 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Market cap</p>
            <p className="mt-1 font-medium text-slate-50">
              {snapshot.marketCap ? snapshot.marketCap.toLocaleString("en-US") : "n/a"}
            </p>
          </div>
          <div className="rounded-xl bg-black/20 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Sector</p>
            <p className="mt-1 font-medium text-slate-50">{snapshot.sector ?? "n/a"}</p>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Captured {formatTimestamp(snapshot.capturedAt)} · Stale after{" "}
          {formatTimestamp(snapshot.staleAfter)}
        </p>
      </CardBody>
    </Card>
  );
}
