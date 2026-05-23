"""Dump sitemap URLs to a plain text file.

Creates `sitemap_urls.txt` next to this script containing one URL per line.
"""

from __future__ import annotations

from pathlib import Path
from typing import Iterable

from scrapper.build_vector_db import discover_sitemap_urls, DEFAULT_SITEMAP_INDEX


def write_urls(urls: Iterable[str], out_path: Path) -> int:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as fh:
        for u in urls:
            fh.write(u + "\n")
    return sum(1 for _ in urls)


def main() -> int:
    out = Path(__file__).parent / "sitemap_urls.txt"
    urls = discover_sitemap_urls(DEFAULT_SITEMAP_INDEX)
    count = 0
    if urls:
        count = write_urls(urls, out)

    print(f"[OK] Escritas {count} URLs en: {out.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
