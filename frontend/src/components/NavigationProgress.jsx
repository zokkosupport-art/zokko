import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

/** Fine barre de progression en haut lors des changements de route (style NProgress). */
export default function NavigationProgress() {
  const { pathname } = useLocation();
  const [phase, setPhase] = useState("idle");

  useEffect(() => {
    setPhase("start");
    const raf = requestAnimationFrame(() => setPhase("progress"));
    const done = setTimeout(() => setPhase("complete"), 280);
    const hide = setTimeout(() => setPhase("idle"), 480);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(done);
      clearTimeout(hide);
    };
  }, [pathname]);

  if (phase === "idle") return null;

  const width =
    phase === "start" ? "0%" : phase === "progress" ? "82%" : "100%";
  const opacity = phase === "complete" ? 0 : 1;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] h-[3px] pointer-events-none"
      role="progressbar"
      aria-hidden
    >
      <div
        className="h-full bg-[#D84315] shadow-[0_0_8px_rgba(216,67,21,0.45)]"
        style={{
          width,
          opacity,
          transition:
            phase === "complete"
              ? "width 120ms ease-out, opacity 200ms ease-out"
              : "width 320ms cubic-bezier(0.4, 0, 0.2, 1), opacity 100ms",
        }}
      />
    </div>
  );
}
