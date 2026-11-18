import { useCallback, useSyncExternalStore } from 'react';

/** Acompanha uma media query. Sem `matchMedia` (SSR, testes simples) devolve `fallback`. */
export function useMediaQuery(query: string, fallback = false) {
  const subscribe = useCallback((update: () => void) => {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {};
    const media = window.matchMedia(query);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);
  const getSnapshot = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : fallback);
  return useSyncExternalStore(subscribe, getSnapshot, () => fallback);
}
