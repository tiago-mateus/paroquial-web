import { useLeafletContext } from "@react-leaflet/core";
import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import { layerGroup, tileLayer } from "leaflet";
import { setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { useEffect } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

setWorkerUrl(workerUrl);

/** Keep Leaflet interactions and markers while rendering the editable vector base. */
export function ChurchLightMapLayer() {
  const { map, layerContainer } = useLeafletContext();

  useEffect(() => {
    const group = layerGroup();
    const container = layerContainer ?? map;
    const vector = maplibreGL({
      style: `${import.meta.env.BASE_URL}maps/parish-light.json`,
      attributionControl: { customAttribution: '<a href="https://openfreemap.org/">OpenFreeMap</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' },
    });
    let timer: number | undefined;
    let fallback = false;
    const showFallback = () => {
      if (fallback || !map.hasLayer(group)) return;
      fallback = true;
      window.clearTimeout(timer);
      try { group.removeLayer(vector); } catch { vector.getContainer()?.remove(); }
      group.addLayer(tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }));
    };
    group.on("add", () => {
      if (fallback) return;
      try {
        group.addLayer(vector);
        const renderer = vector.getMaplibreMap();
        let loaded = false;
        renderer.once("load", () => { loaded = true; window.clearTimeout(timer); });
        renderer.on("error", () => {
          if (!loaded) { window.clearTimeout(timer); timer = window.setTimeout(showFallback, 0); }
        });
        timer = window.setTimeout(showFallback, 15000);
      } catch { timer = window.setTimeout(showFallback, 0); }
    });
    group.on("remove", () => window.clearTimeout(timer));
    container.addLayer(group);
    return () => {
      window.clearTimeout(timer);
      container.removeLayer(group);
      map.removeLayer(group);
      group.off();
    };
  }, [map, layerContainer]);

  return null;
}
