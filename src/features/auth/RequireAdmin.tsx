import { useQuery } from "@tanstack/react-query";
import { Navigate, useParams } from "react-router-dom";
import type { ReactNode } from "react";
import { getSession } from "./auth.api";
import { localAdminAccess } from "../../shared/launchMode";

export function RequireAdmin({ children }: { children: ReactNode }) {
  return localAdminAccess ? children : <RequireSession>{children}</RequireSession>;
}

function RequireSession({ children }: { children: ReactNode }) {
  const { tenantSlug = "" } = useParams();
  const query = useQuery({ queryKey: ["session"], queryFn: getSession, retry: false, staleTime: 0 });
  if (query.isPending || query.isFetching) return <p className="p-6" role="status">Verificando seu acesso…</p>;
  if (query.isError) {
    const unauthorized = typeof query.error === "object" && "code" in query.error && /unauthorized|authentication_required/i.test(String(query.error.code));
    return unauthorized ? <Navigate to={`/login?tenant=${encodeURIComponent(tenantSlug)}`} replace /> : <div className="p-6"><p role="alert">Não foi possível verificar seu acesso.</p><button type="button" className="min-h-11 font-semibold text-primary" onClick={() => void query.refetch()}>Tentar novamente</button></div>;
  }
  if (query.data.onboardingRequired) return <Navigate to="/assinar" replace />;
  if (!query.data.adminTenants.some((tenant) => tenant.slug === tenantSlug)) return <Navigate to="/login" replace />;
  return children;
}
