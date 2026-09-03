import { delay, http, HttpResponse } from "msw";
import { churches, churchAccessByTenant } from "../data/churches";
import { findTenantBySlug } from "../data";
import { baseUrl } from "../utils";
import type { UpsertChurchRequest } from "../../shared/api/churches";

function publicChurch(church: (typeof churches)[number]) {
  return { ...church, tenantSlug: undefined };
}

export const churchHandlers = [
  http.get(`${baseUrl}/api/v1/tenants/:tenantSlug/churches`, async ({ params }) => {
    await delay(300);
    const tenantSlug = String(params.tenantSlug);

    if (tenantSlug === "erro-igrejas") {
      return HttpResponse.json({ code: "CHURCHES_LOAD_ERROR", message: "Erro ao carregar igrejas." }, { status: 500 });
    }

    if (churchAccessByTenant[tenantSlug] === "blocked") {
      return HttpResponse.json(
        { code: "CHURCHES_PREMIUM_REQUIRED", message: "Recurso disponível no plano premium." },
        { status: 403 },
      );
    }

    if (!churchAccessByTenant[tenantSlug]) {
      return HttpResponse.json({ code: "TENANT_NOT_FOUND", message: "Paróquia não encontrada." }, { status: 404 });
    }

    const result = churches
      .filter((church) => church.tenantSlug === tenantSlug)
      .map(publicChurch)
      .sort((first, second) => first.nome.localeCompare(second.nome, "pt-BR"));

    return HttpResponse.json(result);
  }),

  http.post(`${baseUrl}/api/v1/admin/tenants/:tenantSlug/churches`, async ({ params, request }) => {
    await delay(250);
    const tenantSlug = String(params.tenantSlug);
    const tenant = findTenantBySlug(tenantSlug);
    if (!tenant) return HttpResponse.json({ code: "TENANT_NOT_FOUND", message: "Paróquia não encontrada." }, { status: 404 });
    const input = await request.json() as UpsertChurchRequest;
    const church = { ...input, id: crypto.randomUUID(), tenantId: tenant.id, tenantSlug };
    churches.push(church);
    return HttpResponse.json(publicChurch(church), { status: 201 });
  }),

  http.put(`${baseUrl}/api/v1/admin/tenants/:tenantSlug/churches/:churchId`, async ({ params, request }) => {
    await delay(250);
    const church = churches.find((item) => item.tenantSlug === String(params.tenantSlug) && item.id === String(params.churchId));
    if (!church) return HttpResponse.json({ code: "CHURCH_NOT_FOUND", message: "Igreja não encontrada." }, { status: 404 });
    Object.assign(church, await request.json() as UpsertChurchRequest);
    return HttpResponse.json(publicChurch(church));
  }),

  http.delete(`${baseUrl}/api/v1/admin/tenants/:tenantSlug/churches/:churchId`, async ({ params }) => {
    await delay(180);
    const index = churches.findIndex((item) => item.tenantSlug === String(params.tenantSlug) && item.id === String(params.churchId));
    if (index < 0) return HttpResponse.json({ code: "CHURCH_NOT_FOUND", message: "Igreja não encontrada." }, { status: 404 });
    churches.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
