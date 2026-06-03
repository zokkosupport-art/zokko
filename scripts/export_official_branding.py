"""Export site/PWA icons from the official Zokko icon (square elephant on white).

Source file (do not confuse with full poster):
  marketing/logo-icon-officiel.png
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "marketing" / "logo-icon-officiel.png"
OUT = ROOT / "frontend" / "public" / "branding"


def main() -> None:
    if not SRC.is_file():
        raise SystemExit(
            f"Missing {SRC}\n"
            "Place the official square elephant icon (Facebook profile style) there."
        )
    mark = Image.open(SRC).convert("RGBA")
    # Square 512 master
    s = max(mark.size)
    if mark.width != mark.height:
        sq = Image.new("RGBA", (s, s), (255, 255, 255, 255))
        sq.paste(mark, ((s - mark.width) // 2, (s - mark.height) // 2))
        mark = sq
    mark = mark.resize((512, 512), Image.Resampling.LANCZOS)

    OUT.mkdir(parents=True, exist_ok=True)
    sizes = {
        "icon-512.png": 512,
        "icon-192.png": 192,
        "apple-touch-icon.png": 180,
        "favicon-64.png": 64,
        "favicon-32.png": 32,
        "logo-elephant-officiel.png": 512,
    }
    for name, size in sizes.items():
        out_img = mark.resize((size, size), Image.Resampling.LANCZOS)
        out_img.save(OUT / name, optimize=True)
        print("wrote", OUT / name)

    # Copy master into marketing for reference
    mark.save(ROOT / "marketing" / "logo-icon-officiel.png", optimize=True)
    print("ok — official icon only (not the full affiche poster)")


if __name__ == "__main__":
    main()
