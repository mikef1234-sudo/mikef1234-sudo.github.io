from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any


SCHEMA = """
CREATE TABLE IF NOT EXISTS social_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batchName TEXT NOT NULL,
    postNumber INTEGER,
    title TEXT,
    hook TEXT,
    mainPostLine TEXT,
    shortCaption TEXT,
    cta TEXT,
    websiteUrl TEXT,
    linkedinCaption TEXT,
    instagramCaption TEXT,
    facebookCaption TEXT,
    imagePath TEXT,
    platform TEXT,
    status TEXT NOT NULL DEFAULT 'Draft',
    scheduledDate TEXT,
    publishedUrl TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);
"""


def ensure_database(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path) as connection:
        connection.execute(SCHEMA)
        connection.commit()


def get_connection(path: Path) -> sqlite3.Connection:
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    return connection


def row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {key: row[key] for key in row.keys()}
