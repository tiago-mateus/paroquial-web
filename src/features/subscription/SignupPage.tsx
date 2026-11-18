import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, ChevronDown, Crown, Gem, LockKeyhole, RefreshCw, Sprout, TriangleAlert, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { money, plans, type PlanId } from "../marketing/offer";
import { PlanBenefits } from "../marketing/PlanBenefits";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";
import { changeRegistrationEmail, createCheckout, getOnboarding, planIdSchema, resendVerification, startRegistration, subscriptionError, updateRegistration, verifyEmail, type Onboarding } from "./subscription.api";
import { bigButtonClass, Failure, fieldClass, FormField, outlineClass, secondaryClass, SubscriptionShell, surfaceCardClass, tintedCardClass } from "./SubscriptionShell";
import { AccountForm, ParishForm, SignupHero, type ParishEditField, type SignupAction } from "./GuidedSignupForms";
import { publicPageUrl } from "./signupFormat";
import { readResendCooldown, startResendCooldown } from "./signupDraft";

const planIcons: Record<PlanId, LucideIcon> = { basic: Sprout, premium: Crown, pro: Gem };

export function SignupPage() {
  useDocumentTitle("Assinar", "Paroquial");
  const [params, setParams] = useSearchParams();
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["onboarding"], queryFn: getOnboarding, retry: false, staleTime: 0 });
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  const [error, setError] = useState("");
  const [failureCode, setFailureCode] = useState("");
  const editParam = params.get("editar");
  const editing = (["name", "city", "state", "slug", "location"] as const).find((field) => field === editParam);
  function setEditing(field?: ParishEditField) {
    const next = new URLSearchParams(params);
    if (field) next.set("editar", field); else next.delete("editar");
    setParams(next, { replace: true });
  }
  const [selected, setSelected] = useState<PlanId | undefined>();
  const heading = useRef<HTMLHeadingElement>(null);
  const data = query.data;
  const selectedPlan = selected ?? data?.registration?.planId ?? planIdSchema.catch("premium").parse(params.get("plano"));
  const plan = plans.find((item) => item.id === selectedPlan)!;
  const amount = data?.registration?.price.amount !== undefined ? data.registration.price.amount / 100 : plan.monthly;
  const guided = Boolean(data && (!data.user || (data.user.emailVerified && data.registration && (!data.registration.parish || editing))));
  const action: SignupAction = async (callback) => {
    if (inFlight.current) return false;
    inFlight.current = true;
    setPending(true);
    setError("");
    setFailureCode("");
    try {
      await callback();
      await client.invalidateQueries({ queryKey: ["onboarding"] });
      await client.invalidateQueries({ queryKey: ["session"] });
      return true;
    } catch (failure) {
      setError(subscriptionError(failure));
      const code = failure && typeof failure === "object" && "code" in failure ? String(failure.code) : "";
      setFailureCode(code);
      if (code === "SLUG_TAKEN") setEditing("slug");
      await client.invalidateQueries({ queryKey: ["onboarding"] });
      return false;
    }
    finally { inFlight.current = false; setPending(false); }
  };
  useEffect(() => { if (!guided) heading.current?.focus(); }, [data?.status, editing, guided]);
  if (data && ["active", "payment_pending", "provisioning"].includes(data.status)) return <Navigate to="/assinatura/confirmacao" replace />;
  const stage = !data?.user || !data.user.emailVerified ? 0 : !data.registration?.parish || editing ? 1 : 2;
  const reviewing = Boolean(data?.user?.emailVerified && data.registration?.parish && !editing);
  const planLocked = data?.status === "verify_email";
  const planCard = <PlanCard selectedPlan={selectedPlan} amount={amount} locked={planLocked} disabled={pending || planLocked} onSelect={(value) => {
    if (value === selectedPlan) return;
    if (data?.registration) void action(async () => { await updateRegistration({ planId: value }); setSelected(value); });
    else { setSelected(value); setParams({ plano: value }, { replace: true }); }
  }} />;
  const alert = <>
    <Failure message={error} />
    {failureCode === "EMAIL_EXISTS" ? <Link to="/login?continuar=assinatura" className={`${outlineClass} mb-4 w-full`}>Entrar com este e-mail</Link> : null}
  </>;
  // While the e-mail is unconfirmed the first stage names its sub-phase, so the invisible verify gate reads as progress.
  const stepLabels = data?.status === "verify_email" ? ["E-mail", undefined, undefined] : undefined;
  return <SubscriptionShell step={stage} stepLabels={stepLabels} compact signedIn={Boolean(data?.user)}>
    {query.isPending ? <p role="status" className="py-10 text-center text-muted">Preparando seu cadastro…</p> : query.isError ? <div className="py-6"><Failure message="Não foi possível carregar sua contratação. Seus dados não foram perdidos." /><div className="grid gap-2"><button className={bigButtonClass} onClick={() => void query.refetch()}>Tentar novamente</button><Link to="/login?continuar=assinatura" className={outlineClass}>Entrar novamente</Link></div></div> : data ? <>
      {!reviewing ? <div className="mx-auto mb-4 max-w-xl sm:mb-6">{planCard}</div> : null}
      {!data.user ? <AccountForm planId={selectedPlan} action={action} pending={pending} alert={alert} />
        : !data.user.emailVerified ? <EmailVerification data={data} action={action} pending={pending} headingRef={heading} alert={alert} />
        : !data.registration ? <div>
          <SignupHero headingRef={heading} title="Vamos cadastrar sua paróquia" description={<>Conectado como <strong className="font-semibold text-ink [overflow-wrap:anywhere]">{data.user.email}</strong>.</>} />
          {alert}
          <button type="button" className={bigButtonClass} disabled={pending} onClick={() => void action(() => startRegistration(selectedPlan))}>{pending ? "Preparando…" : "Cadastrar paróquia"}<ArrowRight size={20} aria-hidden="true" /></button>
        </div>
        : stage === 1 ? <ParishForm key={`${data.registration.id}:${editing ?? "new"}`} data={data} pending={pending} action={action} editField={editing} alert={alert} onCancel={() => { setEditing(); setError(""); }} onSaved={() => setEditing()} />
        : <ReviewStep data={data} amount={amount} planCard={planCard} pending={pending} headingRef={heading} alert={alert} onEdit={(field) => { setError(""); setEditing(field); }} onPay={() => void action(async () => { const url = await createCheckout(data.registration!.price.version); window.location.assign(url); })} />}
      {pending ? <span className="sr-only" role="status">Salvando suas informações.</span> : null}
    </> : null}
  </SubscriptionShell>;
}

function ReviewStep({ data, amount, planCard, pending, headingRef, alert, onEdit, onPay }: {
  data: Onboarding; amount: number; planCard: ReactNode; pending: boolean; headingRef: Ref<HTMLHeadingElement>; alert: ReactNode;
  onEdit: (field: ParishEditField) => void; onPay: () => void;
}) {
  const parish = data.registration!.parish!;
  const rows: { field?: ParishEditField; label: string; value: string }[] = [
    { label: "Responsável", value: `${data.user!.name} · ${data.user!.email}` },
    { field: "name", label: "Paróquia", value: parish.name },
    { field: "location", label: "Localização", value: `${parish.city}, ${parish.state}` },
    { field: "slug", label: "Link da página", value: publicPageUrl(parish.slug) },
  ];
  const retry = data.status === "payment_failed" || data.status === "checkout_expired";
  return <div className="mx-auto w-full max-w-xl">
    <SignupHero headingRef={headingRef} title="Revise sua assinatura" description="Confira os dados e o valor antes de continuar para o pagamento." />
    {retry ? <p role="status" className="mb-4 mt-0 flex items-start gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-sm font-medium leading-6 text-amber-950"><TriangleAlert size={19} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />{data.status === "payment_failed" ? "O pagamento anterior não foi aprovado." : "A sessão de pagamento expirou."} Seus dados estão salvos.</p> : null}
    <section aria-label="Resumo do pagamento" className="mb-6 rounded-xl bg-selection/35 px-4 pb-4">
      {planCard}
      <dl className="m-0 flex items-baseline justify-between gap-4 pt-4">
        <dt className="text-base font-semibold">Total hoje</dt>
        <dd className="m-0 shrink-0 text-3xl font-extrabold tabular-nums">{money(amount)}</dd>
      </dl>
      <p className="mb-0 mt-2 text-sm leading-6 text-muted">Renovação mensal de {money(amount)}. Cancele quando quiser. <Link to="/termos" target="_blank" className="font-semibold text-primary underline">Condições<span className="sr-only"> (abre em nova aba)</span></Link></p>
    </section>
    <dl className={`${surfaceCardClass} m-0 divide-y divide-line px-4`}>{rows.map((row) => <div key={row.label} className="flex min-h-14 items-center gap-3 py-2">
      <div className="min-w-0 flex-1"><dt className="text-[13px] text-muted">{row.label}</dt><dd className="m-0 break-words font-semibold [overflow-wrap:anywhere]">{row.value}</dd></div>
      {row.field ? <button type="button" aria-label={`Editar ${row.label.toLowerCase()}`} className={`${secondaryClass} shrink-0`} onClick={() => onEdit(row.field!)}>Editar</button> : null}
    </div>)}</dl>
    <div className="h-5" />
    {alert}
    <button type="button" disabled={pending} className={bigButtonClass} onClick={onPay}><LockKeyhole size={19} aria-hidden="true" />{pending ? "Abrindo o pagamento…" : "Continuar para pagamento"}</button>
  </div>;
}

function EmailVerification({ data, action, pending, headingRef, alert }: { data: Onboarding; action: SignupAction; pending: boolean; headingRef: Ref<HTMLHeadingElement>; alert: ReactNode }) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  // Seed from storage so a refetch-driven remount resumes the countdown instead of resetting it.
  const [cooldown, setCooldown] = useState(readResendCooldown);
  const [editingEmail, setEditingEmail] = useState(false);
  const [email, setEmail] = useState(data.user?.email ?? "");
  const [codeError, setCodeError] = useState("");
  useEffect(() => { if (!cooldown) return; const timer = window.setTimeout(() => setCooldown(readResendCooldown()), 1000); return () => clearTimeout(timer); }, [cooldown]);
  return <div className="mx-auto w-full max-w-xl">
    <SignupHero headingRef={headingRef} title="Confirme seu e-mail" description={editingEmail ? undefined : <>Enviamos um código para <strong className="font-semibold text-ink [overflow-wrap:anywhere]">{data.user?.email}</strong>. <button type="button" className="inline min-h-0 p-0 font-semibold text-primary underline disabled:opacity-60" disabled={pending} onClick={() => { setMessage(""); setEditingEmail(true); }}>Corrigir e-mail</button></>} />
    {!editingEmail ? <>
      {data.demo && import.meta.env.DEV ? <p className={`${tintedCardClass} mb-4 mt-0 px-4 py-3 text-sm leading-6`}>Na demonstração, use o código <strong>123456</strong>. Nenhum e-mail foi enviado.</p> : null}
      <form noValidate onSubmit={(event) => { event.preventDefault(); if (code.length !== 6) { setCodeError("Digite os 6 números do código."); return; } setCodeError(""); void action(() => verifyEmail(code)); }}>
        <FormField id="verification-code" label="Código de confirmação" error={codeError} hint="Não chegou? Veja a caixa de spam.">
          <input id="verification-code" className={`${fieldClass} min-h-16 rounded-2xl text-center text-2xl font-bold tracking-[0.5em] tabular-nums focus:border-primary`} autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={code} disabled={pending} aria-invalid={Boolean(codeError)} aria-describedby={`verification-code-hint${codeError ? " verification-code-error" : ""}`} onChange={(event) => { setCodeError(""); setCode(event.target.value.replace(/\D/g, "").slice(0, 6)); }} />
        </FormField>
        {alert}
        <button type="submit" className={bigButtonClass} disabled={pending}>{pending ? "Confirmando…" : "Confirmar e continuar"}<ArrowRight size={20} aria-hidden="true" /></button>
      </form>
      <div className="mt-2 text-center"><button type="button" className={secondaryClass} disabled={pending || cooldown > 0} onClick={() => void action(async () => { await resendVerification(); setMessage("Novo código enviado."); startResendCooldown(60); setCooldown(60); })}><RefreshCw size={16} aria-hidden="true" />{cooldown ? `Reenviar em ${cooldown}s` : "Reenviar código"}</button></div>
    </> : <form onSubmit={(event) => { event.preventDefault(); void action(async () => { await changeRegistrationEmail(email.trim()); setCode(""); setEditingEmail(false); setMessage("E-mail atualizado. Enviamos um novo código para ele."); }); }}>
      <FormField id="correct-email" label="E-mail correto"><input id="correct-email" type="email" required autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} className={`${fieldClass} min-h-14 rounded-2xl focus:border-primary`} value={email} onChange={(event) => setEmail(event.target.value)} disabled={pending} /></FormField>
      {alert}
      <button className={bigButtonClass} disabled={pending} type="submit">{pending ? "Salvando…" : "Salvar e enviar novo código"}</button>
      <button className={`${outlineClass} mt-3 w-full`} type="button" disabled={pending} onClick={() => { setEmail(data.user?.email ?? ""); setEditingEmail(false); }}>Cancelar</button>
    </form>}
    <p role="status" className="mb-0 mt-3 text-center text-sm leading-6 text-muted">{message}</p>
  </div>;
}

/** The chosen plan stays a quiet reminder; comparison opens only on request. */
function PlanCard({ selectedPlan, amount, locked, disabled, onSelect }: { selectedPlan: PlanId; amount: number; locked: boolean; disabled: boolean; onSelect: (plan: PlanId) => void }) {
  const plan = plans.find((item) => item.id === selectedPlan)!;
  return <details className="group rounded-xl border border-line bg-surface">
    <summary className="flex min-h-16 cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm leading-6 [&::-webkit-details-marker]:hidden">
      <span className="min-w-0 flex-1"><span className="font-semibold">Plano {plan.name}</span><span className="tabular-nums text-muted"> · {money(amount)}/mês</span></span>
      <span className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary"><span className="group-open:hidden">{locked ? "Ver plano" : "Alterar"}</span><span className="hidden group-open:inline">Fechar</span><ChevronDown size={16} aria-hidden="true" className="group-open:rotate-180" /></span>
      <span className="sr-only">{locked ? "Ver detalhes do plano" : "Ver detalhes e alterar plano"}</span>
    </summary>
    <PlanPicker selectedPlan={selectedPlan} amount={amount} disabled={disabled} locked={locked} onSelect={onSelect} />
  </details>;
}

function PlanPicker({ selectedPlan, amount, disabled, locked, onSelect }: { selectedPlan: PlanId; amount: number; disabled: boolean; locked: boolean; onSelect: (plan: PlanId) => void }) {
  const plan = plans.find((item) => item.id === selectedPlan)!;
  return <div className="border-t border-line p-4 sm:p-5">
    <fieldset id="signup-plan" disabled={disabled} className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-3 p-0 text-base font-bold">Escolha seu plano</legend>
      {locked ? <p className={`${tintedCardClass} mb-3 mt-0 px-3 py-2 text-[13px] leading-5 text-muted`}>Confirme seu e-mail para trocar de plano.</p> : null}
      <div className="grid gap-2.5">{plans.map((item) => {
        const Icon = planIcons[item.id];
        const checked = item.id === selectedPlan;
        return <label key={item.id} className={`relative flex min-h-20 cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-70 motion-reduce:transition-none ${checked ? "border-primary bg-selection/50" : "border-line bg-surface hover:border-primary/40"}`}>
          <input type="radio" name="signup-plan" value={item.id} checked={checked} onChange={() => onSelect(item.id)} className="sr-only" />
          <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${checked ? "bg-primary text-white" : "bg-selection/70 text-primary"}`}><Icon size={19} strokeWidth={1.9} aria-hidden="true" /></span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-base font-semibold leading-6">{item.name}{item.popular ? <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold leading-4 text-accent-ink">Em destaque</span> : null}</span>
            <span className="mt-0.5 block text-sm font-semibold tabular-nums text-primary">{money(checked ? amount : item.monthly)}/mês</span>
            <span className="mt-1 block text-sm leading-5 text-muted">{item.description}</span>
          </span>
          <span aria-hidden="true" className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${checked ? "border-primary bg-primary text-white" : "border-line bg-surface"}`}>{checked ? <Check size={14} strokeWidth={3} /> : null}</span>
        </label>;
      })}</div>
    </fieldset>
    <div className="mt-5 border-t border-line pt-4">
      <p className="m-0 text-sm font-bold">Incluído no {plan.name}</p>
      <div className="mt-3"><PlanBenefits plan={plan} columns /></div>
    </div>
  </div>;
}
