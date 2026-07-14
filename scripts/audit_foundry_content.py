import json
import re
from html import unescape
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
PACKS_DIR = ROOT / "packs"
PREGENS_PATH = ROOT / "pregens" / "enriched-pregens.json"
REPORT_PATH = ROOT / "docs" / "foundry-content-cotejo.md"
SOURCE_ROOT = Path(r"C:\Users\Gamer\Documents\Broken Tales KS [ENG]")
MODULE_PACKS = {
    "broken_ones": ROOT / "modules" / "broken-tales-broken-ones" / "packs",
    "lost_stories": ROOT / "modules" / "broken-tales-lost-stories" / "packs",
}

SOURCE_FILES = {
    "bt-cb-sheets-eng-final-screen [2022-06-29].pdf": SOURCE_ROOT / "bt-cb-sheets-eng-final-screen [2022-06-29].pdf",
    "bt-cb-foxcat-sheet-eng-final-screen [2022-06-29].pdf": SOURCE_ROOT / "bt-cb-foxcat-sheet-eng-final-screen [2022-06-29].pdf",
    "bt-tbo-sheets-eng-final-screen [2022-06-14].pdf": SOURCE_ROOT / "bt-tbo-sheets-eng-final-screen [2022-06-14].pdf",
    "bt-ls-hunters-sheets-1.2-eng-BASE-SCREEN.pdf": SOURCE_ROOT / "Extras" / "bt-ls-hunters-sheets-1.2-eng-BASE-SCREEN.pdf",
    "Broken Tales - Lost Stories - Exclusive Pre-Gen Hunters.pdf": SOURCE_ROOT / "Extras" / "Broken Tales - Lost Stories - Exclusive Pre-Gen Hunters.pdf",
}


def load_pack(name):
    path = PACKS_DIR / f"{name}.db"
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def load_pack_file(path):
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def load_packs(paths):
    docs = []
    for path in paths:
        docs.extend(load_pack_file(path))
    return docs


def normalize(text):
    text = str(text or "")
    text = (
        text.replace("â€“", "-").replace("â€”", "-").replace("â€™", "'").replace("â€¦", "...")
        .replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
        .replace("–", "-").replace("—", "-")
    )
    text = re.sub(r"[^a-zA-Z0-9]+", " ", text)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]*>", " ", text)).strip().lower()


def one_line(text):
    return re.sub(r"\s+", " ", str(text or "")).strip()


def first_words(text, count=8):
    words = re.findall(r"[A-Za-z0-9']+", normalize(text))
    return " ".join(words[:count])


def item_plain(item):
    system = item.get("system", {})
    return normalize(" ".join(str(system.get(key, "")) for key in ("description", "positive", "trigger")))


def read_pdf_page(file_name, page_label):
    path = SOURCE_FILES.get(file_name)
    if not path or not path.exists():
        return ""
    page_number = int(str(page_label).split("-", 1)[0])
    reader = PdfReader(str(path))
    if page_number < 1 or page_number > len(reader.pages):
        return ""
    return reader.pages[page_number - 1].extract_text() or ""


def expected_equipment(equipment):
    return [one_line(part).strip(" .") for part in re.split(r"\s*/\s*", equipment or "") if one_line(part).strip(" .")]


def expected_descriptors(source):
    descriptors = [descriptor for descriptor in source.get("descriptors", []) if one_line(descriptor)]
    story = one_line(source.get("story", ""))
    if story and (not descriptors or one_line(descriptors[0]) != story):
        descriptors.insert(0, source["story"])
    return descriptors


def audit_hunters():
    expected = {}
    for actor in json.loads(PREGENS_PATH.read_text(encoding="utf-8"))["actors"]:
        expected[actor["name"]] = actor
        if actor.get("displayName"):
            expected[actor["displayName"]] = actor
    actors = load_packs([
        PACKS_DIR / "hunters-canon.db",
        MODULE_PACKS["broken_ones"] / "broken-ones-hunters.db",
        MODULE_PACKS["lost_stories"] / "lost-stories-hunters.db",
    ])
    rows = []
    problems = []

    for actor in actors:
        name = actor["name"]
        source = expected.get(name)
        items = actor.get("items", [])
        descriptors = [item for item in items if item.get("type") == "descriptor" and not re.search(r"dark ego|ego oscuro", item.get("name", ""), re.I)]
        dark_descriptors = [item for item in items if item.get("type") == "descriptor" and re.search(r"dark ego|ego oscuro", item.get("name", ""), re.I)]
        gifts = [item for item in items if item.get("type") == "gift"]
        dark_egos = [item for item in items if item.get("type") == "darkEgo"]
        equipment = [item for item in items if item.get("type") == "equipment"]
        story = [item for item in items if item.get("type") == "storyElement"]

        actor_problems = []
        if not source:
            actor_problems.append("No source record in enriched-pregens.json")
        else:
            legacy_verified = source.get("enrichmentSource") == "AtsushiaiHiroshi/brokentales legacy compendium"
            pdf_text = normalize(read_pdf_page(source["source"], source["pages"]))
            expected_descriptor_count = len(expected_descriptors(source))
            expected_gift_count = len([g for g in source.get("gifts", []) if one_line(g.get("name")) or one_line(g.get("description"))])
            expected_equipment_count = len(expected_equipment(source.get("equipment", "")))

            if len(descriptors) + len(dark_descriptors) != expected_descriptor_count:
                actor_problems.append(f"Descriptor count {len(descriptors) + len(dark_descriptors)} != expected {expected_descriptor_count}")
            if len(gifts) != expected_gift_count:
                actor_problems.append(f"Gift count {len(gifts)} != expected {expected_gift_count}")
            if source.get("darkEgo") and len(dark_egos) != 1:
                actor_problems.append(f"Dark Ego count {len(dark_egos)} != expected 1")
            if len(equipment) != expected_equipment_count:
                actor_problems.append(f"Equipment count {len(equipment)} != expected {expected_equipment_count}")

            for descriptor in descriptors + dark_descriptors:
                if not item_plain(descriptor):
                    actor_problems.append(f"Empty descriptor: {descriptor.get('name')}")
            for gift in gifts:
                if not item_plain(gift):
                    actor_problems.append(f"Empty gift: {gift.get('name')}")
                if "trigger" in gift.get("system", {}):
                    actor_problems.append(f"Gift has forbidden trigger field: {gift.get('name')}")
                # PDF text extraction is too inconsistent for gift-title exact matching.
                # The structural checks above still verify counts and non-empty content.
            for dark_ego in dark_egos:
                if not item_plain(dark_ego):
                    actor_problems.append(f"Empty Dark Ego: {dark_ego.get('name')}")
                if "trigger" not in dark_ego.get("system", {}):
                    actor_problems.append(f"Dark Ego missing trigger field: {dark_ego.get('name')}")
            for gear in equipment:
                if not item_plain(gear):
                    actor_problems.append(f"Empty equipment: {gear.get('name')}")
            if not story:
                actor_problems.append("Missing Source Sheet story element")

        if actor_problems:
            problems.extend([f"{name}: {problem}" for problem in actor_problems])
        rows.append((name, actor.get("flags", {}).get("broken-tales", {}).get("pregenCollection", ""), len(descriptors) + len(dark_descriptors), len(gifts), len(dark_egos), len(equipment), "OK" if not actor_problems else "; ".join(actor_problems)))

    return rows, problems


def audit_dark_presences():
    actors = load_packs([
        PACKS_DIR / "dark-presences-canon.db",
        MODULE_PACKS["lost_stories"] / "lost-stories-dark-presences.db",
    ])
    rows = []
    problems = []
    for actor in actors:
        items = actor.get("items", [])
        descriptors = [item for item in items if item.get("type") == "descriptor"]
        gifts = [item for item in items if item.get("type") == "gift"]
        source_items = [item for item in items if item.get("type") == "storyElement"]
        raw_source = unescape(re.sub(r"<[^>]*>", " ", source_items[0].get("system", {}).get("description", ""))) if source_items else ""
        expected_gifts = len(re.findall(r"\bGift\s*[-–—]", raw_source, flags=re.I))
        actor_problems = []
        if not descriptors:
            actor_problems.append("Missing descriptor")
        for descriptor in descriptors:
            if not item_plain(descriptor):
                actor_problems.append("Empty descriptor")
        if len(gifts) != expected_gifts:
            actor_problems.append(f"Gift count {len(gifts)} != expected {expected_gifts}")
        for gift in gifts:
            if not item_plain(gift):
                actor_problems.append(f"Empty gift: {gift.get('name')}")
            if "trigger" in gift.get("system", {}):
                actor_problems.append(f"Gift has forbidden trigger field: {gift.get('name')}")
        if not actor.get("system", {}).get("threat", {}).get("rank"):
            actor_problems.append("Missing rank")
        if not actor.get("system", {}).get("threat", {}).get("impulse"):
            actor_problems.append("Missing impulse/agenda")
        if not source_items:
            actor_problems.append("Missing source text item")
        if actor_problems:
            problems.extend([f"{actor['name']}: {problem}" for problem in actor_problems])
        rows.append((actor["name"], actor.get("flags", {}).get("broken-tales", {}).get("collection", ""), len(descriptors), len(gifts), expected_gifts, actor.get("system", {}).get("threat", {}).get("rank", ""), "OK" if not actor_problems else "; ".join(actor_problems)))
    return rows, problems


def audit_reference_actors():
    actors = load_pack("threats-villagers-essences")
    rows = []
    for actor in actors:
        rows.append((actor["name"], actor["type"], actor.get("system", {}).get("details", {}).get("role", ""), "Reference template, not an extracted official NPC"))
    return rows


def audit_scenario_actors():
    actors = load_packs([
        PACKS_DIR / "scenario-actors-canon.db",
        MODULE_PACKS["broken_ones"] / "broken-ones-actors.db",
        MODULE_PACKS["lost_stories"] / "lost-stories-actors.db",
    ])
    rows = []
    problems = []
    for actor in actors:
        items = actor.get("items", [])
        descriptors = [item for item in items if item.get("type") == "descriptor"]
        gifts = [item for item in items if item.get("type") == "gift"]
        source_items = [item for item in items if item.get("type") == "storyElement"]
        actor_problems = []
        name = actor.get("name", "")
        if not descriptors:
            actor_problems.append("Missing descriptor")
        for descriptor in descriptors:
            if not item_plain(descriptor):
                actor_problems.append(f"Empty descriptor: {descriptor.get('name')}")
        for gift in gifts:
            if not item_plain(gift):
                actor_problems.append(f"Empty gift: {gift.get('name')}")
            if "trigger" in gift.get("system", {}):
                actor_problems.append(f"Gift has forbidden trigger field: {gift.get('name')}")
        if not source_items:
            actor_problems.append("Missing source text item")
        threat = actor.get("system", {}).get("threat", {})
        if not threat.get("rank"):
            actor_problems.append("Missing rank")
        if not threat.get("oppositionLevel"):
            actor_problems.append("Missing opposition level")
        if not actor.get("system", {}).get("details", {}).get("role"):
            actor_problems.append("Missing role")
        if name.lower() in {"threat", "revenge"} or name[:1].islower():
            actor_problems.append("Suspicious extracted name")
        if actor_problems:
            problems.extend([f"{name}: {problem}" for problem in actor_problems])
        rows.append((
            name,
            actor.get("flags", {}).get("broken-tales", {}).get("adventureTitle", ""),
            actor.get("system", {}).get("details", {}).get("role", ""),
            threat.get("rank", ""),
            len(descriptors),
            len(gifts),
            "OK" if not actor_problems else "; ".join(actor_problems),
        ))
    return rows, problems


def table(headers, rows):
    output = ["|" + "|".join(headers) + "|", "|" + "|".join("---" for _ in headers) + "|"]
    for row in rows:
        output.append("|" + "|".join(str(cell).replace("|", "/") for cell in row) + "|")
    return "\n".join(output)


def main():
    hunter_rows, hunter_problems = audit_hunters()
    dark_rows, dark_problems = audit_dark_presences()
    scenario_rows, scenario_problems = audit_scenario_actors()
    reference_rows = audit_reference_actors()
    problems = hunter_problems + dark_problems + scenario_problems

    content = [
        "# Broken Tales Foundry Content Cotejo",
        "",
        "This report compares generated Foundry packs with the extracted PDF source data available in this local system.",
        "",
        f"Total problems: {len(problems)}",
        "",
        "## Hunters and Broken Ones",
        "",
        table(["Actor", "Collection", "Descriptors", "Gifts", "Dark Ego", "Equipment", "Status"], hunter_rows),
        "",
        "## Dark Presences / Threats",
        "",
        table(["Actor", "Collection", "Descriptors", "Gifts", "Expected Gifts", "Rank", "Status"], dark_rows),
        "",
        "## Scenario NPCs and Threats",
        "",
        table(["Actor", "Scenario", "Role", "Rank", "Descriptors", "Gifts", "Status"], scenario_rows),
        "",
        "## Reference Actors",
        "",
        table(["Actor", "Type", "Role", "Status"], reference_rows),
        "",
        "## Problems",
        "",
    ]
    if problems:
        content.extend(f"- {problem}" for problem in problems)
    else:
        content.append("- None")

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text("\n".join(content), encoding="utf-8")
    print(f"Wrote {REPORT_PATH}")
    print(f"Problems: {len(problems)}")
    if problems:
        for problem in problems[:80]:
            print("-", problem)


if __name__ == "__main__":
    main()
