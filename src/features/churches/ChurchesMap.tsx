import { lazy, Suspense } from "react";
import type { PublicChurch } from "../../shared/api/churches";
import type { ChurchMapStyle } from "./ChurchMapStylePicker";
import { loadChurchMap } from "./churchMapLoading";

const ChurchesMapInner = lazy(loadChurchMap);

export function ChurchesMap(props: { churches: PublicChurch[]; mapStyle?: ChurchMapStyle; selectedId?: string; focusSelection?: boolean; carouselHeight?: number; onSelect: (church: PublicChurch) => void; onSelectGroup: (churches: PublicChurch[]) => void; userLocation?: { latitude: number; longitude: number }; panelExpanded?: boolean; overviewKey?: number }) {
  if (import.meta.env.MODE === "test") {
    return <div className="absolute inset-0 z-0 isolate bg-map-background" aria-label="Mapa de igrejas" />;
  }

  return (
    <Suspense fallback={<MapFallback />}>
      <ChurchesMapInner {...props} />
    </Suspense>
  );
}

function MapFallback() {
  return (
    <div role="status" className="absolute inset-0 z-0 isolate bg-map-background">
      <span className="sr-only">Carregando mapa…</span>
    </div>
  );
}
