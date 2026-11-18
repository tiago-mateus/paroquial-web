import { delay, http, HttpResponse } from "msw";
import { demoSession, loginDemo, readDemo, saveDemo } from "../onboardingStore";
import { baseUrl } from "../utils";

export const authHandlers = [
  http.get(`${baseUrl}/api/v1/auth/me`, async () => {
    await delay(250);
    return HttpResponse.json(demoSession());
  }),

  http.post(`${baseUrl}/api/v1/auth/login`, async ({ request }) => {
    await delay(350);
    const input = await request.json() as { email: string };
    return HttpResponse.json(loginDemo(input.email));
  }),

  http.post(`${baseUrl}/api/v1/auth/logout`, async () => {
    await delay(150);
    saveDemo({ ...readDemo(), loggedIn: false });
    return new HttpResponse(null, { status: 204 });
  }),
];
