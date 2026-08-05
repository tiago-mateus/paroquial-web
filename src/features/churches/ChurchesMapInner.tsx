import { divIcon, latLngBounds } from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { CircleMarker, LayersControl, MapContainer, Marker, TileLayer, useMap, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { PublicChurch } from "../../shared/api/churches";
import { hasValidChurchCoordinates } from "../../shared/api/churches";

const DEFAULT_CENTER: [number, number] = [-23.55052, -46.633308];

export default function ChurchesMapInner({ churches, selectedId, onSelect, userLocation }: { churches: PublicChurch[]; selectedId?: string; onSelect: (church: PublicChurch) => void; userLocation?: { latitude: number; longitude: number } }) {
  const validChurches = useMemo(() => churches.filter(hasValidChurchCoordinates), [churches]);
  const initialCenter: [number, number] = validChurches.length
    ? [validChurches[0].latitude, validChurches[0].longitude]
    : DEFAULT_CENTER;

  return (
    <div className="churches-map absolute inset-0 z-0 isolate" aria-label="Mapa de igrejas">
      <MapContainer center={initialCenter} zoom={11} zoomControl={false} scrollWheelZoom className="h-full w-full">
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Mapa claro">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Ruas">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satélite">
            <TileLayer
              attribution="Tiles &copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        <ZoomControl position="topright" />
        {userLocation ? <CircleMarker center={[userLocation.latitude, userLocation.longitude]} radius={8} pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }} /> : null}

        {validChurches.map((church) => {
          const selected = church.id === selectedId;
          return (
            <Marker
              key={church.id}
              position={[church.latitude, church.longitude]}
              icon={createChurchIcon(church, selected)}
              zIndexOffset={selected ? 1000 : church.tipo === "matriz" ? 500 : 0}
              title={church.nome}
              alt={church.nome}
              eventHandlers={{ click: () => onSelect(church) }}
            />
          );
        })}

        <MapViewport churches={validChurches} selectedId={selectedId} userLocation={userLocation} />
      </MapContainer>
    </div>
  );
}

function MapViewport({ churches, selectedId, userLocation }: { churches: PublicChurch[]; selectedId?: string; userLocation?: { latitude: number; longitude: number } }) {
  const map = useMap();
  const initializedRef = useRef(false);
  const previousSelectedRef = useRef<string | undefined>(undefined);
  const initialSelectedIdRef = useRef(selectedId);
  const coordinatesKey = churches.map((church) => `${church.id}:${church.latitude}:${church.longitude}`).join("|");

  useEffect(() => {
    map.invalidateSize();
    if (!churches.length) return;

    const desktop = window.matchMedia("(min-width: 768px)").matches;
    if (churches.length === 1) {
      map.setView([churches[0].latitude, churches[0].longitude], 10, { animate: false });
    } else {
      const bounds = latLngBounds(churches.map((church) => [church.latitude, church.longitude]));
      map.fitBounds(bounds, {
        maxZoom: 14,
        paddingTopLeft: [48, 72],
        paddingBottomRight: desktop ? [380, 48] : [48, 240],
        animate: false,
      });
    }
    initializedRef.current = true;
    previousSelectedRef.current = initialSelectedIdRef.current;
  }, [coordinatesKey, churches, map]);

  useEffect(() => {
    if (!initializedRef.current || !selectedId || selectedId === previousSelectedRef.current) return;
    const selected = churches.find((church) => church.id === selectedId);
    previousSelectedRef.current = selectedId;
    if (selected) map.flyTo([selected.latitude, selected.longitude], 15, { duration: 0.7 });
  }, [churches, map, selectedId]);

  useEffect(() => {
    if (userLocation) map.flyTo([userLocation.latitude, userLocation.longitude], 13, { duration: 0.7 });
  }, [map, userLocation]);

  return null;
}

function createChurchIcon(church: PublicChurch, selected: boolean) {
  const size = selected ? 42 : church.tipo === "matriz" ? 36 : 32;
  const tone = selected ? "selected" : church.tipo === "matriz" ? "matrix" : "chapel";
  return divIcon({
    className: "church-map-div-icon",
    html: `<span class="church-map-marker church-map-marker--${tone}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="M10 4h4"/><path d="M5 22V10l7-4 7 4v12"/><path d="M2 22h20"/><path d="M9 22v-6h6v6"/><path d="M8 12h2"/><path d="M14 12h2"/></svg></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
