"""Génère tract/qr.svg pointant vers l'URL de la pétition.

Usage : python3 scripts/qr.py https://dahdah.saunier.me/
(nécessite : pip install segno)
"""
import sys
from pathlib import Path

import segno

url = sys.argv[1] if len(sys.argv) > 1 else "https://dahdah.saunier.me/"
out = Path(__file__).resolve().parent.parent / "tract" / "qr.svg"
segno.make(url, error="h").save(str(out), scale=10, border=2, dark="#14213d", svgclass=None, lineclass=None)
print(f"QR -> {out} ({url})")
