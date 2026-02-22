// ---------------------------------------------------------------------------
// Shared utility functions for Analytics sub-components
// ---------------------------------------------------------------------------

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;

  return n.toLocaleString();
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);

    return `${date.getMonth() + 1}/${date.getDate()}`;
  } catch {
    return dateStr;
  }
}

export function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;

  return `${hour - 12} PM`;
}
