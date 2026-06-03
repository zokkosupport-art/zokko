"""Export app icons from the official Zokko elephant poster (marketing/logo-officiel.png)."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "marketing" / "logo-officiel.png"
OUT = ROOT / "frontend" / "public" / "branding"


def main() -> None:
    if not SRC.is_file():
        raise SystemExit(f"Missing {SRC}")
    img = Image.open(SRC).convert("RGBA")
    w, h = img.size
    # Crop the tricolor elephant (top center of the poster)
    left = int(w * 0.30)
    top = int(h * 0.02)
    right = int(w * 0.70)
    bottom = int(h * 0.58)
    mark = img.crop((left, top, right, bottom))
    mark = mark.resize((512, 512), Image.Resampling.LANCZOS)

    OUT.mkdir(parents=True, exist_ok=True)
    sizes = {
        "icon-512.png": 512,
        "icon-192.png": 192,
        "apple-touch-icon.png": 180,
        "favicon-64.png": 64,
        "favicon-32.png": 32,
    }
    for name, size in sizes.items():
        out = mark.resize((size, size), Image.Resampling.LANCZOS)
        out.save(OUT / name, optimize=True)
        print("wrote", OUT / name)

    mark.save(OUT / "logo-elephant-officiel.png", optimize=True)
    print("wrote", OUT / "logo-elephant-officiel.png")


if __name__ == "__main__":
    main()
