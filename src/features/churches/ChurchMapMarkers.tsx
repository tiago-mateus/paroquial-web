import { divIcon, latLngBounds, type LatLngTuple } from "leaflet";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { Marker, Tooltip, useMap } from "react-leaflet";
import type { PublicChurch } from "../../shared/api/churches";
import { churchIconSvg } from "./ChurchIcon";

export function ChurchMapMarkers({ churches, selectedId, onSelect, onSelectGroup }: { churches: PublicChurch[]; selectedId?: string; onSelect: (church: PublicChurch) => void; onSelectGroup: (churches: PublicChurch[]) => void }) {
  const map = useMap();
  const subscribe = useCallback((update: () => void) => {
    map.on("zoomend", update);
    return () => { map.off("zoomend", update); };
  }, [map]);
  const zoom = useSyncExternalStore(subscribe, () => map.getZoom());
  const groups = useMemo(() => {
    const points = churches.map((church) => map.project([church.latitude, church.longitude], zoom));
    const parents = churches.map((_, index) => index);
    const find = (index: number): number => parents[index] === index ? index : (parents[index] = find(parents[index]));
    // Group overlapping tap areas in screen space, recalculated only after zoom.
    for (let index = 0; index < points.length; index++) {
      for (let other = 0; other < index; other++) {
        if (points[index].distanceTo(points[other]) < 60) parents[find(index)] = find(other);
      }
    }
    const result = new Map<number, PublicChurch[]>();
    churches.forEach((church, index) => {
      const root = find(index);
      const group = result.get(root) ?? [];
      group.push(church);
      result.set(root, group);
    });
    return Array.from(result.values());
  }, [churches, map, zoom]);

  return groups.map((group) => {
    const selected = group.some((church) => church.id === selectedId);
    if (group.length > 1) {
      const position: LatLngTuple = [group.reduce((sum, church) => sum + church.latitude, 0) / group.length, group.reduce((sum, church) => sum + church.longitude, 0) / group.length];
      const sameLocation = group.every((church) => church.latitude === group[0].latitude && church.longitude === group[0].longitude);
      const showList = sameLocation || zoom >= Math.min(18, map.getMaxZoom());
      const label = `${group.length} igrejas próximas — ${showList ? "ver lista" : "ampliar mapa"}`;
      return <Marker key={`group-${group.map((church) => church.id).sort().join("-")}-${showList ? "list" : "zoom"}`} position={position} title={label} alt={label} icon={divIcon({ className: "church-map-div-icon", html: `<span class="church-map-cluster${selected ? " church-map-cluster--selected" : ""}" aria-hidden="true">${group.length}</span>`, iconSize: [48, 48], iconAnchor: [24, 24] })} eventHandlers={{ click: () => {
        if (showList) { onSelectGroup(group); return; }
        map.fitBounds(latLngBounds(group.map((church) => [church.latitude, church.longitude])), { paddingTopLeft: [64, 64], paddingBottomRight: [76, 160], maxZoom: Math.min(map.getZoom() + 3, 18), animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches });
      } }}><Tooltip direction="top" offset={[0, -24]} opacity={1}>{label}</Tooltip></Marker>;
    }
    const church = group[0];
    const size = selected ? 48 : 44;
    const height = size + 10;
    const isMatrix = church.tipo === "matriz";
    const tone = selected ? "selected" : "default";
    return <Marker key={church.id} position={[church.latitude, church.longitude]} title={church.nome} alt={`${church.nome}${isMatrix ? " — Matriz" : ""}`} zIndexOffset={selected ? 1000 : isMatrix ? 500 : 0} icon={divIcon({ className: "church-map-div-icon", html: `<span class="church-map-pin church-map-marker--${tone}${isMatrix ? " church-map-marker--matrix" : ""}" aria-hidden="true"><span class="church-map-marker">${churchIconSvg}</span></span>`, iconSize: [size, height], iconAnchor: [size / 2, height - 1] })} eventHandlers={{ click: (event) => { event.target.closeTooltip(); onSelect(church); } }}>
      <Tooltip direction="top" offset={[0, -height]} opacity={1}>{church.nome}</Tooltip>
    </Marker>;
  });
}
