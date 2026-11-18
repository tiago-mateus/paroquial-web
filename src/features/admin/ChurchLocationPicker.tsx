import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { ArrowLeft, Check, CheckCircle2, LoaderCircle, LocateFixed, MapPin, Maximize2, MousePointerClick, Move, Search, X } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
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

function useMediaQuery(query: string) {
  const subscribe = useCallback((update: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}

function currentPosition() {
  return new Promise<ChurchLocation>((resolve, reject) => {
    if (!("geolocation" in navigator)) { reject("Este navegador não informa a localização. Busque o endereço ou marque no mapa."); return; }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      (error) => reject(error.code === error.PERMISSION_DENIED
        ? "A permissão de localização foi negada. Busque o endereço ou marque no mapa."
        : "Não foi possível obter sua localização. Busque o endereço ou marque no mapa."),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    );
  });
}
const overlayButtonClass = "inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-ink shadow-[0_4px_14px_rgb(15_23_42/0.18)] transition-colors hover:bg-selection focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-70";

export function ChurchLocationPicker({ location, center, searchNear, address, onLocationChange, onAddressChange }: {
  location: ChurchLocation;
  center: ChurchLocation;
  /** Centro usado para priorizar resultados próximos na busca, quando conhecido. */
  searchNear?: ChurchLocation;
  address: string;
  onLocationChange: (location: ChurchLocation) => void;
  onAddressChange: (address: string) => void;
}) {
  const [googleFailed, setGoogleFailed] = useState(false);
  const [selectionError, setSelectionError] = useState("");
  const [focusKey, setFocusKey] = useState(0);
  const [suggestion, setSuggestion] = useState<{ address: string; status: "loading" | "ready" } | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading">("idle");
  const [expanded, setExpanded] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const desktop = useMediaQuery("(min-width: 768px)");
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

  function pick(next: ChurchLocation, source: LocationSource) {
    setSelectionError("");
    onLocationChange(next);
    if (source !== "map") setFocusKey((key) => key + 1);
    if (source !== "search") suggestAddressFor(next);
  }

  function selectSearchResult(place: GeocodedPlace) {
    pick({ latitude: place.latitude, longitude: place.longitude }, "search");
    if (!address.trim()) {
      onAddressChange(place.address);
      setAutoFilled(true);
      setSuggestion(null);
    } else if (place.address !== address.trim()) {
      setSuggestion({ address: place.address, status: "ready" });
    }
  }

  function locateMe() {
    setGpsStatus("loading");
    void currentPosition().then(
      (next) => { setGpsStatus("idle"); pick(next, "gps"); },
      (message: string) => { setGpsStatus("idle"); setSelectionError(message); },
    );
  }

  /** Volta do mapa ampliado com o ponto confirmado. */
  function confirmFromExpanded(next: ChurchLocation, pointAddress?: string) {
    setExpanded(false);
    setSelectionError("");
    onLocationChange(next);
    setFocusKey((key) => key + 1);
    window.clearTimeout(reverseTimer.current);
    reverseAbort.current?.abort();
    if (!pointAddress) { suggestAddressFor(next); return; }
    if (!address.trim()) { onAddressChange(pointAddress); setAutoFilled(true); setSuggestion(null); }
    else if (pointAddress !== address.trim()) setSuggestion({ address: pointAddress, status: "ready" });
    else setSuggestion(null);
  }

  const openLabel = hasLocation ? "Ajustar no mapa" : "Marcar no mapa";

  return (
    <section aria-labelledby="church-location-title" className="sm:col-span-2">
      <div className="mb-3">
        <h3 id="church-location-title" className="m-0 flex items-center gap-2 text-base font-semibold text-ink"><MapPin size={18} className="text-primary" aria-hidden="true" />Onde fica a igreja?</h3>
        <p className="m-0 mt-1 text-sm leading-5 text-muted">
          {useGoogle
            ? "Busque pelo nome ou endereço e confira o pino no mapa."
            : desktop
              ? "Busque pelo nome ou endereço. Depois, confira o pino no mapa e arraste se precisar."
              : "Busque pelo nome ou endereço, ou abra o mapa para marcar o ponto exato."}
        </p>
      </div>

      {useGoogle ? (
        <GoogleLocationMap location={location} center={center} onLocationChange={onLocationChange} onAddressChange={onAddressChange} onError={(message) => { setGoogleFailed(true); setSelectionError(message); }} onSelectionError={setSelectionError} />
      ) : (
        <>
          <LocationSearch near={searchNear} onSelect={selectSearchResult} />
          <div className={classNames(mapFrameClass, "mt-3", desktop ? "h-80" : "h-44")} aria-label="Mapa para marcar localização">
            {isTest
              ? <div className="h-full w-full" />
              : <Suspense fallback={<div className="h-full w-full animate-pulse bg-canvas" />}><FallbackMap location={location} center={center} focusKey={focusKey} interactive={desktop} onPick={pick} /></Suspense>}

            {desktop ? (
              <>
                {!hasLocation ? (
                  <p className="pointer-events-none absolute inset-x-3 top-3 z-[1000] m-0 flex justify-center">
                    <span className="inline-flex items-center gap-2 rounded-full bg-ink/85 px-3 py-1.5 text-xs font-semibold text-white shadow">
                      <MousePointerClick size={14} aria-hidden="true" />Clique no mapa onde fica a igreja
                    </span>
                  </p>
                ) : null}
                <div className="absolute right-3 top-3 z-[1000]">
                  <button ref={openButtonRef} type="button" onClick={() => setExpanded(true)} className={overlayButtonClass}>
                    <Maximize2 size={16} className="text-primary" aria-hidden="true" />Ampliar mapa
                  </button>
                </div>
                <div className="absolute bottom-3 left-3 z-[1000]">
                  <button type="button" onClick={locateMe} disabled={gpsStatus === "loading"} className={overlayButtonClass}>
                    {gpsStatus === "loading" ? <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <LocateFixed size={16} className="text-primary" aria-hidden="true" />}
                    {gpsStatus === "loading" ? "Localizando…" : "Estou na igreja"}
                  </button>
                </div>
              </>
            ) : (
              // No celular a prévia não captura gestos: todo o mapa abre a marcação em tela cheia.
              <button ref={openButtonRef} type="button" onClick={() => setExpanded(true)} className="absolute inset-0 z-[1000] flex items-end justify-center bg-gradient-to-t from-ink/35 via-transparent to-transparent p-3 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary">
                <span className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-4 text-[15px] font-semibold text-primary shadow-[0_4px_14px_rgb(15_23_42/0.22)]">
                  <Maximize2 size={17} aria-hidden="true" />{openLabel}
                </span>
              </button>
            )}
          </div>
          {expanded ? (
            <ExpandedLocationPicker
              location={location}
              center={center}
              searchNear={searchNear}
              onCancel={() => { setExpanded(false); openButtonRef.current?.focus(); }}
              onConfirm={(next, pointAddress) => { confirmFromExpanded(next, pointAddress); openButtonRef.current?.focus(); }}
            />
          ) : null}
        </>
      )}

      {selectionError ? <p role="alert" className="mb-0 mt-2 text-sm text-danger">{selectionError}</p> : null}

      <div role="status" className={classNames("mt-3 flex items-start gap-3 rounded-xl px-3.5 py-3 text-sm", hasLocation ? "bg-success/10 text-success" : "bg-warning/10 text-warning")}>
        {hasLocation ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" aria-hidden="true" /> : <MapPin size={18} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />}
        <span className="min-w-0">
          <strong className="block font-semibold">{hasLocation ? "Local marcado no mapa" : "Local ainda não marcado"}</strong>
          <span className="block leading-5">
            {hasLocation
              ? useGoogle ? "Toque em outro ponto do mapa para ajustar." : desktop ? "Arraste o pino ou clique em outro ponto para ajustar." : "Toque no mapa para ajustar o ponto."
              : useGoogle || desktop ? "Use a busca, clique no mapa ou use “Estou na igreja”." : "Use a busca ou toque em “Marcar no mapa”."}
          </span>
          {hasLocation ? <span className="mt-1 block text-xs tabular-nums text-success">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span> : null}
        </span>
      </div>

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

function LocationSearch({ near, onSelect, compact = false }: { near?: ChurchLocation; onSelect: (place: GeocodedPlace) => void; compact?: boolean }) {
  const id = useId();
  const inputId = `${id}-search`;
  const hintId = `${id}-hint`;
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

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // O campo está dentro do formulário da igreja: Enter busca em vez de salvar.
    if (event.key === "Enter") { event.preventDefault(); void run(); }
    if (event.key === "Escape" && results.length) { event.stopPropagation(); setResults([]); setStatus("idle"); }
  }

  return (
    <div className={compact ? "relative" : undefined}>
      <label htmlFor={inputId} className="sr-only">Buscar localização</label>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(event) => { setQuery(event.target.value); if (status !== "loading") setStatus("idle"); }}
            onKeyDown={onKeyDown}
            placeholder="Ex.: Paróquia São José, Campinas"
            autoComplete="off"
            enterKeyHint="search"
            aria-describedby={hintId}
            className={`${fieldClassName} mt-0 pl-10`}
          />
        </div>
        <button type="button" onClick={() => void run()} disabled={tooShort || status === "loading"} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">
          {status === "loading" ? <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
          Buscar
        </button>
      </div>
      <p id={hintId} className={compact ? "sr-only" : "m-0 mt-1.5 text-xs text-muted"}>Inclua a cidade para resultados mais precisos. Busca com dados do OpenStreetMap.</p>

      {/* No mapa ampliado os resultados flutuam sobre o mapa em vez de empurrá-lo. */}
      <div aria-live="polite" className={compact ? "absolute inset-x-0 top-full z-[1100] max-h-[50dvh] overflow-y-auto rounded-xl bg-white shadow-[0_12px_32px_rgb(15_23_42/0.22)] empty:hidden" : undefined}>
        {status === "loading" ? <p className={classNames("m-0 text-sm text-muted", compact ? "px-3.5 py-3" : "mt-2")}>Buscando…</p> : null}
        {status === "error" ? <p role="alert" className={classNames("m-0 text-sm text-danger", compact ? "px-3.5 py-3" : "mt-2")}>A busca não respondeu. Tente de novo em instantes ou marque direto no mapa.</p> : null}
        {status === "done" && !results.length ? <p className={classNames("m-0 text-sm text-muted", compact ? "px-3.5 py-3" : "mt-2")}>Nenhum lugar encontrado. Tente rua e cidade, ou mova o mapa até o local.</p> : null}
        {status === "done" && results.length ? (
          <ul aria-label="Resultados da busca" className={classNames("m-0 list-none divide-y divide-line overflow-hidden rounded-xl p-0", compact ? "" : "mt-2 border border-line")}>
            {results.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  onClick={() => { onSelect(place); setResults([]); setStatus("idle"); setQuery(place.name); }}
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

type PointAddress = { status: "idle" | "loading" | "ready" | "empty"; address?: string };

/**
 * Marcação em tela cheia (celular) ou painel amplo (desktop).
 * O pino fica fixo no centro e a pessoa move o mapa por baixo dele, o que é mais
 * preciso do que arrastar um marcador pequeno com o dedo.
 */
function ExpandedLocationPicker({ location, center, searchNear, onCancel, onConfirm }: {
  location: ChurchLocation;
  center: ChurchLocation;
  searchNear?: ChurchLocation;
  onCancel: () => void;
  onConfirm: (location: ChurchLocation, address?: string) => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const initial = validLocation(location) ? location : center;
  const [draft, setDraft] = useState<ChurchLocation>(initial);
  const [focus, setFocus] = useState<{ key: number; location: ChurchLocation }>({ key: 0, location: initial });
  const [pointAddress, setPointAddress] = useState<PointAddress>({ status: "idle" });
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState("");
  const searchedRef = useRef<{ location: ChurchLocation; address: string } | null>(null);
  const reverseTimer = useRef<number | undefined>(undefined);
  const reverseAbort = useRef<AbortController | null>(null);
  const cancelRef = useRef(onCancel);
  cancelRef.current = onCancel;

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
        if (!controller.signal.aborted) setPointAddress({ status: "empty" });
      }
    }, 800);
  }, []);

  const onCenterChange = useCallback((next: ChurchLocation) => {
    setDraft(next);
    const searched = searchedRef.current;
    // O mapa acabou de centralizar no resultado da busca: mantém o endereço dele.
    if (searched && Math.abs(searched.location.latitude - next.latitude) < 0.00005 && Math.abs(searched.location.longitude - next.longitude) < 0.00005) return;
    searchedRef.current = null;
    lookUpAddress(next);
  }, [lookUpAddress]);

  function moveTo(next: ChurchLocation) {
    setError("");
    setDraft(next);
    setFocus((current) => ({ key: current.key + 1, location: next }));
  }

  function selectPlace(place: GeocodedPlace) {
    const next = { latitude: place.latitude, longitude: place.longitude };
    searchedRef.current = { location: next, address: place.address };
    window.clearTimeout(reverseTimer.current);
    reverseAbort.current?.abort();
    setPointAddress({ status: "ready", address: place.address });
    moveTo(next);
  }

  function locateMe() {
    setGpsStatus("loading");
    void currentPosition().then(
      (next) => { setGpsStatus("idle"); moveTo(next); },
      (message: string) => { setGpsStatus("idle"); setError(message); },
    );
  }

  return createPortal(
    <div className="admin-theme fixed inset-0 z-[90] flex bg-black/45 md:p-6" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="mx-auto flex h-full w-full flex-col overflow-hidden bg-white text-ink shadow-2xl md:max-w-6xl md:rounded-2xl">
        <header className="relative z-[1100] border-b border-line bg-white px-3 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] md:px-5 md:pt-4">
          <div className="mb-3 flex items-center gap-2">
            <button ref={backRef} type="button" onClick={onCancel} aria-label="Voltar ao formulário sem alterar" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink hover:bg-selection focus-visible:outline-2 focus-visible:outline-primary">
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <h2 id={titleId} className="m-0 text-lg font-semibold leading-6">Marcar local da igreja</h2>
              <p className="m-0 hidden text-sm text-muted md:block">Mova o mapa até o pino ficar sobre a entrada da igreja.</p>
            </div>
          </div>
          <LocationSearch near={searchNear} onSelect={selectPlace} compact />
        </header>

        <div className="relative isolate min-h-0 flex-1 bg-canvas">
          {isTest
            ? <div className="h-full w-full" aria-label="Mapa ampliado" />
            : <Suspense fallback={<div className="h-full w-full animate-pulse bg-canvas" />}><FallbackMap location={focus.location} center={initial} focusKey={focus.key} mode="center" onCenterChange={onCenterChange} /></Suspense>}

          {/* Pino fixo: a ponta marca exatamente o centro do mapa. */}
          <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 z-[1000]">
            <span className="absolute left-0 top-0 h-1.5 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink/25" />
            <span className="absolute left-0 top-0 block -translate-x-1/2 -translate-y-full" style={{ width: pinSize, height: pinHeight }} dangerouslySetInnerHTML={{ __html: pinHtml }} />
          </div>

          {/* Começa depois dos botões de zoom para não cobri-los. */}
          <p className="pointer-events-none absolute left-16 right-3 top-3 z-[1000] m-0 flex justify-center md:hidden">
            <span className="inline-flex items-center gap-2 rounded-full bg-ink/85 px-3 py-1.5 text-xs font-semibold text-white shadow">
              <Move size={14} className="shrink-0" aria-hidden="true" />Arraste o mapa até o pino ficar sobre a igreja
            </span>
          </p>

          <div className="absolute bottom-3 right-3 z-[1000]">
            <button type="button" onClick={locateMe} disabled={gpsStatus === "loading"} className={overlayButtonClass}>
              {gpsStatus === "loading" ? <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <LocateFixed size={16} className="text-primary" aria-hidden="true" />}
              {gpsStatus === "loading" ? "Localizando…" : "Estou na igreja"}
            </button>
          </div>
        </div>

        <footer className="border-t border-line bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3 md:flex md:items-center md:gap-4 md:px-5 md:pb-4">
          <div className="min-w-0 flex-1" aria-live="polite">
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted">Ponto marcado</p>
            <p className="m-0 mt-0.5 flex min-h-6 items-center gap-2 text-[15px] font-semibold leading-6">
              {pointAddress.status === "loading" ? <><LoaderCircle size={15} className="animate-spin text-muted motion-reduce:animate-none" aria-hidden="true" /><span className="font-normal text-muted">Buscando endereço…</span></>
                : pointAddress.status === "ready" ? <span className="line-clamp-2">{pointAddress.address}</span>
                : pointAddress.status === "empty" ? <span className="font-normal text-muted">Endereço não identificado. Você pode digitá-lo depois.</span>
                : <span className="font-normal text-muted">Mova o mapa para escolher o ponto.</span>}
            </p>
            <p className="m-0 text-xs tabular-nums text-muted">{draft.latitude.toFixed(6)}, {draft.longitude.toFixed(6)}</p>
            {error ? <p role="alert" className="m-0 mt-1 text-sm text-danger">{error}</p> : null}
          </div>
          <div className="mt-3 flex gap-2 md:mt-0 md:shrink-0">
            <button type="button" onClick={onCancel} className="hidden min-h-12 rounded-xl px-4 text-sm font-semibold text-muted hover:bg-selection md:block">Cancelar</button>
            <button
              type="button"
              onClick={() => onConfirm(draft, pointAddress.status === "ready" ? pointAddress.address : undefined)}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-[15px] font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:flex-none"
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
