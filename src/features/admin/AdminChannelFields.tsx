import { ChevronDown } from "lucide-react";
import { useId, type ReactNode } from "react";
import type { PublicLink, UpsertLinkRequest } from "../../shared/api/links";
import { PublicLinkPreview } from "../links/PublicLinkCard";
import {
  LINK_TEMPLATES, LINK_TEMPLATE_LABELS, resolveLinkColor, resolveLinkIcon,
  resolveLinkTemplate, resolveLinkVariant,
} from "../links/linkPresentation";
import { fieldClassName, labelClassName } from "./AdminFormStyles";

const icons = { site: "Site", whatsapp: "WhatsApp", facebook: "Facebook", instagram: "Instagram", youtube: "YouTube", email: "E-mail", map: "Mapa", link: "Link" };
const colors = { slate: "Neutra", blue: "Azul", green: "Verde", pink: "Rosa", red: "Vermelha", orange: "Laranja", amber: "Âmbar", indigo: "Índigo" };

export function AdminChannelFields({ form, onChange, validationError }: {
  form: UpsertLinkRequest;
  onChange: (form: UpsertLinkRequest) => void;
  validationError?: string;
}) {
  const id = useId();
  const preview: PublicLink = {
    ...form,
    id: "preview",
    title: form.title.trim() || "Nome do canal",
    url: form.url.trim() || "exemplo.com",
  };
  const color = resolveLinkColor(preview);
  const Icon = resolveLinkIcon(preview);
  const variant = resolveLinkVariant(form.variant);
  const visible = form.isActive !== false;

  function change<Key extends keyof UpsertLinkRequest>(key: Key, value: UpsertLinkRequest[Key]) {
    onChange({ ...form, [key]: value });
  }

  return (
    <div className="grid min-w-0 gap-5 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div className="grid min-w-0 gap-4 md:col-start-1">
        <label className={labelClassName}>
          Nome do canal
          <input required value={form.title} onChange={event => change("title", event.target.value)} placeholder="Ex.: WhatsApp da secretaria" className={fieldClassName} />
        </label>
        <label className={labelClassName}>
          Destino
          <input required value={form.url} onChange={event => change("url", event.target.value)} aria-invalid={Boolean(validationError)} aria-describedby={id + (validationError ? "-error" : "-help")} placeholder="Ex.: paroquia.com.br" className={fieldClassName} />
        </label>
        <p id={id + "-help"} className="-mt-3 mb-0 text-sm text-muted">Use um endereço de site, mailto: para e-mail ou tel: para telefone.</p>
        {validationError ? <p id={id + "-error"} role="alert" className="-mt-2 mb-0 text-sm font-semibold text-danger">{validationError}</p> : null}
      </div>

      <aside aria-labelledby={id + "-preview"} className="min-w-0 self-start rounded-xl bg-canvas p-3 md:sticky md:top-0 md:col-start-2 md:row-span-2 md:row-start-1 md:p-4">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 id={id + "-preview"} className="m-0 text-sm font-bold">Prévia do canal</h3>
          <span className="text-sm text-muted">{visible ? "Alterações locais" : "Oculto no site"}</span>
        </div>
        <PublicLinkPreview link={preview} />
      </aside>

      <div className="min-w-0 md:col-start-1">
        <ChannelOptions title="Personalizar aparência" summary={LINK_TEMPLATE_LABELS[variant]}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClassName}>Ícone
              <span className="relative block">
                <Icon size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                <select value={form.iconKey && form.iconKey in icons ? form.iconKey : ""} onChange={event => change("iconKey", event.target.value)} className={fieldClassName + " pl-10"}>
                  {!form.iconKey || !(form.iconKey in icons) ? <option value="">Atual</option> : null}
                  {Object.entries(icons).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </span>
            </label>
            <label className={labelClassName}>Cor
              <span className="relative block">
                <span aria-hidden="true" style={{ backgroundColor: color }} className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 rounded-full border border-control-border" />
                <select value={form.colorKey && form.colorKey in colors ? form.colorKey : ""} onChange={event => change("colorKey", event.target.value)} className={fieldClassName + " pl-10"}>
                  {!form.colorKey || !(form.colorKey in colors) ? <option value="">Atual</option> : null}
                  {Object.entries(colors).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </span>
            </label>
          </div>

          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="mb-2 p-0 text-sm font-semibold">Modelo do botão</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {LINK_TEMPLATES.map(key => {
                const template = resolveLinkTemplate({ ...preview, variant: key });
                const selected = variant === key;
                return (
                  <button key={key} type="button" aria-pressed={selected} onClick={() => change("variant", key)} className={`grid min-w-0 gap-2 rounded-lg border p-2 text-center text-sm font-semibold hover:bg-selection/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${selected ? "border-primary bg-selection" : "border-line"}`}>
                    <span aria-hidden="true" style={template.containerStyle(color)} className={`flex h-9 items-center gap-1.5 px-2 ${template.container}`}>
                      <span className={`grid size-5 shrink-0 place-items-center ${template.iconShape}`} style={{ backgroundColor: template.iconBg(color), color: template.iconColor(color) }}><Icon size={12} /></span>
                      <span className={`h-1.5 w-7 rounded-full bg-current opacity-60 ${template.title}`} />
                    </span>
                    {LINK_TEMPLATE_LABELS[key]}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </ChannelOptions>

        <ChannelOptions title="Organização e publicação" summary={visible ? "Visível" : "Oculto"}>
          <div>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold">
              <input type="checkbox" checked={visible} onChange={event => change("isActive", event.target.checked)} aria-describedby={id + "-visibility"} className="size-5 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" />
              Visível no site
            </label>
            <p id={id + "-visibility"} className="m-0 text-sm text-muted">Canais ocultos permanecem cadastrados e não aparecem para os fiéis.</p>
          </div>
          <label className={labelClassName}>Posição
            <input type="number" min="0" value={form.order} onChange={event => change("order", Number(event.target.value))} aria-describedby={id + "-order"} className={fieldClassName + " max-w-28"} />
          </label>
          <p id={id + "-order"} className="-mt-2 mb-0 text-sm text-muted">Você também pode mudar a ordem pela lista de canais.</p>
        </ChannelOptions>
      </div>
    </div>
  );
}

function ChannelOptions({ title, summary, children }: { title: string; summary: string; children: ReactNode }) {
  return (
    <details className="group border-t border-line">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 rounded-sm py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-focus [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <span className="flex shrink-0 items-center gap-1.5 font-normal text-muted">{summary}<ChevronDown size={16} aria-hidden="true" className="group-open:rotate-180" /></span>
      </summary>
      <div className="grid gap-4 pb-4 pt-1">{children}</div>
    </details>
  );
}
