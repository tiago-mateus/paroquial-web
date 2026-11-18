import { toast } from "sonner";
import { useAdminDraft } from "./useAdminDraft";
import { updateTenantFields } from "./updateTenantFields";
import { AdminSaveBar } from "./AdminSaveBar";
import { UnsavedChanges } from "./UnsavedChanges";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { getTenant, type Tenant, type UpdateTenantRequest } from "../../shared/api/tenants";
import { ErrorState } from "../../shared/components/PageState";
import { formatBrazilianPhone, isValidBrazilianPhone } from "../../shared/lib/phone";
import { fieldClassName, labelClassName } from "./AdminFormStyles";
import { AdminPageHeader } from "./AdminPageHeader";
import { AdminFormSection, AdminPage, AdminPageContent, AdminSurface } from "./AdminPage";

const emptyForm: UpdateTenantRequest = { name: "", contato: "", telefone: "", endereco: "", cidade: "", estado: "", homeHeader: { imageUrl: "", imageOpacity: 0.5 }, homeActions: { secretaria: { label: "Secretaria", subtitle: "Falar no WhatsApp" }, confissoes: { label: "Confissões", subtitle: "Ver horários" } }, confessionSchedule: [] };

export function AdminParishPage() {
  const { tenantSlug = "" } = useParams();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["tenant", tenantSlug], queryFn: () => getTenant(tenantSlug), enabled: Boolean(tenantSlug), refetchOnWindowFocus: false });
  const serverForm = useMemo(() => query.data ? parishForm(query.data) : undefined, [query.data]);
  const { value: form, setValue: setForm, dirty, commit } = useAdminDraft(emptyForm, serverForm);
  const [saved, setSaved] = useState(false);
  const mutation = useMutation({ mutationFn: (input: UpdateTenantRequest) => updateTenantFields(tenantSlug, { name: input.name, contato: input.contato, telefone: input.telefone, endereco: input.endereco, cidade: input.cidade, estado: input.estado }), onSuccess: async (tenant) => { commit(parishForm(tenant)); await queryClient.invalidateQueries({ queryKey: ["tenant", tenantSlug] }); setSaved(true); toast.success("Dados da paróquia atualizados"); } });
  const nameError = !form.name.trim() ? "Informe o nome da paróquia." : undefined;
  const phoneError = form.telefone && !isValidBrazilianPhone(form.telefone) ? "Informe um telefone com DDD válido." : undefined;
  const emailError = form.contato?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contato.trim()) ? "Informe um e-mail válido." : undefined;
  const submit = (event: FormEvent) => { event.preventDefault(); if (!phoneError && !nameError && !emailError && dirty && !mutation.isPending) mutation.mutate(form); };

  if (query.isLoading) return <ParishSkeleton />;
  if (query.isError) return <AdminPage header={<AdminPageHeader title="Dados e contato" />}><AdminPageContent><ErrorState title="Não foi possível carregar a paróquia" description="Tente novamente em instantes." /><button type="button" onClick={() => void query.refetch()} className="min-h-11 justify-self-start rounded-lg bg-primary px-4 text-sm font-semibold text-white">Tentar novamente</button></AdminPageContent></AdminPage>;

  return (
    <AdminPage header={<AdminPageHeader title="Dados e contato" description="Edite os dados institucionais e os contatos exibidos aos fiéis." />}>
      <UnsavedChanges dirty={dirty} />
      <AdminPageContent className="admin-save-content">
        <form noValidate onChange={() => setSaved(false)} onSubmit={submit}>
        <fieldset disabled={mutation.isPending} className="m-0 min-w-0 border-0 p-0">
          <AdminSurface className="divide-y divide-line/60">
          <AdminFormSection title="Dados institucionais" description="Identificação e localização exibidas aos fiéis">
            <div className="grid gap-4 sm:grid-cols-2"><label className={`${labelClassName} sm:col-span-2`}>Nome oficial<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} aria-invalid={Boolean(nameError)} aria-describedby={nameError ? "parish-name-error" : undefined} className={fieldClassName} />{nameError ? <span id="parish-name-error" className="block text-sm text-danger">{nameError}</span> : null}</label><label className={`${labelClassName} sm:col-span-2`}>Endereço<input value={form.endereco ?? ""} onChange={(event) => setForm({ ...form, endereco: event.target.value })} className={fieldClassName} /></label><label className={labelClassName}>Cidade<input value={form.cidade ?? ""} onChange={(event) => setForm({ ...form, cidade: event.target.value })} className={fieldClassName} /></label><label className={labelClassName}>Estado<input maxLength={2} value={form.estado ?? ""} onChange={(event) => setForm({ ...form, estado: event.target.value.toUpperCase() })} className={fieldClassName} /></label></div>
          </AdminFormSection>
          <AdminFormSection title="Contato" description="Canais usados na página pública"><div className="grid gap-4 sm:grid-cols-2"><label className={labelClassName}>Telefone ou WhatsApp<input type="tel" inputMode="tel" autoComplete="tel" value={form.telefone ?? ""} onChange={(event) => setForm({ ...form, telefone: formatBrazilianPhone(event.target.value) })} aria-invalid={Boolean(phoneError)} aria-describedby={phoneError ? "parish-phone-error" : undefined} className={fieldClassName} />{phoneError ? <span id="parish-phone-error" className="mt-1.5 block text-sm font-semibold text-danger">{phoneError}</span> : null}</label><label className={labelClassName}>E-mail<input type="email" inputMode="email" autoComplete="email" value={form.contato ?? ""} onChange={(event) => setForm({ ...form, contato: event.target.value })} aria-invalid={Boolean(emailError)} aria-describedby={emailError ? "parish-email-error" : undefined} className={fieldClassName} />{emailError ? <span id="parish-email-error" className="mt-1.5 block text-sm font-semibold text-danger">{emailError}</span> : null}</label></div></AdminFormSection>
          <AdminSaveBar dirty={dirty} pending={mutation.isPending} invalid={Boolean(phoneError || nameError || emailError)} saved={saved} error={mutation.error} />
          </AdminSurface>
        </fieldset>
        </form>
      </AdminPageContent>
    </AdminPage>
  );
}

function ParishSkeleton() { return <AdminPage header={<AdminPageHeader title="Dados e contato" />}><AdminPageContent><div className="h-96 animate-pulse rounded-2xl border border-line bg-surface" /></AdminPageContent></AdminPage>; }

function parishForm(tenant: Tenant): UpdateTenantRequest { return { name: tenant.name, contato: tenant.contato ?? "", telefone: tenant.telefone ?? "", endereco: tenant.endereco ?? "", cidade: tenant.cidade ?? "", estado: tenant.estado ?? "", homeHeader: tenant.homeHeader ?? emptyForm.homeHeader, homeActions: tenant.homeActions ?? emptyForm.homeActions, confessionSchedule: tenant.confessionSchedule ?? [] }; }
