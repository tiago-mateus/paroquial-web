import { lazy, Suspense } from "react";
import type { PublicChurch } from "../../shared/api/churches";

const ChurchesMapInner = lazy(() => import("./ChurchesMapInner"));

export function ChurchesMap(props: { churches: PublicChurch[]; selectedId?: string; onSelect: (church: PublicChurch) => void; userLocation?: { latitude: number; longitude: number } }) {
  if (import.meta.env.MODE === "test") {
    return <div className="absolute inset-0 z-0 isolate bg-slate-200" aria-label="Mapa de igrejas" />;
  }

  return (
    <Suspense fallback={<MapFallback />}>
      <ChurchesMapInner {...props} />
    </Suspense>
  );
}

function MapFallback() {
  return (
    <div className="absolute inset-0 z-0 isolate overflow-hidden bg-slate-200" aria-label="Carregando mapa">
      <div className="absolute inset-0 animate-pulse bg-[linear-gradient(135deg,#e2e8f0,#f8fafc,#cbd5e1)]" />
    </div>
  );
}
