import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { applyPageSeo, seoForPath, absoluteUrl, organizationJsonLd, websiteJsonLd } from "@/lib/seo";

/** Default per-route SEO (skip listing detail — handled in ListingDetail). */
export default function PageSeo() {
  const { pathname } = useLocation();
  const isListingDetail = /^\/listings\/[^/]+$/.test(pathname);

  useEffect(() => {
    if (isListingDetail) return;
    const cfg = seoForPath(pathname);
    const jsonLd =
      pathname === "/"
        ? [organizationJsonLd(), websiteJsonLd()]
        : undefined;
    applyPageSeo({
      ...cfg,
      canonical: absoluteUrl(pathname),
      jsonLd,
      noindex: ["/admin", "/admin-login", "/messages", "/profile", "/payment", "/my-ads"].some(
        (p) => pathname === p || pathname.startsWith(`${p}/`)
      ),
    });
  }, [pathname, isListingDetail]);

  return null;
}
