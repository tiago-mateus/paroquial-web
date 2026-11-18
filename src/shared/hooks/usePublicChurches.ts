import { useQuery } from "@tanstack/react-query";
import { getTenantChurches } from "../api/churches";

export function usePublicChurches(tenantSlug: string, { enabled = true, ...options }: { enabled?: boolean; retry?: false | number } = {}) {
  return useQuery({
    queryKey: ["churches", tenantSlug],
    queryFn: () => getTenantChurches(tenantSlug),
    enabled: Boolean(tenantSlug) && enabled,
    ...options,
  });
}
