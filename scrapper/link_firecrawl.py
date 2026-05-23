"""Scrape grouped URLs with Firecrawl and save each page as a Markdown file.

Input:
- `scrapper/urls/` contains one text file per group.
- Each group file contains URLs, one per line, usually prefixed with `-`.

Output:
- One `.md` file per scraped URL.
- Files are stored under `scrapper/md/` inside a folder named after the group.
"""

from __future__ import annotations

import hashlib
import os
import re
from pathlib import Path
from urllib.parse import urlparse

from firecrawl import FirecrawlApp
from tqdm import tqdm

# =====================================================
# CONFIGURACIÓN
# =====================================================

FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY", "fc-8182132c32904516a13bae0f4f74a749")
BASE_DIR = Path(__file__).resolve().parent
URLS_DIR = BASE_DIR / "urls"
OUTPUT_DIR = BASE_DIR / "md"

# =====================================================
# FIRECRAWL
# =====================================================

app = FirecrawlApp(api_key=FIRECRAWL_API_KEY)

# =====================================================
# HELPERS
# =====================================================


def slugify(text: str) -> str:
    """Convert a title or URL path into a safe filename."""

    text = text.strip().lower()
    text = text.replace("/", "-")
    text = re.sub(r"[^a-z0-9\-\s_áéíóúüñ]+", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-") or "documento"


def read_group_urls(urls_dir: Path) -> dict[str, list[str]]:
    """Read every text file in the URLs directory and extract URLs by group."""

    grouped_urls: dict[str, list[str]] = {}

    for txt_file in sorted(urls_dir.glob("*.txt")):
        group_name = txt_file.stem
        urls: list[str] = []

        with txt_file.open(encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line.startswith("http") and "https://" not in line:
                    continue

                match = re.search(r"https?://\S+", line)
                if match:
                    urls.append(match.group(0).rstrip(")].,;"))

        grouped_urls[group_name] = urls

    return grouped_urls


def pick_markdown(result: object) -> str:
    """Extract markdown text from Firecrawl responses with a few fallback shapes."""

    markdown = getattr(result, "markdown", None)
    if isinstance(markdown, str) and markdown.strip():
        return markdown

    if isinstance(result, dict):
        markdown = result.get("markdown")
        if isinstance(markdown, str) and markdown.strip():
            return markdown

        data = result.get("data")
        if isinstance(data, dict):
            markdown = data.get("markdown")
            if isinstance(markdown, str) and markdown.strip():
                return markdown

        if isinstance(data, list) and data:
            first_item = data[0]
            if isinstance(first_item, dict):
                markdown = first_item.get("markdown")
                if isinstance(markdown, str) and markdown.strip():
                    return markdown

    return ""


def write_markdown(output_path: Path, title: str, source_url: str, markdown: str) -> None:
    """Write the scraped content to a Markdown file."""

    output_path.parent.mkdir(parents=True, exist_ok=True)
    content = (
        f"# {title}\n\n"
        f"- Source: {source_url}\n\n"
        f"---\n\n"
        f"{markdown.strip()}\n"
    )
    output_path.write_text(content, encoding="utf-8")


# =====================================================
# MAIN
# =====================================================


def main() -> int:
    if not FIRECRAWL_API_KEY:
        print("Falta FIRECRAWL_API_KEY en el entorno.")
        return 1

    grouped_urls = read_group_urls(URLS_DIR)
    if not grouped_urls:
        print(f"No se encontraron archivos .txt dentro de {URLS_DIR.resolve()}")
        return 1

    total_urls = sum(len(urls) for urls in grouped_urls.values())
    print(f"Grupos encontrados: {len(grouped_urls)}")
    print(f"URLs encontradas: {total_urls}")

    saved_files = 0
    output_root = OUTPUT_DIR
    output_root.mkdir(parents=True, exist_ok=True)

    for group_name, urls in grouped_urls.items():
        group_folder = output_root / slugify(group_name)
        group_folder.mkdir(parents=True, exist_ok=True)

        print(f"\nProcesando grupo: {group_name} ({len(urls)} URLs)")

        for url in tqdm(urls, desc=group_name, unit="url"):
            try:
                result = app.scrape_url(url, formats=["markdown"])
                markdown = pick_markdown(result)

                if not markdown.strip():
                    print(f"[WARN] Sin markdown para: {url}")
                    continue

                parsed = urlparse(url)
                url_slug = slugify(parsed.path.strip("/") or parsed.netloc)
                short_hash = hashlib.md5(url.encode("utf-8")).hexdigest()[:8]
                file_name = f"{url_slug}-{short_hash}.md"
                output_path = group_folder / file_name

                title = parsed.path.strip("/").split("/")[-1] or parsed.netloc
                title = title.replace("-", " ").strip() or parsed.netloc
                title = title[:120]

                write_markdown(output_path, title=title, source_url=url, markdown=markdown)
                saved_files += 1
            except Exception as exc:
                print(f"\n[ERROR] {url}")
                print(exc)

    print(f"\nArchivos Markdown guardados: {saved_files}")
    print(f"Salida en: {output_root.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
