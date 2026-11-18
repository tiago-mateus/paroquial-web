import { latLngBounds } from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { PublicChurch } from "../../shared/api/churches";
import { hasValidChurchCoordinates } from "../../shared/api/churches";
import { ChurchMapMarkers } from "./ChurchMapMarkers";
import { ChurchLightMapLayer } from "./ChurchLightMapLayer";
import type { ChurchMapStyle } from "./ChurchMapStylePicker";

const DEFAULT_CENTER: [number, number] = [-23.55052, -46.633308];

export default function ChurchesMapInner({ churches, mapStyle = "light", selectedId, focusSelection = false, carouselHeight = 212, onSelect, onSelectGroup, userLocation, panelExpanded = false, overviewKey = 0 }: { churches: PublicChurch[]; mapStyle?: ChurchMapStyle; selectedId?: string; focusSelection?: boolean; carouselHeight?: number; onSelect: (church: PublicChurch) => void; onSelectGroup: (churches: PublicChurch[]) => void; userLocation?: { latitude: number; longitude: number }; panelExpanded?: boolean; overviewKey?: number }) {
  const validChurches = useMemo(() => churches.filter(hasValidChurchCoordinates), [churches]);
  const initialCenter: [number, number] = validChurches.length
    ? [validChurches[0].latitude, validChurches[0].longitude]
    : DEFAULT_CENTER;

  if (!validChurches.length) return <div className="absolute inset-0 grid place-content-center bg-canvas px-5 text-center text-base leading-6 text-muted">As coordenadas das igrejas ainda não foram informadas.</div>;

  return (
    <div className="churches-map absolute inset-0 z-0 isolate" aria-label="Mapa de igrejas">
      <MapContainer center={initialCenter} zoom={11} minZoom={2} maxZoom={19} zoomControl={false} scrollWheelZoom={false} zoomAnimation={!window.matchMedia("(prefers-reduced-motion: reduce)").matches} fadeAnimation={!window.matchMedia("(prefers-reduced-motion: reduce)").matches} className="h-full w-full">
        {mapStyle === "light" ? <ChurchLightMapLayer /> : mapStyle === "streets" ? <TileLayer
              key="streets"
              maxZoom={19}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            /> : <TileLayer
              key="satellite"
              maxZoom={19}
              attribution="Tiles &copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />}
        {userLocation ? <CircleMarker center={[userLocation.latitude, userLocation.longitude]} radius={8} pathOptions={{ color: "#ffffff", weight: 3, fillColor: "var(--color-primary)", fillOpacity: 1 }} /> : null}

        <ChurchMapMarkers churches={validChurches} selectedId={selectedId} onSelect={onSelect} onSelectGroup={onSelectGroup} />

        <MapViewport churches={validChurches} selectedId={selectedId} focusSelection={focusSelection} carouselHeight={carouselHeight} userLocation={userLocation} panelExpanded={panelExpanded} overviewKey={overviewKey} />
      </MapContainer>
    </div>
  );
}

function MapViewport({ churches, selectedId, focusSelection, carouselHeight, userLocation, panelExpanded, overviewKey }: { churches: PublicChurch[]; selectedId?: string; focusSelection: boolean; carouselHeight: number; userLocation?: { latitude: number; longitude: number }; panelExpanded?: boolean; overviewKey?: number }) {
  const map = useMap();
  const initializedRef = useRef(false);
  const coordinatesKey = churches.map((church) => `${church.id}:${church.latitude}:${church.longitude}`).join("|");

  useEffect(() => {
    map.invalidateSize();
    if (!churches.length) return;

    const overview = () => {
      map.stop();
      map.fitBounds(latLngBounds(churches.map((church) => [church.latitude, church.longitude])), {
        maxZoom: 14,
        paddingTopLeft: [48, 76],
        paddingBottomRight: [76, carouselHeight + 44],
        animate: false,
      });
    };
    if (!initializedRef.current || !focusSelection) overview();
    const onResize = () => { if (!focusSelection) overview(); };
    map.on("resize", onResize);
    initializedRef.current = true;
    return () => { map.off("resize", onResize); };
  }, [coordinatesKey, churches, map, overviewKey, carouselHeight, focusSelection]);

  useEffect(() => {
    map.stop();
    if (!initializedRef.current || !selectedId || !focusSelection) return;
    const selected = churches.find((church) => church.id === selectedId);
    if (!selected) return;
    const zoom = Math.max(14, map.getZoom());
    const inset = panelExpanded ? map.getSize().y * 0.65 : carouselHeight + 28;
    const point = map.project([selected.latitude, selected.longitude], zoom);
    point.y += Math.max(0, inset / 2 - 30);
    map.flyTo(map.unproject(point, zoom), zoom, { duration: 0.85, animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches });
    // MapContainer stops animations when removing the map. Its cleanup runs
    // before this child's cleanup, so calling stop there accesses removed panes.
  }, [churches, map, selectedId, focusSelection, panelExpanded, carouselHeight]);

  useEffect(() => {
    if (userLocation) { map.stop(); map.flyTo([userLocation.latitude, userLocation.longitude], 13, { duration: 0.85, animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches }); }
  }, [map, userLocation]);

  return null;
}
