import json
import random
import re
import string
import time
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = Path(r"C:\Users\Gamer\Documents\Broken Tales KS [ENG]")
PACKS_DIR = ROOT / "packs"

CORE_VERSION = "13.351"
SYSTEM_ID = "broken-tales"
SYSTEM_VERSION = "0.2.0"

SOURCES = [
    ("Core Book", SOURCE_ROOT / "bt-corebook-1-eng-final-screen-fixed [2022-07-01].pdf", 45, 69),
    ("Lost Stories", SOURCE_ROOT / "Extras" / "bt-ls-book-1-ENG-SCREEN.pdf", 6, 19),
]


def doc_id(seed):
    alphabet = string.ascii_letters + string.digits
    rng = random.Random(seed)
    return "".join(rng.choice(alphabet) for _ in range(16))


def slugify(value):
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def clean(text):
    text = str(text or "").replace("\r\n", "\n")
    text = re.sub(r"(?<=\w)-\n(?=\w)", "", text)
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def html(text):
    escaped = (
        str(text or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )
    return "".join(f"<p>{line}</p>" for line in re.split(r"\n{2,}", escaped.strip()) if line.strip())


def stats(seed):
    now = int(time.time() * 1000)
    return {
        "compendiumSource": None,
        "duplicateSource": None,
        "coreVersion": CORE_VERSION,
        "systemId": SYSTEM_ID,
        "systemVersion": SYSTEM_VERSION,
        "createdTime": now,
        "modifiedTime": now,
        "lastModifiedBy": None,
        "exportSource": None,
    }


def title_line(value):
    value = value.strip()
    if not value or re.fullmatch(r"\d+", value):
        return False
    if len(value) > 55:
        return False
    if value.lower().startswith(("dark presence", "gift", "agenda", "descriptor", "opposition", "special agenda", "note")):
        return False
    if re.search(r"[.!?;:]$", value):
        return False
    return True


def candidate_from_prefix(prefix):
    lines = list(re.finditer(r"[^\n]+", prefix))
    parts = []
    start = None
    cursor = len(lines) - 1
    while cursor >= 0 and len(parts) < 4:
        match = lines[cursor]
        value = match.group(0).strip()
        if not title_line(value):
            if parts:
                break
            cursor -= 1
            continue
        parts.append(value)
        start = match.start()
        cursor -= 1
    if not parts:
        return None, None
    name = " ".join(reversed(parts)).strip()
    name = re.sub(r"\s+", " ", name)
    name = re.sub(r"^[•\s.]+", "", name)
    if 2 < len(name) < 90:
        return name, start
    return None, None


def extract_stat(text, pattern):
    match = re.search(pattern, text, flags=re.IGNORECASE | re.DOTALL)
    return match.group(1).strip() if match else ""


def item_doc(seed, name, type_, img, system):
    return {
        "_id": doc_id(seed),
        "name": name,
        "type": type_,
        "img": img,
        "effects": [],
        "folder": None,
        "flags": {},
        "system": system,
        "sort": 0,
        "ownership": {"default": 0},
        "_stats": stats(seed),
    }


def extract_gifts(text):
    gifts = []
    for match in re.finditer(r"Gift\s*[-–—]\s*([^:\n]+):\s*(.*?)(?=\n(?:Gift\s*[-–—]|Agenda:|Descriptor:|\d+\s+Wounds?|Opposition Level:)|\Z)", text, flags=re.IGNORECASE | re.DOTALL):
        gifts.append({
            "name": "Gift - " + clean(match.group(1)),
            "description": clean(match.group(2)),
        })
    return gifts


def build_actor(collection, source_file, page_number, name, text):
    slug = slugify(f"{collection}-{name}-{page_number}")
    ol = extract_stat(text, r"Opposition Level:\s*([A-Za-z]+\s*\d+)")
    wounds = extract_stat(text, r"(\d+)\s+Wounds?")
    agenda = extract_stat(text, r"Agenda:\s*(.*?)(?:\nGift|\nDescriptor|\Z)")
    descriptor = extract_stat(text, r"Descriptor:\s*(.*?)(?:\n\d+\s+Wounds|\nOpposition|\nAgenda|\Z)")
    items = []
    if descriptor:
        items.append(item_doc(
            f"{slug}-descriptor",
            "Descriptor",
            "descriptor",
            "icons/svg/book.svg",
            {
                "description": html(descriptor),
                "notes": f"{source_file.name}, page {page_number}",
                "positive": descriptor,
                "negative": "",
                "exhausted": False,
                "xpMarked": False,
                "specialization": False,
                "sceneUsed": False,
            },
        ))
    for index, gift in enumerate(extract_gifts(text), start=1):
        items.append(item_doc(
            f"{slug}-gift-{index}",
            gift["name"],
            "gift",
            "icons/svg/aura.svg",
            {
                "description": html(gift["description"]),
                "notes": f"{source_file.name}, page {page_number}",
                "somaCost": 0,
                "automaticSuccesses": 0,
            },
        ))
    items.append(
        item_doc(
            f"{slug}-source",
            "Source",
            "storyElement",
            "icons/svg/scroll.svg",
            {
                "description": html(text),
                "notes": f"{source_file.name}, page {page_number}",
            },
        )
    )

    return {
        "_id": doc_id(slug),
        "name": name,
        "type": "threat",
        "img": "icons/svg/cowled.svg",
        "items": items,
        "effects": [],
        "folder": None,
        "flags": {
            "broken-tales": {
                "darkPresenceSlug": slug,
                "collection": collection,
                "sourceFile": source_file.name,
                "page": page_number,
            }
        },
        "system": {
            "details": {
                "concept": "Dark Presence",
                "origin": collection,
                "role": "Dark Presence",
                "notes": html(text),
            },
            "resources": {
                "soma": {"value": 0, "max": 0},
                "xp": 0,
                "wounds": {"value": 0, "max": int(wounds) if wounds.isdigit() else 3},
                "darkness": {"value": 0, "max": 6},
            },
            "opposition": {"defaultLevel": 5, "modifier": 0},
            "bookmark": {"wound1": "", "wound2": "", "wound3": "", "extraWound": ""},
            "threat": {
                "rank": ol,
                "impulse": agenda,
                "oppositionLevel": int(re.search(r"\d+", ol).group(0)) if re.search(r"\d+", ol) else 5,
            },
        },
        "sort": 0,
        "ownership": {"default": 0},
        "_stats": stats(slug),
    }


def descriptor_items_from_actors(actors, pack_name):
    documents = []
    for actor in actors:
        slug = actor["flags"]["broken-tales"]["darkPresenceSlug"]
        source_file = actor["flags"]["broken-tales"]["sourceFile"]
        page = actor["flags"]["broken-tales"]["page"]
        for item in actor["items"]:
            if item["type"] != "descriptor":
                continue
            descriptor = item["system"]["description"]
            documents.append(item_doc(
                f"{pack_name}-{slug}-descriptor",
                f"{actor['name']} - Descriptor",
                "descriptor",
                "icons/svg/book.svg",
                {
                    "description": descriptor,
                    "notes": f"{source_file}, page {page}.",
                    "positive": item["system"].get("positive", ""),
                    "negative": "",
                    "exhausted": False,
                    "xpMarked": False,
                    "specialization": False,
                    "sceneUsed": False,
                },
            ))
    return documents


def main():
    actors = []
    seen = set()
    for collection, path, start, end in SOURCES:
        reader = PdfReader(str(path))
        page_texts = {
            page_number: clean(reader.pages[page_number - 1].extract_text() or "")
            for page_number in range(start, end + 1)
        }
        starts = []
        for page_number in range(start, end + 1):
            text = page_texts[page_number]
            for match in re.finditer(r"(?m)^Inspired by", text):
                name, name_start = candidate_from_prefix(text[:match.start()])
                if not name or name_start is None:
                    continue
                starts.append((page_number, name_start, name))

        for index, (page_number, start_pos, name) in enumerate(starts):
            next_page, next_pos = (starts[index + 1][0], starts[index + 1][1]) if index + 1 < len(starts) else (end + 1, 0)
            section_text = []
            if next_page == page_number:
                section_text.append(page_texts[page_number][start_pos:next_pos])
            else:
                section_text.append(page_texts[page_number][start_pos:])
                for section_page in range(page_number + 1, min(next_page, end + 1)):
                    section_text.append(page_texts[section_page])
                if next_page <= end:
                    section_text.append(page_texts[next_page][:next_pos])
            text = clean("\n".join(section_text))
            key = slugify(f"{collection}-{name}")
            if key in seen:
                continue
            seen.add(key)
            actor = build_actor(collection, path, page_number, name, text)
            has_descriptor = any(item["type"] == "descriptor" for item in actor["items"])
            has_rank = bool(actor["system"]["threat"]["rank"])
            if not has_descriptor or not has_rank:
                continue
            actors.append(actor)

    PACKS_DIR.mkdir(parents=True, exist_ok=True)
    out = PACKS_DIR / "dark-presences.db"
    with out.open("w", encoding="utf-8", newline="\n") as handle:
        for actor in actors:
            handle.write(json.dumps(actor, ensure_ascii=False, separators=(",", ":")))
            handle.write("\n")
    print(f"{out.name}: {len(actors)}")
    for pack_name in ("dark-presence-descriptors", "threat-descriptors"):
        descriptor_out = PACKS_DIR / f"{pack_name}.db"
        documents = descriptor_items_from_actors(actors, pack_name)
        with descriptor_out.open("w", encoding="utf-8", newline="\n") as handle:
            for document in documents:
                handle.write(json.dumps(document, ensure_ascii=False, separators=(",", ":")))
                handle.write("\n")
        print(f"{descriptor_out.name}: {len(documents)}")


if __name__ == "__main__":
    main()
