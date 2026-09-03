import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

/** Shared desktop heading for administrative screens. */
export function AdminPageHeader({ eyebrow = "Administração", title, description, actions }: AdminPageHeaderProps) {
  return (
    <header className="hidden border-b border-slate-200/80 bg-white md:block">
      <div className="mx-auto flex min-h-20 max-w-7xl flex-col items-start justify-between gap-4 px-6 py-2 lg:px-8 xl:flex-row xl:items-center xl:gap-5">
        <div className="min-w-0">
          <p className="m-0 text-[0.64rem] font-extrabold uppercase tracking-[0.15em] text-amber-700">{eyebrow}</p>
          <h1 className="mb-0 mt-0.5 text-xl font-bold tracking-[-0.02em] text-slate-950">{title}</h1>
          {description ? <p className="m-0 mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex w-full flex-none items-center justify-end gap-2 xl:w-auto">{actions}</div> : null}
      </div>
    </header>
  );
}
