export function formatDate(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Today's date in India (IST) as YYYY-MM-DD. */
export function istToday() {
  return new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
}

/** "9876543210" → "98765 43210" */
export function formatPhone(p: string) {
  return /^\d{10}$/.test(p) ? `${p.slice(0, 5)} ${p.slice(5)}` : p;
}
