import type { ChurchLocation } from "./ChurchLocationPicker";

// Visão nacional para começar a navegar, sem representar um local selecionado.
export const brazilOverview = { latitude: -14.24, longitude: -51.93 };

export function churchViewport(points: ChurchLocation[]) {
  if (!points.length) return { center: brazilOverview, zoom: 4 };
  const latitudes = points.map(point => point.latitude);
  const longitudes = points.map(point => point.longitude);
  const south = Math.min(...latitudes);
  const north = Math.max(...latitudes);
  const west = Math.min(...longitudes);
  const east = Math.max(...longitudes);
  const span = Math.max(north - south, east - west);
  return {
    center: { latitude: (north + south) / 2, longitude: (east + west) / 2 },
    zoom: span ? Math.max(3, Math.min(14, Math.floor(Math.log2(180 / span)))) : 14,
  };
}
