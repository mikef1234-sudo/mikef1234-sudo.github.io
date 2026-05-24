from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone
from email.parser import BytesParser
from email.policy import default
from http import cookies
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from connectors import post_to_facebook, post_to_instagram, post_to_linkedin
from db import ensure_database, get_connection, row_to_dict
from parser import parse_docx_file


ROOT = Path(__file__).resolve().parents[2]
ADMIN_DIR = ROOT / "admin" / "social"
DATA_DIR = ADMIN_DIR / "data"
DB_PATH = DATA_DIR / "social.db"
PUBLIC_IMAGE_DIR = ROOT / "public" / "social-posts" / "images"
UPLOAD_DIR = DATA_DIR / "uploads"
DOC_SOURCE_DIR = Path("/Users/miferrar/Downloads/website-marketing-posts/marketing")

SESSION_COOKIE = "clarpoint_admin_session"
SESSIONS: dict[str, str] = {}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def ensure_directories() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    ensure_database(DB_PATH)


def validate_post_payload(payload: dict[str, object]) -> list[str]:
    errors: list[str] = []
    title = str(payload.get("title", "")).strip()
    main_post_line = str(payload.get("mainPostLine", "")).strip()
    image_path = str(payload.get("imagePath", "")).strip()
    short_caption = str(payload.get("shortCaption", "")).strip()
    linkedin_caption = str(payload.get("linkedinCaption", "")).strip()
    instagram_caption = str(payload.get("instagramCaption", "")).strip()
    facebook_caption = str(payload.get("facebookCaption", "")).strip()

    if not title and not main_post_line:
        errors.append("Each post needs a title or main post line.")
    if not any([short_caption, linkedin_caption, instagram_caption, facebook_caption]):
        errors.append("Each post needs at least one caption.")
    if not image_path:
        errors.append("Each post needs an image path before it can be saved.")
    return errors


class ClarpointAdminHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path

        if path.startswith("/admin-api/"):
            if not self._require_auth_for_api(path):
                return
            self._handle_api_get(path, parsed)
            return

        if path.startswith("/social-posts/images/"):
            file_path = ROOT / "public" / path.lstrip("/")
            if file_path.exists():
                self.path = str(file_path.relative_to(ROOT))
            return super().do_GET()

        if path in {"/admin/login", "/admin/login/"}:
            return self._redirect("/admin/social")

        route_map = {
            "/": ROOT / "index.html",
            "/admin/social": ADMIN_DIR / "index.html",
            "/admin/social/": ADMIN_DIR / "index.html",
            "/admin/social/import": ADMIN_DIR / "import" / "index.html",
            "/admin/social/import/": ADMIN_DIR / "import" / "index.html",
            "/admin/social/editor": ADMIN_DIR / "editor" / "index.html",
            "/admin/social/editor/": ADMIN_DIR / "editor" / "index.html",
        }

        if path in route_map:
            return self._serve_file(route_map[path])

        return super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/admin-api/auth/login":
            return self._json({"authenticated": True, "mode": "local-bypass"})

        if path == "/admin-api/auth/logout":
            return self._handle_logout()
        if path == "/admin-api/social/import/upload":
            return self._handle_doc_upload()
        if path == "/admin-api/social/import/parse":
            return self._handle_doc_parse()
        if path == "/admin-api/social/import/confirm":
            return self._handle_import_confirm()
        if path == "/admin-api/social/images/upload":
            return self._handle_image_upload()
        if path.endswith("/mark-approved"):
            return self._handle_status_change(path, "Approved")
        if path.endswith("/mark-posted"):
            return self._handle_status_change(path, "Posted")
        if path.endswith("/publish/instagram"):
            return self._placeholder_publish(path, "instagram")
        if path.endswith("/publish/facebook"):
            return self._placeholder_publish(path, "facebook")
        if path.endswith("/publish/linkedin"):
            return self._placeholder_publish(path, "linkedin")

        return self._json({"error": "Not found"}, status=404)

    def do_PUT(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        if path.startswith("/admin-api/") and not self._is_authenticated():
            return self._json({"error": "Unauthorized"}, status=401)
        if path.startswith("/admin-api/social/posts/"):
            return self._handle_post_update(path)
        return self._json({"error": "Not found"}, status=404)

    def _handle_api_get(self, path: str, parsed) -> None:
        if path == "/admin-api/auth/status":
            return self._json({"authenticated": True, "mode": "local-bypass"})
        if path == "/admin-api/social/documents":
            docs = sorted(
                [
                    {
                        "name": item.name,
                        "path": str(item),
                        "modifiedAt": datetime.fromtimestamp(item.stat().st_mtime, timezone.utc).isoformat(),
                    }
                    for item in DOC_SOURCE_DIR.glob("*.docx")
                    if item.is_file() and not item.name.startswith("~$")
                ],
                key=lambda item: item["name"],
            )
            return self._json({"documents": docs})
        if path == "/admin-api/social/images":
            images = sorted(
                [
                    {
                        "name": item.name,
                        "path": f"/social-posts/images/{item.name}",
                    }
                    for item in PUBLIC_IMAGE_DIR.iterdir()
                    if item.is_file() and item.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}
                ],
                key=lambda item: item["name"],
            )
            return self._json({"images": images})
        if path == "/admin-api/social/posts":
            return self._handle_posts_list(parsed)
        if path.startswith("/admin-api/social/posts/"):
            post_id = path.rstrip("/").split("/")[-1]
            return self._handle_post_detail(post_id)

        return self._json({"error": "Not found"}, status=404)

    def _handle_posts_list(self, parsed) -> None:
        query = parse_qs(parsed.query)
        clauses = []
        values: list[object] = []

        for column, key in [("batchName", "batch"), ("platform", "platform"), ("status", "status"), ("scheduledDate", "scheduledDate")]:
            value = query.get(key, [""])[0].strip()
            if value:
                clauses.append(f"{column} = ?")
                values.append(value)

        sql = "SELECT * FROM social_posts"
        if clauses:
            sql += " WHERE " + " AND ".join(clauses)
        sql += " ORDER BY updatedAt DESC, id DESC"

        with get_connection(DB_PATH) as connection:
            rows = connection.execute(sql, values).fetchall()
            batches = connection.execute("SELECT DISTINCT batchName FROM social_posts WHERE batchName <> '' ORDER BY batchName").fetchall()

        return self._json(
            {
                "posts": [row_to_dict(row) for row in rows],
                "filters": {
                    "batches": [row["batchName"] for row in batches],
                    "platforms": ["Instagram", "Facebook", "LinkedIn"],
                    "statuses": ["Draft", "Approved", "Posted"],
                },
            }
        )

    def _handle_post_detail(self, post_id: str) -> None:
        with get_connection(DB_PATH) as connection:
            row = connection.execute("SELECT * FROM social_posts WHERE id = ?", (post_id,)).fetchone()
        if not row:
            return self._json({"error": "Post not found"}, status=404)
        return self._json({"post": row_to_dict(row)})

    def _handle_post_update(self, path: str) -> None:
        post_id = path.rstrip("/").split("/")[-1]
        payload = self._read_json()
        errors = validate_post_payload(payload)
        if errors:
            return self._json({"errors": errors}, status=400)

        updated_at = utc_now()
        fields = [
            "batchName", "postNumber", "title", "hook", "mainPostLine", "shortCaption",
            "cta", "websiteUrl", "linkedinCaption", "instagramCaption", "facebookCaption",
            "imagePath", "platform", "status", "scheduledDate", "publishedUrl"
        ]
        values = [payload.get(field) for field in fields]
        values.extend([updated_at, post_id])

        with get_connection(DB_PATH) as connection:
            connection.execute(
                """
                UPDATE social_posts
                SET batchName = ?, postNumber = ?, title = ?, hook = ?, mainPostLine = ?, shortCaption = ?,
                    cta = ?, websiteUrl = ?, linkedinCaption = ?, instagramCaption = ?, facebookCaption = ?,
                    imagePath = ?, platform = ?, status = ?, scheduledDate = ?, publishedUrl = ?, updatedAt = ?
                WHERE id = ?
                """,
                values,
            )
            connection.commit()
            row = connection.execute("SELECT * FROM social_posts WHERE id = ?", (post_id,)).fetchone()

        return self._json({"post": row_to_dict(row) if row else None})

    def _handle_status_change(self, path: str, status: str) -> None:
        post_id = path.rstrip("/").split("/")[-2]
        updated_at = utc_now()
        with get_connection(DB_PATH) as connection:
            connection.execute("UPDATE social_posts SET status = ?, updatedAt = ? WHERE id = ?", (status, updated_at, post_id))
            connection.commit()
            row = connection.execute("SELECT * FROM social_posts WHERE id = ?", (post_id,)).fetchone()
        return self._json({"post": row_to_dict(row) if row else None})

    def _placeholder_publish(self, path: str, platform: str) -> None:
        post_id = int(path.rstrip("/").split("/")[-2])
        if platform == "instagram":
            result = post_to_instagram(post_id)
        elif platform == "facebook":
            result = post_to_facebook(post_id)
        else:
            result = post_to_linkedin(post_id)
        return self._json(result)

    def _handle_doc_parse(self) -> None:
        payload = self._read_json()
        doc_path = payload.get("path", "")
        if not doc_path:
            return self._json({"error": "Document path is required."}, status=400)

        source_path = self._resolve_doc_path(str(doc_path))
        if not source_path:
            return self._json({"error": "Document path is not allowed."}, status=403)
        if not source_path.exists():
            return self._json({"error": "Document not found."}, status=404)

        parsed = parse_docx_file(source_path, PUBLIC_IMAGE_DIR)
        return self._json(parsed)

    def _handle_doc_upload(self) -> None:
        uploaded = self._read_uploaded_file("file")
        if not uploaded:
            return self._json({"error": "No .docx file uploaded."}, status=400)

        filename, data = uploaded
        filename = Path(filename).name
        if Path(filename).suffix.lower() != ".docx":
            return self._json({"error": "Only .docx files can be imported."}, status=400)

        target = UPLOAD_DIR / self._unique_doc_filename(filename)
        with target.open("wb") as handle:
            handle.write(data)

        parsed = parse_docx_file(target, PUBLIC_IMAGE_DIR)
        return self._json({"uploadedPath": str(target), **parsed})

    def _handle_import_confirm(self) -> None:
        payload = self._read_json()
        posts = payload.get("posts", [])
        if not isinstance(posts, list) or not posts:
            return self._json({"error": "No posts were provided for import."}, status=400)

        created_at = utc_now()
        inserted_ids: list[int] = []

        with get_connection(DB_PATH) as connection:
            for post in posts:
                errors = validate_post_payload(post)
                if errors:
                    return self._json({"errors": errors, "post": post}, status=400)

                cursor = connection.execute(
                    """
                    INSERT INTO social_posts (
                        batchName, postNumber, title, hook, mainPostLine, shortCaption, cta, websiteUrl,
                        linkedinCaption, instagramCaption, facebookCaption, imagePath, platform, status,
                        scheduledDate, publishedUrl, createdAt, updatedAt
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        post.get("batchName", ""),
                        post.get("postNumber"),
                        post.get("title", ""),
                        post.get("hook", ""),
                        post.get("mainPostLine", ""),
                        post.get("shortCaption", ""),
                        post.get("cta", ""),
                        post.get("websiteUrl", ""),
                        post.get("linkedinCaption", ""),
                        post.get("instagramCaption", ""),
                        post.get("facebookCaption", ""),
                        post.get("imagePath", ""),
                        post.get("platform", ""),
                        post.get("status", "Draft"),
                        post.get("scheduledDate", ""),
                        post.get("publishedUrl", ""),
                        created_at,
                        created_at,
                    ),
                )
                inserted_ids.append(cursor.lastrowid)
            connection.commit()

            rows = connection.execute(
                f"SELECT * FROM social_posts WHERE id IN ({','.join('?' for _ in inserted_ids)}) ORDER BY id DESC",
                inserted_ids,
            ).fetchall()

        return self._json({"imported": [row_to_dict(row) for row in rows]})

    def _handle_image_upload(self) -> None:
        uploaded = self._read_uploaded_file("file")
        if not uploaded:
            return self._json({"error": "No image uploaded."}, status=400)

        filename, data = uploaded
        filename = Path(filename).name
        if Path(filename).suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
            return self._json({"error": "Only PNG, JPG, JPEG, and WEBP images are supported."}, status=400)

        safe_name = self._unique_filename(filename)
        target = PUBLIC_IMAGE_DIR / safe_name
        with target.open("wb") as handle:
            handle.write(data)

        return self._json({"image": {"name": safe_name, "path": f"/social-posts/images/{safe_name}"}})

    def _handle_logout(self) -> None:
        token = self._session_token()
        if token and token in SESSIONS:
            del SESSIONS[token]

        self.send_response(200)
        cookie = cookies.SimpleCookie()
        cookie[SESSION_COOKIE] = ""
        cookie[SESSION_COOKIE]["path"] = "/"
        cookie[SESSION_COOKIE]["max-age"] = 0
        self.send_header("Content-Type", "application/json")
        self.send_header("Set-Cookie", cookie.output(header="").strip())
        self.end_headers()
        self.wfile.write(json.dumps({"authenticated": False}).encode("utf-8"))

    def _session_token(self) -> str | None:
        raw = self.headers.get("Cookie")
        if not raw:
            return None
        parsed = cookies.SimpleCookie()
        parsed.load(raw)
        if SESSION_COOKIE not in parsed:
            return None
        return parsed[SESSION_COOKIE].value

    def _is_authenticated(self) -> bool:
        return True

    def _require_auth_for_api(self, path: str) -> bool:
        return True

    def _serve_file(self, file_path: Path) -> None:
        if not file_path.exists():
            return self._json({"error": "File not found"}, status=404)
        content = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", self.guess_type(str(file_path)))
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def _redirect(self, location: str) -> None:
        self.send_response(302)
        self.send_header("Location", location)
        self.end_headers()

    def _read_json(self) -> dict[str, object]:
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            return json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            return {}

    def _read_uploaded_file(self, field_name: str) -> tuple[str, bytes] | None:
        content_type = self.headers.get("Content-Type", "")
        if "multipart/form-data" not in content_type:
            return None

        length = int(self.headers.get("Content-Length", "0"))
        if not length:
            return None

        body = self.rfile.read(length)
        message = BytesParser(policy=default).parsebytes(
            f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n".encode("utf-8") + body
        )

        for part in message.iter_parts():
            if part.get_param("name", header="content-disposition") != field_name:
                continue

            filename = part.get_filename()
            if not filename:
                return None

            payload = part.get_payload(decode=True) or b""
            return filename, payload

        return None

    def _json(self, payload: dict[str, object], status: int = 200) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _unique_filename(self, filename: str) -> str:
        candidate = Path(filename)
        stem = candidate.stem
        suffix = candidate.suffix.lower()
        current = PUBLIC_IMAGE_DIR / candidate.name
        index = 1
        while current.exists():
            current = PUBLIC_IMAGE_DIR / f"{stem}-{index}{suffix}"
            index += 1
        return current.name

    def _unique_doc_filename(self, filename: str) -> str:
        candidate = Path(filename)
        stem = candidate.stem
        suffix = candidate.suffix.lower()
        current = UPLOAD_DIR / candidate.name
        index = 1
        while current.exists():
            current = UPLOAD_DIR / f"{stem}-{index}{suffix}"
            index += 1
        return current.name

    def _resolve_doc_path(self, path_value: str) -> Path | None:
        candidate = Path(path_value).expanduser()
        try:
            resolved = candidate.resolve(strict=False)
        except OSError:
            return None

        for allowed_root in (DOC_SOURCE_DIR, UPLOAD_DIR):
            try:
                resolved.relative_to(allowed_root.resolve())
                return resolved
            except ValueError:
                continue
        return None


def main() -> None:
    ensure_directories()
    server = ThreadingHTTPServer(("127.0.0.1", 8787), ClarpointAdminHandler)
    print("Clarpoint admin server running at http://127.0.0.1:8787")
    server.serve_forever()


if __name__ == "__main__":
    main()
