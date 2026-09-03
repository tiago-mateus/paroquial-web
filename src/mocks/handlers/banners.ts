import { delay, http, HttpResponse } from "msw";
import { banners, tenantExists } from "../data";
import { baseUrl, tenantNotFound } from "../utils";
import type { UpsertBannerRequest } from "../../shared/api/banners";

function publicBanner(banner: (typeof banners)[number]) {
  return { ...banner, tenantSlug: undefined };
}

export const bannerHandlers = [
  http.get(`${baseUrl}/api/v1/tenants/:tenantSlug/banners`, async ({ params }) => {
    await delay(250);
    const tenantSlug = String(params.tenantSlug);

    if (!tenantExists(tenantSlug)) {
      return HttpResponse.json(tenantNotFound(), { status: 404 });
    }

    return HttpResponse.json(
      banners
        .filter((banner) => banner.tenantSlug === tenantSlug)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(publicBanner),
    );
  }),

  http.post(`${baseUrl}/api/v1/admin/tenants/:tenantSlug/banners`, async ({ params, request }) => {
    await delay(250);
    const tenantSlug = String(params.tenantSlug);
    const input = await request.json() as UpsertBannerRequest;
    const banner = { ...input, id: crypto.randomUUID(), tenantSlug };
    banners.push(banner);
    return HttpResponse.json(publicBanner(banner), { status: 201 });
  }),

  http.put(`${baseUrl}/api/v1/admin/tenants/:tenantSlug/banners/:bannerId`, async ({ params, request }) => {
    await delay(250);
    const banner = banners.find((item) => item.tenantSlug === String(params.tenantSlug) && item.id === String(params.bannerId));
    if (!banner) return HttpResponse.json({ code: "BANNER_NOT_FOUND", message: "Destaque não encontrado." }, { status: 404 });
    Object.assign(banner, await request.json() as UpsertBannerRequest);
    return HttpResponse.json(publicBanner(banner));
  }),

  http.delete(`${baseUrl}/api/v1/admin/tenants/:tenantSlug/banners/:bannerId`, async ({ params }) => {
    await delay(180);
    const index = banners.findIndex((item) => item.tenantSlug === String(params.tenantSlug) && item.id === String(params.bannerId));
    if (index < 0) return HttpResponse.json({ code: "BANNER_NOT_FOUND", message: "Destaque não encontrado." }, { status: 404 });
    banners.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
