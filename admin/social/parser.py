from __future__ import annotations

import re
import shutil
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET


DOC_NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
}

OPTION_PATTERN = re.compile(r"Option\s+(\d+)\s*[\-|]\s*(.+)", re.IGNORECASE)


@dataclass
class ParsedPost:
    post_number: int | None
    title: str
    hook: str
    main_post_line: str
    short_caption: str
    cta: str
    website_url: str
    linkedin_caption: str
    instagram_caption: str
    facebook_caption: str
    image_path: str
    image_source: str
    batch_name: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "postNumber": self.post_number,
            "title": self.title,
            "hook": self.hook,
            "mainPostLine": self.main_post_line,
            "shortCaption": self.short_caption,
            "cta": self.cta,
            "websiteUrl": self.website_url,
            "linkedinCaption": self.linkedin_caption,
            "instagramCaption": self.instagram_caption,
            "facebookCaption": self.facebook_caption,
            "imagePath": self.image_path,
            "imageSource": self.image_source,
            "batchName": self.batch_name,
        }


def parse_docx_file(docx_path: Path, image_output_dir: Path) -> dict[str, Any]:
    image_output_dir.mkdir(parents=True, exist_ok=True)
    batch_name = docx_path.stem

    with zipfile.ZipFile(docx_path) as archive:
        document_root = ET.fromstring(archive.read("word/document.xml"))
        body = document_root.find("w:body", DOC_NS)
        if body is None:
            return {"batchName": batch_name, "posts": [], "warnings": ["Document body could not be read."]}

        rel_root = ET.fromstring(archive.read("word/_rels/document.xml.rels"))
        relationship_map = {
            relationship.attrib["Id"]: relationship.attrib["Target"]
            for relationship in rel_root.findall("rel:Relationship", DOC_NS)
        }

        blocks = []
        for child in list(body):
            blocks.append(
                {
                    "tag": _strip_namespace(child.tag),
                    "text": _extract_text(child),
                    "table": _extract_table(child),
                    "image_rel_ids": child.findall(".//a:blip", DOC_NS),
                }
            )

        image_assignments = _save_images(archive, relationship_map, image_output_dir, batch_name)
        parsed_posts, warnings = _extract_posts(blocks, batch_name, image_assignments)
        return {
            "batchName": batch_name,
            "posts": [post.to_dict() for post in parsed_posts],
            "warnings": warnings,
        }


def _extract_posts(blocks: list[dict[str, Any]], batch_name: str, image_assignments: dict[str, str]) -> tuple[list[ParsedPost], list[str]]:
    posts: list[ParsedPost] = []
    warnings: list[str] = []
    current: dict[str, Any] | None = None
    mode = "unknown"

    def flush_current() -> None:
        nonlocal current
        if not current:
            return
        posts.append(_finalize_post(current, batch_name))
        current = None

    for index, block in enumerate(blocks):
        text = block["text"].strip()
        table = block["table"]

        option_match = OPTION_PATTERN.match(text)
        if option_match:
            flush_current()
            current = _empty_post(batch_name)
            current["postNumber"] = int(option_match.group(1))
            current["title"] = option_match.group(2).strip()
            mode = "paragraph"
            continue

        if table:
            first_cell = table[0][0] if table and table[0] else ""
            option_table_match = OPTION_PATTERN.match(first_cell)
            if option_table_match:
                flush_current()
                current = _empty_post(batch_name)
                current["postNumber"] = int(option_table_match.group(1))
                current["title"] = option_table_match.group(2).strip()
                mode = "table"
                continue

        if not current:
            continue

        if text == "Associated image":
            continue

        image_rel_id = _extract_first_image_rel_id(block)
        if image_rel_id:
            current["imagePath"] = image_assignments.get(image_rel_id, "")
            current["imageSource"] = image_rel_id
            continue

        if mode == "paragraph" and not current["mainPostLine"] and text and not table and not text.startswith("Platform-ready caption"):
            current["mainPostLine"] = text
            continue

        if table:
            lowered_keys = {row[0].lower(): row[1] for row in table if len(row) > 1}
            if "hook line" in lowered_keys:
                current["hook"] = lowered_keys.get("hook line", "")
                current["shortCaption"] = lowered_keys.get("short caption", "")
                current["cta"] = lowered_keys.get("cta", "")
                current["websiteUrl"] = lowered_keys.get("website", "")
                image_headline = lowered_keys.get("image headline", "")
                if image_headline and not current["mainPostLine"]:
                    current["mainPostLine"] = image_headline
                continue

            if "linkedin" in lowered_keys or "instagram" in lowered_keys or "facebook" in lowered_keys:
                current["linkedinCaption"] = lowered_keys.get("linkedin", "")
                current["instagramCaption"] = lowered_keys.get("instagram", "")
                current["facebookCaption"] = lowered_keys.get("facebook", "")
                continue

        if index == len(blocks) - 1 and current:
            flush_current()

    flush_current()

    for post in posts:
        if not post.image_path:
            warnings.append(f"Post {post.post_number or '?'} does not have an imported image and will need manual assignment before saving.")

    return posts, warnings


def _empty_post(batch_name: str) -> dict[str, Any]:
    return {
        "batchName": batch_name,
        "postNumber": None,
        "title": "",
        "hook": "",
        "mainPostLine": "",
        "shortCaption": "",
        "cta": "",
        "websiteUrl": "",
        "linkedinCaption": "",
        "instagramCaption": "",
        "facebookCaption": "",
        "imagePath": "",
        "imageSource": "",
    }


def _finalize_post(data: dict[str, Any], batch_name: str) -> ParsedPost:
    return ParsedPost(
        post_number=data.get("postNumber"),
        title=data.get("title", ""),
        hook=data.get("hook", ""),
        main_post_line=data.get("mainPostLine", ""),
        short_caption=data.get("shortCaption", ""),
        cta=data.get("cta", ""),
        website_url=data.get("websiteUrl", ""),
        linkedin_caption=data.get("linkedinCaption", ""),
        instagram_caption=data.get("instagramCaption", ""),
        facebook_caption=data.get("facebookCaption", ""),
        image_path=data.get("imagePath", ""),
        image_source=data.get("imageSource", ""),
        batch_name=batch_name,
    )


def _save_images(archive: zipfile.ZipFile, relationship_map: dict[str, str], image_output_dir: Path, batch_name: str) -> dict[str, str]:
    assignments: dict[str, str] = {}
    for rel_id, target in relationship_map.items():
        if not target.startswith("media/"):
            continue

        image_name = Path(target).name
        source_path = f"word/{target}"
        if source_path not in archive.namelist():
            continue

        match = re.search(r"image(\d+)", image_name, re.IGNORECASE)
        suffix = match.group(1).zfill(2) if match else rel_id.lower()
        output_name = f"{_slugify(batch_name)}-{suffix}{Path(image_name).suffix.lower()}"
        output_path = image_output_dir / output_name

        with archive.open(source_path) as source_file, output_path.open("wb") as target_file:
            shutil.copyfileobj(source_file, target_file)

        assignments[rel_id] = f"/social-posts/images/{output_name}"

    return assignments


def _extract_text(node: ET.Element) -> str:
    texts = [text.text.strip() for text in node.findall(".//w:t", DOC_NS) if text.text and text.text.strip()]
    return " ".join(texts)


def _extract_table(node: ET.Element) -> list[list[str]]:
    if _strip_namespace(node.tag) != "tbl":
        return []

    rows: list[list[str]] = []
    for row in node.findall("w:tr", DOC_NS):
        values = []
        for cell in row.findall("w:tc", DOC_NS):
            text = _extract_text(cell)
            values.append(text)
        if any(values):
            rows.append(values)
    return rows


def _extract_first_image_rel_id(block: dict[str, Any]) -> str:
    for blip in block["image_rel_ids"]:
        rel_id = blip.attrib.get(f"{{{DOC_NS['r']}}}embed")
        if rel_id:
            return rel_id
    return ""


def _strip_namespace(tag: str) -> str:
    return tag.split("}", 1)[-1]


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "clarpoint-post"
