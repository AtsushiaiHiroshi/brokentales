import json
import re
from collections import defaultdict
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = Path(r"C:\Users\Gamer\Documents\Broken Tales KS [ENG]")
REPORT_DIR = ROOT / "docs"
AUDIT_JSON = ROOT / "content" / "audit.json"
AUDIT_MD = REPORT_DIR / "content-audit.md"

SOURCES = [
    ("Core Book", SOURCE_ROOT / "bt-corebook-1-eng-final-screen-fixed [2022-07-01].pdf"),
    ("Core Book Sheets", SOURCE_ROOT / "bt-cb-sheets-eng-final-screen [2022-06-29].pdf"),
    ("Core Book Sheets", SOURCE_ROOT / "bt-cb-foxcat-sheet-eng-final-screen [2022-06-29].pdf"),
    ("The Broken Ones", SOURCE_ROOT / "bt-tbo-1-eng-final-screen [2022-06-29].pdf"),
    ("The Broken Ones Sheets", SOURCE_ROOT / "bt-tbo-sheets-eng-final-screen [2022-06-14].pdf"),
    ("Adventure", SOURCE_ROOT / "The Newcomer's Crown [2022-06-28].pdf"),
    ("Support", SOURCE_ROOT / "Broken Tales Sheets ENG" / "Broken Tales - Bookmarks [2022-06-30].pdf"),
    ("Support", SOURCE_ROOT / "Broken Tales Sheets ENG" / "Broken Tales - Hunter's Sheet [2022-06-30].pdf"),
    ("Support", SOURCE_ROOT / "Broken Tales Sheets ENG" / "Broken Tales - Map [2022-06-30].pdf"),
    ("Support", SOURCE_ROOT / "Broken Tales Sheets ENG" / "Broken Tales - Scenario Summary Sheet [2022-06-30].pdf"),
    ("Support", SOURCE_ROOT / "Broken Tales Sheets ENG" / "Broken Tales - The Broken Ones - Villager's Sheet [2022-06-30].pdf"),
    ("Spanish Extras", SOURCE_ROOT / "Extras" / "Broken Tales - Hojas de Cazador.pdf"),
    ("Lost Stories Sheets", SOURCE_ROOT / "Extras" / "Broken Tales - Lost Stories - Exclusive Pre-Gen Hunters.pdf"),
    ("Spanish Extras", SOURCE_ROOT / "Extras" / "Broken Tales - Manual Básico.pdf"),
    ("Support", SOURCE_ROOT / "Extras" / "Broken Tales - Storyteller's Screen (OEF).pdf"),
    ("Lost Stories Sheets", SOURCE_ROOT / "Extras" / "Broken_Tales_Lost_Stories_Hunters_Sheets_OEF,_2024_09_24,_1_2_ENG.pdf"),
    ("Lost Stories", SOURCE_ROOT / "Extras" / "Broken_Tales_Lost_Stories_OEF,_2024_10_09,_book_1_ENG_SCREEN.pdf"),
    ("Lost Stories", SOURCE_ROOT / "Extras" / "bt-ls-book-1-ENG-SCREEN.pdf"),
    ("Lost Stories Sheets", SOURCE_ROOT / "Extras" / "bt-ls-hunters-sheets-1.2-eng-BASE-SCREEN.pdf"),
]

CATEGORIES = {
    "gifts": [
        r"\bgift\b", r"\bgifts\b", r"\bdon\b", r"\bdones\b",
        r"\bdark ego\b", r"\bego oscuro\b", r"\bactivator\b", r"\bactivador\b",
    ],
    "scenario_gifts": [
        r"\bscenario gift\b", r"\bscenario gifts\b", r"\bdon de escenario\b",
        r"\bdones de escenario\b",
    ],
    "equipment": [
        r"\bequipment\b", r"\bequipamiento\b", r"\bequipo\b",
        r"\btreasure\b", r"\btesoro\b", r"\bobject\b", r"\bobjects\b",
        r"\bitem\b", r"\bitems\b", r"\bobjetos?\b",
    ],
    "story_elements": [
        r"\bplace\b", r"\bplaces\b", r"\blugar\b", r"\blugares\b",
        r"\bscene\b", r"\bescena\b", r"\bscenario\b", r"\bescenario\b",
        r"\bmap\b", r"\bmapa\b", r"\bclue\b", r"\bpista\b",
    ],
    "threats_npcs": [
        r"\bthreat\b", r"\bthreats\b", r"\bamenaza\b", r"\bamenazas\b",
        r"\bnpc\b", r"\bpnj\b", r"\bopposition level\b", r"\bnivel de oposicion\b",
        r"\bagenda\b", r"\bdescriptor\b",
    ],
    "villagers": [
        r"\bvillager\b", r"\bvillagers\b", r"\baldeano\b", r"\baldeanos\b",
        r"\bthe village\b",
    ],
    "spirits_essences": [
        r"\bspirit\b", r"\bspirits\b", r"\bespiritu\b", r"\bespiritus\b",
        r"\bessence\b", r"\bessences\b", r"\besencia\b", r"\besencias\b",
        r"\bsoul\b", r"\bsouls\b", r"\balma\b", r"\balmas\b",
        r"\bvirtue\b", r"\bvirtues\b", r"\bvirtud\b", r"\bvirtudes\b",
    ],
}

TITLE_PATTERNS = [
    re.compile(r"^\s*(?:•\s*)?([A-Z][A-Za-z0-9'’&.,: -]{2,80}):"),
    re.compile(r"^\s*(Dark Ego - [A-Z][A-Za-z0-9'’&.,: -]{2,80}):"),
    re.compile(r"^\s*(Ego oscuro - [A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ0-9'’&.,: -]{2,80}):"),
]


def normalize_text(text):
    text = str(text or "")
    text = text.replace("\r\n", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    return text


def page_hits(text):
    lower = text.lower()
    hits = {}
    for category, patterns in CATEGORIES.items():
        matched = []
        for pattern in patterns:
            if re.search(pattern, lower, flags=re.IGNORECASE):
                matched.append(pattern.replace(r"\b", "").replace("\\", ""))
        if matched:
            hits[category] = sorted(set(matched))
    return hits


def title_candidates(text):
    found = []
    for line in text.splitlines():
        line = line.strip()
        if len(line) > 120:
            continue
        for pattern in TITLE_PATTERNS:
            match = pattern.match(line)
            if match:
                candidate = match.group(1).strip()
                if not any(skip in candidate.lower() for skip in ["descriptor", "equipment", "agenda"]):
                    found.append(candidate)
    return sorted(set(found))


def outline_titles(reader):
    result = []

    def walk(items, level=0):
        for item in items:
            if isinstance(item, list):
                walk(item, level + 1)
                continue
            title = getattr(item, "title", None)
            if title:
                try:
                    page = reader.get_destination_page_number(item) + 1
                except Exception:
                    page = None
                result.append({"level": level, "title": str(title), "page": page})

    try:
        walk(reader.outline)
    except Exception:
        pass
    return result


def audit_pdf(group, path):
    reader = PdfReader(str(path))
    pages = []
    category_pages = defaultdict(list)
    candidates = defaultdict(list)
    blank_pages = []

    for index, page in enumerate(reader.pages, start=1):
        text = normalize_text(page.extract_text() or "")
        if not text.strip():
            blank_pages.append(index)
        hits = page_hits(text)
        titles = title_candidates(text)
        pages.append({
            "number": index,
            "chars": len(text),
            "hits": hits,
            "titleCandidates": titles[:20],
        })
        for category in hits:
            category_pages[category].append(index)
        for title in titles:
            candidates[title].append(index)

    return {
        "group": group,
        "fileName": path.name,
        "path": str(path),
        "pageCount": len(reader.pages),
        "outline": outline_titles(reader),
        "categoryPages": {key: value for key, value in sorted(category_pages.items())},
        "titleCandidates": {key: value for key, value in sorted(candidates.items())},
        "blankPages": blank_pages,
        "pages": pages,
    }


def ranges(values):
    if not values:
        return "-"
    values = sorted(set(values))
    chunks = []
    start = prev = values[0]
    for value in values[1:]:
        if value == prev + 1:
            prev = value
            continue
        chunks.append(f"{start}-{prev}" if start != prev else str(start))
        start = prev = value
    chunks.append(f"{start}-{prev}" if start != prev else str(start))
    return ", ".join(chunks)


def write_markdown(audit):
    lines = [
        "# Broken Tales - Auditoria de contenido PDF",
        "",
        "Este reporte se genera localmente desde los PDFs de la mesa. Sirve para corroborar donde aparecen Dones, Dones de escenario, equipo, objetos, elementos de escenario, amenazas, aldeanos y espiritus/esencias.",
        "",
        "## Resumen por PDF",
        "",
        "| PDF | Paginas | Dones | Dones escenario | Equipo/objetos | Elementos escenario | Amenazas/PNJ | Aldeanos | Espiritus/esencias | Paginas sin texto |",
        "| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |",
    ]
    category_order = [
        "gifts",
        "scenario_gifts",
        "equipment",
        "story_elements",
        "threats_npcs",
        "villagers",
        "spirits_essences",
    ]
    for book in audit["books"]:
        row = [
            book["fileName"].replace("|", "\\|"),
            str(book["pageCount"]),
            *[ranges(book["categoryPages"].get(category, [])) for category in category_order],
            ranges(book["blankPages"]),
        ]
        lines.append("| " + " | ".join(row) + " |")

    lines += [
        "",
        "## Hallazgos",
        "",
        "- Los compendios actuales contienen la biblioteca completa como Journals y referencias generales de apoyo.",
        "- Los Dones de Cazador y Egos oscuros aparecen principalmente en hojas de Cazador y libros; no todos estan todavia convertidos en Items individuales independientes.",
        "- Los Dones de escenario, amenazas, PNJ, lugares y objetos de escenario aparecen en libros/aventuras y estan localizables en el compendio Biblioteca, pero requieren una segunda pasada para convertirse en compendios granulares separados por documento.",
        "- Las paginas sin texto extraible dependen del PDF; en esos casos el compendio conserva el enlace al PDF local.",
        "",
        "## Candidatos de titulo detectados",
        "",
    ]
    for book in audit["books"]:
        candidates = book["titleCandidates"]
        if not candidates:
            continue
        lines.append(f"### {book['fileName']}")
        for title, pages in list(candidates.items())[:80]:
            lines.append(f"- {title}: p. {ranges(pages)}")
        lines.append("")

    AUDIT_MD.write_text("\n".join(lines), encoding="utf-8")


def main():
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    AUDIT_JSON.parent.mkdir(parents=True, exist_ok=True)
    books = []
    for group, path in SOURCES:
        if not path.exists():
            raise FileNotFoundError(path)
        print(f"Auditing {path.name}")
        books.append(audit_pdf(group, path))

    audit = {
        "version": 1,
        "sourceRoot": str(SOURCE_ROOT),
        "books": books,
    }
    AUDIT_JSON.write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8")
    write_markdown(audit)
    print(f"Wrote {AUDIT_JSON}")
    print(f"Wrote {AUDIT_MD}")


if __name__ == "__main__":
    main()
