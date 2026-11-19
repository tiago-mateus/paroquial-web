import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { ArrowLeft, Check, CheckCircle2, LoaderCircle, LocateFixed, MapPin, Search, X } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { reversePlace, searchPlaces, type GeocodedPlace } from "../../shared/api/geocoding";
import { classNames } from "../../shared/lib/classNames";
import { fieldClassName, labelClassName } from "./AdminFormStyles";
import { pinHeight, pinHtml, pinSize } from "./churchLocationPin";

const FallbackMap = lazy(() => import("./ChurchLocationPickerMap"));
const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
if (mapsKey) setOptions({ key: mapsKey, v: "weekly", language: "pt-BR", region: "BR" });

export type ChurchLocation = { latitude: number; longitude: number };
export type LocationSource = "map" | "search" | "gps";

const validLocation = ({ latitude, longitude }: ChurchLocation) =>
  Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180 && (latitude !== 0 || longitude !== 0);

const mapFrameClass = "relative isolate overflow-hidden rounded-xl border border-line bg-canvas";
const isTest = import.meta.env.MODE === "test";

function currentPosition() {
  return new Promise<ChurchLocation & { accuracy: number }>((resolve, reject) => {
    if (!window.isSecureContext) { reject("A localização do dispositivo exige uma conexão segura. Use a busca ou marque no mapa."); return; }
    if (!("geolocation" in navigator)) { reject("Este navegador não informa a localização. Busque o endereço ou marque no mapa."); return; }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }),
      (error) => reject(error.code === error.PERMISSION_DENIED
        ? "A permissão de localização foi negada. Busque o endereço ou marque no mapa."
        : error.code === error.TIMEOUT ? "A localização demorou demais. Tente novamente ou marque no mapa." : "Não foi possível obter sua localização. Busque o endereço ou marque no mapa."),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    );
  });
}
const overlayButtonClass = "inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-ink shadow-[0_4px_14px_rgb(15_23_42/0.18)] transition-colors hover:bg-selection focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-70";

export function ChurchLocationPicker({ location, center, centerZoom, searchNear, address, active = true, onLocationChange, onAddressChange }: {
  location: ChurchLocation;
  center: ChurchLocation;
  centerZoom?: number;
  /** Centro usado para priorizar resultados próximos na busca, quando conhecido. */
  searchNear?: ChurchLocation;
  address: string;
  active?: boolean;
  onLocationChange: (location: ChurchLocation) => void;
  onAddressChange: (address: string) => void;
}) {
  const [googleFailed, setGoogleFailed] = useState(false);
  const [selectionError, setSelectionError] = useState("");
  const [mapDraft, setMapDraft] = useState<MapDraft>();
  const search = useLocationSearch(searchNear);
  const [suggestion, setSuggestion] = useState<{ address: string; status: "loading" | "ready" } | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading">("idle");
  const [expanded, setExpanded] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const reverseTimer = useRef<number | undefined>(undefined);
  const reverseAbort = useRef<AbortController | null>(null);
  const addressRef = useRef(address);
  addressRef.current = address;
  const hasLocation = validLocation(location);
  const useGoogle = Boolean(mapsKey) && !googleFailed;

  useEffect(() => () => { window.clearTimeout(reverseTimer.current); reverseAbort.current?.abort(); }, []);

  /** Sugere o endereço do ponto marcado. Nunca sobrescreve um endereço já digitado. */
  function suggestAddressFor(next: ChurchLocation) {
    window.clearTimeout(reverseTimer.current);
    reverseAbort.current?.abort();
    setSuggestion({ address: "", status: "loading" });
    reverseTimer.current = window.setTimeout(async () => {
      const controller = new AbortController();
      reverseAbort.current = controller;
      try {
        const place = await reversePlace(next, controller.signal);
        if (controller.signal.aborted) return;
        if (!place?.address) { setSuggestion(null); return; }
        if (!addressRef.current.trim()) {
          onAddressChange(place.address);
          setAutoFilled(true);
          setSuggestion(null);
        } else if (place.address !== addressRef.current.trim()) {
          setSuggestion({ address: place.address, status: "ready" });
        } else {
          setSuggestion(null);
        }
      } catch {
        if (!controller.signal.aborted) setSuggestion(null);
      }
    }, 700);
  }

  function selectSearchResult(place: GeocodedPlace) {
    setMapDraft({ point: place, address: place.address });
    setExpanded(true);
  }

  function locateMe() {
    setGpsStatus("loading");
    void currentPosition().then(
      (next) => { setGpsStatus("idle"); setMapDraft({ point: next, accuracy: next.accuracy }); setExpanded(true); },
      (message: string) => { setGpsStatus("idle"); setSelectionError(message); },
    );
  }

  /** Volta do mapa ampliado com o ponto confirmado. */
  function confirmFromExpanded(next: ChurchLocation, pointAddress?: string, lookUpMissing = false) {
    setExpanded(false);
    setSelectionError("");
    onLocationChange(next);
    setMapDraft(undefined);
    window.clearTimeout(reverseTimer.current);
    reverseAbort.current?.abort();
    if (!pointAddress) {
      if (lookUpMissing) suggestAddressFor(next);
      else setSuggestion(null);
      return;
    }
    if (!address.trim()) { onAddressChange(pointAddress); setAutoFilled(true); setSuggestion(null); }
    else if (pointAddress !== address.trim()) setSuggestion({ address: pointAddress, status: "ready" });
    else setSuggestion(null);
  }

  const openLabel = hasLocation ? "Ajustar no mapa" : mapDraft ? "Retomar marcação no mapa" : "Marcar no mapa";
  if (!active) return null;

  return (
    <section aria-labelledby="church-location-title" className="sm:col-span-2">
      <h3 id="church-location-title" className="m-0 flex items-center gap-2 text-base font-semibold text-ink"><MapPin size={18} className="text-primary" aria-hidden="true" />Onde fica a igreja?</h3>
      {!hasLocation ? <p role="status" className="mb-3 mt-1 text-sm text-muted">Nenhum local selecionado. Busque um endereço ou marque a localização no mapa.</p> : null}
      {!expanded ? <div className="mt-3">
        {useGoogle ? <GoogleLocationMap location={location} center={center} onLocationChange={onLocationChange} onAddressChange={onAddressChange} onError={(message) => { setGoogleFailed(true); setSelectionError(message); }} onSelectionError={setSelectionError} />
          : <LocationSearch search={search} onSelect={selectSearchResult} />}
        {hasLocation && !useGoogle ? (
          <div className={classNames(mapFrameClass, "mt-3 h-28")} aria-label="Prévia da localização escolhida">
            {!isTest ? <Suspense fallback={<div className="h-full bg-selection/40" />}><FallbackMap key={`${location.latitude},${location.longitude}`} location={location} center={center} focusKey={0} interactive={false} /></Suspense> : null}
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <button ref={openButtonRef} type="button" onClick={() => setExpanded(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-primary hover:bg-selection focus-visible:outline-2 focus-visible:outline-primary">
            <MapPin size={16} aria-hidden="true" />{openLabel}
          </button>
          <button type="button" onClick={locateMe} disabled={gpsStatus === "loading"} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-primary hover:bg-selection focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-65">
            {gpsStatus === "loading" ? <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <LocateFixed size={16} aria-hidden="true" />}
            {gpsStatus === "loading" ? "Localizando…" : "Usar minha localização"}
          </button>
        </div>
      </div> : null}
      {expanded ? <ExpandedLocationPicker
        location={location}
        center={center}
        centerZoom={centerZoom}
        initialDraft={mapDraft}
        address={address}
        search={search}
        onCancel={draft => { setMapDraft(draft); setExpanded(false); queueMicrotask(() => openButtonRef.current?.focus()); }}
        onConfirm={(next, pointAddress, lookUpMissing) => { confirmFromExpanded(next, pointAddress, lookUpMissing); queueMicrotask(() => openButtonRef.current?.focus()); }}
      /> : null}

      {selectionError ? <p role="alert" className="mb-0 mt-2 text-sm text-danger">{selectionError}</p> : null}

      {hasLocation ? <p role="status" className="mb-0 mt-3 flex items-start gap-2 text-sm font-semibold text-success"><CheckCircle2 size={17} aria-hidden="true" />Local marcado no mapa</p> : null}

      <label className={`${labelClassName} mt-4`}>Endereço exibido no site
        <input value={address} onChange={(event) => { setAutoFilled(false); onAddressChange(event.target.value); }} placeholder="Rua, número, bairro e cidade" autoComplete="street-address" className={fieldClassName} />
      </label>
      {suggestion?.status === "loading" ? (
        <p className="mb-0 mt-1.5 flex items-center gap-2 text-sm text-muted"><LoaderCircle size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />Buscando o endereço deste ponto…</p>
      ) : suggestion?.status === "ready" ? (
        <div className="mt-2 flex flex-col gap-1 rounded-xl border border-line px-3.5 py-2.5 text-sm sm:flex-row sm:items-center sm:gap-3">
          <span className="min-w-0 flex-1 text-muted">Endereço neste ponto: <span className="text-ink">{suggestion.address}</span></span>
          <span className="-mx-2 flex shrink-0 gap-1 sm:mx-0">
            <button type="button" onClick={() => { onAddressChange(suggestion.address); setSuggestion(null); setAutoFilled(false); }} className="min-h-11 rounded-lg px-2 font-semibold text-primary hover:bg-selection">Usar este endereço</button>
            <button type="button" onClick={() => setSuggestion(null)} aria-label="Manter endereço atual" className="grid min-h-11 min-w-11 place-items-center rounded-lg text-muted hover:bg-selection"><X size={16} aria-hidden="true" /></button>
          </span>
        </div>
      ) : (
        <p className="mb-0 mt-1.5 text-sm leading-5 text-muted">{autoFilled ? "Preenchido automaticamente. Confira o número e o bairro." : "É o texto que os fiéis veem. O pino indica o ponto exato."}</p>
      )}
    </section>
  );
}

function useLocationSearch(near?: ChurchLocation) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [results, setResults] = useState<GeocodedPlace[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const tooShort = query.trim().length < 3;

  useEffect(() => () => abortRef.current?.abort(), []);

  async function run() {
    if (tooShort || status === "loading") return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");
    try {
      const found = await searchPlaces(query.trim(), { near, signal: controller.signal });
      if (controller.signal.aborted) return;
      setResults(found);
      setStatus("done");
    } catch {
      if (!controller.signal.aborted) setStatus("error");
    }
  }

  function change(value: string) {
    abortRef.current?.abort();
    setQuery(value);
    setResults([]);
    setStatus("idle");
  }

  return { query, status, results, tooShort, run, change };
}

type LocationSearchState = ReturnType<typeof useLocationSearch>;

function LocationSearch({ search, onSelect, compact = false }: { search: LocationSearchState; onSelect: (place: GeocodedPlace) => void; compact?: boolean }) {
  const id = useId();
  const inputId = `${id}-search`;
  const hintId = `${id}-hint`;
  const resultsRef = useRef<HTMLDivElement>(null);
  const { query, status, results, tooShort, run, change } = search;

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // O campo está dentro do formulário da igreja: Enter busca em vez de salvar.
    if (event.key === "Enter") { event.preventDefault(); void run(); }
    if (event.key === "ArrowDown" && results.length) {
      event.preventDefault();
      resultsRef.current?.querySelector("button")?.focus();
    }
    if (event.key === "Escape" && results.length) { event.stopPropagation(); change(query); }
  }

  return (
    <div className={compact ? "relative" : undefined}>
      <label htmlFor={inputId} className="sr-only">Buscar localização</label>
      <div className="flex gap-1.5">
        <div className="relative min-w-0 flex-1">
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={event => change(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Nome da igreja, rua ou endereço"
            autoComplete="off"
            enterKeyHint="search"
            aria-describedby={hintId}
            className={`${fieldClassName} mt-0 pl-10`}
          />
        </div>
        <button type="button" aria-label="Buscar endereço" onClick={() => void run()} disabled={tooShort || status === "loading"} className="grid min-h-11 w-11 shrink-0 place-items-center rounded-lg border border-line bg-surface text-primary hover:bg-selection focus-visible:outline-2 focus-visible:outline-focus disabled:opacity-50">
          {status === "loading" ? <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Search size={17} aria-hidden="true" />}
        </button>
      </div>
      <p id={hintId} className={compact ? "sr-only" : "m-0 mt-1.5 text-xs text-muted"}>Inclua a cidade para resultados mais precisos. Busca com dados do OpenStreetMap.</p>

      {/* No mapa ampliado os resultados flutuam sobre o mapa em vez de empurrá-lo. */}
      <div ref={resultsRef} aria-live="polite" className={compact ? "absolute inset-x-0 top-full z-[1100] max-h-[50dvh] overflow-y-auto rounded-xl border border-line bg-surface empty:hidden" : undefined}>
        {status === "loading" ? <p className={classNames("m-0 text-sm text-muted", compact ? "px-3.5 py-3" : "mt-2")}>Buscando…</p> : null}
        {status === "error" ? <p role="alert" className={classNames("m-0 text-sm text-danger", compact ? "px-3.5 py-3" : "mt-2")}>A busca não respondeu. Tente de novo em instantes ou marque direto no mapa.</p> : null}
        {status === "done" && !results.length ? <p className={classNames("m-0 text-sm text-muted", compact ? "px-3.5 py-3" : "mt-2")}>Não encontramos esse endereço. Você pode marcar o local diretamente no mapa.</p> : null}
        {status === "done" && results.length ? (
          <ul aria-label="Resultados da busca" className={classNames("m-0 list-none divide-y divide-line overflow-hidden rounded-xl p-0", compact ? "" : "mt-2 border border-line")}>
            {results.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  onClick={() => { change(query); onSelect(place); }}
                  className="flex min-h-14 w-full items-start gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-selection/50 focus-visible:-outline-offset-2"
                >
                  <MapPin size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0">
                    <strong className="block truncate text-sm font-semibold text-ink">{place.name}</strong>
                    <span className="block text-xs leading-5 text-muted">{place.address}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

type PointAddress = { status: "idle" | "loading" | "ready" | "empty" | "error"; address?: string };
type MapDraft = { point: ChurchLocation; address?: string; accuracy?: number };

function samePoint(a: ChurchLocation, b: ChurchLocation) {
  return Math.abs(a.latitude - b.latitude) < 0.000001 && Math.abs(a.longitude - b.longitude) < 0.000001;
}

/**
 * Marcação em tela cheia (celular) ou painel amplo (desktop).
 * O pino fica fixo no centro e a pessoa move o mapa por baixo dele, o que é mais
 * preciso do que arrastar um marcador pequeno com o dedo.
 */
function ExpandedLocationPicker({ location, center, centerZoom, initialDraft, address, search, onCancel, onConfirm }: {
  location: ChurchLocation;
  center: ChurchLocation;
  centerZoom?: number;
  initialDraft?: MapDraft;
  address: string;
  search: LocationSearchState;
  onCancel: (draft?: MapDraft) => void;
  onConfirm: (location: ChurchLocation, address: string | undefined, lookUpMissing: boolean) => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const existing = validLocation(location) ? location : undefined;
  const [draft, setDraft] = useState<ChurchLocation | undefined>(initialDraft?.point ?? existing);
  const draftRef = useRef(draft);
  const [accuracy, setAccuracy] = useState(initialDraft?.accuracy);
  const [focus, setFocus] = useState({ key: 0, location: draft ?? { latitude: 0, longitude: 0 } });
  const initialAddress = initialDraft ? initialDraft.address : existing ? address.trim() : undefined;
  const [pointAddress, setPointAddress] = useState<PointAddress>(initialAddress ? { status: "ready", address: initialAddress } : { status: "idle" });
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState("");
  const reverseTimer = useRef<number | undefined>(undefined);
  const reverseAbort = useRef<AbortController | null>(null);
  function cancel() { onCancel(draft ? { point: draft, address: pointAddress.address, accuracy } : undefined); }
  const cancelRef = useRef(cancel);
  cancelRef.current = cancel;

  useEffect(() => {
    backRef.current?.focus();
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (Array.from(document.querySelectorAll('[aria-modal="true"]')).at(-1) !== panelRef.current) return;
      if (event.key === "Escape") { event.preventDefault(); cancelRef.current(); return; }
      if (event.key !== "Tab") return;
      const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href]') ?? []);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || !panelRef.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !panelRef.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(reverseTimer.current);
      reverseAbort.current?.abort();
    };
  }, []);

  const lookUpAddress = useCallback((next: ChurchLocation) => {
    window.clearTimeout(reverseTimer.current);
    reverseAbort.current?.abort();
    setPointAddress({ status: "loading" });
    reverseTimer.current = window.setTimeout(async () => {
      const controller = new AbortController();
      reverseAbort.current = controller;
      try {
        const place = await reversePlace(next, controller.signal);
        if (!controller.signal.aborted) setPointAddress(place?.address ? { status: "ready", address: place.address } : { status: "empty" });
      } catch {
        if (!controller.signal.aborted) setPointAddress({ status: "error" });
      }
    }, 800);
  }, []);

  const onCenterChange = useCallback((next: ChurchLocation, explicit = false) => {
    if (!validLocation(next) || (draftRef.current ? samePoint(draftRef.current, next) : !explicit && samePoint(center, next))) return;
    draftRef.current = next;
    setDraft(next);
    setAccuracy(undefined);
    lookUpAddress(next);
  }, [center, lookUpAddress]);

  function moveTo(next: ChurchLocation) {
    setError("");
    draftRef.current = next;
    setDraft(next);
    setFocus((current) => ({ key: current.key + 1, location: next }));
  }

  function selectPlace(place: GeocodedPlace) {
    const next = { latitude: place.latitude, longitude: place.longitude };
    setAccuracy(undefined);
    window.clearTimeout(reverseTimer.current);
    reverseAbort.current?.abort();
    setPointAddress({ status: "ready", address: place.address });
    moveTo(next);
  }

  function locateMe() {
    setGpsStatus("loading");
    void currentPosition().then(
      (next) => { setGpsStatus("idle"); setAccuracy(next.accuracy); moveTo(next); lookUpAddress(next); },
      (message: string) => { setGpsStatus("idle"); setError(message); },
    );
  }

  return createPortal(
    <div className="admin-theme fixed inset-0 z-[90] flex bg-black/45 md:p-6" onMouseDown={(event) => event.target === event.currentTarget && cancel()}>
      <section ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="mx-auto flex h-full w-full flex-col overflow-hidden bg-surface text-ink shadow-xl md:max-w-6xl md:rounded-2xl">
        <header className="relative z-[1100] border-b border-line px-3 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] md:px-5 md:pt-4">
          <div className="mb-3 flex items-center gap-2">
            <button ref={backRef} type="button" onClick={cancel} aria-label="Voltar ao formulário sem alterar" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink hover:bg-selection focus-visible:outline-2 focus-visible:outline-primary">
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <h2 id={titleId} className="m-0 text-lg font-semibold leading-6">Marcar local da igreja</h2>
              <p className="m-0 text-xs text-muted">Toque no local ou alinhe a entrada ao pino.</p>
            </div>
          </div>
          <LocationSearch search={search} onSelect={selectPlace} compact />
        </header>

        <div className="relative isolate min-h-0 flex-1 bg-canvas">
          {isTest
            ? <div className="h-full w-full" aria-label="Mapa ampliado" />
            : <Suspense fallback={<div role="status" className="grid h-full place-items-center text-sm text-muted">Carregando mapa…</div>}><FallbackMap location={focus.location} center={center} centerZoom={centerZoom} focusKey={focus.key} mode="center" onCenterChange={onCenterChange} /></Suspense>}

          {/* Pino fixo: a ponta marca exatamente o centro do mapa. */}
          <div aria-hidden="true" className={classNames("pointer-events-none absolute left-1/2 top-1/2 z-[1000]", !draft && "opacity-45")}>
            <span className="absolute left-0 top-0 h-1.5 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink/25" />
            <span className="absolute left-0 top-0 block -translate-x-1/2 -translate-y-full" style={{ width: pinSize, height: pinHeight }} dangerouslySetInnerHTML={{ __html: pinHtml }} />
          </div>

          <div className="absolute bottom-3 right-3 z-[1000]">
            <button type="button" onClick={locateMe} disabled={gpsStatus === "loading"} className={overlayButtonClass}>
              {gpsStatus === "loading" ? <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <LocateFixed size={16} className="text-primary" aria-hidden="true" />}
              {gpsStatus === "loading" ? "Localizando…" : "Usar minha localização"}
            </button>
          </div>
        </div>

        <footer className="border-t border-line px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3 md:flex md:items-center md:gap-4 md:px-5 md:pb-4">
          <div className="min-w-0 flex-1" aria-live="polite">
            <p className="m-0 text-sm font-semibold text-ink">{draft ? "Ponto selecionado" : "Nenhum ponto selecionado"}</p>
            <p className="m-0 mt-0.5 flex min-h-6 items-center gap-2 text-[15px] font-semibold leading-6">
              {pointAddress.status === "loading" ? <><LoaderCircle size={15} className="animate-spin text-muted motion-reduce:animate-none" aria-hidden="true" /><span className="font-normal text-muted">Buscando endereço…</span></>
                : pointAddress.status === "ready" ? <span className="line-clamp-2">{pointAddress.address}</span>
                : pointAddress.status === "empty" ? <span className="font-normal text-muted">Endereço não identificado. Você pode digitá-lo depois.</span>
                : pointAddress.status === "error" ? <span className="font-normal text-muted">A consulta do endereço falhou. Você pode confirmar o ponto.</span>
                : draft ? <span className="font-normal text-muted">Você pode informar o endereço depois.</span> : null}
            </p>
            {accuracy !== undefined ? <p className="m-0 text-xs text-muted">Precisão GPS aproximada de {Math.round(accuracy)} m. Confira a posição.</p> : null}
            {draft ? <details className="text-xs text-muted"><summary className="min-h-6 cursor-pointer">Coordenadas</summary><p className="m-0 tabular-nums">{draft.latitude.toFixed(6)}, {draft.longitude.toFixed(6)}</p></details> : null}
            {error ? <p role="alert" className="m-0 mt-1 text-sm text-danger">{error}</p> : null}
          </div>
          <div className="mt-3 flex gap-2 md:mt-0 md:shrink-0">
            <button
              type="button"
              disabled={!draft || !validLocation(draft)}
              onClick={() => draft && onConfirm(draft, pointAddress.address, pointAddress.status === "idle")}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-[15px] font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 md:flex-none"
            >
              <Check size={18} aria-hidden="true" />Confirmar local
            </button>
          </div>
        </footer>
      </section>
    </div>,
    document.body,
  );
}

function GoogleLocationMap({ location, center, onLocationChange, onAddressChange, onError, onSelectionError }: {
  location: ChurchLocation;
  center: ChurchLocation;
  onLocationChange: (location: ChurchLocation) => void;
  onAddressChange: (address: string) => void;
  onError: (message: string) => void;
  onSelectionError: (message: string) => void;
}) {
  const mapElement = useRef<HTMLDivElement>(null);
  const searchElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const locationChangeRef = useRef(onLocationChange);
  const addressChangeRef = useRef(onAddressChange);
  const errorRef = useRef(onSelectionError);
  locationChangeRef.current = onLocationChange;
  addressChangeRef.current = onAddressChange;
  errorRef.current = onSelectionError;

  useEffect(() => {
    let cancelled = false;
    let autocomplete: google.maps.places.PlaceAutocompleteElement | undefined;
    let mapListener: google.maps.MapsEventListener | undefined;
    async function init() {
      try {
        const [{ Map }, { PlaceAutocompleteElement }] = await Promise.all([
          importLibrary("maps"), importLibrary("places"),
        ]);
        if (cancelled || !mapElement.current || !searchElement.current) return;
        const initial = validLocation(location) ? location : center;
        const map = new Map(mapElement.current, { center: { lat: initial.latitude, lng: initial.longitude }, zoom: validLocation(location) ? 16 : 12, mapTypeControl: false, streetViewControl: false, fullscreenControl: false, gestureHandling: "cooperative" });
        mapRef.current = map;
        if (validLocation(location)) markerRef.current = new google.maps.Marker({ map, position: { lat: location.latitude, lng: location.longitude }, title: "Local selecionado" });
        autocomplete = new PlaceAutocompleteElement();
        autocomplete.placeholder = "Buscar igreja, rua ou endereço";
        autocomplete.style.width = "100%";
        searchElement.current.appendChild(autocomplete);
        autocomplete.addEventListener("gmp-select", async (event: google.maps.places.PlacePredictionSelectEvent) => {
          try {
            const place = event.placePrediction.toPlace();
            await place.fetchFields({ fields: ["formattedAddress", "location"] });
            if (cancelled || !place.location) { errorRef.current("Não foi possível localizar esse resultado. Tente outro endereço."); return; }
            const next = { latitude: place.location.lat(), longitude: place.location.lng() };
            locationChangeRef.current(next);
            if (place.formattedAddress) addressChangeRef.current(place.formattedAddress);
            map.panTo(place.location);
            map.setZoom(17);
            errorRef.current("");
          } catch { errorRef.current("Não foi possível carregar o endereço. Tente novamente ou marque no mapa."); }
        });
        mapListener = map.addListener("click", (event: google.maps.MapMouseEvent) => {
          if (event.latLng) locationChangeRef.current({ latitude: event.latLng.lat(), longitude: event.latLng.lng() });
        });
      } catch { if (!cancelled) onError("O Google Maps não carregou. Use a busca ou marque o local no mapa abaixo."); }
    }
    void init();
    return () => { cancelled = true; mapListener?.remove(); autocomplete?.remove(); mapRef.current = null; markerRef.current?.setMap(null); markerRef.current = null; };
    // The map is created once per editor opening; changes are synchronized below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!validLocation(location)) { markerRef.current?.setMap(null); return; }
    const position = { lat: location.latitude, lng: location.longitude };
    if (!markerRef.current) markerRef.current = new google.maps.Marker({ map, position, title: "Local selecionado" });
    else { markerRef.current.setMap(map); markerRef.current.setPosition(position); }
    map.panTo(position);
  }, [location]);

  return <div className="rounded-xl border border-line">
    <div className="flex items-center gap-2 rounded-t-xl border-b border-line bg-white px-3 py-2"><Search size={17} className="shrink-0 text-muted" aria-hidden="true" /><div ref={searchElement} aria-label="Buscar endereço no Google Maps" className="min-w-0 flex-1 text-sm" /></div>
    <div ref={mapElement} className="h-64 w-full rounded-b-xl sm:h-80" role="application" aria-label="Mapa para marcar localização" />
  </div>;
}
