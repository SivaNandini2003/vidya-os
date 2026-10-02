import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "destructive" | "info" | "muted";

const tones: Record<Tone, string> = {
  success: "bg-success/12 text-success border-success/25",
  warning: "bg-warning/18 text-warning border-warning/30",
  destructive: "bg-destructive/10 text-destructive border-destructive/25",
  info: "bg-info/12 text-info border-info/25",
  muted: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ tone = "muted", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function attendanceTone(status: string | null) {
  if (status === "present") return "success" as const;
  if (status === "absent") return "destructive" as const;
  if (status === "late") return "warning" as const;
  return "muted" as const;
}

export function feeTone(status: string) {
  if (status === "paid") return "success" as const;
  if (status === "overdue") return "destructive" as const;
  return "warning" as const;
}
