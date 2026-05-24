# Clarpoint Social Dashboard

Private local admin workflow for importing social posts from Word documents and managing copy-ready content inside the existing Clarpoint website codebase.

## Routes

- `/admin/login`
- `/admin/social`
- `/admin/social/import`
- `/admin/social/editor?id=<postId>`

## Source documents

The importer is configured to read `.docx` files from:

`/Users/miferrar/Downloads/website-marketing-posts/marketing`

You can also upload a new `.docx` file directly from the import page.

## Imported image storage

Embedded or replacement images are stored locally in:

`/Users/miferrar/Downloads/mikef1234-sudo.github.io/public/social-posts/images`

Imported posts store the web path version, for example:

`/social-posts/images/clarpoint-social-post-copy-batch-2-with-images-01.png`

## Local database

Imported posts are saved to:

`/Users/miferrar/Downloads/mikef1234-sudo.github.io/admin/social/data/social.db`

## Running the local admin server

From the project root:

```bash
CLARPOINT_ADMIN_PASSWORD="choose-a-password" python3 admin/social/server.py
```

Then open:

`http://127.0.0.1:8787/admin/social`

If you want to use the bundled Codex runtime Python instead of the system Python:

```bash
CLARPOINT_ADMIN_PASSWORD="choose-a-password" /Users/miferrar/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 admin/social/server.py
```

## Current workflow

1. Open `/admin/social/import`
2. Parse a document from the local source folder or upload a new `.docx`
3. Review extracted posts and confirm image assignments
4. Import selected posts into the library
5. Edit, preview, copy, approve, or mark posts as posted from `/admin/social`

## Notes

- `Clarpoint_Social_Post_Copy_Batch_2_With_Images.docx` includes embedded images and should auto-map cleanly.
- `Clarpoint_Social_Post_Copy_Batch_1.docx` imports text only, so images need to be assigned manually before saving.
- Placeholder publish endpoints exist for Instagram, Facebook, and LinkedIn, but they are intentionally disabled for live publishing right now.
