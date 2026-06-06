const cache = new Map();

/** Précharge un chunk lazy au survol / mousedown sur un lien. */
export function prefetchRoute(path) {
  const loaders = {
    "/messages": () => import("@/pages/Conversations"),
    "/admin-login": () => import("@/pages/AdminLogin"),
    "/legal": () => import("@/pages/Legal"),
    "/vendre-plus-vite": () => import("@/pages/SellFaster"),
    "/payment/return": () => import("@/pages/PaymentReturn"),
  };

  const base = path.split("?")[0];
  const loader = loaders[base];
  if (!loader || cache.has(base)) return;
  cache.set(base, loader());
}

export function prefetchHandlersFor(path) {
  return {
    onMouseEnter: () => prefetchRoute(path),
    onFocus: () => prefetchRoute(path),
    onMouseDown: () => prefetchRoute(path),
  };
}
