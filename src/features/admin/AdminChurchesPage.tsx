import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Building2, ExternalLink, MapPin, Pencil, Plus, Search } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { createChurch, deleteChurch, getTenantChurches, hasValidChurchCoordinates, updateChurch, type PublicChurch, type UpsertChurchRequest } from "../../shared/api/churches";
import { ErrorState } from "../../shared/components/PageState";
import { AdminFormDialog, fieldClassName, labelClassName } from "./AdminFormDialog";
import { AdminPageHeader } from "./AdminPageHeader";

type ChurchEditor = { kind: "create" } | { kind: "edit"; church: PublicChurch };

const emptyChurch: UpsertChurchRequest = { nome: "", endereco: "", latitude: 0, longitude: 0, urlImg: "", telefone: null, tipo: "capela" };

export function AdminChurchesPage() {
  const { tenantSlug = "" } = useParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<ChurchEditor | null>(null);
  const [form, setForm] = useState<UpsertChurchRequest>(emptyChurch);
  const query = useQuery({ queryKey: ["churches", tenantSlug], queryFn: () => getTenantChurches(tenantSlug), enabled: Boolean(tenantSlug), retry: false });
  const refresh = async () => queryClient.invalidateQueries({ queryKey: ["churches", tenantSlug] });
  const createMutation = useMutation({ mutationFn: (input: UpsertChurchRequest) => createChurch(tenantSlug, input), onSuccess: refresh });
  const updateMutation = useMutation({ mutationFn: ({ id, input }: { id: string; input: UpsertChurchRequest }) => updateChurch(tenantSlug, id, input), onSuccess: refresh });
  const deleteMutation = useMutation({ mutationFn: (id: string) => deleteChurch(tenantSlug, id), onSuccess: refresh });
  const pending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const filtered = useMemo(() => (query.data ?? []).filter((church) => `${church.nome} ${church.endereco}`.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR"))), [query.data, search]);

  function openCreate() { setForm(emptyChurch); setEditor({ kind: "create" }); }
  function openEdit(church: PublicChurch) { setForm({ nome: church.nome, endereco: church.endereco, latitude: church.latitude, longitude: church.longitude, urlImg: church.urlImg, telefone: church.telefone, tipo: church.tipo }); setEditor({ kind: "edit", church }); }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!form.nome.trim()) return; if (editor?.kind === "edit") await updateMutation.mutateAsync({ id: editor.church.id, input: form }); else await createMutation.mutateAsync(form); setEditor(null); }
  async function remove() { if (editor?.kind !== "edit" || !window.confirm(`Excluir ${editor.church.nome}?`)) return; await deleteMutation.mutateAsync(editor.church.id); setEditor(null); }

  return (
    <section className="min-h-[calc(100dvh-4rem)] bg-white text-slate-950 md:min-h-dvh md:bg-stone-50">
      <AdminPageHeader eyebrow="Locais publicados" title="Igrejas e capelas" description="Mantenha os locais que aparecem no mapa público." actions={<><Link to={`/${tenantSlug}/igrejas`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600"><ExternalLink size={15} /> Ver mapa</Link><button type="button" onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-3.5 text-xs font-bold text-white"><Plus size={16} /> Nova igreja</button></>} />
      <div className="mx-auto max-w-7xl pb-4 md:px-6 md:py-6 lg:px-8">
        <div className="flex gap-2 border-b border-slate-100 px-4 py-3 md:rounded-t-2xl md:border md:border-b-0 md:border-slate-200 md:bg-white md:px-5">
          <label className="relative min-w-0 flex-1"><span className="sr-only">Buscar igreja</span><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar igreja ou endereço" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-amber-400 focus:bg-white" /></label>
          <button type="button" onClick={openCreate} aria-label="Nova igreja" className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-slate-950 text-white md:hidden"><Plus size={18} /></button>
        </div>
        {query.isLoading ? <ChurchListSkeleton /> : query.isError ? <div className="px-4 py-8 md:border md:border-t-0 md:border-slate-200 md:bg-white"><ErrorState title="Não foi possível carregar os locais" description="Tente novamente em instantes." /></div> : (
          <div className="divide-y divide-slate-100 md:overflow-hidden md:rounded-b-2xl md:border md:border-slate-200 md:bg-white">
            {filtered.map((church) => <ChurchRow key={church.id} church={church} onEdit={() => openEdit(church)} />)}
            {!filtered.length ? <div className="px-4 py-10 text-center text-sm text-slate-500">Nenhuma igreja encontrada.</div> : null}
          </div>
        )}
      </div>
      <AdminFormDialog open={Boolean(editor)} eyebrow="Mapa público" title={editor?.kind === "edit" ? "Editar igreja" : "Nova igreja"} submitLabel={editor?.kind === "edit" ? "Salvar alterações" : "Cadastrar igreja"} pending={pending} onClose={() => setEditor(null)} onSubmit={submit} onDelete={editor?.kind === "edit" ? remove : undefined}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={`${labelClassName} sm:col-span-2`}>Nome<input required value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} className={fieldClassName} /></label>
          <label className={labelClassName}>Tipo<select value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value })} className={fieldClassName}><option value="matriz">Matriz</option><option value="capela">Capela</option><option value="comunidade">Comunidade</option></select></label>
          <label className={labelClassName}>Telefone<input value={form.telefone ?? ""} onChange={(event) => setForm({ ...form, telefone: event.target.value || null })} className={fieldClassName} /></label>
          <label className={`${labelClassName} sm:col-span-2`}>Endereço<input value={form.endereco} onChange={(event) => setForm({ ...form, endereco: event.target.value })} className={fieldClassName} /></label>
          <label className={`${labelClassName} sm:col-span-2`}>URL da imagem<input type="url" value={form.urlImg} onChange={(event) => setForm({ ...form, urlImg: event.target.value })} placeholder="https://..." className={fieldClassName} /></label>
          <label className={labelClassName}>Latitude<input type="number" step="any" value={form.latitude || ""} onChange={(event) => setForm({ ...form, latitude: Number(event.target.value) })} className={fieldClassName} /></label>
          <label className={labelClassName}>Longitude<input type="number" step="any" value={form.longitude || ""} onChange={(event) => setForm({ ...form, longitude: Number(event.target.value) })} className={fieldClassName} /></label>
        </div>
      </AdminFormDialog>
    </section>
  );
}

function ChurchRow({ church, onEdit }: { church: PublicChurch; onEdit: () => void }) {
  const issues = [!church.urlImg?.trim() ? "Sem imagem" : null, !church.endereco?.trim() ? "Sem endereço" : null, !hasValidChurchCoordinates(church) ? "Fora do mapa" : null].filter(Boolean);
  return <button type="button" onClick={onEdit} className="grid w-full grid-cols-[3rem_minmax(0,1fr)_2.5rem] items-center gap-3 px-4 py-3 text-left transition hover:bg-stone-50 md:px-5"><span className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-amber-50 text-amber-800">{church.urlImg ? <img src={church.urlImg} alt="" className="h-full w-full object-cover" /> : <Building2 size={19} />}</span><span className="min-w-0"><small className="block text-[0.62rem] font-bold text-amber-700">{church.tipo === "matriz" ? "Matriz" : church.tipo === "capela" ? "Capela" : "Comunidade"}</small><strong className="mt-0.5 block truncate text-sm">{church.nome}</strong><span className="mt-1 flex min-w-0 flex-wrap gap-1.5 text-xs text-slate-500">{church.endereco ? <span className="inline-flex min-w-0 items-center gap-1"><MapPin size={12} /><span className="truncate">{church.endereco}</span></span> : null}{issues.map((issue) => <span key={issue} className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[0.6rem] font-bold text-amber-800"><AlertCircle size={10} />{issue}</span>)}</span></span><span className="grid h-10 w-10 place-items-center rounded-xl text-slate-400"><Pencil size={16} /></span></button>;
}

function ChurchListSkeleton() { return <div className="animate-pulse divide-y divide-slate-100 md:border md:border-slate-200 md:bg-white">{[0, 1, 2].map((item) => <div key={item} className="flex gap-3 px-4 py-4"><span className="h-12 w-12 rounded-xl bg-slate-100" /><span className="flex-1"><span className="block h-4 w-1/2 rounded bg-slate-100" /><span className="mt-2 block h-3 w-2/3 rounded bg-slate-100" /></span></div>)}</div>; }
