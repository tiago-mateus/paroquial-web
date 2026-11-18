import { MessageCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";
import { money, plans } from "../marketing/offer";
import { planIdSchema, parishSchema, suggestSlug } from "./subscription.api";
import { sortedStates, stateLabel } from "./signupFormat";
import { bigButtonClass, fieldClass, FormField, outlineClass, SubscriptionShell } from "./SubscriptionShell";
import { SignupSelect } from "./SignupSelect";

const requestSchema = parishSchema.extend({
  contact: z.string().trim().min(2, "Informe o nome do responsável.").max(120),
  name: parishSchema.shape.name.max(120),
  city: parishSchema.shape.city.max(100),
  email: z.string().trim().email("Informe um e-mail válido.").max(254),
  phone: z.string().trim().regex(/^\+?[\d ().-]{10,25}$/, "Informe um telefone com DDD.")
    .refine(value => /^\d{10,15}$/.test(value.replace(/\D/g, "")), "Informe um telefone com DDD."),
  plan: planIdSchema,
});

type Draft = z.infer<typeof requestSchema>;

const planOptions = plans.map(plan => ({ value: plan.id, label: `${plan.name} · ${money(plan.monthly)}/mês` }));
const stateOptions = sortedStates.map(state => ({ value: state, label: stateLabel(state) }));

function addressSuggestions(name: string, city: string) {
  const place = suggestSlug(city).replaceAll("-", "");
  if (place.length < 2) return [];
  const parish = suggestSlug(name).replace(/^paroquia(?:-de)?(?:-|$)/, "");
  const patron = parish.split(/-(?:de|da|do|das|dos)-/, 1)[0].replaceAll("-", "");
  const patronAndPlace = patron.endsWith(place) ? patron : patron + place;
  const options = ["paroquia" + place];
  if (patron && patronAndPlace !== place) options.push("paroquia" + patronAndPlace, patronAndPlace);
  return [...new Set(options.map(option => option.slice(0, 64)))];
}

export function LaunchSignupPage() {
  useDocumentTitle("Solicitar assinatura", "Paroquial");
  const [params] = useSearchParams();
  const [draft, setDraft] = useState<Draft>({
    contact: "", name: "", city: "", state: "", slug: "", email: "", phone: "",
    plan: planIdSchema.catch("premium").parse(params.get("plano")),
  });
  const [editedSlug, setEditedSlug] = useState(false);
  const [review, setReview] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const plan = plans.find(item => item.id === (review ?? draft).plan)!;
  const suggestions = addressSuggestions(draft.name, draft.city);

  function change<Key extends keyof Draft>(key: Key, value: Draft[Key]) {
    const updateSlug = !editedSlug && (key === "name" || key === "city");
    setDraft(current => {
      const next = { ...current, [key]: value };
      if (updateSlug) next.slug = addressSuggestions(next.name, next.city)[0] ?? suggestSlug(next.name);
      return next;
    });
    setErrors(current => ({ ...current, [key]: undefined, ...(updateSlug ? { slug: undefined } : {}) }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = requestSchema.safeParse(draft);
    if (result.success) {
      setReview(result.data);
      return;
    }
    const next = Object.fromEntries(result.error.issues.map(issue => [issue.path[0], issue.message]));
    setErrors(next);
    const first = result.error.issues[0]?.path[0];
    if (first) document.getElementById("launch-" + String(first))?.focus();
  }

  const details = review ? [
    ["Plano", plan.name + " · " + money(plan.monthly) + "/mês"],
    ["Responsável", review.contact],
    ["E-mail", review.email],
    ["Telefone", review.phone],
    ["Paróquia", review.name],
    ["Cidade", review.city],
    ["Estado", review.state],
    ["Endereço desejado", "/" + review.slug],
  ] : [];
  const message = ["Olá! Quero solicitar uma assinatura do Paroquial.", "", ...details.map(([label, value]) => label + ": " + value)].join("\n");
  const whatsapp = "https://wa.me/5585992180534?text=" + encodeURIComponent(message);

  return <SubscriptionShell compact signedIn>
    <h1 key={review ? "review" : "form"} ref={element => { if (review) element?.focus(); }} tabIndex={-1} className="m-0 font-display text-3xl tracking-tight">{review ? "Revise sua solicitação" : "Solicite sua assinatura"}</h1>
    <p className="mb-6 mt-2 text-muted">{review ? "Confira os dados. O WhatsApp abrirá com a mensagem pronta para você enviar." : "Escolha o plano e informe os dados da paróquia para continuar pelo WhatsApp."}</p>
    {review ? <>
      <dl className="m-0 divide-y divide-line rounded-xl border border-line bg-surface px-4">
        {details.map(([label, value]) => <div key={label} className="py-2.5">
          <dt className="text-sm text-muted">{label}</dt>
          <dd className="m-0 break-words font-semibold">{value}</dd>
        </div>)}
      </dl>
      <p className="my-4 text-sm text-muted">O envio inicia o atendimento. A confirmação da assinatura será combinada na conversa.</p>
      <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={bigButtonClass + " text-center"}><MessageCircle size={20} aria-hidden="true" className="shrink-0" />Confirmar e solicitar assinatura<span className="sr-only"> (abre o WhatsApp em nova aba)</span></a>
      <button type="button" onClick={() => setReview(null)} className={outlineClass + " mt-3 w-full"}>Editar dados</button>
    </> : <form noValidate onSubmit={submit}>
      <FormField id="launch-plan" label="Plano mensal">
        <SignupSelect id="launch-plan" label="Plano mensal" value={draft.plan} options={planOptions} onChange={value => change("plan", value)} />
      </FormField>
      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="mb-3 font-display text-xl">Responsável</legend>
        {input("contact", "Nome", "text", "name", 120)}
        {input("email", "E-mail", "email", "email", 254)}
        {input("phone", "Telefone com DDD", "tel", "tel", 25)}
      </fieldset>
      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="mb-3 font-display text-xl">Paróquia</legend>
        {input("name", "Nome da paróquia", "text", "organization", 120)}
        <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-3">
          {input("city", "Cidade", "text", "address-level2", 100)}
          <FormField id="launch-state" label="Estado" error={errors.state}>
            <SignupSelect id="launch-state" label="Estado" value={draft.state} options={stateOptions} displayValue={draft.state || "UF"} error={errors.state} onChange={value => change("state", value)} />
          </FormField>
        </div>
        {input("slug", "Endereço desejado para a página", "text", "off", 64)}
        {suggestions.length ? <fieldset className="m-0 -mt-2 mb-5 min-w-0 border-0 p-0">
          <legend className="mb-2 p-0 text-sm font-semibold text-muted">Sugestões de endereço</legend>
          <div className="flex flex-wrap gap-2">
            {suggestions.map(slug => <button key={slug} type="button" aria-pressed={draft.slug === slug}
              onClick={() => { setEditedSlug(true); change("slug", slug); }}
              className={"inline-flex min-h-11 min-w-0 max-w-full items-center rounded-lg border px-3 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " + (draft.slug === slug ? "border-primary bg-selection text-primary" : "border-control-border bg-surface text-ink hover:bg-selection/50")}>
              <span className="min-w-0 [overflow-wrap:anywhere]">{slug}</span>
            </button>)}
          </div>
        </fieldset> : null}
      </fieldset>
      <button type="submit" className={bigButtonClass}>Revisar solicitação</button>
    </form>}
  </SubscriptionShell>;

  function input(key: Exclude<keyof Draft, "plan" | "state">, label: string, type: string, autoComplete: string, maxLength: number) {
    const id = "launch-" + key;
    return <FormField id={id} label={label} error={errors[key]}>
      <input id={id} className={fieldClass} type={type} autoComplete={autoComplete} maxLength={maxLength} required value={draft[key]}
        aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? id + "-error" : undefined}
        onChange={event => { if (key === "slug") setEditedSlug(true); change(key, event.target.value); }} />
    </FormField>;
  }
}
