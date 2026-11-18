import type { ReactNode } from "react";
import { classNames } from "../lib/classNames";

type SectionHeadingProps = {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function SectionHeading({ id, title, description, action, className }: SectionHeadingProps) {
  return <header className={classNames("flex justify-between gap-3", className)}>
    <div className="min-w-0">
      <h2 id={id} className="m-0 font-display text-[26px] font-medium leading-tight tracking-tight text-ink sm:text-[30px]">{title}</h2>
      {description ? <p className="mb-0 mt-2 text-sm text-muted">{description}</p> : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </header>;
}
