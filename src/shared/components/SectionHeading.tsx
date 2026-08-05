import type { ReactNode } from "react";

type SectionHeadingProps = {
  title: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function SectionHeading({ title, meta, action, className }: SectionHeadingProps) {
  return (
    <div className={`flex items-center justify-between gap-3 pt-1 ${className ?? ""}`}>
      <span className="text-base font-extrabold text-gray-900">
        {title}
        {meta ? (
          <>
            <em className="mx-1 font-normal not-italic text-slate-300">|</em>
            <small className="text-base font-medium text-slate-500">{meta}</small>
          </>
        ) : null}
      </span>
      {action ? <div className="flex-none [&_a]:rounded-full [&_a]:bg-slate-100 [&_a]:px-3 [&_a]:py-1.5 [&_a]:text-[0.72rem] [&_a]:font-extrabold [&_a]:text-slate-700">{action}</div> : null}
    </div>
  );
}
