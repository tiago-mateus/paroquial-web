import { latLngBounds } from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { hasValidChurchCoordinates, type PublicChurch } from "../../shared/api/churches";
import { ChurchLightMapLayer } from "../churches/ChurchLightMapLayer";
import { ChurchMapMarkers } from "../churches/ChurchMapMarkers";
import type { AdminChurchesMapProps } from "./AdminChurchesMap";
import { brazilOverview } from "./churchMapViewport";

export default function AdminChurchesMapInner({ churches, selectedId, overviewKey, mapStyle, onSelect, onSelectGroup }: AdminChurchesMapProps) {
  const valid = useMemo(() => churches.filter(hasValidChurchCoordinates), [churches]);
  const first = valid[0] ?? brazilOverview;
  const center: [number, number] = [first.latitude, first.longitude];
  return <div className="churches-map absolute inset-0 isolate" aria-label="Mapa de igrejas">
    <MapContainer center={center} zoom={valid.length ? 13 : 4} minZoom={2} maxZoom={19} zoomControl={false} scrollWheelZoom className="h-full w-full" zoomAnimation={!window.matchMedia("(prefers-reduced-motion: reduce)").matches}>
      {mapStyle === "light" ? <ChurchLightMapLayer /> : mapStyle === "streets" ? <TileLayer maxZoom={19} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" /> : <TileLayer maxZoom={19} attribution="Tiles &copy; Esri" url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />}
      <ChurchMapMarkers churches={valid} selectedId={selectedId} onSelect={onSelect} onSelectGroup={onSelectGroup} />
      <MapViewport churches={valid} selectedId={selectedId} overviewKey={overviewKey} />
    </MapContainer>
  </div>;
}

function MapViewport({ churches, selectedId, overviewKey }: { churches: PublicChurch[]; selectedId?: string; overviewKey: number }) {
  const map = useMap();
  useEffect(() => {
    const update = () => {
      map.invalidateSize();
      const inset = map.getSize().x >= 900 ? 360 : 24;
      const selected = churches.find((church) => church.id === selectedId);
      map.stop();
      if (selected) {
        const zoom = Math.max(15, map.getZoom());
        const point = map.project([selected.latitude, selected.longitude], zoom);
        point.x -= Math.max(0, inset / 2 - 24);
        map.setView(map.unproject(point, zoom), zoom, { animate: false });
      } else if (churches.length) {
        map.fitBounds(latLngBounds(churches.map((church) => [church.latitude, church.longitude])), { maxZoom: 14, paddingTopLeft: [inset, 76], paddingBottomRight: [64, 100], animate: false });
      }
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [churches, map, overviewKey, selectedId]);
  return null;
}
