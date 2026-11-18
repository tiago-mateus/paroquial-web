import { useEffect, useState } from "react";
import { ImageIcon, Link2, Smartphone } from "lucide-react";
import type { HomeHeaderConfig, Tenant } from "../../shared/api/tenants";
import { usePublicChurches } from "../../shared/hooks/usePublicChurches";
import { resolveParishCover } from "../../shared/lib/parishCover";
import { getBrazilianWhatsappHref } from "../../shared/lib/phone";
import { HomeHeader } from "../home/HomeHeader";
import { fieldClassName, labelClassName } from "./AdminFormStyles";

type Props = {
  tenantSlug: string;
  tenant: Tenant;
  header: HomeHeaderConfig;
  onChange: (header: HomeHeaderConfig) => void;
  pending: boolean;
  urlError?: string;
};

export function HomeCoverEditor({ tenantSlug, tenant, header, onChange, pending, urlError }: Props) {
  const churches = usePublicChurches(tenantSlug, { retry: false });
  const fallbackImageUrl = resolveParishCover({ churches: churches.data });
  const imageUrl = header.imageUrl?.trim() || "";
  const source = urlError ? null : imageUrl || fallbackImageUrl;
  const [imageResult, setImageResult] = useState<{ source: string; failed: boolean }>();
  const failed = Boolean(source && imageResult?.source === source && imageResult.failed);
  const loading = Boolean(source && imageResult?.source !== source);

  useEffect(() => {
    if (!source) return;
    let active = true;
    const image = new Image();
    const finish = (failed: boolean) => { if (active) setImageResult({ source, failed }); };
    image.onload = () => finish(false);
    image.onerror = () => finish(true);
    const timer = window.setTimeout(() => { image.src = source; }, 350);
    return () => { active = false; window.clearTimeout(timer); image.onload = null; image.onerror = null; };
  }, [source]);

  const opacity = header.imageOpacity ?? 1;
  return <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12">
    <section aria-labelledby="cover-image-heading" className="min-w-0">
      <div className="flex items-center gap-2.5">
        <ImageIcon size={21} className="text-primary" aria-hidden="true" />
        <h2 id="cover-image-heading" className="m-0 text-lg font-bold">Imagem da capa</h2>
      </div>
      <p className="mb-5 mt-2 text-base leading-6 text-muted">Escolha uma foto que represente a comunidade. Ela será a primeira imagem de quem visita o site.</p>
      <label htmlFor="cover-image-url" className={labelClassName}>Link da imagem</label>
      <div className="relative">
        <Link2 size={18} className="pointer-events-none absolute left-3 top-5 text-muted" aria-hidden="true" />
        <input id="cover-image-url" type="url" value={header.imageUrl ?? ""} onChange={(event) => onChange({ ...header, imageUrl: event.target.value })} className={`${fieldClassName} pl-10`} placeholder="https://site.com/foto-da-paroquia.jpg" disabled={pending} aria-invalid={Boolean(urlError)} aria-describedby={`cover-image-help${urlError ? " cover-url-error" : ""}`} />
      </div>
      <p id="cover-image-help" className="mb-0 mt-2 text-sm leading-6 text-muted">Cole o endereço direto de uma foto. Prefira uma imagem horizontal, com a igreja ou a comunidade no centro.</p>
      {urlError ? <p id="cover-url-error" role="alert" className="mb-0 mt-2 text-sm font-semibold text-danger">{urlError}</p> : null}
      {imageUrl ? <button type="button" onClick={() => onChange({ ...header, imageUrl: "" })} disabled={pending} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline decoration-line underline-offset-4 hover:decoration-primary">Usar imagem das igrejas</button> : <p className="mb-0 mt-3 text-sm leading-6 text-muted">Sem um link próprio, o site usa uma foto das igrejas cadastradas, quando disponível.</p>}
      <div className="mt-6 border-t border-line pt-5">
        <label htmlFor="cover-image-opacity" className="flex items-center justify-between gap-4 text-base font-semibold">Visibilidade da imagem <output htmlFor="cover-image-opacity" className="rounded-lg bg-selection px-2 py-1 text-sm tabular-nums text-primary">{Math.round(opacity * 100)}%</output></label>
        <input id="cover-image-opacity" type="range" min="0.2" max="1" step="0.01" value={opacity} onChange={(event) => onChange({ ...header, imageOpacity: Number(event.target.value) })} disabled={pending || !source} aria-describedby="cover-opacity-help" className="block min-h-11 w-full accent-primary disabled:opacity-50" />
        <div aria-hidden="true" className="flex justify-between text-sm text-muted"><span>Mais escura</span><span>Mais nítida</span></div>
        <p id="cover-opacity-help" className="mb-0 mt-3 text-sm leading-6 text-muted">Confira na prévia como a foto aparece atrás do nome da paróquia.</p>
      </div>
    </section>
    <section aria-labelledby="cover-preview-heading" className="order-first min-w-0 lg:order-last">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="cover-preview-heading" className="m-0 text-base font-bold">Prévia da capa</h2>
        <span className="inline-flex items-center gap-1.5 text-sm text-muted"><Smartphone size={16} aria-hidden="true" />No celular</span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-selection/35 px-0 py-0 sm:p-6">
        <div className="mx-auto max-w-[375px] overflow-hidden sm:rounded-xl">
          <div inert aria-hidden="true" className="pointer-events-none bg-surface">
            <HomeHeader preview tenantName={tenant.name} cidade={[tenant.cidade, tenant.estado].filter(Boolean).join(" · ")} headerConfig={{ ...header, imageUrl: failed || urlError ? null : source }} linksHref={`/${tenantSlug}/links`} agendaHref={`/${tenantSlug}/calendario`} contactHref={getBrazilianWhatsappHref(tenant.telefone)} confessionSchedule={tenant.confessionSchedule} />
          </div>
        </div>
      </div>
      <p role="status" className={`mb-0 mt-3 text-sm leading-6 ${failed ? "text-danger" : "text-muted"}`}>
        {urlError ? "Corrija o link para visualizar a imagem." : failed ? "Não foi possível carregar a imagem. Confira se o link abre uma foto acessível a todos." : loading ? "Carregando imagem…" : "A prévia acompanha seus ajustes. Publique as alterações para atualizar o site."}
      </p>
    </section>
  </div>;
}
