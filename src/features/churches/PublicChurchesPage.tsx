import { useQuery } from "@tanstack/react-query";
import { Church, LocateFixed } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type { PublicChurch } from "../../shared/api/churches";
import { getTenantChurches } from "../../shared/api/churches";
import { getTenantEvents } from "../../shared/api/events";
import { getTenant } from "../../shared/api/tenants";
import { PublicDesktopNavigation } from "../../shared/components/PublicNavigation";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";
import { ChurchSearchList } from "./ChurchSearchList";
import { ChurchesMap } from "./ChurchesMap";
import { ChurchesMobileSheet } from "./ChurchesMobileSheet";
import { ChurchesBlockedState, ChurchesEmptyState, ChurchesErrorState, ChurchesLoadingState } from "./ChurchesStates";
import { ChurchSummary } from "./ChurchSummary";

export function PublicChurchesPage() {
  const { tenantSlug = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | undefined>(() => searchParams.get("igreja") ?? undefined);
  const [isListOpen, setIsListOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number }>();
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "error">("idle");
  const tenantQuery = useQuery({ queryKey: ["tenant", tenantSlug], queryFn: () => getTenant(tenantSlug), enabled: Boolean(tenantSlug), retry: false });
  const churchesQuery = useQuery({
    queryKey: ["churches", tenantSlug],
    queryFn: () => getTenantChurches(tenantSlug),
    enabled: Boolean(tenantSlug),
  });
  const churches = useMemo(() => churchesQuery.data ?? [], [churchesQuery.data]);
  const now = useMemo(() => new Date(), []);
  const rangeEnd = useMemo(() => new Date(now.getFullYear(), now.getMonth() + 2, now.getDate()), [now]);
  const eventsQuery = useQuery({ queryKey: ["events", tenantSlug, "churches-next"], queryFn: () => getTenantEvents(tenantSlug, dateKey(now), dateKey(rangeEnd)), enabled: Boolean(tenantSlug) });
  const distances = useMemo(() => new Map(churches.map((church) => [church.id, userLocation ? distanceKm(userLocation, church) : undefined])), [churches, userLocation]);
  const orderedChurches = useMemo(() => userLocation ? [...churches].sort((a, b) => (distances.get(a.id) ?? Infinity) - (distances.get(b.id) ?? Infinity)) : churches, [churches, distances, userLocation]);
  const selectedChurch = churches.find((church) => church.id === selectedId)
    ?? churches.find((church) => church.tipo === "matriz")
    ?? churches[0];
  const tenantName = tenantQuery.data?.name ?? "Paroquial";
  useDocumentTitle("Igrejas", tenantQuery.data?.name);

  useEffect(() => {
    if (!churches.length || churches.some((church) => church.id === selectedId)) return;
    setSelectedId((churches.find((church) => church.tipo === "matriz") ?? churches[0]).id);
  }, [churches, selectedId]);

  const selectChurch = (church: PublicChurch) => {
    setSelectedId(church.id);
    setSearchParams((current) => { const next = new URLSearchParams(current); next.set("igreja", church.id); return next; }, { replace: true });
  };
  const closeList = useCallback(() => setIsListOpen(false), []);
  const selectedNextEvent = useMemo(() => (eventsQuery.data ?? []).filter((event) => new Date(event.start) >= now && eventMatchesChurch(event.location, selectedChurch)).sort((a, b) => +new Date(a.start) - +new Date(b.start))[0], [eventsQuery.data, now, selectedChurch]);

  function locateUser() {
    if (!navigator.geolocation) { setLocationStatus("error"); return; }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(({ coords }) => { setUserLocation({ latitude: coords.latitude, longitude: coords.longitude }); setLocationStatus("idle"); }, () => setLocationStatus("error"), { enableHighAccuracy: true, timeout: 10000 });
  }

  if (churchesQuery.isLoading) return <ChurchesLoadingState />;
  if (isBlockedError(churchesQuery.error)) return <ChurchesBlockedState tenantSlug={tenantSlug} />;
  if (churchesQuery.isError) return <ChurchesErrorState onRetry={() => churchesQuery.refetch()} />;
  if (!churches.length) return <ChurchesEmptyState />;

  return (
    <main className="fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom,0px))] top-0 max-w-none overflow-hidden bg-slate-200 p-0 md:bottom-0">
      <ChurchesMap churches={churches} selectedId={selectedChurch?.id} onSelect={selectChurch} userLocation={userLocation} />

      <button type="button" onClick={() => setIsListOpen(true)} aria-label="Ver todas as igrejas" className="absolute left-3 top-[calc(env(safe-area-inset-top,0px)+12px)] z-10 flex min-h-11 max-w-[calc(100%-4.75rem)] items-center gap-2 rounded-xl border border-white/70 bg-white/90 px-3 py-1.5 text-slate-700 shadow-[0_8px_28px_rgb(15_23_42/0.12)] backdrop-blur-xl md:hidden">
        <Church size={16} className="flex-none text-amber-700" />
        <span className="min-w-0 text-left"><strong className="block truncate text-xs">{tenantName}</strong><small className="block text-[0.62rem] font-semibold text-slate-500">{churches.length} {churches.length === 1 ? "igreja cadastrada" : "igrejas cadastradas"}</small></span>
      </button>
      <button
        type="button"
        onClick={locateUser}
        disabled={locationStatus === "loading"}
        aria-label={locationStatus === "loading" ? "Localizando você" : userLocation ? "Localização ativada" : "Usar minha localização"}
        className="absolute right-3 top-[calc(env(safe-area-inset-top,0px)+12px)] z-10 grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-white/90 text-amber-700 shadow-[0_8px_28px_rgb(15_23_42/0.12)] backdrop-blur-xl md:hidden"
      >
        <LocateFixed size={17} className={locationStatus === "loading" ? "animate-pulse" : ""} />
      </button>

      <div className="absolute left-4 top-4 z-10 hidden items-center gap-2 md:flex">
        <Link to={`/${tenantSlug}`} className="inline-flex h-11 max-w-72 items-center gap-2 rounded-full border border-white/80 bg-white/95 px-4 text-xs font-bold text-slate-800 shadow-sm backdrop-blur-xl"><Church size={15} className="text-amber-700" /><span className="truncate">{tenantName}</span></Link>
        <PublicDesktopNavigation tenantSlug={tenantSlug} />
      </div>

      <aside className="absolute bottom-4 right-4 top-4 z-10 hidden w-[22.5rem] flex-col overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/95 shadow-[0_28px_80px_rgb(15_23_42/0.18)] backdrop-blur-xl md:flex" aria-label="Painel de igrejas">
        <header className="flex items-center justify-between gap-4 px-5 pb-3 pt-5">
          <div>
            <p className="m-0 max-w-48 truncate text-[0.62rem] font-bold text-amber-700">{tenantName}</p>
            <h1 className="m-0 text-lg font-bold tracking-tight text-slate-950">Igrejas e capelas</h1>
            <p className="mb-0 mt-0.5 text-xs text-slate-500">{churches.length} {churches.length === 1 ? "local cadastrado" : "locais cadastrados"}</p>
          </div>
          <button type="button" onClick={locateUser} disabled={locationStatus === "loading"} className="inline-flex h-10 flex-none items-center gap-2 rounded-full bg-slate-100 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-200">
            <LocateFixed size={15} className="text-amber-700" /> {locationStatus === "loading" ? "Localizando" : userLocation ? "Ativado" : "Perto de mim"}
          </button>
        </header>
        {selectedChurch ? <div className="px-3 pb-3"><ChurchSummary church={selectedChurch} distanceKm={distances.get(selectedChurch.id)} nextEvent={selectedNextEvent} tenantSlug={tenantSlug} embedded /></div> : null}
        <ChurchSearchList churches={orderedChurches} selectedId={selectedChurch?.id} onSelect={selectChurch} distances={distances} />
      </aside>

      {selectedChurch ? (
        <div className="absolute bottom-3 left-3 right-3 z-10 md:hidden">
          <ChurchSummary church={selectedChurch} onOpenList={() => setIsListOpen(true)} distanceKm={distances.get(selectedChurch.id)} nextEvent={selectedNextEvent} tenantSlug={tenantSlug} />
        </div>
      ) : null}

      <ChurchesMobileSheet open={isListOpen} churches={orderedChurches} selectedId={selectedChurch?.id} onSelect={selectChurch} onClose={closeList} distances={distances} />
      {locationStatus === "error" ? <p role="alert" className="absolute left-3 top-16 z-20 m-0 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-red-700 shadow-lg md:left-auto md:right-[24rem] md:top-4">Não foi possível acessar sua localização.</p> : null}
    </main>
  );
}

function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function normalize(value = "") { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR"); }
function eventMatchesChurch(location: string | undefined, church: PublicChurch | undefined) { if (!location || !church) return false; const value = normalize(location); const name = normalize(church.nome); return value.includes(name) || name.includes(value) || (church.tipo === "matriz" && value.includes("igreja matriz")); }
function distanceKm(from: { latitude: number; longitude: number }, to: PublicChurch) { const radius = 6371; const rad = (value: number) => value * Math.PI / 180; const dLat = rad(to.latitude - from.latitude); const dLon = rad(to.longitude - from.longitude); const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(from.latitude)) * Math.cos(rad(to.latitude)) * Math.sin(dLon / 2) ** 2; return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); }

function isBlockedError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "CHURCHES_PREMIUM_REQUIRED");
}
