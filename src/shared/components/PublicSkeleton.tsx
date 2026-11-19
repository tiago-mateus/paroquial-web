import type { ReactNode } from "react";
import { classNames } from "../lib/classNames";

export function SkeletonStatus({ label, children }: { label: string; children: ReactNode }) {
  return <>
    <span role="status" className="sr-only">{label}</span>
    <div aria-hidden="true">{children}</div>
  </>;
}

export function SkeletonShape({ className }: { className: string }) {
  return <span className={classNames(
    "block motion-safe:animate-pulse",
    "bg-neutral-300",
    className,
  )} />;
}
