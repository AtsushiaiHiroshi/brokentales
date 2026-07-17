import json
import random
import re
import string
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKS_DIR = ROOT / "packs"
PREGENS_PATH = ROOT / "pregens" / "pregens.json"
ENRICHED_PREGENS_PATH = ROOT / "pregens" / "enriched-pregens.json"
LIBRARY_PATH = ROOT / "content" / "library.json"
AUDIT_PATH = ROOT / "content" / "audit.json"

CORE_VERSION = "13.351"
SYSTEM_ID = "broken-tales"
SYSTEM_VERSION = "0.2.0"
DESCRIPTOR_ICON = "systems/broken-tales/assets/icons/descriptor-improvement.webp"
GIFT_ICON = "systems/broken-tales/assets/icons/icon-gift.webp"


def doc_id(seed):
    alphabet = string.ascii_letters + string.digits
    rng = random.Random(seed)
    return "".join(rng.choice(alphabet) for _ in range(16))


def slugify(value):
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def html(value):
    return (
        str(value or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def one_line(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def paragraphs(text):
    clean = str(text or "").replace("\r\n", "\n").strip()
    if not clean:
        return "<p><em>Page has no extractable text. Use the local PDF linked on the first Journal page.</em></p>"
    return "".join(
        f"<p>{html(block).replace(chr(10), '<br>')}</p>"
        for block in re.split(r"\n{2,}", clean)
    )


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


def source_note(pregen):
    note = (
        f"<p><strong>{html(pregen['collection'])}</strong></p>"
        f"<p>{html(pregen['source'])}, pages {html(pregen['pages'])}.</p>"
    )
    if pregen.get("note"):
        note += f"<p>{html(pregen['note'])}</p>"
    return note


def pregen_descriptor_entries(pregen):
    """Return descriptors with explicit Broken Tales semantics.

    Official pre-generated Hunters use Background as the character's main
    descriptor. The following descriptor entries map to Gift 1, Gift 2, etc.;
    the final remaining descriptor maps to Dark Ego when a Dark Ego is present.
    """
    actor_name = pregen.get("displayName") or pregen["name"]
    owner_slug = slugify(actor_name)
    entries = []
    story = pregen.get("story", "")
    if one_line(story):
        entries.append({
            "text": story,
            "name": "Descriptor 1",
            "role": "principal-descriptor",
            "sequence": 0,
            "key": f"descriptor-principal.{owner_slug}",
        })

    descriptor_texts = [descriptor for descriptor in (pregen.get("descriptors") or []) if one_line(descriptor)]
    gift_count = len(pregen.get("gifts") or [])
    has_dark_ego = bool(pregen.get("darkEgo"))

    for index, descriptor in enumerate(descriptor_texts, start=1):
        if index <= gift_count:
            entries.append({
                "text": descriptor,
                "name": f"Descriptor {index + 1}",
                "role": "gift-descriptor",
                "sequence": index,
                "key": f"descriptor{index}-don{index}.{owner_slug}",
            })
        elif has_dark_ego:
            entries.append({
                "text": descriptor,
                "name": "Dark Ego Descriptor",
                "role": "dark-ego-descriptor",
                "sequence": 0,
                "key": f"descriptor-darkego.{owner_slug}",
            })
        else:
            entries.append({
                "text": descriptor,
                "name": f"Descriptor {index + 1}",
                "role": "extra-descriptor",
                "sequence": index,
                "key": f"descriptor-extra-{index}.{owner_slug}",
            })
    return entries


def pregen_descriptors(pregen):
    return [entry["text"] for entry in pregen_descriptor_entries(pregen)]


def dark_ego_descriptor_entry(pregen):
    for entry in pregen_descriptor_entries(pregen):
        if entry["role"] == "dark-ego-descriptor":
            return entry
    return None


def item_doc(seed, name, type_, img, system, flags=None):
    return {
        "_id": doc_id(seed),
        "name": name,
        "type": type_,
        "img": img,
        "effects": [],
        "folder": None,
        "flags": flags or {},
        "system": system,
        "sort": 0,
        "ownership": {"default": 0},
        "_stats": stats(seed),
    }


def content_flags(pregen, role, key, sequence=0):
    actor_name = pregen.get("displayName") or pregen["name"]
    return {
        "broken-tales": {
            "owner": actor_name,
            "source": pregen.get("collection", ""),
            "category": "hunter",
            "contentKey": key,
            "ownerKey": f"cazador.{slugify(actor_name)}",
            "role": role,
            "sequence": sequence,
        }
    }


def enrich_system(system, pregen, key=None):
    actor_name = pregen.get("displayName") or pregen["name"]
    system = dict(system)
    system.setdefault("owner", actor_name)
    system.setdefault("source", pregen.get("collection", ""))
    system.setdefault("category", "hunter")
    if key:
        system["key"] = key
    return system


def actor_from_pregen(pregen):
    actor_name = pregen.get("displayName") or pregen["name"]
    slug = slugify(f"{pregen['collection']}-{actor_name}")
    owner_slug = slugify(actor_name)
    source = source_note(pregen)
    items = []
    descriptor_entries = pregen_descriptor_entries(pregen)
    gifts = pregen.get("gifts") or []
    dark_ego = pregen.get("darkEgo")

    for entry in descriptor_entries:
        descriptor_text = entry["text"]
        if not descriptor_text:
            continue
        key = entry["key"]
        items.append(item_doc(
            f"{slug}-{key}",
            entry["name"],
            "descriptor",
            DESCRIPTOR_ICON,
            enrich_system({
                "description": html(descriptor_text),
                "notes": f"See {pregen['source']}, pages {pregen['pages']}.",
                "positive": one_line(descriptor_text),
                "negative": "",
                "exhausted": False,
                "xpMarked": False,
                "specialization": False,
                "sceneUsed": False,
            }, pregen, key),
            content_flags(pregen, entry["role"], key, entry["sequence"]),
        ))
    for index, gift in enumerate(gifts, start=1):
        if not gift.get("name") and not gift.get("description"):
            continue
        key = f"don{index}.{owner_slug}"
        items.append(item_doc(
            f"{slug}-{key}",
            gift.get("name") or f"Gift {index}",
            "gift",
            GIFT_ICON,
            enrich_system({
                "description": html(gift.get("description", "")),
                "notes": f"See {pregen['source']}, pages {pregen['pages']}.",
                "somaCost": 0,
                "automaticSuccesses": 0,
            }, pregen, key),
            content_flags(pregen, "gift", key, index),
        ))
    if dark_ego and (dark_ego.get("name") or dark_ego.get("description") or dark_ego.get("trigger")):
        key = f"darkego.{owner_slug}"
        items.append(item_doc(
            f"{slug}-{key}",
            dark_ego.get("name") or "Dark Ego",
            "darkEgo",
            "icons/svg/terror.svg",
            enrich_system({
                "description": html(dark_ego.get("description", "")),
                "notes": f"See {pregen['source']}, pages {pregen['pages']}.",
                "somaCost": 0,
                "automaticSuccesses": 0,
                "trigger": dark_ego.get("trigger", "Activator on source sheet."),
            }, pregen, key),
            content_flags(pregen, "dark-ego", key, 0),
        ))
    equipment_parts = [one_line(part).strip(" .") for part in re.split(r"\s*/\s*", pregen.get("equipment", "")) if one_line(part).strip(" .")]
    if equipment_parts:
        for index, equipment in enumerate(equipment_parts, start=1):
            items.append(item_doc(
                f"{slug}-equipment-{index}",
                equipment,
                "equipment",
                "icons/svg/item-bag.svg",
                enrich_system({
                    "description": html(equipment),
                    "notes": f"See {pregen['source']}, pages {pregen['pages']}.",
                    "quantity": 1,
                }, pregen),
                content_flags(pregen, "equipment", f"equipment{index}.{owner_slug}", index),
            ))
    items.append(item_doc(
        f"{slug}-source",
        "Source Sheet",
        "storyElement",
        "icons/svg/scroll.svg",
        enrich_system({
            "description": source,
            "notes": f"{pregen['source']}, pages {pregen['pages']}",
        }, pregen),
        content_flags(pregen, "source", f"source.{owner_slug}", 0),
    ))

    is_spirit = "spirit" in pregen.get("traits", [])
    actor_img = pregen.get("img") or ("icons/svg/angel.svg" if is_spirit else "icons/svg/mystery-man.svg")
    return {
        "_id": doc_id(slug),
        "name": actor_name,
        "type": "hunter",
        "img": actor_img,
        "items": items,
        "effects": [],
        "folder": None,
        "flags": {
            "broken-tales": {
                "pregenSlug": slug,
                "pregenCollection": pregen["collection"],
                "source": pregen["source"],
                "pages": pregen["pages"],
            }
        },
        "system": {
            "details": {
                "concept": pregen["collection"],
                "origin": actor_name,
                "role": "Spirit Hunter" if is_spirit else "Hunter of the Order",
                "notes": html(pregen.get("story", "")) or source,
            },
            "resources": {
                "soma": {"value": pregen.get("soma", 5), "max": pregen.get("soma", 5)},
                "xp": 0,
                "wounds": {"value": 0, "max": 3},
                "darkness": {"value": 0, "max": 6},
            },
            "opposition": {"defaultLevel": 5, "modifier": 0},
            "bookmark": {"wound1": "", "wound2": "", "wound3": "", "extraWound": ""},
        },
        "sort": 0,
        "ownership": {"default": 0},
        "_stats": stats(slug),
    }

def journal_from_book(book):
    slug = book["slug"]
    pages = [{
        "_id": doc_id(f"{slug}-pdf"),
        "name": "PDF local",
        "type": "text",
        "title": {"show": True, "level": 1},
        "text": {
            "format": 1,
            "content": (
                f"<h1>{html(book['title'])}</h1>"
                f"<p><strong>Archivo:</strong> {html(book['fileName'])}</p>"
                f"<p><strong>Paginas:</strong> {book['pageCount']}</p>"
                f"<p><a href=\"{html(book['assetPath'])}\" target=\"_blank\" rel=\"noopener\">Abrir PDF dentro de Foundry</a></p>"
            ),
            "markdown": "",
        },
        "sort": 0,
        "ownership": {"default": -1},
        "flags": {},
        "_stats": stats(f"{slug}-pdf"),
    }]

    for page in book["pages"]:
        seed = f"{slug}-page-{page['number']}"
        pages.append({
            "_id": doc_id(seed),
            "name": f"Pagina {page['number']}",
            "type": "text",
            "title": {"show": True, "level": 2},
            "text": {
                "format": 1,
                "content": f"<h2>{html(book['title'])} - Pagina {page['number']}</h2>{paragraphs(page['text'])}",
                "markdown": "",
            },
            "sort": page["number"] * 100000,
            "ownership": {"default": -1},
            "flags": {},
            "_stats": stats(seed),
        })

    return {
        "_id": doc_id(slug),
        "name": book["title"],
        "pages": pages,
        "folder": None,
        "flags": {
            "broken-tales": {
                "librarySlug": slug,
                "category": book["category"],
                "sourceFile": book["fileName"],
                "sourcePath": book["originalPath"],
            }
        },
        "sort": 0,
        "ownership": {"default": 0},
        "_stats": stats(slug),
    }


def audit_journal(audit):
    categories = [
        ("gifts", "Gifts"),
        ("scenario_gifts", "Scenario Gifts"),
        ("equipment", "Equipment / Objects"),
        ("story_elements", "Story Elements"),
        ("threats_npcs", "Threats / NPCs"),
        ("villagers", "Villagers"),
        ("spirits_essences", "Spirits / Essences"),
    ]
    rows = []
    for book in audit["books"]:
        cells = [
            html(book["fileName"]),
            str(book["pageCount"]),
            *[str(len(book["categoryPages"].get(key, []))) for key, _label in categories],
            str(len(book["blankPages"])),
        ]
        rows.append("<tr>" + "".join(f"<td>{cell}</td>" for cell in cells) + "</tr>")

    header = (
        "<tr><th>PDF</th><th>Paginas</th>"
        + "".join(f"<th>{html(label)}</th>" for _key, label in categories)
        + "<th>Paginas sin texto</th></tr>"
    )
    content = (
        "<h1>PDF Content Audit</h1>"
        "<p>This Journal summarizes the local PDF sweep. Numbers indicate pages where category-related terms were detected.</p>"
        "<table>"
        f"{header}"
        + "".join(rows)
        + "</table>"
        "<h2>Result</h2>"
        "<p>The Complete Library contains all processed PDFs as Journals with links to the local PDFs. "
        "Granular conversion to independent documents is audited separately in <code>systems/broken-tales/docs/system-audit.md</code>.</p>"
        "<p>Technical report: <code>systems/broken-tales/docs/content-audit.md</code></p>"
    )
    seed = "content-audit"
    return {
        "_id": doc_id(seed),
        "name": "PDF Content Audit",
        "pages": [{
            "_id": doc_id(f"{seed}-page"),
            "name": "Summary",
            "type": "text",
            "title": {"show": True, "level": 1},
            "text": {"format": 1, "content": content, "markdown": ""},
            "sort": 0,
            "ownership": {"default": -1},
            "flags": {},
            "_stats": stats(f"{seed}-page"),
        }],
        "folder": None,
        "flags": {"broken-tales": {"auditSlug": seed}},
        "sort": 0,
        "ownership": {"default": 0},
        "_stats": stats(seed),
    }


SUPPORT_ITEMS = [
    ("scenario-gifts", "Scenario Gifts", "storyElement", GIFT_ICON, "Index for Scenario Gifts. Check the Core Book, The Broken Ones, Lost Stories, screen, and scenario summary Journals."),
    ("objects-equipment", "Objects and Equipment", "equipment", "icons/svg/item-bag.svg", "Index for objects, Hunter equipment, special equipment, and narrative objects."),
    ("order-treasure", "Order Treasure", "storyElement", "icons/svg/chest.svg", "Index for the Order Treasure in The Broken Ones."),
    ("broken-europe-map", "Broken Europe Map", "storyElement", "icons/svg/map.svg", "Reference to the map included in the local library."),
    ("villagers", "Villagers", "storyElement", "icons/svg/village.svg", "Index for The Village and the Villager sheet."),
    ("spirits-essences", "Spirits and Essences", "storyElement", "icons/svg/angel.svg", "Index for spirits, essences, souls, virtues, and incorporeal entities."),
]


REFERENCE_ACTORS = [
    ("reference-threat", "Threat - Template", "threat", "icons/svg/cowled.svg", "Threat / Complex NPC"),
    ("reference-npc", "NPC - Template", "npc", "icons/svg/mystery-man.svg", "NPC"),
    ("reference-villager", "Villager - Template", "villager", "icons/svg/mystery-man.svg", "Villager"),
    ("reference-essence", "Spirit / Essence - Template", "essence", "icons/svg/angel.svg", "Spirit / Essence"),
]


def support_item(entry):
    slug, name, type_, img, description = entry
    system = {
        "description": f"<p>{html(description)}</p>",
        "notes": "Local support content. See the Library compendium for the complete official text.",
    }
    if type_ == "equipment":
        system["quantity"] = 1
    return item_doc(slug, name, type_, img, system)


def gifts_from_pregens(pregens):
    documents = []
    seen = set()
    for pregen in pregens:
        gift_entries = []
        descriptors = pregen_descriptors(pregen)
        gift_descriptors = descriptors[1:] if descriptors else []
        for index, gift in enumerate(pregen.get("gifts") or [], start=1):
            gift_entries.append((gift, gift_descriptors[index - 1] if index - 1 < len(gift_descriptors) else ""))

        for gift, descriptor in gift_entries:
            name = gift.get("name") or ""
            description = gift.get("description") or ""
            if not name or not description:
                continue
            key = slugify(f"{pregen.get('displayName') or pregen['name']}-{name}")
            if key in seen:
                continue
            seen.add(key)
            documents.append(item_doc(
                f"gift-{key}",
                name,
                "gift",
                "icons/svg/terror.svg" if gift.get("dark") else GIFT_ICON,
                {
                    "description": (
                        f"<h3>Associated Descriptor</h3>{html(descriptor)}"
                        f"<h3>Gift</h3>{html(description)}"
                    ),
                    "notes": f"{pregen.get('displayName') or pregen['name']} - {pregen['source']}, pages {pregen['pages']}.",
                    "somaCost": 0,
                    "automaticSuccesses": 0,
                },
            ))
    return documents


def dark_egos_from_pregens(pregens):
    documents = []
    seen = set()
    for pregen in pregens:
        dark_ego = pregen.get("darkEgo") or {}
        name = dark_ego.get("name") or ""
        description = dark_ego.get("description") or ""
        if not name and not description:
            continue
        descriptors = pregen_descriptors(pregen)
        dark_index = dark_ego_descriptor_index(pregen, descriptors)
        descriptor = descriptors[dark_index - 1] if dark_index else ""
        key = slugify(f"{pregen.get('displayName') or pregen['name']}-{name or 'dark-ego'}")
        if key in seen:
            continue
        seen.add(key)
        documents.append(item_doc(
            f"dark-ego-{key}",
            name or f"{pregen.get('displayName') or pregen['name']} - Dark Ego",
            "darkEgo",
            "icons/svg/terror.svg",
            {
                "description": (
                    f"<h3>Associated Descriptor</h3>{html(descriptor)}"
                    f"<h3>Dark Ego</h3>{html(description)}"
                ),
                "notes": f"{pregen.get('displayName') or pregen['name']} - {pregen['source']}, pages {pregen['pages']}.",
                "somaCost": 0,
                "automaticSuccesses": 0,
                "trigger": dark_ego.get("trigger", ""),
            },
        ))
    return documents


def descriptors_from_pregens(pregens):
    documents = []
    seen = set()
    for pregen in pregens:
        descriptors = pregen_descriptors(pregen)
        dark_index = dark_ego_descriptor_index(pregen, descriptors)
        for index, descriptor in enumerate(descriptors, start=1):
            if not descriptor:
                continue
            key = slugify(f"{pregen.get('displayName') or pregen['name']}-descriptor-{index}")
            if key in seen:
                continue
            seen.add(key)
            documents.append(item_doc(
                f"descriptor-{key}",
                f"{pregen.get('displayName') or pregen['name']} - {'Dark Ego Descriptor' if index == dark_index else f'Descriptor {index}'}",
                "descriptor",
                DESCRIPTOR_ICON,
                {
                    "description": html(descriptor),
                    "notes": f"{pregen.get('displayName') or pregen['name']} - {pregen['source']}, pages {pregen['pages']}.",
                    "positive": one_line(descriptor),
                    "negative": "",
                    "exhausted": False,
                    "xpMarked": False,
                    "specialization": False,
                    "sceneUsed": False,
                },
            ))
    return documents


def equipment_from_pregens(pregens):
    documents = []
    seen = set()
    for pregen in pregens:
        equipment = pregen.get("equipment") or ""
        if not equipment:
            continue
        for part in re.split(r"\s*/\s*", equipment):
            name = one_line(part).strip(" .")
            if not name:
                continue
            key = slugify(name)
            if key in seen:
                continue
            seen.add(key)
            documents.append(item_doc(
                f"equipment-{key}",
                name,
                "equipment",
                "icons/svg/item-bag.svg",
                {
                    "description": html(name),
                    "notes": f"Equipo de pregenerado. Primera fuente detectada: {pregen.get('displayName') or pregen['name']}.",
                    "quantity": 1,
                },
            ))
    return documents


def reference_descriptors(category):
    references = {
        "villager": [
            ("Villager - Age", "Age field from the official Villager sheet."),
            ("Villager - Bond", "Bond field from the official Villager sheet."),
            ("Villager - Contact with the Broken Tales", "Contact with the Broken Tales field from the official Villager sheet."),
            ("Villager - Distinguishing Features", "Distinguishing Features field from the official Villager sheet."),
        ],
        "essence": [
            ("Spirit / Essence - Nature", "Nature field for spirits and essences."),
            ("Spirit / Essence - Anchor", "Anchor field for spirits and essences."),
            ("Spirit / Essence - Manifestation", "Manifestation field for spirits and essences."),
        ],
    }
    documents = []
    for index, (name, description) in enumerate(references.get(category, []), start=1):
        documents.append(item_doc(
            f"{category}-descriptor-{index}",
            name,
            "descriptor",
                DESCRIPTOR_ICON,
            {
                "description": html(description),
                "notes": "Reference descriptor field. See the complete Library compendium for official context.",
                "positive": description,
                "negative": "",
                "exhausted": False,
                "xpMarked": False,
                "specialization": False,
                "sceneUsed": False,
            },
        ))
    return documents


def reference_actor(entry):
    slug, name, type_, img, role = entry
    system = {
        "details": {
            "concept": role,
            "origin": "Local Library",
            "role": role,
            "notes": "<p>Reference template. Use the Library compendium to bring in official text from the relevant scenario or book.</p>",
        },
        "resources": {
            "soma": {"value": 5, "max": 5},
            "xp": 0,
            "wounds": {"value": 0, "max": 3},
            "darkness": {"value": 0, "max": 6},
        },
        "opposition": {"defaultLevel": 5, "modifier": 0},
        "bookmark": {"wound1": "", "wound2": "", "wound3": "", "extraWound": ""},
    }
    if type_ == "threat":
        system["threat"] = {"rank": "Intermediate", "impulse": "", "oppositionLevel": 5}
    if type_ == "villager":
        system["villager"] = {"age": "", "bond": "", "contact": "", "distinguishingFeatures": ""}
    if type_ == "essence":
        system["essence"] = {"nature": "", "anchor": "", "manifestation": ""}
    return {
        "_id": doc_id(slug),
        "name": name,
        "type": type_,
        "img": img,
        "items": [],
        "effects": [],
        "folder": None,
        "flags": {"broken-tales": {"supportSlug": slug}},
        "system": system,
        "sort": 0,
        "ownership": {"default": 0},
        "_stats": stats(slug),
    }


def write_pack(name, documents):
    path = PACKS_DIR / f"{name}.db"
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        for document in documents:
            handle.write(json.dumps(document, ensure_ascii=False, separators=(",", ":")))
            handle.write("\n")
    print(f"{path.name}: {len(documents)}")


def main():
    PACKS_DIR.mkdir(parents=True, exist_ok=True)
    pregens_source = ENRICHED_PREGENS_PATH if ENRICHED_PREGENS_PATH.exists() else PREGENS_PATH
    pregens = json.loads(pregens_source.read_text(encoding="utf-8"))["actors"]
    library = json.loads(LIBRARY_PATH.read_text(encoding="utf-8"))["books"]
    audit = json.loads(AUDIT_PATH.read_text(encoding="utf-8"))

    hunter_pregens = [pregen for pregen in pregens if pregen.get("collection") != "The Broken Ones"]
    broken_one_pregens = [pregen for pregen in pregens if pregen.get("collection") == "The Broken Ones"]

    write_pack("hunters", [actor_from_pregen(pregen) for pregen in pregens])
    write_pack("hunter-descriptors", descriptors_from_pregens(hunter_pregens))
    write_pack("broken-one-descriptors", descriptors_from_pregens(broken_one_pregens))
    write_pack("hunter-gifts", gifts_from_pregens(pregens))
    write_pack("hunter-dark-egos", dark_egos_from_pregens(pregens))
    write_pack("hunter-equipment", equipment_from_pregens(pregens))
    write_pack("villager-descriptors", reference_descriptors("villager"))
    write_pack("essence-descriptors", reference_descriptors("essence"))
    write_pack("library", [journal_from_book(book) for book in library])
    write_pack("audit", [audit_journal(audit)])
    write_pack("support", [support_item(entry) for entry in SUPPORT_ITEMS])
    write_pack("threats-villagers-essences", [reference_actor(entry) for entry in REFERENCE_ACTORS])


if __name__ == "__main__":
    main()
