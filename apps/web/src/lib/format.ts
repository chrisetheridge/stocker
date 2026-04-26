export function formatTimestamp(value: string | null | undefined): string {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

export function formatCurrency(
  value: number | null | undefined,
  currency = "USD",
): string {
  if (typeof value !== "number") {
    return "n/a";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatSignedNumber(
  value: number | null | undefined,
  digits = 2,
): string {
  if (typeof value !== "number") {
    return "n/a";
  }

  const formatted = value.toFixed(digits);
  return value > 0 ? `+${formatted}` : formatted;
}
