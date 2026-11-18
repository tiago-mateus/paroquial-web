import { lazy, Suspense } from "react";
import type { PublicChurch } from "../../shared/api/churches";
import type { ChurchMapStyle } from "../churches/ChurchMapStylePicker";
import type { ChurchLocation } from "./ChurchLocationPicker";

export type AdminChurchesMapProps = {
  churches: PublicChurch[];
  selectedId?: string;
  picking: boolean;
  overviewKey: number;
  mapStyle: ChurchMapStyle;
  onSelect: (church: PublicChurch) => void;
  onSelectGroup: (churches: PublicChurch[]) => void;
  onPick: (location: ChurchLocation) => void;
};

const MapInner = lazy(() => import("./AdminChurchesMapInner"));

export function AdminChurchesMap(props: AdminChurchesMapProps) {
  if (import.meta.env.MODE === "test") return <div className="absolute inset-0 bg-map-background" aria-label="Mapa de igrejas" />;
  return <Suspense fallback={<div role="status" className="absolute inset-0 grid place-items-center bg-map-background text-sm text-muted">Carregando mapa…</div>}><MapInner {...props} /></Suspense>;
}
