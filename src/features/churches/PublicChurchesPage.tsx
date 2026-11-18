import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import type { PublicChurch } from "../../shared/api/churches";
import { getTenantEvents } from "../../shared/api/events";
import { usePublicTenant } from "../../shared/hooks/usePublicTenant";
import { usePublicChurches } from "../../shared/hooks/usePublicChurches";
import { IconButton } from "../../shared/components/IconButton";
import { toDateKey } from "../../shared/lib/date";
import { distanceKm, eventMatchesChurch } from "./churches.utils";
import { useChurchLocation } from "./hooks/useChurchLocation";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";
import { ChurchesExplorerPanel } from "./ChurchesExplorerPanel";
import { ChurchCarousel } from "./ChurchCarousel";
import { ChurchMapStylePicker, type ChurchMapStyle } from "./ChurchMapStylePicker";
import { ChurchesMap } from "./ChurchesMap";
import { prepareChurchMap } from "./churchMapLoading";
import { ChurchesBlockedState, ChurchesEmptyState, ChurchesErrorState, ChurchesLoadingState } from "./ChurchesStates";

export function PublicChurchesPage() {
  useEffect(prepareChurchMap, []);
  const { tenantSlug = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("igreja") ?? undefined;
  const [panelView, setPanelView] = useState<"list" | "details" | null>(null);
  const [mapStyle, setMapStyle] = useState<ChurchMapStyle>("light");
  const [mapStyleOpen, setMapStyleOpen] = useState(false);
  const [overviewKey, setOverviewKey] = useState(0);
  const [carouselHeight, setCarouselHeight] = useState(212);
  const [clusterIds, setClusterIds] = useState<string[] | null>(null);
  const { userLocation, locationStatus, locateUser, dismissLocationError } = useChurchLocation();
  const tenantQuery = usePublicTenant(tenantSlug, { retry: false });
  const churchesQuery = usePublicChurches(tenantSlug);
  const churches = useMemo(() => churchesQuery.data ?? [], [churchesQuery.data]);
  const now = useMemo(() => new Date(), []);
  const rangeEnd = useMemo(() => new Date(now.getFullYear(), now.getMonth() + 2, now.getDate()), [now]);
  const eventsQuery = useQuery({ queryKey: ["events", tenantSlug, "churches-next", toDateKey(now), toDateKey(rangeEnd)], queryFn: () => getTenantEvents(tenantSlug, toDateKey(now), toDateKey(rangeEnd)), enabled: Boolean(tenantSlug) && panelView === "details" && churchesQuery.isSuccess && churches.length > 0 });
  const distances = useMemo(() => new Map(churches.map((church) => [church.id, userLocation ? distanceKm(userLocation, church) : undefined])), [churches, userLocation]);
  const orderedChurches = useMemo(() => userLocation ? [...churches].sort((a, b) => (distances.get(a.id) ?? Infinity) - (distances.get(b.id) ?? Infinity)) : [...churches].sort((a, b) => Number(b.tipo === "matriz") - Number(a.tipo === "matriz")), [churches, distances, userLocation]);
  const selectedChurch = churches.find((church) => church.id === selectedId) ?? orderedChurches[0];
  const tenantName = tenantQuery.data?.name ?? "Paroquial";
  useDocumentTitle("Igrejas", tenantQuery.data?.name);

  const selectChurch = (church: PublicChurch, replace = false) => {
    dismissLocationError();
    setSearchParams((current) => { const next = new URLSearchParams(current); next.set("igreja", church.id); return next; }, { replace });
    setPanelView(null);
  };
  const clearSelection = () => setSearchParams((current) => { const next = new URLSearchParams(current); next.delete("igreja"); return next; });
  const showOverview = () => { dismissLocationError(); setPanelView(null); clearSelection(); setOverviewKey((value) => value + 1); };
  const selectedNextEvent = useMemo(() => (eventsQuery.data ?? []).filter((event) => new Date(event.start) >= now && eventMatchesChurch(event.location, selectedChurch)).sort((a, b) => +new Date(a.start) - +new Date(b.start))[0], [eventsQuery.data, now, selectedChurch]);

  if (churchesQuery.isLoading) return <ChurchesLoadingState />;
  if (isBlockedError(churchesQuery.error)) return <ChurchesBlockedState tenantSlug={tenantSlug} />;
  if (churchesQuery.isError) return <ChurchesErrorState onRetry={() => churchesQuery.refetch()} />;
  if (!churches.length) return <ChurchesEmptyState />;

  return (
    <main className="flex h-[calc(100dvh-4.5rem-env(safe-area-inset-bottom,0px))] max-w-none flex-col overflow-hidden bg-canvas p-0 text-ink">
      <h1 className="sr-only">Igrejas — {tenantName}</h1>
      <div className="relative min-h-0 flex-1 isolate" aria-label="Visão das igrejas da paróquia">
        <ChurchesMap churches={churches} mapStyle={mapStyle} selectedId={selectedChurch?.id} focusSelection={Boolean(selectedId)} carouselHeight={carouselHeight} onSelect={selectChurch} onSelectGroup={(group) => { setMapStyleOpen(false); setClusterIds(group.map((church) => church.id)); setPanelView("list"); }} userLocation={userLocation} panelExpanded={panelView === "details"} overviewKey={overviewKey} />
        <button data-church-search hidden={panelView === "list"} type="button" onClick={() => { dismissLocationError(); setMapStyleOpen(false); setClusterIds(null); setPanelView("list"); }} aria-label={`Buscar entre ${churches.length} igrejas`} className="absolute left-3 right-16 top-3 z-10 inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-medium text-muted hover:bg-selection focus-visible:outline-2 focus-visible:outline-focus sm:left-5 sm:right-auto sm:w-96"><Search size={17} aria-hidden="true" />Buscar igrejas</button>
        <ChurchMapStylePicker value={mapStyle} open={mapStyleOpen} onChange={setMapStyle} onOpenChange={(open) => { setMapStyleOpen(open); if (open) { dismissLocationError(); setPanelView(null); } }} />
        {locationStatus === "error" ? <div className="absolute left-3 right-3 top-16 z-30 flex items-start gap-2 rounded-xl border border-line bg-surface py-2 pl-3 pr-1 sm:left-5 sm:right-auto sm:w-96">
          <p role="alert" className="m-0 min-w-0 flex-1 text-sm leading-5 text-ink">Não foi possível acessar sua localização. Busque pelo nome ou endereço.</p>
          <IconButton onClick={dismissLocationError} label="Fechar aviso de localização" icon={X} iconSize={17} />
        </div> : null}
        {selectedChurch ? <ChurchCarousel churches={orderedChurches} selectedId={selectedChurch.id} hidden={panelView === "details"} locating={locationStatus === "loading"} onSelect={(church) => selectChurch(church, true)} onDetails={() => setPanelView("details")} onOverview={showOverview} onLocate={locateUser} onHeightChange={setCarouselHeight} /> : null}
        <ChurchesExplorerPanel mode={panelView} church={selectedChurch} churches={clusterIds ? orderedChurches.filter((church) => clusterIds.includes(church.id)) : orderedChurches} tenantSlug={tenantSlug} distances={distances} nextEvent={selectedNextEvent} eventsLoading={eventsQuery.isLoading} locating={locationStatus === "loading"} carouselHeight={carouselHeight} restoreFocus={!mapStyleOpen} onSelect={selectChurch} onClose={() => setPanelView(null)} onLocate={locateUser} />
      </div>
    </main>
  );
}

function isBlockedError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "CHURCHES_PREMIUM_REQUIRED");
}
