import { divIcon } from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ChurchLightMapLayer } from "../churches/ChurchLightMapLayer";
import type { ChurchLocation, LocationSource } from "./ChurchLocationPicker";
import { pinHeight, pinHtml, pinSize } from "./churchLocationPin";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Props = {
  location: ChurchLocation;
  center: ChurchLocation;
  centerZoom?: number;
  /** Muda quando o mapa deve centralizar e aproximar no local (busca ou GPS). */
  focusKey: number;
  /**
   * "pin": pino arrastável e toque para marcar.
   * "center": o pino fica fixo no centro da tela e a pessoa move o mapa por baixo dele.
   */
  mode?: "pin" | "center";
  /** false: prévia estática, sem gestos (usada no celular dentro do formulário). */
  interactive?: boolean;
  onPick?: (location: ChurchLocation, source: LocationSource) => void;
  onCenterChange?: (location: ChurchLocation, explicit?: boolean) => void;
};

export default function ChurchLocationPickerMap({ location, center, centerZoom = 13, focusKey, mode = "pin", interactive = true, onPick, onCenterChange }: Props) {
  const hasLocation = location.latitude !== 0 || location.longitude !== 0;
  const initial = hasLocation ? location : center;
  const icon = useMemo(() => divIcon({ className: "church-map-div-icon", html: pinHtml, iconSize: [pinSize, pinHeight], iconAnchor: [pinSize / 2, pinHeight - 1] }), []);

  return (
    <div className="churches-map h-full w-full">
      <MapContainer
        center={[initial.latitude, initial.longitude]}
        zoom={hasLocation ? 17 : centerZoom}
        maxZoom={19}
        className="h-full w-full"
        scrollWheelZoom={mode === "center" ? "center" : false}
        touchZoom={interactive ? (mode === "center" ? "center" : true) : false}
        doubleClickZoom={interactive ? (mode === "center" ? "center" : true) : false}
        dragging={interactive}
        boxZoom={interactive}
        keyboard={interactive}
        zoomControl={interactive}
        attributionControl
        zoomAnimation={!reducedMotion()}
      >
        <ChurchLightMapLayer />
        <KeepSize />
        <FocusOnLocation location={location} focusKey={focusKey} />
        {mode === "center"
          ? <ReportCenter onCenterChange={onCenterChange} />
          : <>
              {interactive && onPick ? <MapClicks onPick={onPick} /> : null}
              {hasLocation ? (
                <Marker
                  position={[location.latitude, location.longitude]}
                  icon={icon}
                  draggable={interactive}
                  autoPan
                  keyboard={false}
                  interactive={interactive}
                  title={interactive ? "Local da igreja. Arraste para ajustar." : "Local da igreja"}
                  alt="Local da igreja"
                  eventHandlers={{
                    dragend(event) {
                      const { lat, lng } = event.target.getLatLng();
                      onPick?.({ latitude: lat, longitude: lng }, "map");
                    },
                  }}
                />
              ) : null}
            </>}
      </MapContainer>
    </div>
  );
}

function MapClicks({ onPick }: { onPick: (location: ChurchLocation, source: LocationSource) => void }) {
  useMapEvents({ click(event) { onPick({ latitude: event.latlng.lat, longitude: event.latlng.lng }, "map"); } });
  return null;
}

function ReportCenter({ onCenterChange }: { onCenterChange?: Props["onCenterChange"] }) {
  const map = useMap();
  const callback = useRef(onCenterChange);
  callback.current = onCenterChange;
  useMapEvents({
    moveend() {
      const { lat, lng } = map.wrapLatLng(map.getCenter());
      callback.current?.({ latitude: lat, longitude: lng });
    },
    click(event) {
      const point = map.wrapLatLng(event.latlng);
      callback.current?.({ latitude: point.lat, longitude: point.lng }, true);
      map.setView(point, map.getZoom(), { animate: false });
    },
  });
  return null;
}

/** Recalcula o tamanho quando o contêiner muda (ex.: lista de resultados abre acima do mapa). */
function KeepSize() {
  const map = useMap();
  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

function FocusOnLocation({ location, focusKey }: { location: ChurchLocation; focusKey: number }) {
  const map = useMap();
  const lastKey = useRef(focusKey);
  useEffect(() => {
    if (lastKey.current === focusKey) return;
    lastKey.current = focusKey;
    if (location.latitude === 0 && location.longitude === 0) return;
    map.stop();
    map.setView([location.latitude, location.longitude], Math.max(map.getZoom(), 17), { animate: false });
  }, [focusKey, location, map]);
  return null;
}
