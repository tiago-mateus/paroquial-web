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
        "rounded-2xl bg-surface px-5 py-6 text-center",
        compact ? "py-4" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icon ? (
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-canvas text-muted">
          {icon}
        </span>
      ) : null}
      <strong className={icon ? "mt-3 block text-sm font-bold text-ink" : "block text-sm font-bold text-ink"}>
        {title}
      </strong>
      {description ? <p className="mx-auto mt-1 max-w-[26rem] text-sm leading-relaxed text-muted">{description}</p> : null}
      {action ? <div className="mt-3 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ title = "Carregando...", description }: Partial<PageStateProps>) {
  return <div role="status"><PageState title={title} description={description} compact /></div>;
}

export function ErrorState({
  title = "Nao foi possivel carregar",
  description = "Tente novamente mais tarde.",
  action,
}: Partial<PageStateProps>) {
  return <div role="alert"><PageState title={title} description={description} action={action} compact /></div>;
}

export function EmptyState(props: PageStateProps) {
  return <PageState {...props} />;
}
