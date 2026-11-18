import { useCallback, useEffect, useRef, useState } from "react";
import type { LocationPoint } from "../churches.utils";

export function useChurchLocation() {
  const [userLocation, setUserLocation] = useState<LocationPoint>();
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "error">("idle");
  const requestRef = useRef(0);

  useEffect(() => () => { requestRef.current += 1; }, []);
  useEffect(() => {
    if (locationStatus !== "error") return;
    const timeout = window.setTimeout(() => setLocationStatus("idle"), 8000);
    return () => window.clearTimeout(timeout);
  }, [locationStatus]);

  const dismissLocationError = useCallback(() => setLocationStatus((status) => status === "error" ? "idle" : status), []);
  const locateUser = useCallback(() => {
    const request = ++requestRef.current;
    if (!navigator.geolocation) { setLocationStatus("error"); return; }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (request !== requestRef.current) return;
      setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });
      setLocationStatus("idle");
    }, () => {
      if (request === requestRef.current) setLocationStatus("error");
    }, { enableHighAccuracy: true, timeout: 10000 });
  }, []);

  return { userLocation, locationStatus, locateUser, dismissLocationError };
}
