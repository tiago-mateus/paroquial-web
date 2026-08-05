import { delay, http, HttpResponse } from "msw";
import { currentUser } from "../data";
import { baseUrl } from "../utils";

export const authHandlers = [
  http.get(`${baseUrl}/api/v1/auth/me`, async () => {
    await delay(250);
    return HttpResponse.json(currentUser);
  }),

  http.post(`${baseUrl}/api/v1/auth/login`, async () => {
    await delay(350);
    return HttpResponse.json(currentUser);
  }),

  http.post(`${baseUrl}/api/v1/auth/logout`, async () => {
    await delay(150);
    return new HttpResponse(null, { status: 204 });
  }),
];
