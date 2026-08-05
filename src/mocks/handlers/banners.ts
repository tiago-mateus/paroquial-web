import { delay, http, HttpResponse } from "msw";
import { banners, tenantExists } from "../data";
import { baseUrl, tenantNotFound } from "../utils";

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
        .map((banner) => ({
          id: banner.id,
          tipo: banner.tipo,
          titulo: banner.titulo,
          mensagem: banner.mensagem,
          link: banner.link,
          bgImg: banner.bgImg,
          bgColor: banner.bgColor,
          order: banner.order,
        })),
    );
  }),
];
