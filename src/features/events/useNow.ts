import { useEffect, useState } from "react";

const NOW_REFRESH_INTERVAL_MS = 30_000;

export function useNow() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") tick();
    };

    const interval = window.setInterval(tick, NOW_REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return now;
}
