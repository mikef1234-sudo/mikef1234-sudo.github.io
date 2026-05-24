from __future__ import annotations


FEATURE_FLAG_MESSAGE = {
    "enabled": False,
    "message": "Coming soon. Social publishing is not enabled yet in this private dashboard."
}


def post_to_instagram(post_id: int) -> dict[str, object]:
    return {"postId": post_id, "platform": "Instagram", **FEATURE_FLAG_MESSAGE}


def post_to_facebook(post_id: int) -> dict[str, object]:
    return {"postId": post_id, "platform": "Facebook", **FEATURE_FLAG_MESSAGE}


def post_to_linkedin(post_id: int) -> dict[str, object]:
    return {"postId": post_id, "platform": "LinkedIn", **FEATURE_FLAG_MESSAGE}
