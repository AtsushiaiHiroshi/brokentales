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
    ("Core Book", SOURCE_ROOT / "bt-corebook-1-eng-final-screen-fixed [2022-07-01].pdf", [
        ("red-hood-iskra", "Red-hood / Iskra", 119, 130),
        ("of-flesh-and-wood", "Of Flesh and Wood", 131, 144),
        ("smile-in-the-darkness", "The Smile in the Darkness", 145, 156),
        ("a-soldiers-duty", "A Soldier's Duty", 157, 168),
        ("wonderbedlam", "Wonderbedlam", 169, 182),
        ("tuvstarrs-reflection", "Tuvstarr's Reflection", 183, 196),
        ("one-thousand-and-one-nightmares", "One Thousand and One Nightmares", 197, 202),
        ("city-of-pigs", "The City of Pigs", 203, 216),
        ("saint-george-the-dragon-slayer", "Saint George the Dragon Slayer", 217, 222),
        ("ozena-the-suffering-and-desperate", "OZena the Suffering and Desperate", 223, 243),
    ]),
    ("The Broken Ones", SOURCE_ROOT / "bt-tbo-1-eng-final-screen [2022-06-29].pdf", [
        ("i-dont-believe", "I Don't Believe", 81, 92),
        ("hunger-island", "Hunger Island", 93, 108),
        ("bloodwhites-heart", "Bloodwhite's Heart", 109, 122),
        ("the-house-of-roses", "The House of Roses", 123, 134),
        ("stegeborgs-quiet", "Stegeborg's Quiet", 135, 150),
        ("in-your-eyes-with-your-feet", "In Your Eyes, with Your Feet", 151, 162),
        ("i-will-stay-with-you-always", "I Will Stay with You Always", 163, 175),
    ]),
    ("Lost Stories", SOURCE_ROOT / "Extras" / "bt-ls-book-1-ENG-SCREEN.pdf", [
        ("rome-city-of-the-order", "Rome, City of the Order", 56, 71),
        ("nemesis", "Nemesis", 72, 96),
        ("a-mothers-heart", "A Mother's Heart", 97, 114),
        ("nikolas-pledge", "Nikola's Pledge", 115, 130),
        ("the-last-wish", "The Last Wish", 131, 146),
        ("journey-of-a-thousand-and-one-nights", "Journey of a Thousand and One Nights", 147, 168),
        ("isolde-the-singer-of-lost-love", "Isolde the Singer of Lost Love", 169, 174),
        ("the-kings-awakening", "The King's Awakening", 175, 200),
        ("a-frozen-reflection", "A Frozen Reflection", 201, 227),
    ]),
]

OL_RE = re.compile(r"(?:OL|Opposition Level:)\s*(Easy|Medium|Hard)\s*(\d+)", re.IGNORECASE)


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


def title_caseish(text):
    text = clean(text)
    text = re.sub(r"^\d+\s+", "", text)
    text = re.sub(r"^(?:Threat\s*[-–—]\s*)", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s+", " ", text).strip(" .:-–—")
    text = re.sub(r"^[•\s.]+", "", text)
    return text[:90]


def reasonable_name(name):
    if not name or len(name) < 3 or len(name) > 90:
        return False
    lower = name.lower()
    blocked = ("descriptor", "agenda", "gift", "information", "place", "scene", "read aloud")
    if lower.startswith(blocked):
        return False
    if name.split()[0][0].islower():
        return False
    if re.search(r"\b(if|with|against|should|normal|support|them|from|one|on|they|his|as)\b", lower):
        return False
    return bool(re.search(r"[A-Za-z]", name))


def extract_between(text, start_pattern, end_patterns):
    start = re.search(start_pattern, text, flags=re.IGNORECASE | re.DOTALL)
    if not start:
        return ""
    tail = text[start.end():]
    stops = [m.start() for pat in end_patterns if (m := re.search(pat, tail, flags=re.IGNORECASE | re.DOTALL))]
    end = min(stops) if stops else len(tail)
    return clean(tail[:end])


def extract_descriptor(body):
    return extract_between(body, r"\bDescriptor\s*:\s*", [
        r"\bAgenda\s*:",
        r"\bGift\s*[-–—]",
        r"\bInformation\s*:",
        r"\bSpecial Agenda\s*",
        r"\bSeals\s*:",
    ])


def extract_agenda(body):
    agenda = extract_between(body, r"\bAgenda\s*:\s*", [
        r"\bGift\s*[-–—]",
        r"\bInformation\s*:",
        r"\bSpecial Agenda\s*",
        r"\bSeals\s*:",
    ])
    return agenda


def extract_wounds(body):
    match = re.search(r"\((\d+)\s+Wounds?\)|\b(\d+)\s+Wounds?\b", body, flags=re.IGNORECASE)
    if not match:
        return 1
    return int(match.group(1) or match.group(2))


def extract_role(body, original_prefix):
    role_match = re.search(r"(Minor NPC|Main NPC|Threat)", f"{original_prefix} {body}", flags=re.IGNORECASE)
    if not role_match:
        return "Scenario Actor"
    role = role_match.group(1)
    return " ".join(part.capitalize() if part.lower() != "npc" else "NPC" for part in role.split())


def extract_gifts(body):
    gifts = []
    for match in re.finditer(
        r"\bGift\s*[-–—]\s*([^:\n]+):\s*(.*?)(?=\n(?:Gift\s*[-–—]|Agenda:|Descriptor:|Information:|Special Agenda|\Z))",
        body,
        flags=re.IGNORECASE | re.DOTALL,
    ):
        name = "Gift - " + clean(match.group(1))
        description = clean(match.group(2))
        if name and description:
            gifts.append({"name": name, "description": description})
    return gifts


def build_actor(collection, adventure_slug, adventure_title, source_file, page_number, name, difficulty, ol, body, original_prefix):
    slug = slugify(f"{collection}-{adventure_slug}-{name}-{page_number}")
    descriptor = extract_descriptor(body)
    if not descriptor:
        return None
    agenda = extract_agenda(body)
    wounds = extract_wounds(body)
    role = extract_role(body, original_prefix)
    items = [
        item_doc(
            f"{slug}-descriptor",
            f"{name} - Descriptor",
            "descriptor",
            "icons/svg/book.svg",
            {
                "description": html(descriptor),
                "notes": f"{adventure_title} - {source_file.name}, page {page_number}.",
                "positive": descriptor,
                "negative": "",
                "exhausted": False,
                "xpMarked": False,
                "specialization": False,
                "sceneUsed": False,
            },
        )
    ]
    for index, gift in enumerate(extract_gifts(body), start=1):
        items.append(item_doc(
            f"{slug}-gift-{index}",
            gift["name"],
            "gift",
            "icons/svg/aura.svg",
            {
                "description": html(gift["description"]),
                "notes": f"{adventure_title} - {source_file.name}, page {page_number}.",
                "somaCost": 0,
                "automaticSuccesses": 0,
            },
        ))
    items.append(item_doc(
        f"{slug}-source",
        "Source Text",
        "storyElement",
        "icons/svg/scroll.svg",
        {
            "description": html(body),
            "notes": f"{adventure_title} - {source_file.name}, page {page_number}.",
        },
    ))
    return {
        "_id": doc_id(slug),
        "name": name,
        "type": "threat",
        "img": "icons/svg/cowled.svg" if role == "Threat" else "icons/svg/mystery-man.svg",
        "items": items,
        "effects": [],
        "folder": None,
        "flags": {
            "broken-tales": {
                "scenarioActorSlug": slug,
                "collection": collection,
                "adventureSlug": adventure_slug,
                "adventureTitle": adventure_title,
                "sourceFile": source_file.name,
                "page": page_number,
                "role": role,
            }
        },
        "system": {
            "details": {
                "concept": adventure_title,
                "origin": collection,
                "role": role,
                "notes": html(body),
            },
            "resources": {
                "soma": {"value": 0, "max": 0},
                "xp": 0,
                "wounds": {"value": 0, "max": wounds},
                "darkness": {"value": 0, "max": 6},
            },
            "opposition": {"defaultLevel": int(ol), "modifier": 0},
            "bookmark": {"wound1": "", "wound2": "", "wound3": "", "extraWound": ""},
            "threat": {
                "rank": f"{difficulty.capitalize()} {ol}",
                "impulse": agenda,
                "oppositionLevel": int(ol),
            },
        },
        "sort": 0,
        "ownership": {"default": 0},
        "_stats": stats(slug),
    }


def extract_from_page(collection, adventure_slug, adventure_title, source_file, page_number, text):
    actors = []
    text = clean(text)
    matches = list(OL_RE.finditer(text))
    for index, match in enumerate(matches):
        line_start = text.rfind("\n", 0, match.start()) + 1
        prefix = text[line_start:match.start()].strip()
        if not prefix:
            previous_lines = [line.strip() for line in text[:line_start].splitlines() if line.strip()]
            prefix = previous_lines[-1] if previous_lines else ""
            if (
                len(previous_lines) >= 2
                and len(prefix.split()) <= 2
                and previous_lines[-2][0].isupper()
                and not re.search(r"[.!?:]$", previous_lines[-2])
                and not re.fullmatch(r"\d+", previous_lines[-2])
            ):
                prefix = f"{previous_lines[-2]} {prefix}"
        else:
            previous_lines = [line.strip() for line in text[:line_start].splitlines() if line.strip()]
            previous = previous_lines[-1] if previous_lines else ""
            if (
                previous
                and len(prefix.split()) <= 2
                and previous[0].isupper()
                and not re.search(r"[.!?:]$", previous)
                and not re.fullmatch(r"\d+", previous)
            ):
                prefix = f"{previous} {prefix}"
        if re.search(r"[.!?]\s+\S", prefix):
            prefix = re.split(r"[.!?]\s+", prefix)[-1]
        name = title_caseish(prefix)
        if not reasonable_name(name):
            continue
        next_start = len(text)
        if index + 1 < len(matches):
            next_line_start = text.rfind("\n", 0, matches[index + 1].start()) + 1
            next_start = next_line_start if next_line_start > match.end() else matches[index + 1].start()
        body = text[match.end():next_start]
        if name.lower() == "threat":
            places = re.findall(r"\d+\s*[-–—]\s*([^:\n]+):", text[:line_start])
            place_lines = re.findall(r"\bPlace:\s*([^\n]+)", text[:line_start], flags=re.IGNORECASE)
            descriptor_hint = extract_descriptor(body)
            if places:
                name = title_caseish(places[-1])
            elif place_lines:
                name = title_caseish(place_lines[-1])
            elif descriptor_hint:
                name = title_caseish(" ".join(descriptor_hint.split()[:5]))
        actor = build_actor(
            collection,
            adventure_slug,
            adventure_title,
            source_file,
            page_number,
            name,
            match.group(1),
            match.group(2),
            body,
            prefix,
        )
        if actor:
            actors.append(actor)
    return actors


def main():
    actors = []
    seen = set()
    for collection, source_file, adventures in SOURCES:
        reader = PdfReader(str(source_file))
        for adventure_slug, adventure_title, start, end in adventures:
            for page_number in range(start, min(end, len(reader.pages)) + 1):
                text = reader.pages[page_number - 1].extract_text() or ""
                for actor in extract_from_page(collection, adventure_slug, adventure_title, source_file, page_number, text):
                    key = slugify(f"{actor['flags']['broken-tales']['adventureSlug']}-{actor['name']}-{actor['system']['threat']['rank']}")
                    if key in seen:
                        continue
                    seen.add(key)
                    actors.append(actor)

    PACKS_DIR.mkdir(parents=True, exist_ok=True)
    out = PACKS_DIR / "scenario-actors.db"
    with out.open("w", encoding="utf-8", newline="\n") as handle:
        for actor in actors:
            handle.write(json.dumps(actor, ensure_ascii=False, separators=(",", ":")))
            handle.write("\n")
    print(f"{out.name}: {len(actors)}")


if __name__ == "__main__":
    main()
