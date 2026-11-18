import type { LucideIcon } from "lucide-react";
import type { ComponentPropsWithRef } from "react";
import { classNames } from "../lib/classNames";

type Props = Omit<ComponentPropsWithRef<"button">, "children" | "aria-label"> & {
  label: string;
  icon: LucideIcon;
  iconSize?: number;
  tone?: "muted" | "primary";
};

export function IconButton({ label, icon: Icon, iconSize = 18, tone = "muted", className, type = "button", ...props }: Props) {
  return <button {...props} type={type} aria-label={label} className={classNames(
    "grid h-11 w-11 shrink-0 place-items-center rounded-lg hover:bg-selection focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed",
    tone === "primary" ? "text-primary" : "text-muted",
    className,
  )}><Icon size={iconSize} aria-hidden="true" /></button>;
}
