/**
 * Busca de endereços sem chave de API, via Nominatim (OpenStreetMap).
 *
 * A política de uso do serviço público exige no máximo 1 requisição por segundo,
 * atribuição ao OpenStreetMap e proíbe busca enquanto se digita. Por isso a busca
 * só acontece quando a pessoa confirma (Enter ou botão). Para volume maior,
 * aponte VITE_GEOCODING_URL para uma instância própria compatível.
 */
const geocodingUrl = (import.meta.env.VITE_GEOCODING_URL?.trim() || "https://nominatim.openstreetmap.org").replace(/\/$/, "");

export type GeocodedPlace = {
  id: string;
  /** Nome curto do resultado (ex.: nome da igreja ou rua). */
  name: string;
  /** Endereço legível no padrão brasileiro. */
  address: string;
  latitude: number;
  longitude: number;
};

type NominatimAddress = Partial<Record<
  "amenity" | "place_of_worship" | "building" | "road" | "pedestrian" | "house_number" | "neighbourhood" | "suburb" | "quarter" | "city_district" | "city" | "town" | "village" | "municipality" | "state" | "ISO3166-2-lvl4" | "postcode",
  string
>>;

type NominatimResult = {
  place_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  address?: NominatimAddress;
};

let lastRequestAt = 0;

/** Garante o intervalo mínimo entre chamadas ao serviço público. */
async function throttle(signal?: AbortSignal) {
  const wait = lastRequestAt + 1000 - Date.now();
  if (wait > 0) {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, wait);
      signal?.addEventListener("abort", () => { clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); }, { once: true });
    });
  }
  lastRequestAt = Date.now();
}

async function request<T>(path: string, params: Record<string, string>, signal?: AbortSignal): Promise<T> {
  await throttle(signal);
  const query = new URLSearchParams({ format: "jsonv2", addressdetails: "1", "accept-language": "pt-BR", ...params });
  const response = await fetch(`${geocodingUrl}${path}?${query}`, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Geocoding failed with status ${response.status}`);
  return (await response.json()) as T;
}

export async function searchPlaces(text: string, options: { near?: { latitude: number; longitude: number }; signal?: AbortSignal } = {}) {
  const params: Record<string, string> = { q: text, limit: "5", countrycodes: "br" };
  if (options.near) {
    // Prefere resultados próximos da paróquia, sem excluir os demais.
    const { latitude, longitude } = options.near;
    params.viewbox = [longitude - 0.6, latitude + 0.6, longitude + 0.6, latitude - 0.6].join(",");
  }
  const results = await request<NominatimResult[]>("/search", params, options.signal);
  return results.map(toPlace).filter((place): place is GeocodedPlace => Boolean(place));
}

export async function reversePlace(location: { latitude: number; longitude: number }, signal?: AbortSignal) {
  const result = await request<NominatimResult | { error: string }>("/reverse", { lat: String(location.latitude), lon: String(location.longitude), zoom: "18" }, signal);
  return "error" in result ? null : toPlace(result);
}

function toPlace(result: NominatimResult): GeocodedPlace | null {
  const latitude = Number(result.lat);
  const longitude = Number(result.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const address = formatAddress(result.address) || result.display_name;
  const name = result.name?.trim() || address.split(",")[0];
  return { id: String(result.place_id), name, address, latitude, longitude };
}

/** "Rua X, 123 - Bairro, Cidade - UF" */
export function formatAddress(address?: NominatimAddress) {
  if (!address) return "";
  const road = address.road ?? address.pedestrian;
  const street = road ? [road, address.house_number].filter(Boolean).join(", ") : "";
  const district = address.suburb ?? address.neighbourhood ?? address.quarter ?? address.city_district;
  const city = address.city ?? address.town ?? address.village ?? address.municipality;
  const state = address["ISO3166-2-lvl4"]?.replace(/^BR-/, "") ?? address.state;
  const local = [street, district].filter(Boolean).join(" - ");
  const region = [city, state].filter(Boolean).join(" - ");
  return [local, region].filter(Boolean).join(", ");
}
