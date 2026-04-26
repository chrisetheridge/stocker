import { Badge } from "~/components/ui";
import { formatCurrency, formatSignedNumber } from "~/lib/format";

import type { InboxItemRecord } from "@stocker/core";

export function StockChip({
  snapshot,
  companyName,
}: {
  snapshot: InboxItemRecord["snapshots"][number] | null | undefined;
  companyName: string;
}) {
  if (!snapshot) {
    return (
      <Badge tone="muted" className="max-w-full truncate">
        {companyName}
      </Badge>
    );
  }

  const price = formatCurrency(snapshot.price, snapshot.currency ?? "USD");
  const change = formatSignedNumber(snapshot.dailyChange);
  const percent = formatSignedNumber(snapshot.dailyChangePercent);

  return (
    <Badge tone="success" className="max-w-full truncate">
      <span className="mr-1 font-semibold">{snapshot.ticker}</span>
      <span className="opacity-80">
        {price} {change} ({percent}%)
      </span>
    </Badge>
  );
}
