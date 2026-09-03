import { delay, http, HttpResponse } from "msw";
import { findTenantBySlug } from "../data";
import type { UpdateTenantRequest } from "../../shared/api/tenants";
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

  http.put(`${baseUrl}/api/v1/admin/tenants/:tenantSlug`, async ({ params, request }) => {
    await delay(250);
    const tenant = findTenantBySlug(String(params.tenantSlug));
    if (!tenant) return HttpResponse.json(tenantNotFound(), { status: 404 });
    const input = await request.json() as UpdateTenantRequest;
    Object.assign(tenant, input);
    return HttpResponse.json(tenant);
  }),
];
