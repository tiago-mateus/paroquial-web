import { useCallback, useRef, useState } from "react";

export type DragReorderHandlers = {
  /** props para o "punho" de arrastar de cada item */
  handleProps: (index: number) => {
    onPointerDown: (event: React.PointerEvent) => void;
    style: React.CSSProperties;
  };
  /** índice do item sendo arrastado, ou null */
  draggingIndex: number | null;
  /** índice sobre o qual o item arrastado está posicionado, ou null */
  overIndex: number | null;
};

/**
 * Reordenação por arrastar-e-soltar com suporte a toque (Pointer Events).
 * Chama onCommit(from, to) quando o usuário solta em uma posição diferente.
 * A persistência/otimismo fica a cargo de quem consome (ex.: React Query).
 */
export function useDragReorder(total: number, onCommit: (from: number, to: number) => void, layout: "vertical" | "grid" = "vertical"): DragReorderHandlers {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const stateRef = useRef({ from: -1, over: -1, rows: [] as HTMLElement[] });

  const cleanup = useCallback(() => {
    setDraggingIndex(null);
    setOverIndex(null);
    stateRef.current = { from: -1, over: -1, rows: [] };
    document.body.style.userSelect = "";
    document.body.style.touchAction = "";
  }, []);

  const handleProps = useCallback((index: number) => ({
    style: { touchAction: "none" as const, cursor: "grab" },
    onPointerDown: (event: React.PointerEvent) => {
      if (event.button !== 0 && event.pointerType === "mouse") return;
      const article = (event.currentTarget as HTMLElement).closest("[data-drag-item]") as HTMLElement | null;
      const list = article?.parentElement;
      if (!article || !list) return;
      event.preventDefault();

      const rows = Array.from(list.querySelectorAll<HTMLElement>("[data-drag-item]"));
      stateRef.current = { from: index, over: index, rows };
      setDraggingIndex(index);
      setOverIndex(index);
      document.body.style.userSelect = "none";
      document.body.style.touchAction = "none";

      const onMove = (moveEvent: PointerEvent) => {
        const { rows: currentRows } = stateRef.current;
        if (layout === "grid") {
          // Use both axes so cards in the same row remain distinct drop targets.
          let nearest = 0;
          let shortestDistance = Infinity;
          currentRows.forEach((row, index) => {
            const rect = row.getBoundingClientRect();
            const dx = Math.max(rect.left - moveEvent.clientX, 0, moveEvent.clientX - rect.right);
            const dy = Math.max(rect.top - moveEvent.clientY, 0, moveEvent.clientY - rect.bottom);
            const distance = dx * dx + dy * dy;
            if (distance < shortestDistance) { shortestDistance = distance; nearest = index; }
          });
          if (nearest !== stateRef.current.over) {
            stateRef.current.over = nearest;
            setOverIndex(nearest);
          }
          return;
        }
        const y = moveEvent.clientY;
        let next = currentRows.length - 1;
        for (let i = 0; i < currentRows.length; i += 1) {
          const rect = currentRows[i].getBoundingClientRect();
          if (y < rect.top + rect.height / 2) { next = i; break; }
        }
        if (next !== stateRef.current.over) {
          stateRef.current.over = next;
          setOverIndex(next);
        }
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        const { from, over } = stateRef.current;
        if (from >= 0 && over >= 0 && from !== over) onCommit(from, over);
        cleanup();
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
  }), [cleanup, onCommit, layout]);

  // total é aceito para futura validação de limites; mantém a assinatura estável.
  void total;

  return { handleProps, draggingIndex, overIndex };
}
