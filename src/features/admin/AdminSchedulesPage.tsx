import { AdminNotice } from "./AdminNotice";
import { toast } from "sonner";
import { useAdminDraft } from "./useAdminDraft";
import { updateTenantFields } from "./updateTenantFields";
import { AdminSaveBar } from "./AdminSaveBar";
import { UnsavedChanges } from "./UnsavedChanges";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { getTenant, type ConfessionScheduleItem, type UpdateTenantRequest } from "../../shared/api/tenants";
import { AdminPageHeader } from "./AdminPageHeader";
import { AdminFormSection, AdminPage, AdminPageContent, AdminSurface } from "./AdminPage";
import { ConfessionScheduleEditor } from "./ConfessionScheduleEditor";
import { validateConfessionSchedule } from "./confessionSchedule";

export function AdminSchedulesPage() {
  const { tenantSlug = "" } = useParams();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["tenant", tenantSlug], queryFn: () => getTenant(tenantSlug), enabled: Boolean(tenantSlug), refetchOnWindowFocus: false });
  const serverItems = useMemo(() => query.data ? query.data.confessionSchedule ?? [] : undefined, [query.data]);
  const { value: items, setValue: setItems, dirty, commit } = useAdminDraft<ConfessionScheduleItem[]>([], serverItems);
  const [saved, setSaved] = useState(false);
  const mutation = useMutation({ mutationFn: (input: UpdateTenantRequest) => updateTenantFields(tenantSlug, { confessionSchedule: input.confessionSchedule }), onSuccess: async (tenant) => { commit(tenant.confessionSchedule ?? []); await queryClient.invalidateQueries({ queryKey: ["tenant", tenantSlug] }); setSaved(true); toast.success("Horários de confissão atualizados"); } });
  const errors = validateConfessionSchedule(items);
  const hasErrors = Boolean(Object.keys(errors).length);
  const submit = (event: FormEvent) => { event.preventDefault(); if (!query.data || hasErrors || !dirty || mutation.isPending) return; mutation.mutate({ name: query.data.name, contato: query.data.contato, telefone: query.data.telefone, endereco: query.data.endereco, cidade: query.data.cidade, estado: query.data.estado, homeHeader: query.data.homeHeader, homeActions: query.data.homeActions, confessionSchedule: items }); };

  return (
    <AdminPage header={<AdminPageHeader title="Horários de confissão" description="Mantenha os horários exibidos aos fiéis." />}>
      <UnsavedChanges dirty={dirty} />
      <AdminPageContent className="admin-save-content">
      <form noValidate onChange={() => setSaved(false)} onSubmit={submit}>
        <AdminSurface>
          <AdminFormSection title="Programação publicada" description="Exibida no botão Confissões da página inicial" id="confession-title">
          {query.isLoading ? <div className="py-6 text-sm text-muted">Carregando horários...</div> : query.isError ? <AdminNotice>Não foi possível carregar os horários.<button type="button" onClick={() => query.refetch()} className="block min-h-11 font-bold">Tentar novamente</button></AdminNotice> : <ConfessionScheduleEditor items={items} onChange={(next) => { setItems(next); setSaved(false); }} errors={errors} disabled={mutation.isPending} idPrefix="schedules-confession" />}
          </AdminFormSection>
          <AdminSaveBar dirty={dirty} pending={mutation.isPending} invalid={hasErrors || query.isLoading || query.isError} saved={saved} error={mutation.error} label="Salvar horários" />
        </AdminSurface>
      </form>
      </AdminPageContent>
    </AdminPage>
  );
}
