"""Deterministic, honest and concise video sitemap metadata.

Uses the title and opening actual description only. Does not invent dialogue,
video content, ratings, views or dates. Google video sitemap stays URL-specific.
"""
from __future__ import annotations

import re

TAG = re.compile(r"\s*#[^\s#]+")
WHITESPACE = re.compile(r"\s+")

def clean_video_text(video):
    original = str(video.get("title") or "Bizdə Belədir").strip()
    title = WHITESPACE.sub(" ", original.split("#", 1)[0]).strip(" .·–-")
    title = title[:110].strip() or "Bizdə Belədir videosu"
    raw = str(video.get("description") or "")
    candidates = []
    for paragraph in raw.splitlines():
        text = WHITESPACE.sub(" ", TAG.sub("", paragraph)).strip(" .·–-")
        if not text or text.lower().startswith(("abunə ol", "subscribe", "youtube:")):
            if candidates:
                break
            continue
        # Stop at generic channel boilerplate and hashtags, not actual scene.
        if paragraph.lstrip().startswith("#") or "Azərbaycanda hamının yaşadığı tanış səhnələr" in text:
            break
        if "Bunu özünü tanıyan dostuna" in text or "Şərhlərdə yaz" in text:
            break
        candidates.append(text)
        if len(candidates) == 2:
            break
    opening = WHITESPACE.sub(" ", " ".join(candidates)).strip()
    if opening and opening.casefold() != title.casefold() and not opening.casefold().startswith(title.casefold()):
        description = title + ". " + opening
    else:
        description = title + ". Azərbaycan gündəlik məişət yumoru."
    return title, description[:220].rstrip(" ,.;") + "."
