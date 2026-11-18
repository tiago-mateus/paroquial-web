import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { apiFetch } from "../../shared/api/http";
import { Failure, secondaryClass } from "./SubscriptionShell";

export function DemoResetButton() {
  const client = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  async function restart() {
    if (inFlight.current) return;
    inFlight.current = true; setPending(true); setError("");
    try {
      await client.cancelQueries();
      await apiFetch("/api/v1/__demo/reset", { method: "POST" });
      try {
        const keys = Array.from({ length: sessionStorage.length }, (_, index) => sessionStorage.key(index));
        keys.forEach((key) => { if (key?.startsWith("paroquial.signup.")) sessionStorage.removeItem(key); });
      } catch { /* Storage may be disabled; the mock server was still reset. */ }
      client.clear();
      window.location.replace("/assinar");
    } catch { setError("Não foi possível reiniciar a demonstração. Tente novamente."); inFlight.current = false; setPending(false); }
  }
  if (!import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCKS !== "true") return null;
  return confirming ? <div className="mt-2 max-w-xl rounded-md border border-line bg-surface p-4">
    <p className="m-0 text-sm leading-6">Reiniciar esta demonstração? Os dados desta contratação simulada serão removidos para começar outro teste.</p>
    <div className="mt-2 flex flex-wrap gap-2"><button type="button" className={secondaryClass} disabled={pending} onClick={() => setConfirming(false)}>Cancelar</button><button type="button" className={`${secondaryClass} bg-selection`} disabled={pending} onClick={() => void restart()}>{pending ? "Reiniciando…" : "Confirmar reinício"}</button></div>
    <Failure message={error} />
  </div> : <button type="button" className={`${secondaryClass} px-0`} onClick={() => setConfirming(true)}>Reiniciar teste</button>;
}
