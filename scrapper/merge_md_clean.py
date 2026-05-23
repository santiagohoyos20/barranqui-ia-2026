"""Merge the Markdown files in each `scrapper/md/<group>/` folder into one clean file.

The cleaner removes:
- image links and image-only markdown
- navigation / footer boilerplate
- the entire "## Vamos a conectarnos" section and everything after it
- repeated contact, social, and app-promo blocks

Output:
- one `resumen.md` file per subfolder
"""

from __future__ import annotations

import re
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
MD_ROOT = BASE_DIR / "md"
OUTPUT_NAME = "resumen.md"


BOILERPLATE_EXACT = {
    "BuscarBuscar",
    "Menú",
    "Beneficios",
    "Requisitos",
    "Requisitos/Documentos",
    "Legales:",
    "Serfinanza para ti:",
    "Descarga nuestra Aplicación Serfinanza Móvil",
    "¿Ya nos sigues en nuestras redes sociales?",
}

STOP_SECTIONS = {
    "## Vamos a conectarnos",
    "## Sigue construyendo tus metas",
    "## Queremos hacer tu vida más sencilla",
    "## Vale la pena cumplir tus sueños",
}


def extract_useful_title(text: str, fallback: str) -> str:
    """Pick the first meaningful H1/H2 title from a document."""

    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("# "):
            candidate = stripped.lstrip("# ").strip()
            if candidate:
                return candidate
    return fallback


def strip_image_links(line: str) -> str:
    """Remove image markdown and image-based links from a line."""

    line = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", line)
    line = re.sub(r"\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)", "", line)
    line = re.sub(r"\[\s*\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)\s*\]", "", line)
    return line.strip()


def clean_document(text: str) -> str:
    """Remove repeated boilerplate and keep only useful content."""

    cleaned_lines: list[str] = []
    skip_rest = False

    for raw_line in text.splitlines():
        line = raw_line.strip()

        if skip_rest:
            continue

        if not line:
            if cleaned_lines and cleaned_lines[-1] != "":
                cleaned_lines.append("")
            continue

        if line.startswith("# "):
            continue

        if any(line.startswith(section) for section in STOP_SECTIONS):
            skip_rest = True
            continue

        if line in BOILERPLATE_EXACT:
            continue

        if line in {"---", "***"}:
            continue

        if line.startswith("[Ir al contenido]"):
            continue

        if line.startswith("Source:") or line.startswith("- Source:"):
            continue

        if line.startswith("© 2026. Banco Serfinanza"):
            continue

        if line.startswith("![") or line.startswith("[!"):
            continue

        if "bancoserfinanza.com/wp-content/uploads" in line and not line.startswith("http"):
            continue

        line = strip_image_links(line)
        if not line:
            continue

        # Drop pure standalone social/media link lines.
        if line in {"[Facebook-f](https://www.facebook.com/bancoserfinanza)", "[Linkedin](https://co.linkedin.com/company/bancoserfinanza)", "[Instagram](https://www.instagram.com/bancoserfinanza)"}:
            continue

        cleaned_lines.append(line)

    # Collapse extra blank lines.
    final_lines: list[str] = []
    previous_blank = False
    for line in cleaned_lines:
        is_blank = not line.strip()
        if is_blank and previous_blank:
            continue
        final_lines.append(line)
        previous_blank = is_blank

    return "\n".join(final_lines).strip() + "\n"


def merge_folder(folder: Path) -> Path | None:
    """Merge all Markdown files in a folder into one cleaned document."""

    source_files = sorted(
        path for path in folder.glob("*.md") if path.name.lower() != OUTPUT_NAME.lower()
    )

    if not source_files:
        return None

    parts: list[str] = []

    for source_file in source_files:
        text = source_file.read_text(encoding="utf-8")
        cleaned = clean_document(text)
        if not cleaned.strip():
            continue

        section_title = extract_useful_title(text, source_file.stem)
        parts.append(f"# {section_title}\n\n{cleaned}".strip())

    if not parts:
        return None

    output_path = folder / OUTPUT_NAME
    output_path.write_text("\n\n---\n\n".join(parts).strip() + "\n", encoding="utf-8")
    return output_path


def main() -> int:
    if not MD_ROOT.exists():
        print(f"No existe la carpeta: {MD_ROOT}")
        return 1

    generated = 0
    for folder in sorted(path for path in MD_ROOT.iterdir() if path.is_dir()):
        output_path = merge_folder(folder)
        if output_path is not None:
            generated += 1
            print(f"[OK] {output_path}")

    print(f"\nCarpetas consolidadas: {generated}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())