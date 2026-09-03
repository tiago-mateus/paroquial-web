import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, LoaderCircle, Save } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { getTenant, updateTenant, type UpdateTenantRequest } from "../../shared/api/tenants";
import { ErrorState } from "../../shared/components/PageState";
import { formatBrazilianPhone, isValidBrazilianPhone } from "../../shared/lib/phone";
import { fieldClassName, labelClassName } from "./AdminFormDialog";
import { AdminPageHeader } from "./AdminPageHeader";

const emptyForm: UpdateTenantRequest = { name: "", contato: "", telefone: "", endereco: "", cidade: "", estado: "", homeHeader: { imageUrl: "", imageOpacity: 0.5 }, homeActions: { secretaria: { label: "Secretaria", subtitle: "Falar no WhatsApp" }, confissoes: { label: "Confissões", subtitle: "Ver horários" } }, confessionSchedule: [] };

export function AdminParishPage() {
  const { tenantSlug = "" } = useParams();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["tenant", tenantSlug], queryFn: () => getTenant(tenantSlug), enabled: Boolean(tenantSlug) });
  const [form, setForm] = useState<UpdateTenantRequest>(emptyForm);
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (query.data) setForm({ name: query.data.name, contato: query.data.contato ?? "", telefone: query.data.telefone ?? "", endereco: query.data.endereco ?? "", cidade: query.data.cidade ?? "", estado: query.data.estado ?? "", homeHeader: query.data.homeHeader ?? emptyForm.homeHeader, homeActions: query.data.homeActions ?? emptyForm.homeActions, confessionSchedule: query.data.confessionSchedule ?? [] }); }, [query.data]);
  const mutation = useMutation({ mutationFn: (input: UpdateTenantRequest) => updateTenant(tenantSlug, input), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["tenant", tenantSlug] }); setSaved(true); window.setTimeout(() => setSaved(false), 3000); } });
  const phoneError = form.telefone && !isValidBrazilianPhone(form.telefone) ? "Informe um telefone com DDD válido." : undefined;
  const submit = (event: FormEvent) => { event.preventDefault(); if (!phoneError) mutation.mutate(form); };

  if (query.isLoading) return <ParishSkeleton />;
  if (query.isError) return <section className="min-h-dvh bg-stone-50"><AdminPageHeader eyebrow="Identidade pública" title="Paróquia" /><div className="mx-auto max-w-7xl p-6"><ErrorState title="Não foi possível carregar a paróquia" description="Tente novamente em instantes." /></div></section>;

  return (
    <section className="min-h-[calc(100dvh-4rem)] bg-white text-slate-950 md:min-h-dvh md:bg-stone-50">
      <AdminPageHeader eyebrow="Identidade pública" title="Paróquia" description="Edite os dados institucionais e os contatos exibidos aos fiéis." actions={<Link to={`/${tenantSlug}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600"><ExternalLink size={15} /> Conferir página</Link>} />
      <form noValidate onSubmit={submit} className="mx-auto max-w-5xl md:px-6 md:py-6 lg:px-8">
        <div className="divide-y divide-slate-100 md:overflow-hidden md:rounded-2xl md:border md:border-slate-200 md:bg-white">
          <FormSection title="Dados institucionais" description="Identificação e localização exibidas aos fiéis">
            <div className="grid gap-4 sm:grid-cols-2"><label className={`${labelClassName} sm:col-span-2`}>Nome oficial<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={fieldClassName} /></label><label className={`${labelClassName} sm:col-span-2`}>Endereço<input value={form.endereco ?? ""} onChange={(event) => setForm({ ...form, endereco: event.target.value })} className={fieldClassName} /></label><label className={labelClassName}>Cidade<input value={form.cidade ?? ""} onChange={(event) => setForm({ ...form, cidade: event.target.value })} className={fieldClassName} /></label><label className={labelClassName}>Estado<input maxLength={2} value={form.estado ?? ""} onChange={(event) => setForm({ ...form, estado: event.target.value.toUpperCase() })} className={fieldClassName} /></label></div>
          </FormSection>
          <FormSection title="Contato" description="Canais usados na página pública"><div className="grid gap-4 sm:grid-cols-2"><label className={labelClassName}>Telefone ou WhatsApp<input type="tel" inputMode="tel" autoComplete="tel" value={form.telefone ?? ""} onChange={(event) => setForm({ ...form, telefone: formatBrazilianPhone(event.target.value) })} aria-invalid={Boolean(phoneError)} aria-describedby={phoneError ? "parish-phone-error" : undefined} className={`${fieldClassName} ${phoneError ? "border-red-400" : ""}`} />{phoneError ? <span id="parish-phone-error" className="mt-1.5 block text-[0.68rem] font-semibold text-red-700">{phoneError}</span> : null}</label><label className={labelClassName}>E-mail<input value={form.contato ?? ""} onChange={(event) => setForm({ ...form, contato: event.target.value })} className={fieldClassName} /></label></div></FormSection>
          <div className="sticky bottom-16 flex items-center gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:static md:px-5"><span className={`text-xs font-semibold ${phoneError ? "text-red-700" : "text-emerald-700"}`} role="status">{phoneError ?? (saved ? "Alterações publicadas" : "")}</span><button type="submit" disabled={mutation.isPending || Boolean(phoneError)} className="ml-auto inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white disabled:bg-slate-200 disabled:text-slate-500">{mutation.isPending ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />} Salvar alterações</button></div>
        </div>
      </form>
    </section>
  );
}

function FormSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="px-4 py-5 md:px-5"><h2 className="m-0 text-sm font-bold">{title}</h2><p className="m-0 mt-0.5 text-xs text-slate-500">{description}</p><div className="mt-4">{children}</div></section>; }
function ParishSkeleton() { return <section className="min-h-dvh animate-pulse bg-stone-50"><AdminPageHeader eyebrow="Identidade pública" title="Paróquia" /><div className="mx-auto max-w-7xl p-6"><div className="h-96 rounded-2xl bg-white" /></div></section>; }
