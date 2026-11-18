const paths = [
  "M12 2v4m-1.5-2.5h3",
  "M8 21V9l4-3 4 3v12",
  "m8 12-5 3v6h18v-6l-5-3",
  "M10 21v-4a2 2 0 0 1 4 0v4",
  "M13 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0",
  "M5.5 16v2m13-2v2M2 21h20",
];

/** Shared church silhouette for Leaflet markers and photo fallbacks. */
export const churchIconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths.map((d) => `<path d="${d}"/>`).join("")}</svg>`;

export function ChurchIcon({ size = 24 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths.map((d) => <path key={d} d={d} />)}</svg>;
}
