import { toast } from "sonner";
import { AdminNotice } from "./AdminNotice";
import { useAdminDraft } from "./useAdminDraft";
import { updateTenantFields } from "./updateTenantFields";
import { UnsavedChanges } from "./UnsavedChanges";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Check, ChevronRight, ExternalLink, Eye, EyeOff, GripVertical, Link2, LoaderCircle, MessageCircleMore, Pencil, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { AdminConfirmDialog } from "./AdminConfirmDialog";
import { AdminActionMenu } from "./AdminActionMenu";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { useDragReorder } from "./useDragReorder";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { createTenantBanner, deleteTenantBanner, getTenantBanners, reorderTenantBanners, updateTenantBanner, type PublicHomeBanner, type UpsertBannerRequest } from "../../shared/api/banners";
import { createTenantLink, deleteTenantLink, getAdminTenantLinks, updateTenantLink, type PublicLink, type UpsertLinkRequest } from "../../shared/api/links";
import { getTenant, type HomeHeaderConfig } from "../../shared/api/tenants";
import { HomeCoverEditor } from "./HomeCoverEditor";
import { DEFAULT_HIGHLIGHT_BACKGROUND, HighlightContent } from "../home/HighlightContent";
import { getLinkDestination, normalizeLinkUrl, resolveLinkColor, resolveLinkIcon } from "../links/linkPresentation";
import { AdminChannelFields } from "./AdminChannelFields";
import { AdminFormDialog } from "./AdminFormDialog";
import { fieldClassName, labelClassName } from "./AdminFormStyles";
import { AdminPageHeader, type AdminHeaderAction } from "./AdminPageHeader";
import { AdminPage, AdminPageContent, AdminSurface, AdminSurfaceHeader } from "./AdminPage";
import { AdminSaveBar } from "./AdminSaveBar";

const emptyBanner: UpsertBannerRequest = { tipo: "aviso", titulo: "", mensagem: "", link: "", bgImg: "", bgColor: "", order: 0 };
const emptyLink: UpsertLinkRequest = { title: "", url: "", iconKey: "link", colorKey: "slate", variant: "default", order: 0, isActive: true };

const BANNER_TYPE_OPTIONS = [
  { value: "aviso", label: "Aviso" },
  { value: "campanha", label: "Campanha" },
  { value: "convite", label: "Convite" },
  { value: "comunicado", label: "Comunicado" },
] as const;

const BANNER_TITLE_MAX = 60;
const BANNER_MESSAGE_MAX = 140;

const BANNER_COLOR_OPTIONS = [
  { value: "", label: "Padrão (âmbar)", gradient: DEFAULT_HIGHLIGHT_BACKGROUND },
  { value: "linear-gradient(135deg, #be123c, #7f1d1d)", label: "Vermelho", gradient: "linear-gradient(135deg, #be123c, #7f1d1d)" },
  { value: "linear-gradient(135deg, #0369a1, #164e63)", label: "Azul", gradient: "linear-gradient(135deg, #0369a1, #164e63)" },
  { value: "linear-gradient(135deg, #0f766e, #134e4a)", label: "Verde", gradient: "linear-gradient(135deg, #0f766e, #134e4a)" },
  { value: "linear-gradient(135deg, #6d28d9, #4c1d95)", label: "Roxo", gradient: "linear-gradient(135deg, #6d28d9, #4c1d95)" },
  { value: "linear-gradient(135deg, #475569, #1f2937)", label: "Grafite", gradient: "linear-gradient(135deg, #475569, #1f2937)" },
] as const;


export function AdminHomePage() {
  const { tenantSlug = "" } = useParams();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["tenant", tenantSlug], queryFn: () => getTenant(tenantSlug), enabled: Boolean(tenantSlug), retry: false, refetchOnWindowFocus: false });
  const serverHeader = useMemo(() => query.data ? query.data.homeHeader ?? {} : undefined, [query.data]);
  const { value: header, setValue: setHeader, dirty, commit } = useAdminDraft<HomeHeaderConfig>({}, serverHeader);
  const [saved, setSaved] = useState(false);
  const imageUrlError = getBannerUrlError(header.imageUrl);
  const mutation = useMutation({
    mutationFn: () => updateTenantFields(tenantSlug, { homeHeader: { ...header, imageUrl: header.imageUrl?.trim() } }),
    onSuccess: async (tenant) => { commit(tenant.homeHeader ?? {}); setSaved(true); toast.success("Capa atualizada"); await queryClient.invalidateQueries({ queryKey: ["tenant", tenantSlug] }); },
  });
  const updateHeader = (value: HomeHeaderConfig) => { setHeader(value); setSaved(false); };
  return <SitePageShell title="Capa da página" description="Dê as boas-vindas à comunidade com uma imagem da sua paróquia." publicHref={`/${tenantSlug}`} contentClassName="admin-save-content" wide>
    <UnsavedChanges dirty={dirty} />
    {query.isLoading ? <HomeSkeleton /> : query.isError || !query.data ? <QueryError title="Não foi possível carregar a página inicial" onRetry={() => query.refetch()} /> : <form className="grid w-full min-w-0 gap-8" id="admin-home-form" onSubmit={(event) => { event.preventDefault(); if (dirty && !imageUrlError && !mutation.isPending) mutation.mutate(); }}>
      <HomeCoverEditor tenantSlug={tenantSlug} tenant={query.data} header={header} onChange={updateHeader} pending={mutation.isPending} urlError={imageUrlError} />
      <section aria-labelledby="home-owners" className="max-w-3xl"><AdminSurfaceHeader id="home-owners" title="Também aparece na capa" description="Os atalhos usam as informações cadastradas nestas áreas." />
        <ContentBlockRow icon={<MessageCircleMore size={18} />} tone="bg-canvas text-primary" label="Contato da secretaria" value={query.data.telefone || "Telefone não informado"} href={`/${tenantSlug}/admin/paroquia/dados`} />
        <ContentBlockRow icon={<CalendarDays size={18} />} tone="bg-canvas text-primary" label="Horários de confissão" value={`${query.data.confessionSchedule?.length ?? 0} horários configurados`} href={`/${tenantSlug}/admin/calendario/confissoes`} />
      </section>
      <AdminSaveBar dirty={dirty} pending={mutation.isPending} invalid={Boolean(imageUrlError)} saved={saved} error={mutation.error} label="Publicar alterações" />
    </form>}
  </SitePageShell>;
}

export function AdminHighlightsPage() {
  const { tenantSlug = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["banners", tenantSlug], queryFn: () => getTenantBanners(tenantSlug), enabled: Boolean(tenantSlug), retry: false });
  const banners = useMemo(() => [...(query.data ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [query.data]);
  const [editor, setEditor] = useState<PublicHomeBanner | "new" | null>(null);
  const [form, setForm] = useState<UpsertBannerRequest>(emptyBanner);
  const [initialForm, setInitialForm] = useState<UpsertBannerRequest>(emptyBanner);
  const [organizing, setOrganizing] = useState(false);
  const [deleteItem, setDeleteItem] = useState<PublicHomeBanner | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["banners", tenantSlug] });
  const createMutation = useMutation({ mutationFn: (input: UpsertBannerRequest) => createTenantBanner(tenantSlug, input), onSuccess: refresh });
  const updateMutation = useMutation({ mutationFn: ({ id, input }: { id: string; input: UpsertBannerRequest }) => updateTenantBanner(tenantSlug, id, input), onSuccess: refresh });
  const deleteMutation = useMutation({ mutationFn: (id: string) => deleteTenantBanner(tenantSlug, id), onSuccess: refresh });
  const reorderMutation = useMutation({
    mutationFn: (reordered: PublicHomeBanner[]) => reorderTenantBanners(tenantSlug, reordered),
    onMutate: async (reordered) => {
      await queryClient.cancelQueries({ queryKey: ["banners", tenantSlug] });
      const previous = queryClient.getQueryData<PublicHomeBanner[]>(["banners", tenantSlug]);
      queryClient.setQueryData<PublicHomeBanner[]>(["banners", tenantSlug], reordered.map((banner, position) => ({ ...banner, order: position })));
      return { previous };
    },
    onError: (_error, _variables, context) => { if (context?.previous) queryClient.setQueryData(["banners", tenantSlug], context.previous); },
    onSettled: refresh,
  });
  const pending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const mutationError = createMutation.error || updateMutation.error || deleteMutation.error || reorderMutation.error;
  function openEditor(item?: PublicHomeBanner) { setOrganizing(false); const next = item ? bannerRequest(item, item.order ?? 0) : { ...emptyBanner, order: Math.max(-1, ...banners.map(banner => banner.order ?? 0)) + 1 }; createMutation.reset(); updateMutation.reset(); deleteMutation.reset(); reorderMutation.reset(); setForm(next); setInitialForm(next); setEditor(item ?? "new"); }
  useEffect(() => {
    if (params.get("action") !== "new" || !query.isSuccess) return;
    const nextForm = { ...emptyBanner, order: Math.max(-1, ...banners.map(item => item.order ?? 0)) + 1 }; setForm(nextForm); setInitialForm(nextForm);
    setEditor("new");
    const next = new URLSearchParams(params); next.delete("action"); setParams(next, { replace: true });
  }, [params, setParams, query.isSuccess, banners]);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (editor === null || getBannerUrlError(form.link) || getBannerUrlError(form.bgImg)) return; if (editor === "new") await createMutation.mutateAsync(form); else await updateMutation.mutateAsync({ id: editor.id, input: form }); setEditor(null); toast.success(editor === "new" ? "Destaque publicado" : "Destaque atualizado"); }
  async function confirmDelete() { if (!deleteItem) return; await deleteMutation.mutateAsync(deleteItem.id); setDeleteItem(null); setEditor(null); toast.success("Destaque excluído"); }
  function reorder(from: number, to: number) { reorderMutation.mutate(moveInArray(banners, from, to)); }
  return <SitePageShell title="Destaques" description="Gerencie os avisos da página inicial." publicHref={`/${tenantSlug}`} action={{ kind: "create", label: "Novo destaque", icon: Plus, onClick: () => openEditor() }}>
    <AdminSurface variant="flush" labelledBy="highlights-title"><div className="flex flex-wrap items-center justify-between gap-3"><h2 id="highlights-title" className="m-0 text-base font-semibold leading-6">{query.isLoading ? "Carregando destaques…" : query.isError ? "Destaques publicados" : `${banners.length} ${banners.length === 1 ? "destaque" : "destaques"}`}</h2>{query.isSuccess && banners.length > 1 ? <button type="button" aria-pressed={organizing} aria-controls="highlight-gallery" disabled={pending || reorderMutation.isPending} onClick={() => setOrganizing(!organizing)} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors motion-reduce:transition-none ${organizing ? "bg-primary text-white hover:bg-primary-hover" : "text-primary hover:bg-selection"}`}>{organizing ? <Check size={18} aria-hidden="true" /> : <ArrowUpDown size={18} aria-hidden="true" />}{organizing ? "Concluir organização" : "Organizar destaques"}</button> : null}</div>{organizing ? <p role="status" className="m-0 mt-2 text-sm leading-6 text-muted">Arraste os destaques ou use o menu para mover. A ordem é salva automaticamente.</p> : null}<MutationNotice className="my-4" error={editor === null && !deleteItem ? mutationError : null} />{query.isLoading ? <HighlightCardsSkeleton /> : query.isError ? <QueryError title="Não foi possível carregar os destaques" onRetry={() => query.refetch()} compact /> : banners.length ? <div className="pt-4"><BannerList banners={banners} organizing={organizing} disabled={pending} reordering={reorderMutation.isPending} onEdit={openEditor} onReorder={reorder} /></div> : <EmptyResource icon={<Sparkles size={21} />} title="Nenhum destaque publicado" description="Publique o primeiro comunicado para exibi-lo no carrossel da página inicial." />}<p className="m-0 mt-4 text-sm leading-6 text-muted">No site, o Evangelho do dia aparece antes dos destaques e é atualizado automaticamente.</p></AdminSurface>
    <AdminFormDialog wide open={editor !== null} eyebrow="Página inicial" title={editor === "new" ? "Novo destaque" : "Editar destaque"} submitLabel={editor === "new" ? "Publicar" : "Salvar alterações"} pending={pending} dirty={JSON.stringify(form) !== JSON.stringify(initialForm)} submitDisabled={editor !== "new" && JSON.stringify(form) === JSON.stringify(initialForm)} submitHint={editor !== "new" && JSON.stringify(form) === JSON.stringify(initialForm) ? "Faça uma alteração para habilitar o salvamento." : undefined} onClose={() => setEditor(null)} onSubmit={(event) => { void submit(event).catch(() => undefined); }} onDelete={editor && editor !== "new" ? () => setDeleteItem(editor) : undefined}><MutationNotice error={mutationError} /><BannerFields form={form} onChange={setForm} /></AdminFormDialog>
    <DeleteDialog error={deleteMutation.error} open={Boolean(deleteItem)} title="Excluir destaque?" description={deleteItem ? `“${deleteItem.titulo}” deixará de aparecer na página inicial.` : ""} pending={deleteMutation.isPending} onClose={() => setDeleteItem(null)} onConfirm={() => { void confirmDelete().catch(() => undefined); }} />
  </SitePageShell>;
}

export function AdminChannelsPage() {
  const { tenantSlug = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "links", tenantSlug], queryFn: () => getAdminTenantLinks(tenantSlug), enabled: Boolean(tenantSlug), retry: false });
  const links = useMemo(() => [...(query.data ?? [])].sort((a, b) => a.order - b.order), [query.data]);
  const visibleCount = links.filter((item) => item.isActive !== false).length;
  const hiddenCount = links.length - visibleCount;
  const [editor, setEditor] = useState<PublicLink | "new" | null>(null);
  const [form, setForm] = useState<UpsertLinkRequest>(emptyLink);
  const [initialForm, setInitialForm] = useState<UpsertLinkRequest>(emptyLink);
  const [deleteItem, setDeleteItem] = useState<PublicLink | null>(null);
  const [validationError, setValidationError] = useState<string>();
  const refresh = async () => Promise.all([queryClient.invalidateQueries({ queryKey: ["admin", "links", tenantSlug] }), queryClient.invalidateQueries({ queryKey: ["links", tenantSlug] })]);
  const createMutation = useMutation({ mutationFn: (input: UpsertLinkRequest) => createTenantLink(tenantSlug, input), onSuccess: refresh });
  const updateMutation = useMutation({ mutationFn: ({ id, input }: { id: string; input: UpsertLinkRequest }) => updateTenantLink(tenantSlug, id, input), onSuccess: refresh });
  const deleteMutation = useMutation({ mutationFn: (id: string) => deleteTenantLink(tenantSlug, id), onSuccess: refresh });
  const reorderMutation = useMutation({
    mutationFn: async (reordered: PublicLink[]) => {
      const changed = reordered.map((link, position) => ({ link, position })).filter(({ link, position }) => link.order !== position);
      const results = await Promise.allSettled(changed.map(({ link, position }) => updateTenantLink(tenantSlug, link.id, linkRequest(link, position))));
      const failure = results.find(result => result.status === "rejected");
      if (failure) throw failure.reason;
    },
    onMutate: async (reordered) => {
      await Promise.all([queryClient.cancelQueries({ queryKey: ["admin", "links", tenantSlug] }), queryClient.cancelQueries({ queryKey: ["links", tenantSlug] })]);
      const previous = queryClient.getQueryData<PublicLink[]>(["admin", "links", tenantSlug]);
      queryClient.setQueryData<PublicLink[]>(["admin", "links", tenantSlug], reordered.map((link, position) => ({ ...link, order: position })));
      return { previous };
    },
    onError: (_error, _variables, context) => { if (context?.previous) queryClient.setQueryData(["admin", "links", tenantSlug], context.previous); },
    onSettled: refresh,
  });
  const pending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const saveError = createMutation.error || updateMutation.error;
  function openEditor(item?: PublicLink) { const next = item ? linkRequest(item, item.order) : { ...emptyLink, order: links.length }; createMutation.reset(); updateMutation.reset(); deleteMutation.reset(); reorderMutation.reset(); setValidationError(undefined); setForm(next); setInitialForm(next); setEditor(item ?? "new"); }
  useEffect(() => {
    if (params.get("action") !== "new" || !query.isSuccess) return;
    const nextForm = { ...emptyLink, order: Math.max(-1, ...links.map(item => item.order)) + 1 }; setForm(nextForm); setInitialForm(nextForm);
    setEditor("new");
    const next = new URLSearchParams(params); next.delete("action"); setParams(next, { replace: true });
  }, [params, setParams, query.isSuccess, links]);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (editor === null) return; if (!isValidDestination(form.url)) { setValidationError("Informe um site, e-mail ou telefone válido."); return; } setValidationError(undefined); if (editor === "new") await createMutation.mutateAsync(form); else await updateMutation.mutateAsync({ id: editor.id, input: form }); setEditor(null); toast.success(editor === "new" ? "Canal criado" : "Canal atualizado"); }
  async function confirmDelete() { if (!deleteItem) return; await deleteMutation.mutateAsync(deleteItem.id); setDeleteItem(null); setEditor(null); toast.success("Canal excluído"); }
  const busy = pending || reorderMutation.isPending;
  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm);
  function reorder(from: number, to: number) {
    if (busy || from === to || to < 0 || to >= links.length) return;
    reorderMutation.mutate(moveInArray(links, from, to), {
      onSuccess: () => toast.success("Ordem dos canais salva"),
    });
  }
  function toggleVisibility(link: PublicLink) {
    if (busy) return;
    const isActive = link.isActive === false;
    updateMutation.mutate({ id: link.id, input: { ...linkRequest(link, link.order), isActive } }, {
      onSuccess: () => toast.success(isActive ? "Canal visível no site" : "Canal oculto no site"),
    });
  }

  return <AdminPage header={<AdminPageHeader
    title="Canais oficiais"
    description="Gerencie os links de contato publicados para os fiéis."
    descriptionClassName="hidden md:block"
    publicHref={`/${tenantSlug}/links`}
    publicLabel="Ver canais no site"
    primaryAction={{ kind: "create", label: "Novo canal", icon: Plus, disabled: busy, onClick: () => openEditor() }}
  />}>
    <AdminPageContent width="wide">
      <AdminSurface variant="flush" labelledBy="channels-title">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line pb-3">
          <h2 id="channels-title" className="m-0 text-base font-semibold">Canais cadastrados</h2>
          <p role="status" className="m-0 text-sm text-muted">
            {reorderMutation.isPending ? "Salvando ordem…" : updateMutation.isPending && editor === null ? "Atualizando visibilidade…" : query.isLoading ? "Carregando…" : query.isSuccess ? `${visibleCount} ${visibleCount === 1 ? "visível" : "visíveis"} · ${hiddenCount} ${hiddenCount === 1 ? "oculto" : "ocultos"}` : null}
          </p>
        </div>
        {reorderMutation.isError ? <AdminNotice className="my-4">Não foi possível salvar toda a ordem. Confira a lista e tente novamente.</AdminNotice> : null}
        {editor === null && updateMutation.isError ? <AdminNotice className="my-4">Não foi possível atualizar a visibilidade. Tente novamente.</AdminNotice> : null}
        {query.isLoading ? <RowsSkeleton count={5} /> : query.isError ? (
          <QueryError title="Não foi possível carregar os canais" onRetry={() => query.refetch()} />
        ) : links.length ? (
          <ChannelList links={links} disabled={busy} onEdit={openEditor} onDelete={setDeleteItem} onToggleVisibility={toggleVisibility} onReorder={reorder} />
        ) : (
          <EmptyResource icon={<Link2 size={21} />} title="Nenhum canal cadastrado" description="Use Novo canal para publicar o primeiro contato, site ou rede social da paróquia." />
        )}
      </AdminSurface>
    </AdminPageContent>
    <AdminFormDialog wide open={editor !== null} eyebrow="" title={editor === "new" ? "Novo canal" : "Editar canal"}
      submitLabel={editor === "new" ? "Criar canal" : "Salvar alterações"} pending={pending} dirty={dirty}
      submitDisabled={editor !== "new" && !dirty} onClose={() => setEditor(null)}
      onSubmit={event => { void submit(event).catch(() => undefined); }}
      onDelete={editor && editor !== "new" ? () => setDeleteItem(editor) : undefined}>
      <MutationNotice className="mb-4" error={saveError} />
      <AdminChannelFields form={form} onChange={next => {
        if (next.url !== form.url) setValidationError(undefined);
        setForm(next);
      }} validationError={validationError} />
    </AdminFormDialog>
    <DeleteDialog error={deleteMutation.error} open={Boolean(deleteItem)} title="Excluir canal?" description={deleteItem ? `“${deleteItem.title}” será removido definitivamente da gestão e do site público.` : ""} pending={deleteMutation.isPending} onClose={() => setDeleteItem(null)} onConfirm={() => { void confirmDelete().catch(() => undefined); }} />
  </AdminPage>;
}

function SitePageShell({ title, description, publicHref, action, children, contentClassName, wide = false }: { title: string; description: string; publicHref: string; action?: AdminHeaderAction; children: ReactNode; contentClassName?: string; wide?: boolean }) {
  return <AdminPage header={<AdminPageHeader title={title} description={description} publicHref={publicHref} primaryAction={action} />}><AdminPageContent width={wide ? "wide" : "standard"} className={contentClassName}>{children}</AdminPageContent></AdminPage>;
}
function ContentBlockRow({ icon, tone, label, value, href }: { icon: ReactNode; tone: string; label: string; value: string; href: string }) { return <Link to={href} className="flex min-h-[4.5rem] items-center gap-3 border-t border-line px-4 py-3 transition hover:bg-selection/35 md:px-5"><span className={`grid h-11 w-11 flex-none place-items-center rounded-xl ${tone}`}>{icon}</span><span className="min-w-0 flex-1"><strong className="block text-sm">{label}</strong><small className="mt-0.5 block truncate text-sm text-muted">{value}</small></span><ChevronRight size={16} className="flex-none text-muted" /></Link>; }

const dragHandleClass = "grid h-11 flex-none touch-none place-items-center rounded-lg text-muted hover:bg-selection/35 hover:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

function DragHandle({ label, handleProps, onKeyDown, disabled = false }: { label: string; handleProps: { onPointerDown: (e: React.PointerEvent) => void; style: React.CSSProperties }; onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void; disabled?: boolean }) {
  return <button type="button" disabled={disabled} aria-label={`Arrastar ${label} para reordenar${onKeyDown ? ". Use as setas para cima ou para baixo." : ""}`} className={`${dragHandleClass} w-11`} onPointerDown={handleProps.onPointerDown} onKeyDown={onKeyDown} style={handleProps.style}><GripVertical size={18} aria-hidden="true" /></button>;
}

function BannerList({ banners, organizing, disabled, reordering, onEdit, onReorder }: { banners: PublicHomeBanner[]; organizing: boolean; disabled: boolean; reordering: boolean; onEdit: (item: PublicHomeBanner) => void; onReorder: (from: number, to: number) => void }) {
  const { handleProps, draggingIndex, overIndex } = useDragReorder(banners.length, (from, to) => { if (organizing && !disabled && !reordering) onReorder(from, to); }, "grid");
  return <>
    <div id="highlight-gallery" className="grid items-start gap-6 sm:grid-cols-2 xl:grid-cols-3" aria-label="Destaques publicados" aria-busy={reordering}>
      {banners.map((banner, index) => (
        <article key={banner.id} data-drag-item aria-label={banner.titulo} className={`flex w-full min-w-0 max-w-sm flex-col overflow-hidden rounded-2xl border bg-surface transition-colors motion-reduce:transition-none ${draggingIndex === index ? "border-primary bg-selection/40" : overIndex === index && draggingIndex !== null ? "border-primary ring-2 ring-focus/20" : "border-line"}`}>
          {organizing ? <header className="flex min-h-14 items-center gap-2 border-b border-line/60 bg-selection/30 px-2 py-1">
            <DragHandle disabled={disabled || reordering} label={`destaque ${banner.titulo}`} handleProps={handleProps(index)} onKeyDown={(event) => { if (event.key === "ArrowUp" && index > 0) { event.preventDefault(); onReorder(index, index - 1); } else if (event.key === "ArrowDown" && index < banners.length - 1) { event.preventDefault(); onReorder(index, index + 1); } }} />
            <span className="min-w-0 flex-1 text-sm font-semibold leading-5 text-ink">{index + 1}º destaque</span>
            <AdminActionMenu quiet label={banner.titulo} disabled={disabled || reordering} actions={[
              { label: 'Mover para cima', icon: ArrowUp, disabled: index === 0, onClick: () => onReorder(index, index - 1) },
              { label: 'Mover para baixo', icon: ArrowDown, disabled: index === banners.length - 1, onClick: () => onReorder(index, index + 1) },
            ]} />
          </header> : null}
          <div className="flex min-w-0 flex-1 flex-col"><HighlightContent banner={banner} variant="gallery" /></div>
          {!organizing ? <footer className="px-4 pb-3 pt-1">
            <button type="button" onClick={() => onEdit(banner)} disabled={disabled || reordering} aria-label={`Editar destaque ${banner.titulo}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-primary transition-colors hover:bg-selection motion-reduce:transition-none"><Pencil size={16} aria-hidden="true" />Editar</button>
          </footer> : null}
        </article>
      ))}
    </div>
    {reordering ? <p role="status" className="m-0 mt-3 flex items-center gap-2 text-sm text-muted"><LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />Salvando ordem dos destaques…</p> : null}
  </>;
}

function HighlightCardsSkeleton() {
  return <div role="status" aria-label="Carregando destaques" className="grid gap-6 pt-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1].map(item => <div key={item} className="overflow-hidden rounded-2xl border border-line p-5" aria-hidden="true"><div className="animate-pulse motion-reduce:animate-none"><span className="block h-5 w-2/3 rounded bg-selection" /><span className="mt-4 block h-4 w-full rounded bg-selection" /><span className="mt-2 block h-4 w-4/5 rounded bg-selection" /></div><div className="mt-5 h-11 w-24 rounded-xl bg-selection/40" /></div>)}<span className="sr-only">Carregando destaques…</span></div>;
}

function ChannelList({ links, disabled, onEdit, onDelete, onToggleVisibility, onReorder }: {
  links: PublicLink[];
  disabled: boolean;
  onEdit: (item: PublicLink) => void;
  onDelete: (item: PublicLink) => void;
  onToggleVisibility: (item: PublicLink) => void;
  onReorder: (from: number, to: number) => void;
}) {
  const { handleProps, draggingIndex, overIndex } = useDragReorder(links.length, onReorder);
  return <ul aria-label="Canais cadastrados" className="m-0 list-none divide-y divide-line/70 p-0">
    {links.map((link, index) => {
      const hidden = link.isActive === false;
      const Icon = resolveLinkIcon(link);
      const color = resolveLinkColor(link);
      const destination = getLinkDestination(link.url) ?? link.url;
      const href = isValidDestination(link.url) ? normalizeLinkUrl(link.url) : null;
      const dragging = draggingIndex === index;
      const dropTarget = draggingIndex !== null && !dragging && overIndex === index;
      const dropLine = dropTarget ? (index < draggingIndex ? "before:top-0" : "before:bottom-0") : "";
      return <li key={link.id} data-drag-item className={`relative grid min-w-0 grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-1 py-1.5 ${dragging ? "bg-selection" : ""} ${dropTarget ? "bg-selection/30 before:absolute before:inset-x-0 before:h-0.5 before:bg-primary" : ""} ${dropLine}`}>
        <DragHandle disabled={disabled || links.length < 2} label={`canal ${link.title}`} handleProps={handleProps(index)} onKeyDown={event => {
          if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
          event.preventDefault();
          onReorder(index, index + (event.key === "ArrowUp" ? -1 : 1));
        }} />
        <button type="button" onClick={() => onEdit(link)} disabled={disabled} aria-label={`Editar canal ${link.title}`}
          className="flex min-h-12 min-w-0 items-center gap-2.5 rounded-lg px-1 py-1 text-left hover:bg-selection/40 active:bg-selection focus-visible:outline-2 focus-visible:outline-focus sm:gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: `${color}18`, color }}><Icon size={18} aria-hidden="true" /></span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <strong className="min-w-0 text-[15px] leading-5 [overflow-wrap:anywhere]">{link.title}</strong>
              {hidden ? <span className="inline-flex items-center gap-1 text-xs font-medium text-muted"><EyeOff size={13} aria-hidden="true" />Oculto</span> : null}
            </span>
            <span className="block truncate text-sm leading-5 text-muted" title={link.url}>{destination}</span>
          </span>
        </button>
        <AdminActionMenu quiet label={link.title} disabled={disabled} actions={[
          { label: "Editar canal", icon: Pencil, onClick: () => onEdit(link) },
          ...(href ? [{ label: "Abrir destino", icon: ExternalLink, onClick: () => {
            if (/^https?:/i.test(href)) window.open(href, "_blank", "noopener,noreferrer");
            else window.location.assign(href);
          } }] : []),
          { label: hidden ? "Mostrar no site" : "Ocultar no site", icon: hidden ? Eye : EyeOff, onClick: () => onToggleVisibility(link) },
          { label: "Mover para cima", icon: ArrowUp, disabled: index === 0, onClick: () => onReorder(index, index - 1) },
          { label: "Mover para baixo", icon: ArrowDown, disabled: index === links.length - 1, onClick: () => onReorder(index, index + 1) },
          { label: `Excluir canal ${link.title}`, icon: Trash2, danger: true, onClick: () => onDelete(link) },
        ]} />
      </li>;
    })}
  </ul>;
}

function CharCounter({ value, max }: { value: number; max: number }) {
  const over = value > max;
  return <span className={`text-sm font-semibold tabular-nums ${over ? "text-danger" : value > max * 0.85 ? "text-warning" : "text-muted"}`}>{value}/{max}</span>;
}

function BannerFields({ form, onChange }: { form: UpsertBannerRequest; onChange: (form: UpsertBannerRequest) => void }) {
  const linkError = getBannerUrlError(form.link);
  const imageError = getBannerUrlError(form.bgImg);
  const previewRef = useRef<HTMLHeadingElement>(null);
  const titleLength = form.titulo.length;
  const messageLength = (form.mensagem ?? "").length;
  const preview: PublicHomeBanner = { ...form, id: "preview", titulo: form.titulo.trim() || "Título do destaque", bgImg: imageError ? "" : form.bgImg, link: linkError ? "" : form.link };
  return <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
    <div className="min-w-0 space-y-6">
      <section aria-labelledby="banner-content-title" className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <h3 id="banner-content-title" className="m-0 text-base font-semibold">Conteúdo</h3>
          <button type="button" onClick={() => previewRef.current?.scrollIntoView({ block: "start" })} className="inline-flex min-h-11 flex-none items-center gap-2 rounded-xl px-3 text-sm font-semibold text-primary transition-colors hover:bg-selection focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"><Eye size={17} aria-hidden="true" />Ver prévia</button>
        </div>
      <label className={labelClassName}>
        <span className="flex items-center justify-between">Título<CharCounter value={titleLength} max={BANNER_TITLE_MAX} /></span>
        <input required aria-label="Título" maxLength={BANNER_TITLE_MAX} value={form.titulo} onChange={(event) => onChange({ ...form, titulo: event.target.value })} className={fieldClassName} placeholder="O que deseja anunciar?" />
      </label>
      <label className={labelClassName}>
        <span className="flex items-center justify-between"><span>Mensagem <span className="font-normal text-muted">(opcional)</span></span><CharCounter value={messageLength} max={BANNER_MESSAGE_MAX} /></span>
        <textarea aria-label="Mensagem" maxLength={BANNER_MESSAGE_MAX} value={form.mensagem ?? ""} onChange={(event) => onChange({ ...form, mensagem: event.target.value })} className={`${fieldClassName} min-h-24 resize-y`} placeholder="Conte o essencial para quem verá o destaque" />
      </label>

        <label className={labelClassName}>Para onde o destaque leva <span className="font-normal text-muted">(opcional)</span><input type="text" inputMode="url" autoCapitalize="off" autoCorrect="off" value={form.link ?? ""} onChange={(event) => onChange({ ...form, link: event.target.value })} aria-invalid={Boolean(linkError)} aria-describedby={linkError ? "banner-link-error" : undefined} className={fieldClassName} placeholder="https://site.com/pagina" />{linkError ? <span id="banner-link-error" className="mt-1.5 block text-sm font-semibold text-danger">{linkError}</span> : null}</label>
        <details className="border-b border-line pb-3"><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">Opções da publicação</summary><div className="pt-2">      <fieldset className="m-0 border-0 p-0">
        <legend className={`${labelClassName} mb-1.5 p-0`}>Tipo</legend>
        <div className="flex flex-wrap gap-2">{BANNER_TYPE_OPTIONS.map((option) => {
          const active = (form.tipo ?? "aviso") === option.value;
          return <button key={option.value} type="button" aria-pressed={active} onClick={() => onChange({ ...form, tipo: option.value })} className={`inline-flex min-h-11 items-center rounded-xl border px-3.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${active ? "border-line bg-primary text-white" : "border-line bg-surface text-ink hover:bg-selection/35"}`}>{option.label}</button>;
        })}</div>
      </fieldset>
</div></details>
      </section>
      <section aria-labelledby="banner-appearance-title" className="grid gap-4">
        <h3 id="banner-appearance-title" className="m-0 text-base font-semibold">Aparência</h3>
      <fieldset className="m-0 border-0 p-0">
        <legend className={`${labelClassName} mb-1.5 p-0`}>Cor de fundo</legend>
        <div className="flex flex-wrap gap-2">{BANNER_COLOR_OPTIONS.map((option) => {
          const active = (form.bgColor ?? "") === option.value;
          return <button key={option.label} type="button" aria-pressed={active} onClick={() => onChange({ ...form, bgColor: option.value })} className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${active ? "border-primary bg-selection/40 text-primary" : "border-line bg-surface text-ink hover:bg-selection/30"}`}><span aria-hidden="true" className="h-5 w-5 flex-none rounded-full border border-black/10" style={{ background: option.gradient }} />{option.label}{active ? <Check size={15} aria-hidden="true" /> : null}</button>;
        })}</div>
      </fieldset>
        <label className={labelClassName}>URL da imagem <span className="font-normal text-muted">(opcional)</span><input type="text" inputMode="url" autoCapitalize="off" autoCorrect="off" value={form.bgImg ?? ""} onChange={(event) => onChange({ ...form, bgImg: event.target.value })} aria-invalid={Boolean(imageError)} aria-describedby={imageError ? "banner-image-error" : "banner-image-help"} className={fieldClassName} placeholder="https://site.com/imagem.jpg" />{imageError ? <span id="banner-image-error" className="mt-1.5 block text-sm font-semibold text-danger">{imageError}</span> : <span id="banner-image-help" className="mt-1.5 block text-sm leading-5 text-muted">Cole um link público que comece com http:// ou https:// e abra a imagem sem pedir login. Sem imagem, será usada a cor escolhida.</span>}</label>
      </section>
    </div>
    <aside aria-labelledby="banner-preview-title" className="min-w-0 self-start lg:sticky lg:top-0">
      <h3 ref={previewRef} id="banner-preview-title" tabIndex={-1} className="m-0 scroll-mt-4 text-base font-semibold">Prévia no celular</h3>
      <p className="m-0 mb-3 mt-1 text-sm leading-6 text-muted">Acompanhe as alterações antes de publicar.</p>
      <div className="max-w-sm overflow-hidden rounded-xl border border-line" inert aria-hidden="true"><HighlightContent banner={preview} /></div>
    </aside>
  </div>;
}

const DeleteDialog = AdminConfirmDialog;
function QueryError({ title, onRetry, compact = false }: { title: string; onRetry: () => void; compact?: boolean }) { return <div className={`${compact ? "border-t border-line" : "border-y border-line bg-surface md:rounded-2xl md:border"} px-4 py-10 text-center`}><p className="m-0 text-sm font-bold text-ink">{title}</p><p className="m-0 mt-1 text-sm text-muted">Tente novamente em instantes.</p><button type="button" onClick={onRetry} className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white"><RefreshCw size={14} /> Tentar novamente</button></div>; }
function EmptyResource({ icon, title, description }: { icon: ReactNode; title: string; description: string }) { return <div className="border-t border-line px-5 py-10 text-center"><span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-selection/40 text-muted">{icon}</span><p className="m-0 mt-3 text-sm font-bold">{title}</p><p className="mx-auto mb-0 mt-1 max-w-md text-sm leading-5 text-muted">{description}</p></div>; }
function RowsSkeleton({ count = 2 }: { count?: number }) { return <div className="animate-pulse divide-y divide-line/60" aria-label="Carregando conteúdo">{Array.from({ length: count }, (_, index) => <div key={index} className="flex h-[4.75rem] items-center gap-3 px-4 md:px-5"><span className="h-12 w-12 rounded-xl bg-selection/40" /><span className="flex-1"><span className="block h-3.5 w-1/3 rounded bg-selection" /><span className="mt-2 block h-3 w-1/2 rounded bg-selection" /></span></div>)}<span className="sr-only" role="status">Carregando...</span></div>; }
function HomeSkeleton() { return <div className="h-[38rem] animate-pulse rounded-2xl border border-line bg-surface" />; }
function MutationNotice({ error, className }: { error?: Error | null; className?: string }) { return error ? <AdminNotice className={className}>Não foi possível concluir a alteração. Seus dados foram mantidos. Tente novamente.</AdminNotice> : null; }
function bannerRequest(item: PublicHomeBanner, order: number): UpsertBannerRequest { return { tipo: item.tipo, titulo: item.titulo, mensagem: item.mensagem, link: item.link, bgImg: item.bgImg, bgColor: item.bgColor, order }; }
function getBannerUrlError(value?: string | null) { if (!value?.trim()) return undefined; try { return ["http:", "https:"].includes(new URL(value.trim()).protocol) ? undefined : "Use um endereço que comece com https:// ou http://."; } catch { return "Use um endereço completo, começando com https:// ou http://."; } }
function linkRequest(item: PublicLink, order: number): UpsertLinkRequest { return { title: item.title, url: item.url, iconKey: item.iconKey, colorKey: item.colorKey, color: item.color, variant: item.variant, order, isActive: item.isActive }; }
function isValidDestination(value: string) { const normalized = normalizeLinkUrl(value); if (!normalized) return false; try { return ["http:", "https:", "mailto:", "tel:"].includes(new URL(normalized).protocol); } catch { return false; } }
function moveInArray<T>(list: T[], from: number, to: number): T[] { const next = [...list]; const [moved] = next.splice(from, 1); next.splice(to, 0, moved); return next; }
