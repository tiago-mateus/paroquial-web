import type { ReactNode } from "react";

/** Separators sit outside each row's interactive surface. */
export function EventList({ children, label, variant = "default" }: { children: ReactNode; label?: string; variant?: "default" | "home" }) {
  const separators = variant === "home"
    ? "[&>li+li]:before:mx-4 [&>li+li]:before:block [&>li+li]:before:border-t [&>li+li]:before:border-line sm:[&>li+li]:before:mx-5"
    : "[&>li+li]:before:mx-3 [&>li+li]:before:my-1 [&>li+li]:before:block [&>li+li]:before:border-t [&>li+li]:before:border-line/60 sm:[&>li+li]:before:mx-4";
  return (
    <ul aria-label={label} className={`m-0 list-none p-0 ${separators}`}>
      {children}
    </ul>
  );
}
