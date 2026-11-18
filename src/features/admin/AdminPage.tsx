import { useId, type ReactNode } from "react";
import { classNames } from "../../shared/lib/classNames";

type AdminPageProps = {
  header?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function AdminPage({ header, children, className }: AdminPageProps) {
  return (
    <section
      data-testid="admin-page"
      className={classNames("min-h-[calc(100dvh-var(--admin-nav-offset)-var(--admin-header-offset))] min-w-0 bg-canvas text-ink", className)}
    >
      {header}
      {children}
    </section>
  );
}

/**
 * Larguras de conteúdo (sempre alinhadas à esquerda, na mesma borda do cabeçalho):
 * - `standard`: formulários diretos limitados a 48 rem (coluna de leitura); o resto ocupa a área toda.
 * - `narrow`: todo o conteúdo em coluna de leitura de 48 rem (páginas de texto e conta, sem formulário direto).
 * - `wide`: área toda, para listagens, calendário e painéis.
 */
type AdminPageContentProps = {
  children: ReactNode;
  width?: "standard" | "narrow" | "wide";
  className?: string;
};

const contentWidthClass = {
  standard: "[&>form]:w-full [&>form]:max-w-3xl",
  narrow: "[&>*]:w-full [&>*]:max-w-3xl",
  wide: "",
} as const;

export function AdminPageContent({ children, width = "standard", className }: AdminPageContentProps) {
  return (
    <div
      data-testid="admin-page-content"
      data-width={width}
      className={classNames(
        "mx-auto grid max-w-316 min-w-0 gap-5 px-4 py-4 md:gap-6 md:px-6 md:py-6 xl:px-8",
        contentWidthClass[width],
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Quando usar:
 * - `card` (padrão): agrupa informação ou um formulário que precisa se destacar do fundo da página.
 * - `flush`: só semântica e espaçamento, sem borda nem fundo. Use quando o conteúdo já traz as próprias
 *   superfícies (cartões, listas, mapas), para não criar cartão dentro de cartão.
 */
type AdminSurfaceProps = {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
  variant?: "card" | "flush";
};

export function AdminSurface({ children, className, labelledBy, variant = "card" }: AdminSurfaceProps) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={classNames("min-w-0", variant === "card" ? "rounded-2xl border border-line bg-surface p-4 sm:p-6" : "", className)}
    >
      {children}
    </section>
  );
}

type AdminSurfaceHeaderProps = {
  title: string;
  description?: string;
  summary?: ReactNode;
  action?: ReactNode;
  id?: string;
  className?: string;
};

export function AdminSurfaceHeader({ title, description, summary, action, id, className }: AdminSurfaceHeaderProps) {
  const generatedId = useId();
  const titleId = id ?? `admin-surface-${generatedId}`;

  return (
    <div className={classNames("flex items-start justify-between gap-4 border-b border-line/60 pb-4", className)}>
      <div className="min-w-0 flex-1">
        <h2 id={titleId} className="m-0 font-display text-xl font-medium leading-7 text-ink">
          {title}
        </h2>
        {description ? <p className="m-0 mt-1 max-w-2xl text-sm leading-5 text-muted">{description}</p> : null}
        {summary ? <div className="mt-2 text-sm text-muted">{summary}</div> : null}
      </div>
      {action ? <div className="flex-none">{action}</div> : null}
    </div>
  );
}

type AdminFormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  id?: string;
  className?: string;
};

export function AdminFormSection({ title, description, children, id, className }: AdminFormSectionProps) {
  const generatedId = useId();
  const titleId = id ?? `admin-form-section-${generatedId}`;

  return (
    <section aria-labelledby={titleId} className={classNames("py-6 first:pt-0 md:py-8", className)}>
      <h2 id={titleId} className="m-0 font-display text-xl font-medium leading-7 text-ink">
        {title}
      </h2>
      {description ? <p className="m-0 mt-1 text-sm leading-5 text-muted">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
