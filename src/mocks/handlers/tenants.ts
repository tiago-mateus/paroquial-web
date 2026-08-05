import { delay, http, HttpResponse } from "msw";
import { findTenantBySlug } from "../data";
import { baseUrl, tenantNotFound } from "../utils";

export const tenantHandlers = [
  http.get(`${baseUrl}/api/v1/tenants/:tenantSlug`, async ({ params }) => {
    await delay(250);
    const tenant = findTenantBySlug(String(params.tenantSlug));

    if (!tenant) {
      return HttpResponse.json(tenantNotFound(), { status: 404 });
    }

    return HttpResponse.json(tenant);
  }),

  http.get(`${baseUrl}/api/v1/admin/tenants/:tenantSlug`, async ({ params }) => {
    await delay(250);
    const tenant = findTenantBySlug(String(params.tenantSlug));

    if (!tenant) {
      return HttpResponse.json(tenantNotFound(), { status: 404 });
    }

    return HttpResponse.json(tenant);
  }),
];
