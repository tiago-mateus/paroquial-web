let mapModule: Promise<typeof import("./ChurchesMapInner")> | undefined;

/** Share the same download between navigation intent, route entry and React.lazy. */
export function loadChurchMap() {
  mapModule ??= import("./ChurchesMapInner").catch((error: unknown) => {
    mapModule = undefined;
    throw error;
  });
  return mapModule;
}

export function prepareChurchMap() {
  if (import.meta.env.MODE === "test" || typeof document === "undefined") return;

  const origin = "https://tiles.openfreemap.org";
  if (!document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) {
    const connection = document.createElement("link");
    connection.rel = "preconnect";
    connection.href = origin;
    connection.crossOrigin = "anonymous";
    document.head.append(connection);
  }

  // A speculative download must not interrupt navigation when it fails.
  void loadChurchMap().catch(() => {});
}
