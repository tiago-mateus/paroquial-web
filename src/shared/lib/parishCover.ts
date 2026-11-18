import type { PublicChurch } from "../api/churches";
import type { HomeHeaderConfig } from "../api/tenants";

export function resolveParishCover({ headerConfig, churches = [], fallbackImageUrl }: {
  headerConfig?: HomeHeaderConfig | null;
  churches?: Pick<PublicChurch, "tipo" | "urlImg">[];
  fallbackImageUrl?: string | null;
}) {
  return headerConfig?.imageUrl?.trim()
    || fallbackImageUrl?.trim()
    || churches.find((church) => church.tipo === "matriz" && church.urlImg?.trim())?.urlImg.trim()
    || churches.find((church) => church.urlImg?.trim())?.urlImg.trim()
    || null;
}
