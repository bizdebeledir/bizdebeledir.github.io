"""Offline Site Doctor. Never modifies project files. Exit nonzero on real errors."""
from __future__ import annotations
import json
from html.parser import HTMLParser
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parent

class HTMLAudit(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids=set()
        self.duplicate=[]
        self.assets=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        val=a.get("id")
        if val:
            if val in self.ids:self.duplicate.append(val)
            self.ids.add(val)
        if tag in ("script","link"):
            key="src" if tag=="script" else "href"
            uri=a.get(key,"")
            if uri.endswith((".js",".css")) and not uri.startswith(("http:", "https:","//")):
                self.assets.append(uri)

def audit(root=ROOT):
    base=Path(root)
    errors=[]
    try:
        videos=json.loads((base/"all-videos.json").read_text(encoding="utf-8"))
        channel=json.loads((base/"channel-stats.json").read_text(encoding="utf-8"))
        assert isinstance(videos,list) and videos and isinstance(channel,dict)
    except Exception as exc:
        return ["DATA_INVALID: "+type(exc).__name__]
    ids=[v.get("id") for v in videos if isinstance(v,dict)]
    if len(set(ids))!=len(videos):errors.append("DUPLICATE_VIDEO_IDS")
    try:
        sitemap=ET.parse(base/"sitemap.xml")
        locs=[(x.text or "") for x in sitemap.iter() if x.tag.endswith("}loc")]
        for page in ["https://bizdebeledir.github.io/","https://bizdebeledir.github.io/shorts.html"]:
            if page not in locs:errors.append("MISSING_SITEMAP: "+page)
    except Exception as exc:
        errors.append("SITEMAP_INVALID: "+str(exc)[:90])
        locs=[]
    for video in videos:
        vid=video.get("id","")
        if not isinstance(vid,str) or len(vid)!=11:
            errors.append("INVALID_VIDEO_ID");continue
        p=base/"video"/(vid+".html")
        if not p.is_file():
            errors.append("MISSING_VIDEO_PAGE "+vid);continue
        if "https://bizdebeledir.github.io/video/"+vid+".html" not in locs:
            errors.append("MISSING_SITEMAP_VIDEO "+vid)
    for name in ("index.html","videos.html","shorts.html","favorites.html",
                 "ideas.html","privacy.html","trending.html","yumor-dnt.html","yumor-parki.html"):
        f=base/name
        if not f.is_file():
            errors.append("PAGE_MISSING "+name);continue
        parser=HTMLAudit()
        try:parser.feed(f.read_text(encoding="utf-8"))
        except Exception:errors.append("PAGE_NOT_PARSEABLE "+name);continue
        if parser.duplicate:errors.append("DUPLICATE_HTML_IDS "+name)
        for asset in parser.assets:
            path=(base/asset.lstrip("/")).resolve()
            if base.resolve() not in path.parents or not path.is_file():
                errors.append("MISSING_ASSET "+name+" "+asset)
    sync=channel.get("sync")
    if sync and sync.get("publicListedVideos") !=len(videos):
        errors.append("SYNC_COUNT_INCONSISTENCY")
    return errors

if __name__=="__main__":
    failures=audit()
    if failures:
        print("SITE_DOCTOR_FAILED",len(failures))
        for e in failures[:40]:print("ERROR:",e)
        raise SystemExit(1)
    print("SITE_DOCTOR_OK")
