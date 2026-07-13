import json
import re
import shutil
import sys
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = Path(r"C:\Users\Gamer\Documents\Broken Tales KS [ENG]")
CONTENT_DIR = ROOT / "content"
PDF_DIR = ROOT / "assets" / "source-pdfs"

SOURCES = [
    ("Core Book", SOURCE_ROOT / "bt-corebook-1-eng-final-screen-fixed [2022-07-01].pdf"),
    ("Core Book", SOURCE_ROOT / "bt-cb-sheets-eng-final-screen [2022-06-29].pdf"),
    ("Core Book", SOURCE_ROOT / "bt-cb-foxcat-sheet-eng-final-screen [2022-06-29].pdf"),
    ("Sheets and Support", SOURCE_ROOT / "Broken Europe Map.pdf"),
    ("The Broken Ones", SOURCE_ROOT / "bt-tbo-1-eng-final-screen [2022-06-29].pdf"),
    ("The Broken Ones", SOURCE_ROOT / "bt-tbo-sheets-eng-final-screen [2022-06-14].pdf"),
    ("Adventures", SOURCE_ROOT / "The Newcomer's Crown [2022-06-28].pdf"),
    ("Sheets and Support", SOURCE_ROOT / "Broken Tales Sheets ENG" / "Broken Tales - Bookmarks [2022-06-30].pdf"),
    ("Sheets and Support", SOURCE_ROOT / "Broken Tales Sheets ENG" / "Broken Tales - Hunter's Sheet [2022-06-30].pdf"),
    ("Sheets and Support", SOURCE_ROOT / "Broken Tales Sheets ENG" / "Broken Tales - Map [2022-06-30].pdf"),
    ("Sheets and Support", SOURCE_ROOT / "Broken Tales Sheets ENG" / "Broken Tales - Scenario Summary Sheet [2022-06-30].pdf"),
    ("Sheets and Support", SOURCE_ROOT / "Broken Tales Sheets ENG" / "Broken Tales - The Broken Ones - Villager's Sheet [2022-06-30].pdf"),
    ("Spanish Extras", SOURCE_ROOT / "Extras" / "Broken Tales - Hojas de Cazador.pdf"),
    ("Lost Stories", SOURCE_ROOT / "Extras" / "Broken Tales - Lost Stories - Exclusive Pre-Gen Hunters.pdf"),
    ("Spanish Extras", SOURCE_ROOT / "Extras" / "Broken Tales - Manual Básico.pdf"),
    ("Spanish Extras", SOURCE_ROOT / "Extras" / "Mapa Europa Rota.pdf"),
    ("Sheets and Support", SOURCE_ROOT / "Extras" / "Broken Tales - Storyteller's Screen (OEF).pdf"),
    ("Lost Stories", SOURCE_ROOT / "Extras" / "Broken_Tales_Lost_Stories_Hunters_Sheets_OEF,_2024_09_24,_1_2_ENG.pdf"),
    ("Lost Stories", SOURCE_ROOT / "Extras" / "Broken_Tales_Lost_Stories_OEF,_2024_10_09,_book_1_ENG_SCREEN.pdf"),
    ("Lost Stories", SOURCE_ROOT / "Extras" / "bt-ls-book-1-ENG-SCREEN.pdf"),
    ("Lost Stories", SOURCE_ROOT / "Extras" / "bt-ls-hunters-sheets-1.2-eng-BASE-SCREEN.pdf"),
]


def slugify(value):
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def title_from_file(path):
    title = path.stem
    title = re.sub(r"\s*\[\d{4}-\d{2}-\d{2}\]\s*$", "", title)
    title = re.sub(r"[, ]*2024_\d{2}_\d{2}.*$", "", title)
    title = title.replace("_", " ").replace("  ", " ")
    return title.strip()


def extract_book(category, path):
    if not path.exists():
        raise FileNotFoundError(path)

    slug = slugify(path.stem)
    safe_pdf_name = f"{slug}.pdf"
    copied_pdf = PDF_DIR / safe_pdf_name
    shutil.copy2(path, copied_pdf)

    reader = PdfReader(str(path))
    pages = []
    for index, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        pages.append({
            "number": index,
            "text": text.strip()
        })

    return {
        "slug": slug,
        "title": title_from_file(path),
        "category": category,
        "fileName": path.name,
        "originalPath": str(path),
        "assetPath": f"systems/broken-tales/assets/source-pdfs/{safe_pdf_name}",
        "pageCount": len(pages),
        "pages": pages
    }


def main():
    CONTENT_DIR.mkdir(parents=True, exist_ok=True)
    PDF_DIR.mkdir(parents=True, exist_ok=True)

    books = []
    errors = []
    for category, path in SOURCES:
        try:
            books.append(extract_book(category, path))
            print(f"OK {path.name}")
        except Exception as exc:
            errors.append(f"{path}: {exc}")
            print(f"ERROR {path}: {exc}", file=sys.stderr)

    library = {
        "version": 1,
        "sourceRoot": str(SOURCE_ROOT),
        "books": books,
        "errors": errors
    }

    output = CONTENT_DIR / "library.json"
    output.write_text(json.dumps(library, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {output}")
    print(f"Books: {len(books)}")
    print(f"Errors: {len(errors)}")
    if errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
