import json
import re
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageOps
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
PREGENS_PATH = ROOT / "pregens" / "enriched-pregens.json"
AVATAR_DIR = ROOT / "assets" / "avatars" / "pregens"
SYSTEM_PREFIX = "systems/broken-tales"

PDF_ROOTS = [
    Path(r"C:\Users\Gamer\Documents\Broken Tales KS [ENG]"),
    Path(r"C:\Users\Gamer\Documents\Broken Tales KS [ENG]\Extras"),
    ROOT / "assets" / "source-pdfs",
]

PREFERRED_SOURCES = {
    "bt-cb-sheets-eng-final-screen [2022-06-29].pdf": "Broken Tales - Basic Hunters Sheets.pdf",
    "bt-tbo-sheets-eng-final-screen [2022-06-14].pdf": "Broken Tales - The Broken Ones Hunters Sheets.pdf",
    "bt-cb-foxcat-sheet-eng-final-screen [2022-06-29].pdf": "Cunning Machiavelli the Fox & Sly Bischeri the Cat.pdf",
    "Broken Tales - Lost Stories - Exclusive Pre-Gen Hunters.pdf": "Broken Tales - Lost Stories - Exclusive Pre-Gen Hunters.pdf",
    "bt-ls-hunters-sheets-1.2-eng-BASE-SCREEN.pdf": "bt-ls-hunters-sheets-1.2-eng-BASE-SCREEN.pdf",
}


def slugify(value):
    value = str(value or "").lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def first_page(value):
    match = re.search(r"\d+", str(value or ""))
    return max(1, int(match.group(0))) if match else 1


def normalized_name(value):
    return slugify(Path(value).stem)


def find_pdf(source_name):
    candidates = []
    preferred = PREFERRED_SOURCES.get(source_name)
    if preferred:
        candidates.append(preferred)
    candidates.append(source_name)
    candidates.append(normalized_name(source_name) + ".pdf")

    for candidate in candidates:
        for root in PDF_ROOTS:
            path = root / candidate
            if path.exists():
                return path

    target = normalized_name(source_name)
    for root in PDF_ROOTS:
        if not root.exists():
            continue
        for path in root.rglob("*.pdf"):
            if normalized_name(path.name) == target:
                return path
            if preferred and normalized_name(path.name) == normalized_name(preferred):
                return path
    return None


def poppler_exe():
    runtime = Path(r"C:\Users\Gamer\.cache\codex-runtimes\codex-primary-runtime\dependencies")
    direct = runtime / "native" / "poppler" / "Library" / "bin" / "pdftoppm.exe"
    if direct.exists():
        return direct
    found = shutil.which("pdftoppm")
    return Path(found) if found else None


def render_pdf_page(pdf_path, page_number, output_base):
    exe = poppler_exe()
    if not exe:
        return None
    subprocess.run(
        [
            str(exe),
            "-f",
            str(page_number),
            "-l",
            str(page_number),
            "-r",
            "150",
            "-png",
            str(pdf_path),
            str(output_base),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    matches = sorted(output_base.parent.glob(output_base.name + "-*.png"))
    return matches[-1] if matches else None


def extract_best_embedded_image(pdf_path, page_number, output_path):
    try:
        reader = PdfReader(str(pdf_path))
        page = reader.pages[page_number - 1]
    except Exception:
        return False

    best = None
    best_score = 0
    for image_file in page.images:
        image = image_file.image.convert("RGBA")
        width, height = image.size
        area = width * height
        if area < 120000:
            continue
        alpha_bbox = image.getbbox()
        if not alpha_bbox:
            continue
        # Avoid long thin borders, banners, and paint strips.
        ratio = max(width / max(height, 1), height / max(width, 1))
        if ratio > 3.8:
            continue
        score = area
        if 0.65 <= width / max(height, 1) <= 1.55:
            score *= 1.35
        if score > best_score:
            best = image
            best_score = score

    if not best:
        return False

    save_square(best, output_path)
    return True


def save_square(image, output_path):
    image = image.convert("RGBA")
    background = Image.new("RGBA", image.size, (246, 244, 238, 255))
    background.alpha_composite(image)
    image = background.convert("RGB")

    image = ImageOps.contain(image, (512, 512), method=Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (512, 512), (246, 244, 238))
    x = (512 - image.width) // 2
    y = (512 - image.height) // 2
    canvas.paste(image, (x, y))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output_path, "PNG", optimize=True)


def render_avatar(pdf_path, page_number, output_path):
    tmp_base = output_path.with_suffix("")
    rendered = None
    try:
        rendered = render_pdf_page(pdf_path, page_number, tmp_base)
    except Exception:
        rendered = None

    if rendered and rendered.exists():
        image = Image.open(rendered).convert("RGB")
        save_square(image, output_path)
        rendered.unlink(missing_ok=True)
        return True, "render"

    if extract_best_embedded_image(pdf_path, page_number, output_path):
        return True, "embedded"

    return False, "missing"


def main():
    data = json.loads(PREGENS_PATH.read_text(encoding="utf-8"))
    actors = data.get("actors", [])
    report = []

    for pregen in actors:
        actor_name = pregen.get("displayName") or pregen.get("name")
        if not actor_name:
            continue
        slug = slugify(f"{pregen.get('collection', '')}-{actor_name}")
        pdf_path = find_pdf(pregen.get("source", ""))
        page_number = first_page(pregen.get("pages", "1"))
        output_path = AVATAR_DIR / f"{slug}.png"

        if pdf_path:
            ok, mode = render_avatar(pdf_path, page_number, output_path)
        else:
            ok, mode = False, "pdf-not-found"

        if ok:
            pregen["img"] = f"{SYSTEM_PREFIX}/assets/avatars/pregens/{output_path.name}"

        report.append(
            {
                "name": actor_name,
                "collection": pregen.get("collection"),
                "source": pregen.get("source"),
                "pdf": str(pdf_path) if pdf_path else None,
                "page": page_number,
                "img": pregen.get("img"),
                "mode": mode,
                "ok": ok,
            }
        )

    data["avatarReport"] = report
    PREGENS_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (ROOT / "docs" / "pregen-avatar-report.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    ok_count = sum(1 for item in report if item["ok"])
    print(f"Pregenerated avatars: {ok_count}/{len(report)}")
    for item in report:
        if not item["ok"]:
            print(f"MISS {item['name']}: {item['mode']} ({item['source']})")


if __name__ == "__main__":
    main()
