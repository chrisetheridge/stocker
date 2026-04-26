"use client";

import { useState } from "react";

import { Button, Input, Textarea } from "~/components/ui";

export function CorrectionDialog({
  companyName,
  initialTicker,
  onApply,
}: {
  companyName: string;
  initialTicker?: string | null;
  onApply: (input: {
    companyName: string;
    ticker: string;
    exchange?: string;
    notes?: string;
  }) => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [ticker, setTicker] = useState(initialTicker ?? "");
  const [exchange, setExchange] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen((value) => !value)}
      >
        Correct match
      </Button>

      {open ? (
        <form
          className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4"
          onSubmit={async (event) => {
            event.preventDefault();
            await onApply({
              companyName,
              ticker,
              exchange: exchange || undefined,
              notes: notes || undefined,
            });
            setOpen(false);
          }}
        >
          <div className="space-y-1">
            <p className="text-xs tracking-[0.2em] text-slate-400 uppercase">
              Company
            </p>
            <p className="text-sm font-medium text-slate-100">{companyName}</p>
          </div>
          <Input
            value={ticker}
            onChange={(event) => setTicker(event.target.value)}
            placeholder="Ticker"
          />
          <Input
            value={exchange}
            onChange={(event) => setExchange(event.target.value)}
            placeholder="Exchange"
          />
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Notes"
          />
          <div className="flex items-center gap-2">
            <Button type="submit">Apply correction</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
