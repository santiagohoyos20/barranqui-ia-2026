"""Crawls an internal website and builds a persistent ChromaDB vector store.

This script is intentionally simple:
- visits internal pages from a starting URL
- extracts useful visible text
- splits the text into chunks of about 500-1000 characters
- stores the chunks and embeddings in ChromaDB

For the first version, this only builds the vector database.
The RAG answer-generation step can be added later on top of this store.
"""

from __future__ import annotations

import argparse
import re
import sys
from collections import deque
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin, urlparse, urlunparse
import xml.etree.ElementTree as ET

import chromadb
import requests
from bs4 import BeautifulSoup
from chromadb.api.models.Collection import Collection
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright
from sentence_transformers import SentenceTransformer


DEFAULT_BASE_URL = "https://bancoserfinanza.com/"
DEFAULT_COLLECTION_NAME = "banco_ser_finanza"
DEFAULT_OUTPUT_DIR = "vector_db"
DEFAULT_EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
DEFAULT_SITEMAP_INDEX = "https://bancoserfinanza.com/sitemap_index.xml"


@dataclass(frozen=True)
class PageData:
    """Simple container for one crawled page."""

    url: str
    title: str
    text: str


def normalize_url(url: str) -> str:
    """Remove fragments and normalize trailing slash handling."""

    parsed = urlparse(url)
    cleaned = parsed._replace(fragment="")

    if cleaned.path != "/" and cleaned.path.endswith("/"):
        cleaned = cleaned._replace(path=cleaned.path.rstrip("/"))

    return urlunparse(cleaned)


def is_internal_url(url: str, base_netloc: str) -> bool:
    """Keep only URLs that belong to the same domain."""

    parsed = urlparse(url)
    if not parsed.scheme.startswith("http"):
        return False

    return parsed.netloc == base_netloc or parsed.netloc.endswith(f".{base_netloc}")


def extract_visible_text(html: str) -> tuple[str, str, list[str]]:
    """Pull the most useful text from a page and collect internal links."""

    soup = BeautifulSoup(html, "html.parser")

    for tag_name in [
        "script",
        "style",
        "noscript",
        "svg",
        "iframe",
        "form",
        "button",
        "input",
        "header",
        "footer",
        "nav",
        "aside",
    ]:
        for tag in soup.find_all(tag_name):
            tag.decompose()

    title = soup.title.get_text(" ", strip=True) if soup.title else ""

    main_node = soup.find("main") or soup.find("article") or soup.body or soup
    text = main_node.get_text(" ", strip=True)

    links: list[str] = []
    for anchor in soup.find_all("a", href=True):
        links.append(anchor["href"])

    return title, text, links


def clean_text(text: str) -> str:
    """Normalize whitespace so chunking is more stable."""

    text = re.sub(r"\s+", " ", text)
    return text.strip()


def looks_blocked(html: str) -> bool:
    """Detect Radware or CAPTCHA block pages so we can skip them cleanly."""

    lowered = html.lower()
    return "radware" in lowered or "captcha" in lowered or "behavio" in lowered and "bot" in lowered


def discover_sitemap_urls(sitemap_index_url: str) -> list[str]:
    """Read the WordPress sitemap index and expand it into page URLs."""

    session = requests.Session()
    session.headers.update({"User-Agent": "Mozilla/5.0"})

    try:
        sitemap_index = session.get(sitemap_index_url, timeout=20)
        sitemap_index.raise_for_status()
    except requests.RequestException as exc:
        print(f"[WARN] No se pudo leer el sitemap index: {exc}", file=sys.stderr)
        return []

    try:
        root = ET.fromstring(sitemap_index.text)
    except ET.ParseError as exc:
        print(f"[WARN] Sitemap index inválido: {exc}", file=sys.stderr)
        return []

    namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    sitemap_urls = [element.text for element in root.findall("sm:sitemap/sm:loc", namespace) if element.text]

    discovered_urls: list[str] = []
    for sitemap_url in sitemap_urls:
        try:
            sitemap_response = session.get(sitemap_url, timeout=20)
            sitemap_response.raise_for_status()
            sitemap_root = ET.fromstring(sitemap_response.text)
        except (requests.RequestException, ET.ParseError) as exc:
            print(f"[WARN] No se pudo leer {sitemap_url}: {exc}", file=sys.stderr)
            continue

        discovered_urls.extend(
            element.text
            for element in sitemap_root.findall("sm:url/sm:loc", namespace)
            if element.text
        )

    # Keep the first occurrence of each URL while preserving order.
    unique_urls = list(dict.fromkeys(normalize_url(url) for url in discovered_urls))
    return unique_urls


def split_text_into_chunks(text: str, min_chars: int = 500, max_chars: int = 1000) -> list[str]:
    """Split text into readable chunks without exceeding the target size too much."""

    text = clean_text(text)
    if not text:
        return []

    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks: list[str] = []
    current_parts: list[str] = []

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue

        proposed = " ".join(current_parts + [sentence]).strip()

        if current_parts and len(proposed) > max_chars:
            chunks.append(" ".join(current_parts).strip())
            current_parts = [sentence]
            continue

        current_parts.append(sentence)

        if len(" ".join(current_parts)) >= max_chars:
            chunks.append(" ".join(current_parts).strip())
            current_parts = []

    if current_parts:
        chunks.append(" ".join(current_parts).strip())

    merged_chunks: list[str] = []
    buffer = ""

    for chunk in chunks:
        if not buffer:
            buffer = chunk
            continue

        if len(buffer) < min_chars:
            candidate = f"{buffer} {chunk}".strip()
            if len(candidate) <= max_chars:
                buffer = candidate
                continue

        merged_chunks.append(buffer)
        buffer = chunk

    if buffer:
        merged_chunks.append(buffer)

    return [chunk for chunk in merged_chunks if chunk]


def fetch_page(page, url: str) -> str | None:
    """Load a page in a real browser and return the rendered HTML."""

    try:
        page.goto(url, wait_until="domcontentloaded", timeout=45000)

        # Some pages need a short extra wait so the visible content settles.
        page.wait_for_load_state("networkidle", timeout=15000)

        html = page.content()
        if looks_blocked(html):
            print(f"[WARN] Página bloqueada por protección anti-bot: {url}", file=sys.stderr)
            return None

        return html
    except PlaywrightTimeoutError as exc:
        print(f"[WARN] Timeout al leer {url}: {exc}", file=sys.stderr)
        return None
    except Exception as exc:  # pragma: no cover - defensive catch for browser runtime issues
        print(f"[WARN] No se pudo leer {url}: {exc}", file=sys.stderr)
        return None


def crawl_site(base_url: str, max_pages: int) -> list[PageData]:
    """Breadth-first crawl of the internal site pages."""

    base_url = normalize_url(base_url)
    base_netloc = urlparse(base_url).netloc

    # Prefer the public sitemap, because the home page is protected by Radware.
    seed_urls = discover_sitemap_urls(DEFAULT_SITEMAP_INDEX)
    if not seed_urls:
        seed_urls = [base_url]

    queue: deque[str] = deque(seed_urls)
    seen: set[str] = set()
    pages: list[PageData] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            locale="es-ES",
            viewport={"width": 1440, "height": 1800},
        )
        page = context.new_page()

        try:
            while queue and len(pages) < max_pages:
                url = normalize_url(queue.popleft())
                if url in seen:
                    continue
                seen.add(url)

                if not is_internal_url(url, base_netloc):
                    continue

                html = fetch_page(page, url)
                if html is None:
                    continue

                title, text, raw_links = extract_visible_text(html)
                text = clean_text(text)

                if len(text) >= 120:
                    pages.append(PageData(url=url, title=title, text=text))

                for raw_link in raw_links:
                    absolute = normalize_url(urljoin(url, raw_link))
                    if is_internal_url(absolute, base_netloc) and absolute not in seen:
                        queue.append(absolute)
        finally:
            context.close()
            browser.close()

    return pages


def build_documents(pages: Iterable[PageData], min_chars: int, max_chars: int) -> tuple[list[str], list[str], list[dict[str, str]]]:
    """Convert pages into documents, ids, and metadata rows."""

    documents: list[str] = []
    ids: list[str] = []
    metadatas: list[dict[str, str]] = []

    for page in pages:
        chunks = split_text_into_chunks(page.text, min_chars=min_chars, max_chars=max_chars)

        for index, chunk in enumerate(chunks):
            document = chunk
            if page.title:
                document = f"{page.title}. {chunk}"

            documents.append(document)
            ids.append(f"{page.url}#chunk-{index + 1}")
            metadatas.append(
                {
                    "source": page.url,
                    "title": page.title,
                    "chunk_index": str(index + 1),
                }
            )

    return documents, ids, metadatas


def ensure_collection(output_dir: Path, collection_name: str) -> Collection:
    """Create or open the persistent Chroma collection."""

    client = chromadb.PersistentClient(path=str(output_dir))
    return client.get_or_create_collection(name=collection_name)


def main() -> int:
    parser = argparse.ArgumentParser(description="Build a ChromaDB vector store from bancoserfinanza.com.")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help="Starting URL for the crawl.")
    parser.add_argument("--output-dir", default=DEFAULT_OUTPUT_DIR, help="Folder where ChromaDB will be saved.")
    parser.add_argument("--collection-name", default=DEFAULT_COLLECTION_NAME, help="ChromaDB collection name.")
    parser.add_argument("--embedding-model", default=DEFAULT_EMBEDDING_MODEL, help="SentenceTransformer model name.")
    parser.add_argument("--max-pages", type=int, default=500, help="Maximum number of pages to crawl.")
    parser.add_argument("--min-chars", type=int, default=500, help="Minimum chunk size in characters.")
    parser.add_argument("--max-chars", type=int, default=1000, help="Maximum chunk size in characters.")

    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print("[INFO] Cargando modelo de embeddings...")
    model = SentenceTransformer(args.embedding_model)

    print(f"[INFO] Rastreando sitio desde {args.base_url}")
    pages = crawl_site(args.base_url, max_pages=args.max_pages)
    print(f"[INFO] Páginas útiles encontradas: {len(pages)}")

    documents, ids, metadatas = build_documents(pages, min_chars=args.min_chars, max_chars=args.max_chars)
    if not documents:
        print("[WARN] No se encontraron documentos para guardar.")
        return 1

    print(f"[INFO] Fragmentos generados: {len(documents)}")
    embeddings = model.encode(documents, batch_size=32, show_progress_bar=True, normalize_embeddings=True).tolist()

    collection = ensure_collection(output_dir, args.collection_name)
    collection.upsert(ids=ids, documents=documents, metadatas=metadatas, embeddings=embeddings)

    print(f"[OK] Base vectorial creada en: {output_dir.resolve()}")
    print(f"[OK] Colección: {args.collection_name}")
    print(f"[OK] Total de registros: {collection.count()}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())