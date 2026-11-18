import { toast } from "sonner";
import { AdminNotice } from "./AdminNotice";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Building2, MapPin, MapPinPlus, Pencil, Plus, Scan, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { createChurch, deleteChurch, getTenantChurches, hasValidChurchCoordinates, updateChurch, type PublicChurch, type UpsertChurchRequest } from "../../shared/api/churches";
import { ErrorState } from "../../shared/components/PageState";
import { AdminFormDialog } from "./AdminFormDialog";
import { fieldClassName, labelClassName } from "./AdminFormStyles";
import { AdminPageHeader } from "./AdminPageHeader";
import { AdminPage } from "./AdminPage";
import { ChurchLocationPicker, type ChurchLocation } from "./ChurchLocationPicker";
import { AdminConfirmDialog } from "./AdminConfirmDialog";
import { normalizeChurchSearch } from "../churches/churches.utils";
import { ChurchMapStylePicker, type ChurchMapStyle } from "../churches/ChurchMapStylePicker";
import { AdminChurchesMap } from "./AdminChurchesMap";
import { reversePlace } from "../../shared/api/geocoding";
import { ChurchRegistrationForm, type ChurchAddressStatus, type ChurchRegistrationStep } from "./ChurchRegistrationForm";
import { churchRegistrationError } from "./churchRegistration.utils";

type ChurchEditor = { kind: "create" } | { kind: "edit"; church: PublicChurch };

const emptyChurch: UpsertChurchRequest = { nome: "", endereco: "", latitude: 0, longitude: 0, urlImg: "", telefone: null, tipo: "capela" };

export function AdminChurchesPage() {
  const { tenantSlug = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<ChurchEditor | null>(null);
  const [form, setForm] = useState<UpsertChurchRequest>(emptyChurch);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  const [overviewKey, setOverviewKey] = useState(0);
  const [mapStyle, setMapStyle] = useState<ChurchMapStyle>("light");
  const [mapStyleOpen, setMapStyleOpen] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<ChurchRegistrationStep>("location");
  const [addressStatus, setAddressStatus] = useState<ChurchAddressStatus>("idle");
  const addressAbort = useRef<AbortController | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const mapFrameRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const pickButtonRef = useRef<HTMLButtonElement>(null);
  const pickCancelRef = useRef<HTMLButtonElement>(null);
  const restorePickFocus = useRef(false);
  const query = useQuery({ queryKey: ["churches", tenantSlug], queryFn: () => getTenantChurches(tenantSlug), enabled: Boolean(tenantSlug), retry: false });
  const refresh = async () => queryClient.invalidateQueries({ queryKey: ["churches", tenantSlug] });
  const createMutation = useMutation({ mutationFn: (input: UpsertChurchRequest) => createChurch(tenantSlug, input), onSuccess: refresh });
  const updateMutation = useMutation({ mutationFn: ({ id, input }: { id: string; input: UpsertChurchRequest }) => updateChurch(tenantSlug, id, input), onSuccess: refresh });
  const deleteMutation = useMutation({ mutationFn: (id: string) => deleteChurch(tenantSlug, id), onSuccess: refresh });
  const pending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const filtered = useMemo(() => (query.data ?? []).filter((church) => normalizeChurchSearch(`${church.nome} ${church.endereco}`).includes(normalizeChurchSearch(search.trim()))), [query.data, search]);
  const knownChurch = useMemo(() => query.data?.find(hasValidChurchCoordinates), [query.data]);
  const mapCenter = useMemo(() => knownChurch ?? { latitude: -23.55052, longitude: -46.633308 }, [knownChurch]);
  const initialForm = editor?.kind === "edit" ? { nome: editor.church.nome, endereco: editor.church.endereco, latitude: editor.church.latitude, longitude: editor.church.longitude, urlImg: editor.church.urlImg, telefone: editor.church.telefone, tipo: editor.church.tipo } : emptyChurch;
  const formDirty = Boolean(editor) && JSON.stringify(form) !== JSON.stringify(initialForm);
  const registrationError = editor?.kind === "create" && registrationStep === "details" ? churchRegistrationError(form) : undefined;
  const locationMissing = !hasValidChurchCoordinates(form);

  useEffect(() => () => addressAbort.current?.abort(), []);

  useEffect(() => {
    const frame = mapFrameRef.current;
    if (!frame) return;
    const resize = () => frame.style.setProperty("--church-map-top", `${frame.getBoundingClientRect().top + window.scrollY}px`);
    resize();
    window.addEventListener("resize", resize);
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(resize);
    if (headerRef.current) observer?.observe(headerRef.current);
    const workspace = document.querySelector(".admin-workspace");
    if (workspace) observer?.observe(workspace);
    return () => { window.removeEventListener("resize", resize); observer?.disconnect(); };
  }, []);

  useEffect(() => {
    if (!picking) {
      if (restorePickFocus.current) { pickButtonRef.current?.focus(); restorePickFocus.current = false; }
      return;
    }
    pickCancelRef.current?.focus();
    const cancel = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      restorePickFocus.current = true;
      setPicking(false);
    };
    document.addEventListener("keydown", cancel);
    return () => document.removeEventListener("keydown", cancel);
  }, [picking]);

  useEffect(() => { if (listOpen) searchRef.current?.focus(); }, [listOpen]);

  useEffect(() => {
    if (params.get("action") !== "new") return;
    addressAbort.current?.abort();
    setForm(emptyChurch); setRegistrationStep("location"); setAddressStatus("idle"); setDetailsOpen(false); setEditor({ kind: "create" });
    const next = new URLSearchParams(params); next.delete("action"); setParams(next, { replace: true });
  }, [params, setParams]);
  function resetErrors() { addressAbort.current?.abort(); setAddressStatus("idle"); createMutation.reset(); updateMutation.reset(); deleteMutation.reset(); }
  function openCreate() { resetErrors(); setPicking(false); setForm(emptyChurch); setRegistrationStep("location"); setDetailsOpen(false); setEditor({ kind: "create" }); }
  function openCreateAt(location: ChurchLocation) {
    resetErrors(); setPicking(false); setForm({ ...emptyChurch, ...location }); setRegistrationStep("details"); setDetailsOpen(false); setEditor({ kind: "create" });
    const controller = new AbortController();
    addressAbort.current = controller;
    setAddressStatus("loading");
    void reversePlace(location, controller.signal).then((place) => {
      if (controller.signal.aborted) return;
      if (!place?.address) { setAddressStatus("unavailable"); return; }
      setForm((current) => current.latitude === location.latitude && current.longitude === location.longitude && !current.endereco.trim() ? { ...current, endereco: place.address } : current);
      setAddressStatus("ready");
    }).catch(() => { if (!controller.signal.aborted) setAddressStatus("unavailable"); });
  }
  function openEdit(church: PublicChurch) { resetErrors(); setPicking(false); setSelectedId(church.id); setListOpen(false); setForm({ nome: church.nome, endereco: church.endereco, latitude: church.latitude, longitude: church.longitude, urlImg: church.urlImg, telefone: church.telefone, tipo: church.tipo }); setDetailsOpen(Boolean(church.telefone || church.urlImg)); setEditor({ kind: "edit", church }); }
  function closeEditor() { addressAbort.current?.abort(); setEditor(null); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || locationMissing) return;
    if (editor?.kind === "create" && registrationStep === "location") { setRegistrationStep("details"); return; }
    if (!form.nome.trim() || registrationError) return;
    const input = { ...form, nome: form.nome.trim(), endereco: form.endereco.trim(), urlImg: form.urlImg.trim(), telefone: form.telefone?.trim() || null };
    const saved = editor?.kind === "edit" ? await updateMutation.mutateAsync({ id: editor.church.id, input }) : await createMutation.mutateAsync(input);
    setSelectedId(saved.id); setSearch(""); setListOpen(false);
    toast.success(editor?.kind === "edit" ? "Igreja atualizada" : "Igreja cadastrada"); closeEditor();
  }
  async function remove() { if (editor?.kind !== "edit") return; await deleteMutation.mutateAsync(editor.church.id); setDeleteOpen(false); setEditor(null); toast.success("Igreja excluída"); }

  return (
    <AdminPage header={<div ref={headerRef}><AdminPageHeader title="Igrejas e capelas" density="compact" compactActions description="Localize as igrejas e marque no mapa para cadastrar um novo local." publicHref={`/${tenantSlug}/igrejas`} publicLabel="Ver mapa público" primaryAction={{ kind: "create", label: "Nova igreja", icon: Plus, onClick: openCreate, mobileHidden: picking }} /></div>}>
      <div ref={mapFrameRef} className="admin-church-map relative isolate mt-3 min-h-80 overflow-hidden border-y border-line bg-map-background" style={{ height: "calc(100dvh - var(--church-map-top, 12rem) - var(--admin-nav-offset, 4.5rem))" }}>
        <h2 className="sr-only">Mapa das igrejas e capelas</h2>
        <AdminChurchesMap churches={filtered} selectedId={selectedId} picking={picking} overviewKey={overviewKey} mapStyle={mapStyle} onPick={openCreateAt} onSelect={openEdit} onSelectGroup={() => { setListOpen(true); setPicking(false); }} />
        {!picking && !listOpen ? <button type="button" onClick={() => setListOpen(true)} aria-expanded={false} aria-controls="admin-church-search-panel" className="absolute left-3 right-16 top-3 z-20 inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm text-muted hover:bg-selection focus-visible:outline-2 focus-visible:outline-focus xl:hidden"><Search size={17} aria-hidden="true" />Buscar igrejas</button> : null}
        <div className={listOpen ? "hidden xl:block" : ""}><ChurchMapStylePicker value={mapStyle} open={mapStyleOpen} onChange={setMapStyle} onOpenChange={setMapStyleOpen} /></div>
        <section id="admin-church-search-panel" aria-labelledby="churches-list-title" className={`absolute left-3 top-3 z-20 max-h-[calc(100%-6rem)] w-[calc(100%-1.5rem)] max-w-80 flex-col overflow-hidden rounded-2xl border border-line bg-surface ${picking ? "hidden" : listOpen || query.isError || query.isLoading || query.data?.length === 0 ? "flex" : "hidden xl:flex"}`}>
        <div className="border-b border-line px-4 pb-4 pt-3">
          <div className="mb-2 flex min-h-11 items-center justify-between gap-2"><h2 id="churches-list-title" className="m-0 text-base font-bold">Locais cadastrados</h2><button type="button" aria-label="Fechar busca de igrejas" onClick={() => setListOpen(false)} className={`h-11 w-11 place-items-center rounded-lg text-muted hover:bg-selection focus-visible:outline-2 focus-visible:outline-focus ${query.isLoading || query.isError || query.data?.length === 0 ? "hidden" : "grid xl:hidden"}`}><X size={18} aria-hidden="true" /></button></div>
          <label className="relative block min-w-0"><span className="sr-only">Buscar igreja ou endereço</span><Search size={17} className="absolute left-3 top-4 text-muted" aria-hidden="true" /><input ref={searchRef} type="search" value={search} onChange={(event) => { setSearch(event.target.value); setSelectedId(undefined); }} placeholder="Nome ou endereço" className={`${fieldClassName} mt-0 pl-10`} /></label>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-4">
        {query.isLoading ? <ChurchListSkeleton /> : query.isError ? <div className="px-4 py-8"><ErrorState title="Não foi possível carregar os locais" description="Tente novamente em instantes." /><button type="button" onClick={() => void query.refetch()} className="mt-4 min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-white">Tentar novamente</button></div> : (
          <div className="divide-y divide-line/60">
            <p role="status" className="m-0 py-3 text-sm text-muted">{filtered.length} {filtered.length === 1 ? "local encontrado" : "locais encontrados"}</p>
            {filtered.map((church) => <ChurchRow key={church.id} church={church} onEdit={() => openEdit(church)} />)}
            {!filtered.length ? <div className="px-5 py-12 text-center"><p className="m-0 text-base font-semibold text-ink">{search.trim() ? "Nenhum local encontrado" : "Nenhum local cadastrado"}</p><p className="mb-0 mt-1 text-sm text-muted">{search.trim() ? "Tente buscar por outro nome ou endereço." : "Adicione uma igreja, capela ou comunidade para aparecer no mapa público."}</p>{search.trim() ? <button type="button" onClick={() => setSearch("")} className="mt-4 min-h-11 rounded-xl border border-line px-4 text-sm font-semibold text-primary">Limpar busca</button> : null}</div> : null}
          </div>
        )}
        </div>
        </section>
        {picking ? <div role="status" className="absolute inset-x-3 bottom-6 z-30 mx-auto max-w-xl rounded-2xl border border-line bg-surface p-3 shadow-lg"><div className="flex items-start gap-2"><MapPinPlus size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" /><p className="m-0 flex-1 text-sm font-semibold leading-6">Marque no mapa onde fica a nova igreja.</p><button ref={pickCancelRef} type="button" aria-label="Cancelar marcação no mapa" onClick={() => { restorePickFocus.current = true; setPicking(false); }} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-muted hover:bg-selection focus-visible:outline-2 focus-visible:outline-focus"><X size={18} aria-hidden="true" /></button></div><button type="button" onClick={openCreate} className="mt-1 min-h-11 rounded-lg px-2 text-sm font-semibold text-primary hover:bg-selection focus-visible:outline-2 focus-visible:outline-focus">Prefiro preencher o formulário</button></div> : <div className="admin-church-map-actions absolute bottom-8 right-3 z-20 flex flex-col items-end gap-2">
          <button type="button" aria-label="Ver todas as igrejas no mapa" onClick={() => { setSearch(""); setSelectedId(undefined); setOverviewKey((key) => key + 1); setListOpen(false); }} className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-surface text-primary hover:bg-selection focus-visible:outline-2 focus-visible:outline-focus"><Scan size={20} aria-hidden="true" /></button>
          <button ref={pickButtonRef} type="button" disabled={query.isLoading || query.isError} onClick={() => { setPicking(true); setListOpen(false); setMapStyleOpen(false); }} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-control-border bg-surface px-4 text-sm font-semibold text-primary hover:bg-selection focus-visible:outline-2 focus-visible:outline-focus"><MapPinPlus size={19} aria-hidden="true" />Cadastrar no mapa</button>
        </div>}
      </div>
      <AdminFormDialog open={Boolean(editor)} eyebrow={editor?.kind === "create" ? registrationStep === "location" ? "Etapa 1 de 2 · Localização" : "Etapa 2 de 2 · Dados da igreja" : ""} title={editor?.kind === "edit" ? "Editar igreja" : "Nova igreja"} submitLabel={editor?.kind === "edit" ? "Salvar alterações" : registrationStep === "location" ? "Continuar" : "Cadastrar igreja"} contentKey={editor?.kind === "create" ? registrationStep : "edit"} initialFocusRef={editor?.kind === "create" ? nameRef : undefined} pending={pending} dirty={formDirty} submitDisabled={locationMissing || Boolean(registrationError) || (editor?.kind === "edit" && !formDirty)} submitHint={locationMissing ? "Marque o local no mapa para continuar." : registrationError} onClose={closeEditor} onSubmit={(event) => { void submit(event).catch(() => undefined); }} onDelete={editor?.kind === "edit" ? () => { deleteMutation.reset(); setDeleteOpen(true); } : undefined}>
        {createMutation.error || updateMutation.error ? <AdminNotice className="mb-4">Não foi possível salvar. Seus dados foram mantidos. Tente novamente.</AdminNotice> : null}
        {editor?.kind === "create" ? <ChurchRegistrationForm step={registrationStep} onStepChange={setRegistrationStep} form={form} setForm={setForm} center={mapCenter} searchNear={knownChurch} churches={query.data ?? []} nameRef={nameRef} addressStatus={addressStatus} onLocationChange={(location) => { addressAbort.current?.abort(); setAddressStatus("idle"); setForm((current) => ({ ...current, ...location })); }} /> : <div className="grid gap-4 sm:grid-cols-2">
          <h3 className="m-0 text-lg font-semibold sm:col-span-2">Identificação</h3>
          <label className={`${labelClassName} sm:col-span-2`}>Nome<input required value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} className={fieldClassName} /></label>
          <label className={labelClassName}>Tipo<select value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value })} className={fieldClassName}><option value="matriz">Matriz</option><option value="capela">Capela</option><option value="comunidade">Comunidade</option></select></label>
          <div className="sm:col-span-2 border-t border-line pt-5"><ChurchLocationPicker location={{ latitude: form.latitude, longitude: form.longitude }} center={mapCenter} searchNear={knownChurch} address={form.endereco} onLocationChange={(location) => setForm((current) => ({ ...current, ...location }))} onAddressChange={(endereco) => setForm((current) => ({ ...current, endereco }))} /></div>
          <details className="sm:col-span-2 text-sm text-muted"><summary className="min-h-11 cursor-pointer py-3 font-semibold text-ink">Informar coordenadas manualmente</summary><div className="grid gap-3 pb-2 sm:grid-cols-2"><label className={labelClassName}>Latitude<input type="number" min="-90" max="90" step="any" value={form.latitude || ""} onChange={(event) => setForm({ ...form, latitude: Number(event.target.value) })} className={fieldClassName} /></label><label className={labelClassName}>Longitude<input type="number" min="-180" max="180" step="any" value={form.longitude || ""} onChange={(event) => setForm({ ...form, longitude: Number(event.target.value) })} className={fieldClassName} /></label></div></details>
          <details open={detailsOpen} onToggle={(event) => setDetailsOpen(event.currentTarget.open)} className="sm:col-span-2 border-t border-line pt-2 text-sm text-muted"><summary className="min-h-11 cursor-pointer py-3 font-semibold text-ink">Apresentação e contato <span className="font-normal text-muted">(opcional)</span></summary><div className="grid gap-4 pb-2 sm:grid-cols-2"><label className={labelClassName}>Telefone<input type="tel" inputMode="tel" autoComplete="tel" value={form.telefone ?? ""} onChange={(event) => setForm({ ...form, telefone: event.target.value || null })} className={fieldClassName} /></label><label className={labelClassName}>URL da imagem<input type="url" value={form.urlImg} onChange={(event) => setForm({ ...form, urlImg: event.target.value })} placeholder="https://..." className={fieldClassName} /></label></div></details>
        </div>}
      </AdminFormDialog>
      <AdminConfirmDialog open={deleteOpen} title="Excluir igreja?" description={`${form.nome} será removida da gestão e do mapa público.`} pending={deleteMutation.isPending} error={deleteMutation.error} onClose={() => setDeleteOpen(false)} onConfirm={() => { void remove().catch(() => undefined); }} />
    </AdminPage>
  );
}

function ChurchRow({ church, onEdit }: { church: PublicChurch; onEdit: () => void }) {
  const missing = [!hasValidChurchCoordinates(church) ? "localização" : null, !church.endereco?.trim() ? "endereço" : null, !church.urlImg?.trim() ? "imagem" : null].filter((value): value is string => Boolean(value));
  const missingText = missing.length > 1 ? `${missing.slice(0, -1).join(", ")} e ${missing.at(-1)}` : missing[0];
  const typeLabel = church.tipo === "matriz" ? "Matriz" : church.tipo === "capela" ? "Capela" : "Comunidade";
  return <button type="button" onClick={onEdit} aria-label={`Editar ${church.nome}`} className="grid w-full grid-cols-[2.75rem_minmax(0,1fr)_1.5rem] items-start gap-3 px-0 py-4 text-left transition hover:bg-selection/35 focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary md:grid-cols-[3rem_minmax(0,1fr)_2rem] md:px-0">
    <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-selection/40 text-primary md:h-12 md:w-12">{church.urlImg ? <img src={church.urlImg} alt="" className="h-full w-full object-cover" /> : <Building2 size={19} aria-hidden="true" />}</span>
    <span className="min-w-0"><small className="block text-sm font-medium text-muted">{typeLabel}</small><strong className="mt-0.5 block text-base leading-5 text-ink">{church.nome}</strong>
      {church.endereco ? <span className="mt-1.5 flex min-w-0 items-start gap-1 text-sm leading-4 text-muted"><MapPin size={13} className="mt-0.5 shrink-0" aria-hidden="true" /><span className="line-clamp-2 break-words" title={church.endereco}>{church.endereco}</span></span> : null}
      {missingText ? <span className={`mt-2 flex items-start gap-1 text-sm leading-5 ${missing.some((item) => item !== "imagem") ? "text-warning" : "text-muted"}`}><AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" /><span>{missing.length > 1 ? "Faltam" : "Falta"} {missingText}</span></span> : null}
    </span>
    <span className="grid h-8 w-6 place-items-center text-muted" aria-hidden="true"><Pencil size={16} /></span>
  </button>;
}

function ChurchListSkeleton() { return <div className="animate-pulse divide-y divide-line/60">{[0, 1, 2].map((item) => <div key={item} className="flex gap-3 px-4 py-4"><span className="h-12 w-12 rounded-xl bg-selection/40" /><span className="flex-1"><span className="block h-4 w-1/2 rounded bg-selection" /><span className="mt-2 block h-3 w-2/3 rounded bg-selection" /></span></div>)}</div>; }
