#!/usr/bin/env python3
"""Offline Google readiness audit for Bizdə Belədir.

No OAuth tokens, outbound requests, settings changes, quotas or cookies.
Validates public sitemap, robots, GA4 instrumentation, canonicals,
JSON-LD VideoObjects and 12 topic articles using only repository files.
This is NOT a Google indexing verdict and cannot prove GA4 receives events.
"""
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
BASE_URL = "https://bizdebeledir.github.io/"
PUBLIC_PAGES = (
    "index.html", "shorts.html", "videos.html", "favorites.html",
    "trending.html", "ideas.html", "yumor-dnt.html", "yumor-parki.html",
    "gulus-seheri.html", "yumor-studiyasi.html", "movzular.html",
)
EXPECTED_STANDARD_PAGES = 11  # excludes 12 topic + video pages
VIDEO_ID = re.compile(r"^[A-Za-z0-9_-]{11}$")
GA_ID = re.compile(r"\bG-[A-Z0-9]{6,16}\b")
NOINDEX = re.compile(
    r'<meta\b[^>]*\bname\s*=\s*["\']robots["\'][^>]*\bcontent\s*=\s*'
    r'["\'][^"\']*\bnoindex\b', re.I
)

class HeadReader(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.canonicals = []
        self.gtag_scripts = []
        self.noindex = False
        self.headers = []
        self.objects = []
        self._jsonld = False
        self._jsonld_pieces = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "link" and a.get("rel", "").lower() == "canonical":
            self.canonicals.append(a.get("href", ""))
        if tag == "script":
            src = a.get("src", "")
            if "googletagmanager.com/gtag/js" in src:
                self.gtag_scripts.append(src)
            if a.get("type") == "application/ld+json":
                self._jsonld = True
                self._jsonld_pieces = []
        if tag == "meta" and a.get("name", "").lower() == "robots":
            self.noindex = self.noindex or "noindex" in a.get("content", "").lower()
        if tag in ("h1", "title"):
            self.headers.append(tag)

    def handle_data(self, data):
        if self._jsonld:
            self._jsonld_pieces.append(data)

    def handle_endtag(self, tag):
        if tag == "script" and self._jsonld:
            self._jsonld = False
            raw = "".join(self._jsonld_pieces)
            try:
                self.objects.append(json.loads(raw))
            except ValueError:
                self.objects.append(None)


def audit(root=ROOT):
    base = Path(root)
    errors = []
    reports = {"htmlChecked": 0, "videoObjects": 0, "topicPages": 0,
               "sitemapUrls": 0, "analyticsId": None}

    try:
        videos = json.loads((base / "all-videos.json").read_text(encoding="utf-8"))
        topics = json.loads((base / "studio-topics.json").read_text(encoding="utf-8"))
        sitemap = ET.parse(base / "sitemap.xml")
    except (OSError, ValueError, ET.ParseError) as exc:
        return ["GOOGLE_INPUT_INVALID: " + type(exc).__name__], reports

    if not isinstance(videos, list) or not isinstance(topics, list):
        return ["GOOGLE_INPUT_STRUCTURE_INVALID"], reports

    if len(topics) != 12:
        errors.append("GOOGLE_TOPIC_COUNT_NOT_12")

    topic_paths = ["movzu/" + t.get("slug", "") + ".html"
                   for t in topics if isinstance(t, dict)]
    video_paths = ["video/" + v.get("id", "") + ".html"
                   for v in videos if isinstance(v, dict)]

    expected = [
        "index.html", *PUBLIC_PAGES[1:], *topic_paths, *video_paths
    ]
    expected_urls = {
        BASE_URL if name == "index.html" else BASE_URL + name
        for name in expected
    }
    xml_urls = [(e.text or "").strip() for e in sitemap.iter()
                if e.tag.endswith("}loc")]
    reports["sitemapUrls"] = len(xml_urls)

    if len(xml_urls) != len(set(xml_urls)):
        errors.append("GOOGLE_SITEMAP_DUPLICATES")
    if set(xml_urls) != expected_urls:
        missing = expected_urls - set(xml_urls)
        extra = set(xml_urls) - expected_urls
        errors.extend("GOOGLE_SITEMAP_MISSING: " + x for x in sorted(missing)[:8])
        errors.extend("GOOGLE_SITEMAP_EXTRA: " + x for x in sorted(extra)[:8])

    try:
        robots = (base / "robots.txt").read_text(encoding="utf-8")
        if "Sitemap: " + BASE_URL + "sitemap.xml" not in robots:
            errors.append("GOOGLE_ROBOTS_NO_SITEMAP")
        if re.search(r"(?im)^\s*Disallow:\s*/\s*$", robots):
            errors.append("GOOGLE_ROBOTS_SITE_BLOCKED")
    except OSError:
        errors.append("GOOGLE_ROBOTS_MISSING")

    seen_ga = {}
    known_ids = {v["id"] for v in videos
                 if isinstance(v, dict) and VIDEO_ID.fullmatch(str(v.get("id", "")))}
    for relative in expected:
        file = (base / relative).resolve()
        if base.resolve() not in file.parents:
            errors.append("GOOGLE_PATH_TRAVERSAL: " + relative)
            continue
        if not file.is_file():
            errors.append("GOOGLE_HTML_MISSING: " + relative)
            continue
        try:
            content = file.read_text(encoding="utf-8")
            reader = HeadReader()
            reader.feed(content)
        except (UnicodeError, ValueError):
            errors.append("GOOGLE_HTML_UNPARSEABLE: " + relative)
            continue

        reports["htmlChecked"] += 1
        url = BASE_URL if relative == "index.html" else BASE_URL + relative
        if reader.canonicals != [url]:
            errors.append("GOOGLE_CANONICAL_MISMATCH: " + relative)
        if reader.noindex or NOINDEX.search(content[:2000]):
            errors.append("GOOGLE_NOINDEX_IN_SITEMAP: " + relative)
        if len(reader.gtag_scripts) != 1:
            errors.append("GOOGLE_GTAG_MISSING_OR_DUPLICATE: " + relative)
        tag_match = GA_ID.findall(reader.gtag_scripts[0]) if reader.gtag_scripts else []
        if len(tag_match) != 1:
            errors.append("GOOGLE_GTAG_ID_INVALID: " + relative)
        else:
            seen_ga.setdefault(tag_match[0], []).append(relative)
        if not re.search(r"\bgtag\(\s*[\"']config[\"']\s*,\s*[\"']G-[A-Z0-9]+", content):
            errors.append("GOOGLE_GTAG_CONFIG_MISSING: " + relative)
        if relative.startswith("video/"):
            video_id = Path(relative).stem
            objs = [o for o in reader.objects if isinstance(o, dict)
                    and o.get("@type") == "VideoObject"]
            if len(objs) != 1:
                errors.append("GOOGLE_VIDEO_OBJECT_MISSING: " + relative)
                continue
            obj = objs[0]
            reports["videoObjects"] += 1
            if obj.get("url") != url:
                errors.append("GOOGLE_VIDEO_SCHEMA_URL_BAD: " + relative)
            if obj.get("embedUrl") != "https://www.youtube.com/embed/" + video_id:
                errors.append("GOOGLE_VIDEO_SCHEMA_EMBED_BAD: " + relative)
            thumbnails = obj.get("thumbnailUrl", [])
            if not isinstance(thumbnails, list) or not thumbnails or not any(
                isinstance(x, str) and "/vi/" + video_id + "/" in x
                for x in thumbnails
            ):
                errors.append("GOOGLE_VIDEO_THUMBNAIL_BAD: " + relative)
            if not isinstance(obj.get("name"), str) or not obj["name"].strip():
                errors.append("GOOGLE_VIDEO_SCHEMA_NAME_MISSING: " + relative)
            if not isinstance(obj.get("uploadDate"), str) or not obj["uploadDate"]:
                errors.append("GOOGLE_VIDEO_DATE_MISSING: " + relative)
        if relative.startswith("movzu/"):
            reports["topicPages"] += 1
            if "<h1>" not in content or len(content) < 3000:
                errors.append("GOOGLE_TOPIC_PAGE_EMPTY: " + relative)

    if len(seen_ga) != 1:
        errors.append("GOOGLE_MIXED_ANALYTICS_IDS: " + ",".join(sorted(seen_ga)))
    else:
        reports["analyticsId"] = next(iter(seen_ga))

    if len(known_ids) != len(videos):
        errors.append("GOOGLE_VIDEO_IDS_INCONSISTENT")

    # The sitemap may be technically correct but this does not prove Google
    # has fetched or indexed any pages, nor that GA4 account is connected.
    return errors, reports


if __name__ == "__main__":
    errors, result = audit()
    if errors:
        print("GOOGLE_SEO_DOCTOR_FAILED", len(errors))
        for issue in errors[:40]:
            print("ERROR", issue)
        raise SystemExit(1)
    print("GOOGLE_SEO_DOCTOR_OK", json.dumps(result, ensure_ascii=False))
