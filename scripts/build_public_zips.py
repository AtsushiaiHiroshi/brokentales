from __future__ import annotations

import json
import pathlib
import zipfile


REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
DIST_DIR = REPO_ROOT / "dist"


def manifest_pack_paths(manifest_path: str, base: str = "") -> set[str]:
    manifest = json.loads((REPO_ROOT / manifest_path).read_text(encoding="utf8"))
    return {
        str(pathlib.PurePosixPath(base) / pack["path"]).replace("\\", "/")
        for pack in manifest.get("packs", [])
    }


SYSTEM_PACKS = manifest_pack_paths("system.json")
BROKEN_ONES_PACKS = manifest_pack_paths("modules/broken-tales-broken-ones/module.json")
LOST_STORIES_PACKS = manifest_pack_paths("modules/broken-tales-lost-stories/module.json")


def common_skip(rel: str) -> bool:
    name = pathlib.PurePosixPath(rel).name
    return (
        name in {"LOCK", "LOG", "LOG.old", "CURRENT"}
        or name.startswith("MANIFEST-")
        or rel.startswith(".git/")
        or rel.startswith(".github/")
        or rel.startswith("dist/")
        or rel.startswith("docs/")
        or rel.startswith("scripts/")
        or rel.startswith("tools/")
        or "__pycache__/" in rel
        or rel.startswith("assets/source-pdfs/")
        or rel.startswith("assets/audio/")
    )


def skip_system(rel: str) -> bool:
    if common_skip(rel):
        return True
    if rel.startswith("modules/"):
        return True
    if rel.startswith("assets/adventures/"):
        return True
    if rel.startswith("packs/") and rel not in SYSTEM_PACKS:
        return True
    return False


def skip_module(rel: str, allowed_packs: set[str]) -> bool:
    if common_skip(rel):
        return True
    if rel.startswith("packs/") and rel not in allowed_packs:
        return True
    return False


def write_zip(zip_name: str, source_root: pathlib.Path, prefix: str, skip) -> None:
    zip_path = DIST_DIR / zip_name
    if zip_path.exists():
        zip_path.unlink()

    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for file_path in sorted(source_root.rglob("*")):
            if file_path.is_dir():
                continue
            rel = file_path.relative_to(source_root).as_posix()
            if skip(rel):
                continue
            archive.write(file_path, f"{prefix}/{rel}")

    print(f"{zip_path.name}: {zip_path.stat().st_size / 1024 / 1024:.2f} MB")


def main() -> None:
    DIST_DIR.mkdir(exist_ok=True)
    write_zip("broken-tales.zip", REPO_ROOT, "broken-tales", skip_system)
    write_zip(
        "broken-tales-broken-ones.zip",
        REPO_ROOT / "modules" / "broken-tales-broken-ones",
        "broken-tales-broken-ones",
        lambda rel: skip_module(rel, BROKEN_ONES_PACKS),
    )
    write_zip(
        "broken-tales-lost-stories.zip",
        REPO_ROOT / "modules" / "broken-tales-lost-stories",
        "broken-tales-lost-stories",
        lambda rel: skip_module(rel, LOST_STORIES_PACKS),
    )


if __name__ == "__main__":
    main()
