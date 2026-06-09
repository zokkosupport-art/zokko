import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Radix Dialog/Sheet peut laisser overlay + pointer-events:none sur body après navigation SPA. */
export function clearStuckOverlays() {
  document.body.style.pointerEvents = "";
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
  document.body.removeAttribute("data-scroll-locked");

  document.querySelectorAll("[data-radix-focus-guard]").forEach((el) => el.remove());
  document.querySelectorAll("[data-radix-dialog-overlay]").forEach((el) => el.remove());
  document.querySelectorAll("[data-radix-portal]").forEach((portal) => {
    if (portal.querySelector('[role="dialog"]') || portal.querySelector("[data-radix-dialog-overlay]")) {
      portal.remove();
    }
  });
}

/** Ferme modales / état local quand on change de page. */
export function useResetOnNavigate(reset) {
  const { pathname } = useLocation();
  useEffect(() => {
    reset();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Débloque body + retire overlays Radix orphelins à chaque changement de route. */
export function useUnlockBodyOnNavigate() {
  const { pathname } = useLocation();
  useEffect(() => {
    clearStuckOverlays();
  }, [pathname]);
}
