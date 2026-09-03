import { delay, http, HttpResponse } from "msw";
import { publicLinks } from "../data/links";
import { baseUrl, tenantNotFound } from "../utils";
import { tenantExists } from "../data";
import type { UpsertLinkRequest } from "../../shared/api/links";

function publicLink(link: (typeof publicLinks)[number]) {
  return { ...link, tenantSlug: undefined };
}

export const linkHandlers = [
  http.get(`${baseUrl}/api/v1/tenants/:tenantSlug/links`, async ({ params }) => {
    await delay(250);
    const tenantSlug = String(params.tenantSlug);
    if (tenantSlug === "erro-links") return HttpResponse.json({ code: "LINKS_LOAD_ERROR", message: "Erro ao carregar links." }, { status: 500 });
    if (!tenantExists(tenantSlug) && tenantSlug !== "sem-links") return HttpResponse.json(tenantNotFound(), { status: 404 });

    const result = publicLinks
      .filter((link) => link.tenantSlug === tenantSlug && link.isActive !== false)
      .sort((first, second) => first.order - second.order)
      .map(publicLink);
    return HttpResponse.json(result);
  }),

  http.get(`${baseUrl}/api/v1/admin/tenants/:tenantSlug/links`, async ({ params }) => {
    await delay(250);
    const tenantSlug = String(params.tenantSlug);
    if (!tenantExists(tenantSlug)) return HttpResponse.json(tenantNotFound(), { status: 404 });
    return HttpResponse.json(publicLinks.filter((link) => link.tenantSlug === tenantSlug).sort((a, b) => a.order - b.order).map(publicLink));
  }),

  http.post(`${baseUrl}/api/v1/admin/tenants/:tenantSlug/links`, async ({ params, request }) => {
    await delay(250);
    const tenantSlug = String(params.tenantSlug);
    const input = await request.json() as UpsertLinkRequest;
    const link = { ...input, id: crypto.randomUUID(), tenantSlug };
    publicLinks.push(link);
    return HttpResponse.json(publicLink(link), { status: 201 });
  }),

  http.put(`${baseUrl}/api/v1/admin/tenants/:tenantSlug/links/:linkId`, async ({ params, request }) => {
    await delay(250);
    const link = publicLinks.find((item) => item.tenantSlug === String(params.tenantSlug) && item.id === String(params.linkId));
    if (!link) return HttpResponse.json({ code: "LINK_NOT_FOUND", message: "Canal não encontrado." }, { status: 404 });
    Object.assign(link, await request.json() as UpsertLinkRequest);
    return HttpResponse.json(publicLink(link));
  }),

  http.delete(`${baseUrl}/api/v1/admin/tenants/:tenantSlug/links/:linkId`, async ({ params }) => {
    await delay(180);
    const index = publicLinks.findIndex((item) => item.tenantSlug === String(params.tenantSlug) && item.id === String(params.linkId));
    if (index < 0) return HttpResponse.json({ code: "LINK_NOT_FOUND", message: "Canal não encontrado." }, { status: 404 });
    publicLinks.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${baseUrl}/api/v1/tenants/:tenantSlug/links/:linkId/click`, async () => {
    await delay(30);
    return new HttpResponse(null, { status: 204 });
  }),
];
