import { Badge, Card, CardBody, CardHeader } from "~/components/ui";

import type { ItemDetailViewRecord } from "@stocker/core";

import { CorrectionDialog } from "./correction-dialog";
import { StockSnapshotCard } from "./stock-snapshot-card";

export function CompanyCard({
  company,
  snapshot,
  onApplyCorrection,
}: {
  company: ItemDetailViewRecord["companies"][number];
  snapshot: ItemDetailViewRecord["snapshots"][number] | null | undefined;
  onApplyCorrection: (input: {
    companyName: string;
    ticker: string;
    exchange?: string;
    notes?: string;
  }) => Promise<void> | void;
}) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={company.matchStatus === "validated" ? "success" : "warning"}>
            {company.matchStatus === "validated" ? "Validated" : "Needs review"}
          </Badge>
          <Badge tone="muted">{company.relationshipType}</Badge>
          <Badge tone="muted">Confidence {Math.round(company.confidence * 100)}%</Badge>
        </div>
        <h3 className="text-base font-semibold text-slate-50">{company.companyName}</h3>
      </CardHeader>
      <CardBody className="space-y-4">
        <p className="text-sm leading-6 text-slate-300">
          {company.relevanceExplanation}
        </p>
        {company.evidenceText ? (
          <p className="rounded-xl border border-dashed border-white/10 bg-black/15 p-3 text-sm text-slate-400">
            {company.evidenceText}
          </p>
        ) : null}
        {snapshot ? <StockSnapshotCard snapshot={snapshot} /> : null}
        <CorrectionDialog
          companyName={company.companyName}
          initialTicker={company.ticker}
          onApply={onApplyCorrection}
        />
      </CardBody>
    </Card>
  );
}
