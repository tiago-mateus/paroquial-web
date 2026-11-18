import { useLocation, useParams, Navigate } from "react-router-dom";

export function AdminSitePage() { return <AdminLegacyRedirect path="site/destaques" />; }
export function AdminParishHubPage() { return <AdminLegacyRedirect path="paroquia/dados" />; }
export function AdminLegacyRedirect({ path }: { path: string }) {
  const { tenantSlug = "" } = useParams();
  const { search, hash } = useLocation();
  return <Navigate to={`/${tenantSlug}/admin/${path}${search}${hash}`} replace />;
}
