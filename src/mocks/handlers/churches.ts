import { delay, http, HttpResponse } from "msw";
import { churches, churchAccessByTenant } from "../data/churches";
import { baseUrl } from "../utils";

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
      .map((church) => ({
        id: church.id,
        tenantId: church.tenantId,
        nome: church.nome,
        endereco: church.endereco,
        latitude: church.latitude,
        longitude: church.longitude,
        urlImg: church.urlImg,
        telefone: church.telefone,
        tipo: church.tipo,
      }))
      .sort((first, second) => first.nome.localeCompare(second.nome, "pt-BR"));

    return HttpResponse.json(result);
  }),
];
