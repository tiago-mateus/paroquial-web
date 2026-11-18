import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode, type Ref } from "react";
import { Link } from "react-router-dom";
import type { PlanId } from "../marketing/offer";
import { getLegal, parishSchema, registerAccount, registrationInputSchema, suggestSlug, updateRegistration, type Onboarding, type ParishDraft } from "./subscription.api";
import { publicPageUrl, sortedStates, stateLabel } from "./signupFormat";
import { bigButtonClass, Failure, fieldClass, FormField, secondaryClass } from "./SubscriptionShell";
import { accountDraftKey, clearSignupDraft, parishDraftKey, readAccountDraft, readParishDraft, saveAccountDraft, saveParishDraft } from "./signupDraft";

export type SignupAction = (action: () => Promise<unknown>) => Promise<boolean>;
export type ParishEditField = keyof ParishDraft | "location";

export function SignupHero({ title, description, headingRef, headingId = "signup-question" }: {
  title: string; description?: ReactNode; headingRef?: Ref<HTMLHeadingElement>; headingId?: string;
}) {
  return <div className="mb-6">
    <h1 id={headingId} ref={headingRef} tabIndex={headingRef ? -1 : undefined} className="m-0 text-2xl font-extrabold leading-tight tracking-tight focus:outline-none sm:text-3xl">{title}</h1>
    {description ? <div className="mt-2 text-base leading-6 text-muted">{description}</div> : null}
  </div>;
}

const signupFieldClass = `${fieldClass} data-[filled=true]:border-primary/40 aria-[invalid=true]:bg-danger/5`;
const accountFields = [
  { key: "name", label: "Seu nome", autoComplete: "name" },
  { key: "email", label: "E-mail", autoComplete: "email" },
  { key: "password", label: "Senha", autoComplete: "new-password" },
] as const;
type Errors = Partial<Record<string, string>>;

function validationErrors(issues: { path: PropertyKey[]; message: string }[]): Errors {
  const errors: Errors = {};
  for (const issue of issues) errors[String(issue.path[0])] ??= issue.message;
  return errors;
}

export function AccountForm({ planId, action, pending, alert }: { planId: PlanId; action: SignupAction; pending: boolean; alert?: ReactNode }) {
  const legal = useQuery({ queryKey: ["legal", "terms"], queryFn: () => getLegal("terms"), retry: false });
  const [restored] = useState(readAccountDraft);
  const [values, setValues] = useState({ name: restored?.name ?? "", email: restored?.email ?? "", password: "" });
  const [accepted, setAccepted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const form = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => { saveAccountDraft({ name: values.name, email: values.email, step: 0 }); }, [values.name, values.email]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending || !legal.data) return;
    const parsed = registrationInputSchema.safeParse({ ...values, planId, acceptedTerms: accepted, termsVersion: legal.data.version });
    if (!parsed.success) {
      const next = validationErrors(parsed.error.issues);
      if (next.acceptedTerms) next.acceptedTerms = "Aceite os termos para criar sua conta.";
      setErrors(next);
      const key = parsed.error.issues[0].path[0];
      form.current?.querySelector<HTMLElement>(key === "acceptedTerms" ? "#signup-terms" : `#signup-${String(key)}`)?.focus();
      return;
    }
    setErrors({});
    if (await action(() => registerAccount(parsed.data))) { clearSignupDraft(accountDraftKey); setValues((current) => ({ ...current, password: "" })); }
  }

  return <form ref={form} onSubmit={submit} noValidate aria-labelledby="signup-question">
    <SignupHero headingRef={heading} title="Crie sua conta" description="Use seus dados para acessar o Paroquial. Você revisa a contratação antes de pagar." />
    {restored && (restored.name || restored.email) ? <p role="status" className="mb-5 text-sm leading-6 text-muted">Nome e e-mail recuperados. Por segurança, preencha sua senha novamente.</p> : null}
    <fieldset disabled={pending} className="m-0 min-w-0 border-0 p-0">
      {accountFields.map((field) => <FormField key={field.key} id={`signup-${field.key}`} label={field.label} error={errors[field.key]} hint={field.key === "password" ? "Use pelo menos 10 caracteres." : undefined}>
        <div className="relative"><input
          id={`signup-${field.key}`} type={field.key === "email" ? "email" : field.key === "password" && !visible ? "password" : "text"}
          autoComplete={field.autoComplete} value={values[field.key]} required maxLength={field.key === "name" ? 160 : field.key === "email" ? 254 : undefined}
          data-filled={Boolean(values[field.key]) && !errors[field.key]}
          onChange={(event) => { setErrors((current) => ({ ...current, [field.key]: undefined })); setValues({ ...values, [field.key]: event.target.value }); }}
          className={`${signupFieldClass} ${field.key === "password" ? "pr-14 [&::-ms-reveal]:hidden" : ""}`} aria-invalid={Boolean(errors[field.key])}
          aria-describedby={[errors[field.key] ? `signup-${field.key}-error` : "", field.key === "password" ? "signup-password-hint" : ""].filter(Boolean).join(" ") || undefined}
          autoCapitalize={field.key === "email" || field.key === "password" ? "none" : undefined} spellCheck={field.key === "email" || field.key === "password" ? false : undefined} inputMode={field.key === "email" ? "email" : undefined}
        />{field.key === "password" ? <button type="button" aria-label={visible ? "Ocultar senha" : "Mostrar senha"} aria-pressed={visible} className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-selection" onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={20} /> : <Eye size={20} />}</button> : null}</div>
      </FormField>)}
      <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-base leading-6"><input id="signup-terms" type="checkbox" checked={accepted} onChange={(event) => { setErrors((current) => ({ ...current, acceptedTerms: undefined })); setAccepted(event.target.checked); }} className="mt-0.5 size-5 shrink-0 accent-primary" aria-invalid={Boolean(errors.acceptedTerms)} aria-describedby={errors.acceptedTerms ? "terms-error" : undefined} /><span>Li e aceito os <Link to="/termos" target="_blank" className="font-semibold text-primary underline">Termos de uso<span className="sr-only"> (abre em nova aba)</span></Link> e conheço a <Link to="/privacidade" target="_blank" className="font-semibold text-primary underline">Política de privacidade<span className="sr-only"> (abre em nova aba)</span></Link>.</span></label>
      {errors.acceptedTerms ? <p id="terms-error" role="alert" className="mt-1 text-sm text-danger">{errors.acceptedTerms}</p> : null}
    </fieldset>
    {legal.isPending ? <p role="status" className="text-sm text-muted">Carregando termos…</p> : null}
    {legal.isError ? <div><Failure message="Não foi possível carregar os termos. Tente novamente antes de criar sua conta." /><button type="button" className={secondaryClass} onClick={() => void legal.refetch()}>Carregar termos</button></div> : null}
    {alert}
    <button type="submit" disabled={pending || !legal.data} className={`${bigButtonClass} mt-5`}>{pending ? "Criando conta…" : "Criar conta"}<ArrowRight size={18} aria-hidden="true" /></button>
  </form>;
}

const normalizeSlugInput = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-{2,}/g, "-").replace(/^-/, "").slice(0, 64);
const parishFields = [
  { key: "name", label: "Nome da paróquia", placeholder: "Ex.: Paróquia São José" },
  { key: "city", label: "Cidade", placeholder: "Ex.: Fortaleza" },
  { key: "state", label: "Estado", placeholder: "" },
  { key: "slug", label: "Link da página", placeholder: "nome-da-paroquia" },
] as const;

export function ParishForm({ data, action, pending, onSaved, editField, onCancel, alert }: { data: Onboarding; action: SignupAction; pending: boolean; onSaved: () => void; editField?: ParishEditField; onCancel?: () => void; alert?: ReactNode }) {
  const registrationId = data.registration!.id;
  const [restored] = useState(() => readParishDraft(registrationId));
  const singleEdit = Boolean(data.registration?.parish && editField);
  const [values, setValues] = useState<ParishDraft>(restored?.values ?? data.registration?.parish ?? { name: "", city: "", state: "", slug: "" });
  const [slugEdited, setSlugEdited] = useState(restored?.slugEdited ?? Boolean(data.registration?.parish));
  const [showSlug, setShowSlug] = useState(editField === "slug");
  const [errors, setErrors] = useState<Errors>({});
  const form = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { saveParishDraft(registrationId, { values, step: 0, slugEdited }); }, [registrationId, values, slugEdited]);
  useEffect(() => {
    if (editField) form.current?.querySelector<HTMLElement>(`#parish-${editField === "location" ? "city" : editField}`)?.focus();
    else heading.current?.focus();
  }, [editField]);
  function update(key: keyof ParishDraft, raw: string) {
    const value = key === "slug" ? normalizeSlugInput(raw) : raw;
    setErrors((current) => ({ ...current, [key]: undefined }));
    if (key === "slug") setSlugEdited(true);
    setValues((current) => ({ ...current, [key]: value, ...(key === "name" && !slugEdited ? { slug: suggestSlug(value) } : {}) }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    const parsed = parishSchema.safeParse({ ...values, slug: values.slug.replace(/-$/, "") });
    if (!parsed.success) {
      setErrors(validationErrors(parsed.error.issues));
      const key = parsed.error.issues[0].path[0];
      if (key === "slug") setShowSlug(true);
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>(`#parish-${String(key)}`)?.focus());
      return;
    }
    setErrors({});
    if (await action(() => updateRegistration({ parish: parsed.data }))) { clearSignupDraft(parishDraftKey(registrationId)); onSaved(); }
  }
  const fields = singleEdit ? parishFields.filter((field) => editField === "location" ? field.key === "city" || field.key === "state" : field.key === editField) : parishFields.filter((field) => field.key !== "slug" || showSlug);
  return <form ref={form} noValidate onSubmit={submit} aria-labelledby="signup-question">
    <SignupHero headingRef={heading} title={singleEdit ? editField === "location" ? "Editar localização" : `Editar ${parishFields.find((field) => field.key === editField)!.label.toLowerCase()}` : "Dados da paróquia"} description={singleEdit ? undefined : "Informe os dados básicos. Fotos, horários e igrejas podem ser adicionados depois da assinatura."} />
    <fieldset disabled={pending} className="m-0 min-w-0 border-0 p-0">
      {fields.map((field) => <FormField key={field.key} id={`parish-${field.key}`} label={field.label} error={errors[field.key]} hint={field.key === "slug" ? <>Endereço: <span className="break-all">{publicPageUrl(values.slug || "nome-da-paroquia")}</span></> : undefined}>
        {field.key === "state" ? <select id="parish-state" className={signupFieldClass} data-filled={Boolean(values.state) && !errors.state} value={values.state} onChange={(event) => update("state", event.target.value)} autoComplete="address-level1" required aria-invalid={Boolean(errors.state)} aria-describedby={errors.state ? "parish-state-error" : undefined}><option value="">Selecione o estado</option>{sortedStates.map((uf) => <option key={uf} value={uf}>{stateLabel(uf)}</option>)}</select> : <input
          id={`parish-${field.key}`} className={signupFieldClass} placeholder={field.placeholder} value={values[field.key]} maxLength={field.key === "slug" ? 64 : 160} required
          data-filled={Boolean(values[field.key]) && !errors[field.key]}
          autoCapitalize={field.key === "slug" ? "none" : undefined} spellCheck={field.key === "slug" ? false : undefined} autoComplete={field.key === "city" ? "address-level2" : "off"}
          aria-invalid={Boolean(errors[field.key])} aria-describedby={[errors[field.key] ? `parish-${field.key}-error` : "", field.key === "slug" ? "parish-slug-hint" : ""].filter(Boolean).join(" ") || undefined}
          onChange={(event) => update(field.key, event.target.value)}
        />}
      </FormField>)}
      {!singleEdit && !showSlug ? <div className="mb-5 text-sm leading-6 text-muted"><span className="block">Link da página</span><div className="flex flex-wrap items-center gap-x-3"><span className="min-w-0 break-all text-ink">{publicPageUrl(values.slug || "nome-da-paroquia")}</span><button type="button" className={secondaryClass} onClick={() => { setShowSlug(true); requestAnimationFrame(() => form.current?.querySelector<HTMLElement>("#parish-slug")?.focus()); }}>Editar link</button></div></div> : null}
    </fieldset>
    {alert}
    <button type="submit" disabled={pending} className={bigButtonClass}>{pending ? "Salvando…" : singleEdit ? "Salvar alteração" : "Revisar contratação"}<ArrowRight size={18} aria-hidden="true" /></button>
    {singleEdit ? <button type="button" disabled={pending} className={`${secondaryClass} mt-2 w-full`} onClick={() => { clearSignupDraft(parishDraftKey(registrationId)); onCancel?.(); }}>Cancelar</button> : null}
  </form>;
}
