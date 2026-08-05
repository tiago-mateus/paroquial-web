import { registerTenantLinkClick } from "../../shared/api/links";

const VISITOR_KEY = "paroquial.visitor-id";

export function trackPublicLinkClick(tenantSlug: string, linkId: string) {
  const visitorId = getVisitorId();
  const referer = typeof window === "undefined" ? "" : window.location.href;
  void registerTenantLinkClick(tenantSlug, linkId, { visitorId, referer }).catch(() => undefined);
}

function getVisitorId() {
  if (typeof window === "undefined") return "anonymous";
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const generated = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(VISITOR_KEY, generated);
    return generated;
  } catch {
    return "anonymous";
  }
}
