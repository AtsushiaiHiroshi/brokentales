import json
import re
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = Path(r"C:\Users\Gamer\Documents\Broken Tales KS [ENG]")
BASE_PATH = ROOT / "pregens" / "pregens.json"
OUT_PATH = ROOT / "pregens" / "enriched-pregens.json"

SHEET_SOURCES = [
    {
        "collection": "Core Book",
        "source": SOURCE_ROOT / "bt-cb-sheets-eng-final-screen [2022-06-29].pdf",
        "detail_pages": list(range(4, 31, 2)),
        "language": "en",
    },
    {
        "collection": "Core Book: Fox and Cat",
        "source": SOURCE_ROOT / "bt-cb-foxcat-sheet-eng-final-screen [2022-06-29].pdf",
        "detail_pages": [2],
        "language": "en",
    },
    {
        "collection": "The Broken Ones",
        "source": SOURCE_ROOT / "bt-tbo-sheets-eng-final-screen [2022-06-14].pdf",
        "detail_pages": list(range(2, 27, 2)),
        "language": "en",
    },
    {
        "collection": "Lost Stories",
        "source": SOURCE_ROOT / "Extras" / "bt-ls-hunters-sheets-1.2-eng-BASE-SCREEN.pdf",
        "detail_pages": list(range(2, 23, 2)),
        "language": "en",
    },
    {
        "collection": "Lost Stories Exclusives",
        "source": SOURCE_ROOT / "Extras" / "Broken Tales - Lost Stories - Exclusive Pre-Gen Hunters.pdf",
        "detail_pages": list(range(2, 19, 2)),
        "language": "en",
    },
]


def clean(text):
    text = str(text or "")
    text = text.replace("\r\n", "\n")
    text = re.sub(r"(?<=\w)-\n(?=\w)", "", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def one_line(text):
    return re.sub(r"\s+", " ", clean(text)).strip()


def html(text):
    escaped = (
        str(text or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )
    return "".join(f"<p>{line}</p>" for line in re.split(r"\n{2,}", escaped.strip()) if line.strip())


def split_last_paragraph_boundary(text):
    text = clean(text)
    matches = list(re.finditer(r"(?<=[.!?])\s*\n(?=[A-ZÁÉÍÓÚÑ])", text))
    if not matches:
        return text, ""
    split = matches[-1].start() + 1
    return clean(text[:split]), clean(text[split:])


def title_from_text(text, marker):
    before = clean(text.split(marker, 1)[0])
    lines = [line.strip() for line in before.splitlines() if line.strip()]
    if not lines:
        return ""
    return " ".join(lines[-2:]) if len(lines) >= 2 else lines[-1]


def split_tail(text):
    equipment = ""
    soma = None
    trigger = ""

    equipment_match = re.search(r"\n(?:Equipo|Equipment)\s*\n", text, flags=re.IGNORECASE)
    if equipment_match:
        equipment_part = text[equipment_match.end():]
        text = text[:equipment_match.start()]
        stop = re.search(r"\n(?:Heridas|Wounds|PX|XP|Soma)\b", equipment_part, flags=re.IGNORECASE)
        equipment = clean(equipment_part[:stop.start()] if stop else equipment_part)

    soma_match = re.search(r"\bSoma\s*\n?\s*(\d+)", text + "\n" + equipment, flags=re.IGNORECASE)
    if soma_match:
        soma = int(soma_match.group(1))

    trigger_match = re.search(r"(?:Activador|Activator)\s*:\s*(.*)$", text, flags=re.IGNORECASE | re.DOTALL)
    if trigger_match:
        trigger = clean(trigger_match.group(1))
        text = clean(text[:trigger_match.start()])

    return clean(text), trigger, equipment, soma


def extract_dark_ego_anywhere(text):
    match = re.search(
        r"(?:^|\n)(?:•|â€¢)\s*(Dark Ego[^:]*):\s*(.*?)(?:\nActivator:\s*(.*?))?(?=\n(?:Equipment|Soma|Wounds|XP|Descriptors and Gifts)\b|\Z)",
        text,
        flags=re.IGNORECASE | re.DOTALL,
    )
    if not match:
        return None
    return {
        "name": one_line(match.group(1)),
        "description": clean(match.group(2)),
        "dark": True,
        "trigger": clean(match.group(3) or ""),
    }


def extract_equipment_anywhere(text):
    match = re.search(
        r"\nEquipment\s*\n(.*?)(?=\n(?:Soma|Wounds|XP|Descriptors and Gifts)\b|\Z)",
        text,
        flags=re.IGNORECASE | re.DOTALL,
    )
    return clean(match.group(1)) if match else ""


def parse_sheet_page(text, language):
    marker = "Descriptores y dones" if language == "es" else "Descriptors and Gifts"
    if marker not in text:
        return None
    name = title_from_text(text, marker)
    tail = clean(text.split(marker, 1)[1])
    bullet_re = re.compile(r"^(?:•|â€¢)\s*([^:\n]+):", flags=re.MULTILINE)
    matches = list(bullet_re.finditer(tail))
    if not matches:
        return None

    descriptors = []
    gifts = []
    story = ""
    pending_title = None
    pending_start = None

    for index, match in enumerate(matches):
        section_before = clean(tail[pending_start:match.start()] if pending_start is not None else tail[:match.start()])
        if index == 0:
            descriptors.append(section_before)
        else:
            gift_body, next_descriptor = split_last_paragraph_boundary(section_before)
            if "ego oscuro" in match.group(1).lower() or "dark ego" in match.group(1).lower():
                gift_body, possible_story = split_last_paragraph_boundary(gift_body)
                if possible_story:
                    story = possible_story
            gifts.append({
                "name": pending_title,
                "description": gift_body,
                "dark": False,
                "trigger": "",
            })
            descriptors.append(next_descriptor)
        pending_title = clean(match.group(1))
        pending_start = match.end()

    final_body = clean(tail[pending_start:])
    final_body, trigger, equipment, soma = split_tail(final_body)
    is_dark = bool(pending_title and re.search(r"ego oscuro|dark ego", pending_title, flags=re.IGNORECASE))
    gifts.append({
        "name": pending_title,
        "description": final_body,
        "dark": is_dark,
        "trigger": trigger,
    })

    normal_gifts = [gift for gift in gifts if not gift["dark"]]
    dark_gifts = [gift for gift in gifts if gift["dark"]]
    if not dark_gifts:
        fallback_dark_ego = extract_dark_ego_anywhere(text)
        if fallback_dark_ego:
            dark_gifts = [fallback_dark_ego]
    if not equipment:
        equipment = extract_equipment_anywhere(text)

    return {
        "name": name,
        "soma": soma,
        "story": story,
        "descriptors": descriptors[:3],
        "gifts": normal_gifts[:2],
        "darkEgo": dark_gifts[0] if dark_gifts else None,
        "equipment": equipment,
    }


def read_source_entries(source):
    reader = PdfReader(str(source["source"]))
    entries = []
    for page_number in source["detail_pages"]:
        if page_number > len(reader.pages):
            continue
        text = reader.pages[page_number - 1].extract_text() or ""
        parsed = parse_sheet_page(text, source["language"])
        if parsed:
            parsed["sheetSource"] = source["source"].name
            parsed["sheetPages"] = str(page_number)
            entries.append(parsed)
    return entries


def valid_name(name):
    text = one_line(name)
    if not text or len(text) > 55:
        return False
    blocked = [
        "activador", "activator", "equipment", "equipo", "descriptor",
        "gift", "don ", "soma", "wounds", "heridas"
    ]
    return not any(word in text.lower() for word in blocked)


def apply_enrichment(base, collection, entries):
    targets = [actor for actor in base["actors"] if actor["collection"] == collection]
    for actor, entry in zip(targets, entries):
        if valid_name(entry["name"]):
            actor["name"] = entry["name"]
        if entry.get("soma"):
            actor["soma"] = entry["soma"]
        actor["source"] = entry["sheetSource"]
        actor["pages"] = entry["sheetPages"]
        actor["story"] = entry.get("story", "")
        actor["descriptors"] = entry.get("descriptors", [])
        actor["gifts"] = entry.get("gifts", [])
        actor["darkEgo"] = entry.get("darkEgo")
        actor["equipment"] = entry.get("equipment", "")
        actor["enriched"] = True

    if len(entries) > len(targets):
        for index, entry in enumerate(entries[len(targets):], start=len(targets) + 1):
            name = entry["name"] or f"{collection} Hunter {index}"
            base["actors"].append({
                "name": name,
                "collection": collection,
                "soma": entry.get("soma") or 6,
                "source": entry["sheetSource"],
                "pages": entry["sheetPages"],
                "story": entry.get("story", ""),
                "descriptors": entry.get("descriptors", []),
                "gifts": entry.get("gifts", []),
                "darkEgo": entry.get("darkEgo"),
                "equipment": entry.get("equipment", ""),
                "enriched": True,
            })


def main():
    base = json.loads(BASE_PATH.read_text(encoding="utf-8"))
    report = {}
    for source in SHEET_SOURCES:
        entries = read_source_entries(source)
        report[source["collection"]] = len(entries)
        apply_enrichment(base, source["collection"], entries)

    base["enrichmentReport"] = report
    OUT_PATH.write_text(json.dumps(base, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT_PATH}")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
