import type { PublicChurch } from "../../shared/api/churches";
import { hasValidChurchCoordinates } from "../../shared/api/churches";

export type LocationPoint = { latitude: number; longitude: number };

export function formatDistance(value: number) {
  return value < 1 ? `${Math.round(value * 1000)} m` : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`;
}

export function normalizeChurchSearch(value = "") {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

export function eventMatchesChurch(location: string | undefined, church: PublicChurch | undefined) {
  if (!location || !church) return false;
  const value = normalizeChurchSearch(location);
  const name = normalizeChurchSearch(church.nome);
  if (!value || !name) return false;
  return value.includes(name) || name.includes(value) || (church.tipo === "matriz" && value.includes("igreja matriz"));
}

export function distanceKm(from: LocationPoint, to: PublicChurch) {
  if (!hasValidChurchCoordinates(to)) return undefined;
  const radius = 6371;
  const rad = (value: number) => value * Math.PI / 180;
  const dLat = rad(to.latitude - from.latitude);
  const dLon = rad(to.longitude - from.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(from.latitude)) * Math.cos(rad(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
