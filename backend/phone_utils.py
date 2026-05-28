"""Phone normalization for Guinea (+224) and France (+33)."""
import re
from typing import List


def normalize_phone(phone: str, country: str = "GN") -> str:
    """Return E.164 digits without '+' (e.g. 224612516488, 33659497111)."""
    p = re.sub(r"\D", "", (phone or "").strip())
    if not p:
        return p

    if p.startswith("224") and len(p) == 12:
        return p
    if p.startswith("33") and len(p) == 11:
        return p

    country = (country or "GN").upper()
    if country == "FR":
        if p.startswith("33"):
            return p[:11] if len(p) >= 11 else "33" + p[2:]
        if p.startswith("0"):
            p = p[1:]
        return "33" + p

    # Guinea default
    if p.startswith("224"):
        return p[:12]
    if len(p) == 9:
        return "224" + p
    return p


def phone_lookup_keys(normalized: str) -> List[str]:
    """Legacy 9-digit Guinea keys + E.164 for DB lookup."""
    keys = []
    if normalized:
        keys.append(normalized)
    if normalized.startswith("224") and len(normalized) == 12:
        keys.append(normalized[3:])
    return list(dict.fromkeys(keys))


def format_phone_display(normalized: str) -> str:
    if normalized.startswith("224") and len(normalized) == 12:
        return f"+224 {normalized[3:]}"
    if normalized.startswith("33") and len(normalized) == 11:
        return f"+33 {normalized[2:]}"
    return f"+{normalized}"
