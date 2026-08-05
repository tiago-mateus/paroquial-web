import { delay, http, HttpResponse } from "msw";
import { publicLinks } from "../data/links";
import { baseUrl, tenantNotFound } from "../utils";
import { tenantExists } from "../data";

export const linkHandlers = [
  http.get(`${baseUrl}/api/v1/tenants/:tenantSlug/links`, async ({ params }) => {
    await delay(250);
    const tenantSlug = String(params.tenantSlug);
    if (tenantSlug === "erro-links") return HttpResponse.json({ code: "LINKS_LOAD_ERROR", message: "Erro ao carregar links." }, { status: 500 });
    if (!tenantExists(tenantSlug) && tenantSlug !== "sem-links") return HttpResponse.json(tenantNotFound(), { status: 404 });

    const result = publicLinks
      .filter((link) => link.tenantSlug === tenantSlug && link.isActive !== false)
      .sort((first, second) => first.order - second.order)
      .map((link) => ({
        id: link.id,
        title: link.title,
        url: link.url,
        iconKey: link.iconKey,
        colorKey: link.colorKey,
        color: link.color,
        variant: link.variant,
        order: link.order,
        isActive: link.isActive,
      }));
    return HttpResponse.json(result);
  }),

  http.post(`${baseUrl}/api/v1/tenants/:tenantSlug/links/:linkId/click`, async () => {
    await delay(30);
    return new HttpResponse(null, { status: 204 });
  }),
];
