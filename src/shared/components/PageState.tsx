import type { ReactNode } from "react";

type PageStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
};

export function PageState({ title, description, icon, action, className, compact = false }: PageStateProps) {
  return (
    <div
      className={[
        "rounded-3xl border border-slate-100 bg-white px-4 py-5 text-center",
        compact ? "py-4" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icon ? (
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-500">
          {icon}
        </span>
      ) : null}
      <strong className={icon ? "mt-3 block text-sm font-bold text-slate-950" : "block text-sm font-bold text-slate-950"}>
        {title}
      </strong>
      {description ? <p className="mx-auto mt-1 max-w-[26rem] text-sm leading-relaxed text-slate-500">{description}</p> : null}
      {action ? <div className="mt-3 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ title = "Carregando...", description }: Partial<PageStateProps>) {
  return <PageState title={title} description={description} compact />;
}

export function ErrorState({
  title = "Nao foi possivel carregar",
  description = "Tente novamente mais tarde.",
  action,
}: Partial<PageStateProps>) {
  return <PageState title={title} description={description} action={action} compact />;
}

export function EmptyState(props: PageStateProps) {
  return <PageState {...props} />;
}
