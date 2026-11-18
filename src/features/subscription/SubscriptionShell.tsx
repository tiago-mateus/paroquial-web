import { ArrowLeft, Check, Church, CircleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { demoMode } from "../../shared/launchMode";
import { DemoResetButton } from "./DemoResetButton";
import { buttonClasses, fieldClasses } from "../../shared/styles/controls";

// Mesma geometria dos formulários do painel (tamanho lg: 48 px, raio 12 px). Ver shared/styles/controls.ts.
export const fieldClass = fieldClasses.lg;
export const primaryClass = `${buttonClasses.primary.lg} disabled:cursor-wait disabled:opacity-60`;
export const bigButtonClass = `${primaryClass} w-full`;
export const secondaryClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-selection hover:text-primary-hover disabled:opacity-60 motion-reduce:transition-none";
/** Bordered secondary action, for choices that sit next to the main button. */
export const outlineClass = "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-primary/25 bg-surface px-4 py-2.5 text-[15px] font-semibold text-primary transition-colors hover:border-primary/50 hover:bg-selection/40 disabled:opacity-60 motion-reduce:transition-none";
/** Light tinted surface used by the signup cards (plan, highlights, notices). */
export const tintedCardClass = "rounded-2xl bg-selection/35";
export const surfaceCardClass = "rounded-2xl border border-line bg-surface";
export const iconTileClass = "grid shrink-0 place-items-center rounded-xl bg-selection/80 text-primary";

const signupSteps = ["Conta", "Paróquia", "Pagamento"];

/**
 * `step` = index of the current stage; a value past the last stage marks every stage as done.
 * `stepLabels` overrides individual labels so the active stage can name its sub-phase
 * (e.g. "Confirmar e-mail" while still inside the account stage) without adding a stepper column.
 */
function SignupStepper({ step, compact, stepLabels }: { step: number; compact: boolean; stepLabels?: (string | undefined)[] }) {
  return <ol aria-label="Etapas da contratação" className={`${compact ? "mb-2 sm:mb-6" : "mb-8"} mt-0 grid list-none grid-cols-3 p-0`}>
    {signupSteps.map((base, index) => {
      const label = stepLabels?.[index] ?? base;
      const done = index < step;
      const current = index === step;
      return <li key={base} aria-current={current ? "step" : undefined} className={`relative flex items-center gap-1.5 text-center ${compact ? "flex-row justify-center sm:flex-col" : "flex-col"}`}>
        {index > 0 ? <span aria-hidden="true" className={`absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 ${compact ? "hidden sm:block" : ""} ${index <= step ? "bg-primary" : "bg-line"}`} /> : null}
        <span aria-hidden="true" className={`relative z-10 grid shrink-0 place-items-center rounded-full text-sm font-bold tabular-nums ${compact ? "size-6 sm:size-8" : "size-8"} ${current || done ? "bg-primary text-white" : "bg-selection text-muted"}`}>{done ? <Check size={16} strokeWidth={3} /> : index + 1}</span>
        <span className={`text-[13px] leading-5 ${current ? "font-bold text-primary" : done ? "font-semibold text-ink" : "font-medium text-muted"}`}>{label}{done ? <span className="sr-only"> (concluída)</span> : current ? <span className="sr-only"> (etapa atual)</span> : null}</span>
      </li>;
    })}
  </ol>;
}

export function SubscriptionShell({ children, aside, step, stepLabels, compact = false, signedIn = false }: { children: ReactNode; aside?: ReactNode; step?: number; stepLabels?: (string | undefined)[]; compact?: boolean; signedIn?: boolean }) {
  const demo = demoMode;
  return <div className="landing-theme relative isolate min-h-dvh overflow-x-clip bg-canvas text-ink">
    {!compact ? <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-1/5 bg-linear-to-br from-landing-tint/50 via-landing-sky/15 to-accent/20 lg:block" /> : null}
    <header><div className={`mx-auto flex min-h-16 flex-wrap items-center justify-between gap-2 px-5 sm:px-8 ${compact ? "max-w-3xl sm:min-h-20" : "max-w-3xl"}`}>
      <Link to="/" className="inline-flex min-h-11 items-center gap-2 text-2xl font-extrabold tracking-tight text-ink" aria-label="Paroquial, página inicial"><Church size={28} strokeWidth={1.9} className="text-primary" aria-hidden="true" />paroquial.</Link>
      {/* Once the person has an account, offering "Entrar" again suggests they are signed out. */}
      {!signedIn ? <Link to="/login?continuar=assinatura" className={`${secondaryClass} text-base font-bold`}>{compact ? "Entrar" : "Já tenho uma conta"}</Link> : null}
    </div></header>
    {demo ? <details className="mx-auto max-w-3xl px-5 text-sm leading-6 text-muted sm:px-8"><summary className="min-h-11 w-fit cursor-pointer py-2.5">Demonstração · sem cobrança</summary><p className="mb-0 mt-0">Não há envio de e-mails nem cobranças reais. Use dados fictícios.</p><DemoResetButton /></details> : null}
    <main id="subscription-main" className={`mx-auto grid gap-6 px-5 pb-8 sm:px-8 sm:pb-16 ${compact ? "max-w-lg pt-3 sm:pt-6" : `${aside ? "max-w-6xl" : "max-w-3xl"} pt-4 sm:pt-8`} ${aside ? "lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16" : ""}`}>
      <div className={`min-w-0 ${compact ? "mx-auto w-full" : ""}`}>
        {!compact && !signedIn ? <Link to="/#planos" className={`${secondaryClass} mb-4 px-0`}><ArrowLeft size={17} aria-hidden="true" />Ver planos</Link> : null}
        {step !== undefined ? <SignupStepper step={step} stepLabels={stepLabels} compact={compact} /> : null}
        {children}
      </div>
      {aside ? <aside className="min-w-0 lg:pt-16">{aside}</aside> : null}
    </main>
  </div>;
}
export function FormField({ label, id, error, children, hint }: { label: string; id: string; error?: string; children: ReactNode; hint?: ReactNode }) {
  return <div className="mb-5 min-w-0"><label htmlFor={id} className="mb-2 block text-base font-semibold">{label}</label>{children}{hint ? <p id={`${id}-hint`} className="mb-0 mt-2 text-sm leading-6 text-muted">{hint}</p> : null}{error ? <p id={`${id}-error`} className="mb-0 mt-2 flex items-start gap-1.5 text-sm font-medium leading-6 text-danger"><CircleAlert size={18} aria-hidden="true" className="mt-[3px] shrink-0" />{error}</p> : null}</div>;
}
export function Failure({ message }: { message: string }) {
  return message ? <p role="alert" className="my-4 flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm leading-6 text-danger"><CircleAlert size={20} aria-hidden="true" className="mt-0.5 shrink-0" />{message}</p> : null;
}
