export const toISODate = (d: Date) => d.toISOString().slice(0, 10);

export const today = () => toISODate(new Date());

export function lastWeekdays(count: number, from = new Date()): string[] {
  const out: string[] = [];
  const d = new Date(from);
  while (out.length < count) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) out.push(toISODate(d));
    d.setDate(d.getDate() - 1);
  }
  return out.reverse();
}

export function addDays(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
}

export function prettyDate(iso: string) {
  const d = new Date(iso.length > 10 ? iso : iso + "T00:00:00Z");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function prettyDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function shortDate(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}
