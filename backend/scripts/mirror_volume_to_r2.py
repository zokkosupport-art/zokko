"""Copie une fois les fichiers du volume Railway vers le bucket R2 (secours)."""
from __future__ import annotations

import mimetypes
import sys
from pathlib import Path

# backend/ on path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

import storage  # noqa: E402


def main() -> None:
    if not storage.backup_enabled() and not storage.s3_configured():
        print("Configure STORAGE_BACKUP=s3 et les variables S3_* / R2 dans Railway.")
        sys.exit(1)
    root = storage.get_local_root()
    if not root.is_dir():
        print("Dossier local introuvable:", root)
        sys.exit(1)
    ok = fail = 0
    for path in root.rglob("*"):
        if not path.is_file() or path.name.startswith("."):
            continue
        rel = path.relative_to(root).as_posix()
        data = path.read_bytes()
        ct = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        try:
            storage._put_s3(rel, data, ct)  # noqa: SLF001
            ok += 1
            print("OK", rel)
        except Exception as exc:
            fail += 1
            print("FAIL", rel, exc)
    print(f"Terminé: {ok} copiés, {fail} erreurs.")


if __name__ == "__main__":
    main()
