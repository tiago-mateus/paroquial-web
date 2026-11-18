import { useEffect, useRef, useState } from 'react';

/** Synchronize clean forms while keeping the local draft during background refetches. */
export function useAdminDraft<T>(initial: T, serverValue: T | undefined) {
  const [value, setValue] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const seen = useRef<T | undefined>(undefined);
  const dirty = JSON.stringify(value) !== JSON.stringify(baseline);
  useEffect(() => {
    if (serverValue === undefined || serverValue === seen.current) return;
    seen.current = serverValue;
    if (!dirty) { setValue(serverValue); setBaseline(serverValue); }
  }, [serverValue, dirty]);
  const commit = (saved: T) => { setValue(saved); setBaseline(saved); };
  return { value, setValue, dirty, commit };
}
