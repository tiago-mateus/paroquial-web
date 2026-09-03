import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CalendarPlus, ChevronRight, ExternalLink, LoaderCircle, Save } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { getTenant, updateTenant, type ConfessionScheduleItem, type UpdateTenantRequest } from "../../shared/api/tenants";
import { AdminPageHeader } from "./AdminPageHeader";
import { ConfessionScheduleEditor } from "./ConfessionScheduleEditor";
import { validateConfessionSchedule } from "./confessionSchedule";

export function AdminSchedulesPage() {
  const { tenantSlug = "" } = useParams();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["tenant", tenantSlug], queryFn: () => getTenant(tenantSlug), enabled: Boolean(tenantSlug) });
  const [items, setItems] = useState<ConfessionScheduleItem[]>([]);
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (query.data) setItems(query.data.confessionSchedule ?? []); }, [query.data]);
  const mutation = useMutation({ mutationFn: (input: UpdateTenantRequest) => updateTenant(tenantSlug, input), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["tenant", tenantSlug] }); setSaved(true); window.setTimeout(() => setSaved(false), 3000); } });
  const errors = validateConfessionSchedule(items);
  const hasErrors = Boolean(Object.keys(errors).length);
  const submit = (event: FormEvent) => { event.preventDefault(); if (!query.data || hasErrors) return; mutation.mutate({ name: query.data.name, contato: query.data.contato, telefone: query.data.telefone, endereco: query.data.endereco, cidade: query.data.cidade, estado: query.data.estado, homeHeader: query.data.homeHeader, homeActions: query.data.homeActions, confessionSchedule: items }); };

  return (
    <section className="min-h-[calc(100dvh-4rem)] bg-white text-slate-950 md:min-h-dvh md:bg-stone-50">
      <AdminPageHeader eyebrow="Rotina paroquial" title="Horários fixos" description="Organize confissões e direcione celebrações recorrentes para a agenda." actions={<Link to={`/${tenantSlug}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600"><ExternalLink size={15} /> Conferir início</Link>} />
      <form noValidate onSubmit={submit} className="mx-auto max-w-5xl md:px-6 md:py-6 lg:px-8">
        <section className="border-b border-slate-100 md:overflow-hidden md:rounded-2xl md:border md:border-slate-200 md:bg-white" aria-labelledby="confession-title">
          <div className="px-4 pb-1 pt-4 md:px-5"><h2 id="confession-title" className="m-0 text-sm font-bold">Horários de confissão</h2><p className="m-0 mt-0.5 text-xs text-slate-500">Exibidos no botão Confissões da página inicial</p></div>
          <div className="px-4 pb-4 md:px-5">{query.isLoading ? <div className="py-6 text-sm text-slate-400">Carregando horários...</div> : <ConfessionScheduleEditor items={items} onChange={setItems} errors={errors} disabled={mutation.isPending} idPrefix="schedules-confession" />}</div>
          <div className="sticky bottom-16 flex items-center gap-3 border-t border-slate-100 bg-white/95 px-4 py-3 backdrop-blur md:static md:px-5"><span role="status" className={`text-xs font-semibold ${hasErrors ? "text-red-700" : "text-emerald-700"}`}>{hasErrors ? "Revise os horários" : saved ? "Horários publicados" : ""}</span><button type="submit" disabled={mutation.isPending || query.isLoading || hasErrors} className="ml-auto inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white disabled:bg-slate-200 disabled:text-slate-500">{mutation.isPending ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />} Salvar horários</button></div>
        </section>
        <section className="mt-4 md:overflow-hidden md:rounded-2xl md:border md:border-slate-200 md:bg-white" aria-labelledby="recurring-title"><div className="px-4 pb-2 pt-4 md:px-5"><h2 id="recurring-title" className="m-0 text-sm font-bold">Missas e celebrações recorrentes</h2><p className="m-0 mt-0.5 text-xs text-slate-500">Pertencem à agenda para manter data, local e recorrência juntos</p></div><Link to={`/${tenantSlug}/admin/calendario?action=new`} className="flex min-h-[4.5rem] items-center gap-3 border-t border-slate-100 px-4 py-3 md:px-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-800"><CalendarPlus size={18} /></span><span className="min-w-0 flex-1"><strong className="block text-sm">Criar celebração recorrente</strong><small className="text-xs text-slate-500">Cadastre o horário semanal ou mensal na agenda</small></span><ChevronRight size={16} className="text-slate-300" /></Link></section>
        <section className="mt-4 md:overflow-hidden md:rounded-2xl md:border md:border-slate-200 md:bg-white"><div className="px-4 pb-2 pt-4 md:px-5"><h2 className="m-0 text-sm font-bold">Atendimento da secretaria</h2><p className="m-0 mt-0.5 text-xs text-slate-500">O contato público utiliza os dados institucionais</p></div><Link to={`/${tenantSlug}/admin/paroquia`} className="flex min-h-[4.5rem] items-center gap-3 border-t border-slate-100 px-4 py-3 md:px-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-700"><CalendarClock size={18} /></span><span className="min-w-0 flex-1"><strong className="block text-sm">Revisar contato da secretaria</strong><small className="text-xs text-slate-500">Telefone, WhatsApp e chamada da página inicial</small></span><ChevronRight size={16} className="text-slate-300" /></Link></section>
      </form>
    </section>
  );
}
