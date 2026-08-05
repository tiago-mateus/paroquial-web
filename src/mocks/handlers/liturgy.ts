import { delay, http, HttpResponse } from "msw";
import { baseUrl } from "../utils";

export const liturgyHandlers = [
  http.get(`${baseUrl}/api/v1/liturgy/today`, async () => {
    await delay(180);
    return HttpResponse.json({
      referencia: "Mt 10,16-23",
      cor: "Verde",
      liturgia: "São Bento, abade",
    });
  }),
];
