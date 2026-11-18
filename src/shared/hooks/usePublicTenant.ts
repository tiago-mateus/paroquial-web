import { useQuery } from "@tanstack/react-query";
import { getTenant } from "../api/tenants";

export function usePublicTenant(tenantSlug: string, options: { retry?: false | number } = {}) {
  return useQuery({
    queryKey: ["tenant", tenantSlug],
    queryFn: () => getTenant(tenantSlug),
    enabled: Boolean(tenantSlug),
    ...options,
  });
}
