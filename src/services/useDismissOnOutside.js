import { useEffect, useRef } from "react";

export function useDismissOnOutside(open, onDismiss, ...refs) {
  const refsRef = useRef(refs);
  const dismissRef = useRef(onDismiss);

  useEffect(() => {
    refsRef.current = refs;
    dismissRef.current = onDismiss;
  });

  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(event) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (refsRef.current.some((ref) => ref.current?.contains(target))) return;
      dismissRef.current();
      function swallowBellClick(clickEvent) {
        const clickTarget = clickEvent.target;
        if (clickTarget instanceof Element && clickTarget.closest("[data-notification-toggle]")) {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
        }
        document.removeEventListener("click", swallowBellClick, true);
      }
      document.addEventListener("click", swallowBellClick, true);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);
}
