import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Check, Church, MapPin } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { useParams } from "react-router-dom";
import { buttonClasses, fieldClasses } from "../../shared/styles/controls";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";
import { defaultTheme, sameTheme, themeErrors, themeFields, themePresets, themeSchema, themeTokens, type ParishTheme } from "../../shared/theme/palette";
import { saveParishTheme, themeQueryKey, useParishTheme, type StoredTheme } from "../../shared/theme/parishTheme";
import { AdminNotice } from "./AdminNotice";
import { AdminPage, AdminPageContent } from "./AdminPage";
import { AdminPageHeader } from "./AdminPageHeader";
import { UnsavedChanges } from "./UnsavedChanges";

export function AdminThemePage() {
  const { tenantSlug = "" } = useParams();
  const query = useParishTheme(tenantSlug);
  useDocumentTitle("Tema e cores", "Paroquial");

  return <AdminPage header={<AdminPageHeader title="Tema e cores" description="Escolha a paleta do painel e do site público da paróquia." />}>
    <AdminPageContent width="wide">
      {query.isPending ? <p role="status" className="text-muted">Carregando tema…</p> : query.isError ? (
        <div>
          <AdminNotice>Não foi possível carregar o tema da paróquia.</AdminNotice>
          <button type="button" className={buttonClasses.secondary.md + " mt-3"} onClick={() => void query.refetch()}>Tentar novamente</button>
        </div>
      ) : <ThemeEditor key={tenantSlug} tenant={tenantSlug} saved={query.data} />}
    </AdminPageContent>
  </AdminPage>;
}

function ThemeEditor({ tenant, saved }: { tenant: string; saved: StoredTheme }) {
  const client = useQueryClient();
  const [draft, setDraft] = useState<ParishTheme>(saved.theme);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; error: boolean } | null>(null);
  const colors = themeSchema.safeParse(draft);
  const contrastErrors = colors.success ? themeErrors(colors.data) : {};
  const issues = themeFields.map(({ key }) => !/^#[0-9a-f]{6}$/i.test(draft[key]) ? "Use um código hexadecimal como #17654D." : contrastErrors[key]);
  const dirty = !sameTheme(draft, saved.theme);
  const shared = saved.storage === "shared";

  function change(value: ParishTheme) {
    setDraft(value);
    setFeedback(null);
  }

  async function submit() {
    if (!colors.success || issues.some(Boolean) || !dirty || pending) return;
    setPending(true);
    setFeedback(null);
    try {
      const result = await saveParishTheme(tenant, saved.storage, colors.data);
      client.setQueryData(themeQueryKey(tenant), result);
      setDraft(result.theme);
      setFeedback({ message: shared ? "Tema publicado no painel e no site público." : "Tema salvo neste navegador.", error: false });
    } catch {
      setFeedback({ message: "Não foi possível salvar o tema. Suas escolhas foram mantidas.", error: true });
    } finally {
      setPending(false);
    }
  }

  return <form onSubmit={event => { event.preventDefault(); void submit(); }} className="grid !max-w-none min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
    <UnsavedChanges dirty={dirty} />
    <fieldset disabled={pending} className="m-0 grid min-w-0 gap-6 rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="mb-3 p-0 font-display text-xl">Paletas prontas</legend>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {themePresets.map(({ name, theme }) => {
            const selected = sameTheme(theme, draft);
            return <button key={name} type="button" aria-pressed={selected} onClick={() => change(theme)}
              className={"grid min-w-0 gap-2 rounded-xl border p-3 text-left text-sm font-semibold hover:bg-selection/40 " + (selected ? "border-primary bg-selection/50 text-primary" : "border-line")}>
              <span aria-hidden="true" className="flex items-center gap-1.5">
                {themeFields.map(({ key }) => <span key={key} className="size-5 rounded-full border border-black/15" style={{ backgroundColor: theme[key] }} />)}
                {selected ? <Check className="ml-auto shrink-0" size={16} /> : null}
              </span>
              <span>{name}</span>
            </button>;
          })}
        </div>
      </fieldset>
      <fieldset className="m-0 min-w-0 border-0 border-t border-line p-0 pt-3">
        <legend className="pr-2 font-display text-xl">Personalizar cores</legend>
        <div className="divide-y divide-line">
          {themeFields.map(({ key, label, description }, index) => {
            const issue = issues[index];
            return <div key={key} className="py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <div><label htmlFor={"theme-" + key} className="text-sm font-semibold">{label}</label><p className="m-0 text-sm text-muted">{description}</p></div>
                <div className="flex items-center gap-2">
                  <input type="color" aria-label={"Seletor de " + label.toLowerCase()} value={/^#[0-9a-f]{6}$/i.test(draft[key]) ? draft[key] : defaultTheme[key]}
                    onChange={event => change({ ...draft, [key]: event.target.value.toUpperCase() })} className="size-11 cursor-pointer rounded-lg border border-control-border bg-surface p-1.5" />
                  <input id={"theme-" + key} maxLength={7} spellCheck={false} value={draft[key]} onChange={event => change({ ...draft, [key]: event.target.value.toUpperCase() })}
                    aria-invalid={Boolean(issue)} aria-describedby={issue ? "theme-error-" + key : undefined} className={fieldClasses.md + " max-w-27 font-mono"} />
                </div>
              </div>
              {issue ? <p id={"theme-error-" + key} className="m-0 mt-1 text-sm text-danger">{issue}</p> : null}
            </div>;
          })}
        </div>
      </fieldset>
      <div className="grid gap-3 border-t border-line pt-4">
        <p className="m-0 text-sm text-muted">{shared ? "Ao publicar, visitantes e administradores verão a nova paleta." : "O tema salvo será aplicado ao painel e ao site público neste navegador."}</p>
        {feedback ? <p role={feedback.error ? "alert" : "status"} className={"m-0 text-sm " + (feedback.error ? "text-danger" : "text-success")}>{feedback.message}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={!dirty || pending || issues.some(Boolean)} className={buttonClasses.primary.md + " disabled:opacity-60"}>{pending ? "Salvando…" : shared ? "Publicar tema" : "Salvar neste navegador"}</button>
          <button type="button" disabled={sameTheme(draft, defaultTheme)} className={buttonClasses.ghost.md} onClick={() => change(defaultTheme)}>Restaurar padrão</button>
        </div>
      </div>
    </fieldset>
    <ThemePreview theme={colors.success && !issues.some(Boolean) ? colors.data : saved.theme} invalid={issues.some(Boolean)} />
  </form>;
}

function ThemePreview({ theme, invalid }: { theme: ParishTheme; invalid: boolean }) {
  return <section aria-labelledby="theme-preview" className="min-w-0 rounded-2xl border border-line bg-surface p-4 sm:p-5 xl:sticky xl:top-6">
    <h2 id="theme-preview" className="m-0 font-display text-xl">Prévia do site</h2>
    <p className="mb-3 mt-1 text-sm text-muted">{invalid ? "Ajuste os campos indicados para atualizar a prévia." : "As cores mudam aqui enquanto você edita."}</p>
    <div style={themeTokens(theme) as CSSProperties} className="overflow-hidden rounded-xl border border-line bg-canvas text-ink">
      <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-3 font-bold text-primary"><Church size={19} aria-hidden="true" /> Sua paróquia</div>
      <div className="px-4 py-5">
        <p className="m-0 font-display text-2xl">Programação</p>
        <p className="mb-4 mt-1 text-sm text-muted">Celebrações e encontros da comunidade</p>
        <div className="rounded-xl border border-line bg-surface p-3">
          <span className="inline-flex rounded-md bg-accent px-2 py-1 text-xs font-bold text-accent-ink">Domingo</span>
          <p className="mb-1 mt-2 font-semibold">Santa Missa</p>
          <p className="m-0 flex items-center gap-1.5 text-sm text-muted"><MapPin size={15} aria-hidden="true" /> Igreja Matriz</p>
        </div>
        <span className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-white"><CalendarDays size={17} aria-hidden="true" /> Ver agenda</span>
      </div>
    </div>
  </section>;
}
