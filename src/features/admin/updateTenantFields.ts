import { getTenant, updateTenant, type UpdateTenantRequest } from "../../shared/api/tenants";
export async function updateTenantFields(tenantSlug: string, changes: Partial<UpdateTenantRequest>) {
  const { name, contato, telefone, endereco, cidade, estado, homeHeader, homeActions, confessionSchedule } = await getTenant(tenantSlug);
  return updateTenant(tenantSlug, { name, contato, telefone, endereco, cidade, estado, homeHeader, homeActions, confessionSchedule, ...changes });
}
