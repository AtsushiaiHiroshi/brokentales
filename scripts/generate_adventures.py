import json
import random
import re
import string
import time
from pathlib import Path

from PIL import Image
from pypdf import PdfReader
import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = Path(r"C:\Users\Gamer\Documents\Broken Tales KS [ENG]")
ASSET_DIR = ROOT / "assets" / "adventures"
PACKS_DIR = ROOT / "packs"

CORE_VERSION = "13.351"
SYSTEM_ID = "broken-tales"
SYSTEM_VERSION = "0.2.0"

ADVENTURES = [
    {
        "collection": "Core Book",
        "file": SOURCE_ROOT / "bt-corebook-1-eng-final-screen-fixed [2022-07-01].pdf",
        "items": [
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
        ],
    },
    {
        "collection": "The Broken Ones",
        "file": SOURCE_ROOT / "bt-tbo-1-eng-final-screen [2022-06-29].pdf",
        "items": [
            ("i-dont-believe", "I Don't Believe", 81, 92),
            ("hunger-island", "Hunger Island", 93, 108),
            ("bloodwhites-heart", "Bloodwhite's Heart", 109, 122),
            ("the-house-of-roses", "The House of Roses", 123, 134),
            ("stegeborgs-quiet", "Stegeborg's Quiet", 135, 150),
            ("in-your-eyes-with-your-feet", "In Your Eyes, with Your Feet", 151, 162),
            ("i-will-stay-with-you-always", "I Will Stay with You Always", 163, 175),
        ],
    },
    {
        "collection": "Lost Stories",
        "file": SOURCE_ROOT / "Extras" / "bt-ls-book-1-ENG-SCREEN.pdf",
        "items": [
            ("rome-city-of-the-order", "Rome, City of the Order", 56, 71),
            ("nemesis", "Nemesis", 72, 96),
            ("a-mothers-heart", "A Mother's Heart", 97, 114),
            ("nikolas-pledge", "Nikola's Pledge", 115, 130),
            ("the-last-wish", "The Last Wish", 131, 146),
            ("journey-of-a-thousand-and-one-nights", "Journey of a Thousand and One Nights", 147, 168),
            ("isolde-the-singer-of-lost-love", "Isolde the Singer of Lost Love", 169, 174),
            ("the-kings-awakening", "The King's Awakening", 175, 200),
            ("a-frozen-reflection", "A Frozen Reflection", 201, 227),
        ],
    },
    {
        "collection": "Standalone",
        "file": SOURCE_ROOT / "The Newcomer's Crown [2022-06-28].pdf",
        "items": [
            ("the-newcomers-crown", "The Newcomer's Crown", 1, 1),
        ],
    },
]

EXTRA_MAPS = [
    {
        "slug": "broken-europe-map-english",
        "title": "Broken Europe Map",
        "collection": "Support",
        "file": SOURCE_ROOT / "Broken Europe Map.pdf",
        "page": 1,
    },
    {
        "slug": "mapa-europa-rota",
        "title": "Mapa Europa Rota",
        "collection": "Spanish Extras",
        "file": SOURCE_ROOT / "Extras" / "Mapa Europa Rota.pdf",
        "page": 1,
    },
    {
        "slug": "broken-europe-map",
        "title": "Broken Europe Map",
        "collection": "Support",
        "file": SOURCE_ROOT / "Broken Tales Sheets ENG" / "Broken Tales - Map [2022-06-30].pdf",
        "page": 1,
    },
]


def doc_id(seed):
    alphabet = string.ascii_letters + string.digits
    rng = random.Random(seed)
    return "".join(rng.choice(alphabet) for _ in range(16))


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


def html(value):
    return (
        str(value or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def paragraphs(text):
    clean = re.sub(r"\[\[SOURCE_PAGE:\d+\]\]\s*", "", str(text or "")).replace("\r\n", "\n").strip()
    if not clean:
        return "<p><em>Page has no extractable text. Check the source PDF in the Complete Library.</em></p>"
    return "".join(
        f"<p>{html(block).replace(chr(10), '<br>')}</p>"
        for block in re.split(r"\n{2,}", clean)
    )


def safe_image(image):
    if image.mode in {"RGBA", "LA", "P"}:
        return image.convert("RGBA")
    return image.convert("RGB")


def render_pdf_page(source_file, page_number, slug):
    out_dir = ASSET_DIR / "maps"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_name = f"{slug}-p{page_number}-full.png"
    out_path = out_dir / out_name
    pdf = pdfium.PdfDocument(str(source_file))
    page = pdf[page_number - 1]
    image = page.render(scale=2.5).to_pil()
    safe_image(image).save(out_path)
    width, height = image.size
    page.close()
    pdf.close()
    return {
        "path": f"systems/broken-tales/assets/adventures/maps/{out_name}",
        "width": width,
        "height": height,
    }


def extract_main_image(reader, source_file, page_number, slug):
    try:
        return render_pdf_page(source_file, page_number, slug)
    except Exception:
        pass

    page = reader.pages[page_number - 1]
    images = []
    for index, image_file in enumerate(page.images):
        image = getattr(image_file, "image", None)
        if not image:
            continue
        width, height = image.size
        area = width * height
        if width < 120 or height < 120:
            continue
        images.append((area, index, width, height, image))
    if not images:
        return None

    images.sort(reverse=True, key=lambda entry: entry[0])
    _area, index, width, height, image = images[0]
    out_dir = ASSET_DIR / "maps"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_name = f"{slug}-p{page_number}-img{index}.png"
    out_path = out_dir / out_name
    safe_image(image).save(out_path)
    return {
        "path": f"systems/broken-tales/assets/adventures/maps/{out_name}",
        "width": width,
        "height": height,
    }


ORDINAL_SCENES = {
    "first": 1,
    "second": 2,
    "third": 3,
    "fourth": 4,
    "fifth": 5,
    "sixth": 6,
    "seventh": 7,
    "eighth": 8,
    "ninth": 9,
    "tenth": 10,
    "eleventh": 11,
    "twelfth": 12,
    "final": 99,
}


def split_scene_sections(pages):
    combined = "\n\n".join(f"[[SOURCE_PAGE:{page_number}]]\n{text}" for page_number, text in pages)
    pattern = re.compile(
        r"(?im)^(?:(First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|Eleventh|Twelfth|Final)\s+Scene|Scene\s+(\d+))\b"
    )
    matches = list(pattern.finditer(combined))
    if not matches:
        return [{
            "name": "Scenario Text",
            "title": "Scenario Text",
            "text": combined,
            "sort": 100000,
        }]

    sections = []
    prelude = combined[:matches[0].start()].strip()
    if prelude:
        sections.append({
            "name": "Setup",
            "title": "Setup",
            "text": prelude,
            "sort": 50000,
        })

    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(combined)
        text = combined[match.start():end].strip()
        ordinal = (match.group(1) or "").lower()
        number = int(match.group(2)) if match.group(2) else ORDINAL_SCENES.get(ordinal, index + 1)
        label = "Final Scene" if number == 99 else f"Scene {number}"
        if sections and sections[-1]["name"] == label:
            sections[-1]["text"] = f"{sections[-1]['text']}\n\n{text}"
        else:
            sections.append({
                "name": label,
                "title": label,
                "text": text,
                "sort": (number if number != 99 else index + 1) * 100000,
            })
    return sections


def build_adventure_journal(collection, source_file, slug, title, start, end, pages, image_info):
    journal_pages = [{
        "_id": doc_id(f"{slug}-overview"),
        "name": "Summary",
        "type": "text",
        "title": {"show": True, "level": 1},
        "text": {
            "format": 1,
            "markdown": "",
            "content": (
                f"<h1>{html(title)}</h1>"
                f"<p><strong>Collection:</strong> {html(collection)}</p>"
                f"<p><strong>Source:</strong> {html(source_file.name)}, pages {start}-{end}.</p>"
                + (f"<p><img src=\"{html(image_info['path'])}\" style=\"max-width: 100%; height: auto;\" /></p>" if image_info else "")
            ),
        },
        "sort": 0,
        "ownership": {"default": -1},
        "flags": {},
        "_stats": stats(f"{slug}-overview"),
    }]
    for section in split_scene_sections(pages):
        seed = f"{slug}-{section['name'].lower().replace(' ', '-')}"
        journal_pages.append({
            "_id": doc_id(seed),
            "name": section["name"],
            "type": "text",
            "title": {"show": True, "level": 2},
            "text": {
                "format": 1,
                "markdown": "",
                "content": f"<h2>{html(title)} - {html(section['title'])}</h2>{paragraphs(section['text'])}",
            },
            "sort": section["sort"],
            "ownership": {"default": -1},
            "flags": {},
            "_stats": stats(seed),
        })
    return {
        "_id": doc_id(slug),
        "name": title,
        "pages": journal_pages,
        "folder": None,
        "flags": {
            "broken-tales": {
                "adventureSlug": slug,
                "collection": collection,
                "sourceFile": source_file.name,
                "pages": f"{start}-{end}",
            }
        },
        "sort": 0,
        "ownership": {"default": 0},
        "_stats": stats(slug),
    }


def build_map_journal(slug, title, collection, source_file, page_number, image_info):
    content = (
        f"<h1>{html(title)}</h1>"
        f"<p><strong>Collection:</strong> {html(collection)}</p>"
        f"<p><strong>Source:</strong> {html(source_file.name)}, page {page_number}.</p>"
    )
    if image_info:
        content += f"<p><img src=\"{html(image_info['path'])}\" style=\"max-width: 100%; height: auto;\" /></p>"
        content += f"<p><strong>Extracted dimensions:</strong> {image_info['width']} x {image_info['height']} px.</p>"
    else:
        content += "<p><em>Could not extract a direct image. Check the source PDF in the Complete Library.</em></p>"
    return {
        "_id": doc_id(f"map-{slug}"),
        "name": title,
        "pages": [{
            "_id": doc_id(f"map-{slug}-page"),
            "name": "Map / Visual Resource",
            "type": "text",
            "title": {"show": True, "level": 1},
            "text": {"format": 1, "markdown": "", "content": content},
            "sort": 0,
            "ownership": {"default": -1},
            "flags": {},
            "_stats": stats(f"map-{slug}-page"),
        }],
        "folder": None,
        "flags": {"broken-tales": {"mapSlug": slug, "sourceFile": source_file.name}},
        "sort": 0,
        "ownership": {"default": 0},
        "_stats": stats(f"map-{slug}"),
    }


def build_scene(slug, title, image_info):
    width = image_info["width"]
    height = image_info["height"]
    return {
        "_id": doc_id(f"scene-{slug}"),
        "name": title,
        "active": False,
        "navigation": False,
        "navOrder": 0,
        "navName": "",
        "thumb": image_info["path"],
        "background": {
            "src": image_info["path"],
            "offsetX": 0,
            "offsetY": 0,
            "scaleX": 1,
            "scaleY": 1,
            "rotation": 0,
            "tint": None,
        },
        "foreground": None,
        "foregroundElevation": None,
        "width": width,
        "height": height,
        "padding": 0.25,
        "initial": {},
        "grid": {
            "type": 0,
            "size": 100,
            "distance": 1,
            "units": "m",
            "color": "#000000",
            "alpha": 0.2,
        },
        "tokenVision": False,
        "fogExploration": False,
        "lights": [],
        "sounds": [],
        "templates": [],
        "tiles": [],
        "tokens": [],
        "walls": [],
        "drawings": [],
        "notes": [],
        "weather": "",
        "journal": None,
        "journalEntryPage": None,
        "playlist": None,
        "playlistSound": None,
        "darkness": 0,
        "folder": None,
        "sort": 0,
        "ownership": {"default": 0},
        "flags": {"broken-tales": {"sceneSlug": slug}},
        "_stats": stats(f"scene-{slug}"),
    }


def write_pack(name, documents):
    path = PACKS_DIR / f"{name}.db"
    PACKS_DIR.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        for document in documents:
            handle.write(json.dumps(document, ensure_ascii=False, separators=(",", ":")))
            handle.write("\n")
    print(f"{path.name}: {len(documents)}")


def main():
    journals = []
    map_journals = []
    scenes = []

    for source in ADVENTURES:
        reader = PdfReader(str(source["file"]))
        for slug, title, start, end in source["items"]:
            pages = []
            for page_number in range(start, end + 1):
                if 1 <= page_number <= len(reader.pages):
                    text = reader.pages[page_number - 1].extract_text() or ""
                    pages.append((page_number, text.strip()))
            image_info = extract_main_image(reader, source["file"], start, slug)
            journals.append(build_adventure_journal(source["collection"], source["file"], slug, title, start, end, pages, image_info))
            map_journals.append(build_map_journal(slug, title, source["collection"], source["file"], start, image_info))
            if image_info:
                scenes.append(build_scene(slug, title, image_info))

    for entry in EXTRA_MAPS:
        reader = PdfReader(str(entry["file"]))
        image_info = extract_main_image(reader, entry["file"], entry["page"], entry["slug"])
        map_journals.append(build_map_journal(entry["slug"], entry["title"], entry["collection"], entry["file"], entry["page"], image_info))
        if image_info:
            scenes.append(build_scene(entry["slug"], entry["title"], image_info))

    write_pack("adventures", journals)
    write_pack("adventure-maps", map_journals)
    write_pack("adventure-scenes", scenes)


if __name__ == "__main__":
    main()
