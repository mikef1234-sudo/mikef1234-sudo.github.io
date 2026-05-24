from __future__ import annotations

import shutil
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DOWNLOADS = ROOT / "public" / "downloads" / "templates"
FULL_BUNDLE = DOWNLOADS / "full-clarpoint-business-execution-toolkit"

PACK_ORDER = [
    "executive-project-status-pack",
    "raid-log-action-tracker-bundle",
    "client-kickoff-meeting-pack",
    "website-redesign-planning-kit",
    "consulting-proposal-starter-kit",
]


def visible_files(folder: Path):
    for item in sorted(folder.iterdir()):
        if item.name.startswith("."):
            continue
        if item.name == "download-all.zip":
            continue
        yield item


def write_zip(folder: Path, zip_name: str = "download-all.zip") -> Path:
    zip_path = folder / zip_name
    if zip_path.exists():
        zip_path.unlink()
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as archive:
        for item in visible_files(folder):
            archive.write(item, arcname=item.name)
    return zip_path


def package_all() -> None:
    created = {}
    for slug in PACK_ORDER:
        created[slug] = write_zip(DOWNLOADS / slug)

    for slug, zip_path in created.items():
        bundle_target = FULL_BUNDLE / f"{slug}.zip"
        if bundle_target.exists():
            bundle_target.unlink()
        shutil.copy2(zip_path, bundle_target)

    write_zip(FULL_BUNDLE)


if __name__ == "__main__":
    package_all()
