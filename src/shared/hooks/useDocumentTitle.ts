import { useEffect } from "react";

export function useDocumentTitle(section: string, tenantName?: string | null) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = tenantName ? `${section} | ${tenantName}` : `${section} | Paroquial`;
    return () => {
      document.title = previousTitle;
    };
  }, [section, tenantName]);
}
