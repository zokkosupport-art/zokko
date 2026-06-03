"""Server-rendered SEO HTML for Zokko — listings + city/category hubs (Guinea)."""
from __future__ import annotations

import html
import json
import re
import unicodedata
from typing import Any, Optional

CRAWLER_UA = re.compile(
    r"facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|slackbot|"
    r"telegrambot|discordbot|pinterest|googlebot|bingbot|bingpreview|embedly|"
    r"yandex|duckduckbot|slurp|applebot",
    re.I,
)

CITY_SLUGS: dict[str, str] = {
    "conakry": "Conakry",
    "kankan": "Kankan",
    "labe": "Labé",
    "kindia": "Kindia",
    "nzerekore": "Nzérékoré",
    "boke": "Boké",
    "faranah": "Faranah",
    "mamou": "Mamou",
    "siguiri": "Siguiri",
    "kissidougou": "Kissidougou",
}

CATEGORY_SLUGS: dict[str, str] = {
    "immobilier": "Immobilier",
    "vehicules": "Véhicules",
    "electronique": "Électronique",
    "mode": "Mode",
    "services": "Services",
    "emploi": "Emploi",
    "alimentation": "Alimentation",
}

_STYLE = """
body{font-family:system-ui,-apple-system,sans-serif;margin:0;color:#1A2E22;background:#FAF8F5;line-height:1.5}
.wrap{max-width:920px;margin:0 auto;padding:24px 16px 48px}
.breadcrumb{font-size:14px;color:#4A5D50;margin-bottom:12px}
.breadcrumb a{color:#D84315;text-decoration:none}
h1{font-size:1.6rem;margin:0 0 8px}
.lead{color:#4A5D50;margin:0 0 20px}
.cta{display:inline-block;background:#D84315;color:#fff!important;padding:12px 20px;border-radius:999px;
font-weight:700;text-decoration:none;margin:8px 0 24px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;margin-top:16px}
.card{background:#fff;border:1px solid #E5E0D8;border-radius:16px;padding:14px;text-decoration:none;color:inherit}
.card strong{display:block;color:#1A2E22;margin-bottom:4px}
.card span{color:#D84315;font-weight:700}
.card small{color:#4A5D50}
.pills{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0}
.pill{background:#fff;border:1px solid #E5E0D8;border-radius:999px;padding:6px 12px;font-size:13px;
text-decoration:none;color:#1A2E22}
footer{margin-top:32px;font-size:13px;color:#4A5D50}
"""


def is_crawler(user_agent: str) -> bool:
    return bool(CRAWLER_UA.search(user_agent or ""))


def request_base(request) -> str:
    forwarded_proto = request.headers.get("x-forwarded-proto", "https")
    forwarded_host = request.headers.get("x-forwarded-host") or request.headers.get("host")
    if forwarded_host:
        return f"{forwarded_proto}://{forwarded_host}".rstrip("/")
    return str(request.base_url).rstrip("/")


def city_slug(city: str) -> str:
    for slug, name in CITY_SLUGS.items():
        if name.lower() == city.lower():
            return slug
    s = unicodedata.normalize("NFKD", city).encode("ascii", "ignore").decode("ascii")
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s or "guinee"


def city_from_slug(slug: str) -> Optional[str]:
    return CITY_SLUGS.get(slug.lower())


def category_from_slug(slug: str) -> Optional[str]:
    return CATEGORY_SLUGS.get(slug.lower())


def _esc(text: Any) -> str:
    return html.escape(str(text or ""), quote=True)


def format_price(listing: dict) -> str:
    price = listing.get("price", 0)
    currency = listing.get("currency", "GNF")
    try:
        n = int(float(price))
        return f"{n:,}".replace(",", " ") + f" {currency}"
    except (TypeError, ValueError):
        return f"{price} {currency}"


def listing_image_url(base: str, listing: dict) -> str:
    photos = listing.get("photos") or []
    if not photos:
        return f"{base}/branding/icon-512.png"
    p0 = photos[0]
    if str(p0).startswith(("http://", "https://")):
        return p0
    return f"{base}/api/files/{p0}"


def hub_title(city: Optional[str], category: Optional[str]) -> str:
    if city and category:
        return f"{category} à {city} — Annonces Zokko Guinée"
    if city:
        return f"Annonces {city} — Marketplace Zokko Guinée"
    if category:
        return f"{category} en Guinée — Annonces Zokko"
    return "Annonces Guinée — Zokko Marketplace"


def hub_description(city: Optional[str], category: Optional[str], count: int) -> str:
    parts = []
    if category:
        parts.append(category.lower())
    parts.append("annonces")
    if city:
        parts.append(f"à {city}")
    else:
        parts.append("en Guinée")
    tail = f"{count} annonce{'s' if count != 1 else ''} sur Zokko. Contact WhatsApp direct, prix en GNF, inscription +224."
    return " ".join(parts).capitalize() + f". {tail}"


def hub_intro(city: Optional[str], category: Optional[str]) -> str:
    if city and category:
        return (
            f"Achetez et vendez {category.lower()} à {city} sur Zokko, la marketplace guinéenne. "
            f"Annonces avec photos, prix en francs guinéens et contact vendeur sur WhatsApp."
        )
    if city:
        return (
            f"Parcourez les petites annonces à {city} : véhicules, téléphones, mode, immobilier, services et plus. "
            f"Publication gratuite, visible partout en Guinée."
        )
    if category:
        return (
            f"Toutes les annonces {category.lower()} en Guinée : Conakry, Kankan, Labé, Kindia et autres villes. "
            f"Trouvez ou vendez près de chez vous sur Zokko."
        )
    return "Marketplace et petites annonces gratuites en Guinée."


def hub_canonical(base: str, city: Optional[str], category: Optional[str]) -> str:
    cat_slug = next((k for k, v in CATEGORY_SLUGS.items() if v == category), None) if category else None
    if city and category and cat_slug:
        return f"{base}/annonces/{city_slug(city)}/{cat_slug}"
    if city:
        return f"{base}/annonces/{city_slug(city)}"
    if category and cat_slug:
        return f"{base}/annonces/categorie/{cat_slug}"
    return f"{base}/listings"


def hub_app_url(city: Optional[str], category: Optional[str]) -> str:
    from urllib.parse import urlencode

    params = {}
    if city:
        params["city"] = city
    if category:
        cat_slug = next((k for k, v in CATEGORY_SLUGS.items() if v == category), None)
        if cat_slug:
            params["category"] = cat_slug
    q = urlencode(params)
    return f"/listings{'?' + q if q else ''}"


def breadcrumbs(base: str, city: Optional[str], category: Optional[str]) -> list[tuple[str, str]]:
    crumbs = [("Accueil", f"{base}/"), ("Annonces", f"{base}/listings")]
    if city:
        crumbs.append((city, f"{base}/annonces/{city_slug(city)}"))
    if category:
        cat_slug = next((k for k, v in CATEGORY_SLUGS.items() if v == category), "mode")
        if city:
            crumbs.append((category, f"{base}/annonces/{city_slug(city)}/{cat_slug}"))
        else:
            crumbs.append((category, f"{base}/annonces/categorie/{cat_slug}"))
    return crumbs


def breadcrumb_json_ld(base: str, city: Optional[str], category: Optional[str]) -> dict:
    items = []
    for i, (name, url) in enumerate(breadcrumbs(base, city, category), start=1):
        items.append({"@type": "ListItem", "position": i, "name": name, "item": url})
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": items}


def item_list_json_ld(base: str, listings: list[dict]) -> dict:
    elements = []
    for i, li in enumerate(listings[:20], start=1):
        elements.append(
            {
                "@type": "ListItem",
                "position": i,
                "url": f"{base}/listings/{li.get('id', '')}",
                "name": (li.get("title") or "Annonce")[:80],
            }
        )
    return {"@context": "https://schema.org", "@type": "ItemList", "itemListElement": elements}


def product_json_ld(base: str, listing: dict, image_url: str) -> dict:
    doc = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": listing.get("title"),
        "description": (listing.get("description") or listing.get("title") or "")[:500],
        "offers": {
            "@type": "Offer",
            "price": listing.get("price", 0),
            "priceCurrency": listing.get("currency", "GNF"),
            "availability": "https://schema.org/InStock",
            "url": f"{base}/listings/{listing.get('id', '')}",
        },
        "brand": {"@type": "Brand", "name": "Zokko"},
    }
    if image_url:
        doc["image"] = [image_url]
    return doc


def _json_ld_script(*blocks: dict) -> str:
    clean = [b for b in blocks if b]
    if not clean:
        return ""
    payload = clean[0] if len(clean) == 1 else clean
    return f'<script type="application/ld+json">{json.dumps(payload, ensure_ascii=False)}</script>'


def render_hub_page(
    *,
    base: str,
    city: Optional[str],
    category: Optional[str],
    listings: list[dict],
) -> str:
    title = hub_title(city, category)
    description = hub_description(city, category, len(listings))
    cat_slug = next((k for k, v in CATEGORY_SLUGS.items() if v == category), None) if category else None
    canonical = hub_canonical(base, city, category)
    h1 = title.replace(" — Annonces Zokko Guinée", "").replace(" — Marketplace Zokko Guinée", "").replace(" — Annonces Zokko", "")
    intro = hub_intro(city, category)
    app_url = hub_app_url(city, category)

    crumb_html = " › ".join(
        f'<a href="{_esc(url)}">{_esc(name)}</a>' if i < len(breadcrumbs(base, city, category)) - 1 else f"<span>{_esc(name)}</span>"
        for i, (name, url) in enumerate(breadcrumbs(base, city, category))
    )

    cards = []
    for li in listings[:24]:
        lid = li.get("id", "")
        cards.append(
            f'<a class="card" href="{_esc(base)}/listings/{_esc(lid)}">'
            f"<strong>{_esc((li.get('title') or 'Annonce')[:70])}</strong>"
            f"<span>{_esc(format_price(li))}</span><br/>"
            f"<small>{_esc(li.get('city') or '')}</small></a>"
        )
    if not cards:
        cards.append('<p class="lead">Aucune annonce pour le moment. Soyez le premier à publier sur Zokko.</p>')

    city_pills = ""
    if category and not city:
        city_pills = '<div class="pills">' + "".join(
            f'<a class="pill" href="{_esc(base)}/annonces/{slug}/{cat_slug}">{_esc(name)}</a>'
            for slug, name in CITY_SLUGS.items()
        ) + "</div>"

    cat_pills = ""
    if city and not category:
        cat_pills = '<div class="pills">' + "".join(
            f'<a class="pill" href="{_esc(base)}/annonces/{city_slug(city)}/{slug}">{_esc(name)}</a>'
            for slug, name in CATEGORY_SLUGS.items()
        ) + "</div>"

    ld = _json_ld_script(breadcrumb_json_ld(base, city, category), item_list_json_ld(base, listings))

    return f"""<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>{_esc(title)}</title>
<meta name="description" content="{_esc(description[:160])}"/>
<meta name="robots" content="index, follow, max-image-preview:large"/>
<link rel="canonical" href="{_esc(canonical)}"/>
<meta property="og:type" content="website"/>
<meta property="og:title" content="{_esc(title)}"/>
<meta property="og:description" content="{_esc(description[:200])}"/>
<meta property="og:url" content="{_esc(canonical)}"/>
<meta property="og:image" content="{_esc(base)}/branding/icon-512.png"/>
<meta property="og:site_name" content="Zokko"/>
<meta property="og:locale" content="fr_GN"/>
{ld}
<style>{_STYLE}</style>
</head><body>
<div class="wrap">
<nav class="breadcrumb">{crumb_html}</nav>
<h1>{_esc(h1)}</h1>
<p class="lead">{_esc(intro)}</p>
<a class="cta" href="{_esc(app_url)}">Voir toutes les annonces sur Zokko →</a>
{cat_pills}{city_pills}
<div class="grid">{''.join(cards)}</div>
<footer>Marketplace Zokko · Petites annonces gratuites en Guinée · <a href="{_esc(base)}/">zokko.net</a></footer>
</div>
</body></html>"""


def render_listing_seo_page(
    *,
    base: str,
    listing: dict,
    for_crawler: bool,
    social_share: bool = False,
) -> str:
    """Full SEO HTML for a listing (Google) or OG share (Facebook)."""
    listing_id = listing.get("id", "")
    listing_url = f"{base}/listings/{listing_id}"
    share_url = f"{base}/api/s/{listing_id}"
    image_url = listing_image_url(base, listing)
    title = (listing.get("title") or "Annonce")[:80]
    price = format_price(listing)
    city = listing.get("city", "Guinée")
    desc = f"{price} · {city} · Vu sur Zokko"
    full_desc = (listing.get("description") or desc)[:300]
    page_title = f"{title} | Zokko Guinée"
    meta_desc = f"{title} — {price} — {city}. {(listing.get('description') or '')[:100]}".strip()[:160]

    redirect_meta = ""
    redirect_script = ""
    if social_share and not for_crawler:
        redirect_meta = f'<meta http-equiv="refresh" content="0;url={_esc(listing_url)}"/>'
        redirect_script = f"<script>window.location.replace({json.dumps(listing_url)});</script>"

    og_url = share_url if (social_share and for_crawler) else listing_url

    og_image = ""
    if image_url:
        og_image = (
            f'<meta property="og:image" content="{_esc(image_url)}"/>'
            f'<meta property="og:image:secure_url" content="{_esc(image_url)}"/>'
            '<meta property="og:image:width" content="1200"/>'
            '<meta property="og:image:height" content="900"/>'
        )

    body_extra = ""
    if for_crawler and not social_share:
        body_extra = f"""
<p>{_esc(full_desc[:400])}</p>
<div class="grid" style="max-width:480px">
  <a class="card" href="{_esc(listing_url)}">
    <strong>{_esc(title)}</strong>
    <span>{_esc(price)}</span><br/><small>{_esc(city)}</small>
  </a>
</div>"""

    ld = _json_ld_script(product_json_ld(base, listing, image_url))

    return f"""<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>{_esc(page_title)}</title>
<meta name="description" content="{_esc(meta_desc)}"/>
<meta name="robots" content="index, follow, max-image-preview:large"/>
<link rel="canonical" href="{_esc(listing_url)}"/>
<meta property="og:type" content="product"/>
<meta property="og:title" content="{_esc(title)}"/>
<meta property="og:description" content="{_esc(desc)} — {_esc(full_desc[:160])}"/>
<meta property="og:url" content="{_esc(og_url)}"/>
{og_image}
<meta property="og:site_name" content="Zokko"/>
<meta property="product:price:amount" content="{listing.get('price', 0)}"/>
<meta property="product:price:currency" content="{listing.get('currency', 'GNF')}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="{_esc(title)}"/>
<meta name="twitter:description" content="{_esc(desc)}"/>
<meta name="twitter:image" content="{_esc(image_url)}"/>
{redirect_meta}
{ld}
<style>{_STYLE}</style>
</head><body>
<div class="wrap">
<h1>{_esc(title)}</h1>
<p class="lead">{_esc(desc)}</p>
{body_extra}
<p><a class="cta" href="{_esc(listing_url)}">Voir l'annonce sur Zokko →</a></p>
{redirect_script}
</div>
</body></html>"""
