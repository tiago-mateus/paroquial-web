import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";
import { classNames } from "../../shared/lib/classNames";

/** Persistent feedback for a problem or instruction that needs context. */
export function AdminNotice({ children, tone = "error", className }: { children: ReactNode; tone?: "error" | "success" | "info"; className?: string }) {
  const Icon = tone === "error" ? AlertCircle : tone === "success" ? CheckCircle2 : Info;
  return <div role={tone === "error" ? "alert" : "status"} className={classNames(
    "flex items-start gap-3 rounded-xl p-4 text-sm leading-6",
    tone === "error" ? "bg-danger/10 text-danger" : tone === "success" ? "bg-success/10 text-success" : "bg-selection text-primary",
    className,
  )}><Icon size={20} aria-hidden="true" className="mt-0.5 shrink-0" /><div className="min-w-0 flex-1">{children}</div></div>;
}
