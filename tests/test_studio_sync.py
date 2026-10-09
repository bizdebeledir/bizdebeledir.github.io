#!/usr/bin/env python3
"""Offline YouTube API mock for 81 / 123 videos and 12 topic portals."""
from __future__ import annotations
import json
import os
from pathlib import Path
import runpy
import shutil
import sys
import tempfile
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
BACKEND=urllib.request.urlopen

class FakeResponse:
    def __init__(self,payload):self.body=json.dumps(payload).encode()
    def __enter__(self):return self
    def __exit__(self,*args):return False
    def read(self):return self.body

def scenario(n):
    ids=["MOCK%07d"%i for i in range(n)]
    def fake(req,timeout=None):
        url=urllib.parse.urlsplit(req.full_url)
        query=urllib.parse.parse_qs(url.query)
        op=url.path.rsplit("/",1)[-1]
        if op=="channels":
            return FakeResponse({"items":[{
                "id":"UCFAKE",
                "snippet":{"title":"Local mock"},
                "statistics":{"subscriberCount":"1000","viewCount":"200000","videoCount":str(n)},
                "contentDetails":{"relatedPlaylists":{"uploads":"UUFAKE"}}
            }]})
        if op=="playlistItems":
            start=int(query.get("pageToken",["0"])[0])
            batch=ids[start:start+50]
            result={"items":[{"contentDetails":{"videoId":v}} for v in batch]}
            if start+50<n:result["nextPageToken"]=str(start+50)
            return FakeResponse(result)
        if op=="videos":
            return FakeResponse({"items":[{
                "id":id,
                "snippet":{"title":"Telefon bildirişi gəlmir, yenə gözləyirəm 😂 #Shorts",
                    "description":"Məişətdə tanış telefon hadisəsi.",
                    "publishedAt":"2026-10-09T09:00:00Z"},
                "statistics":{"viewCount":"123"},
                "contentDetails":{"duration":"PT11S"}
            } for id in query["id"][0].split(",")]})
        raise RuntimeError("MOCK_ONLY_YOUTUBE_API "+op)
    with tempfile.TemporaryDirectory(prefix="studio_sync_test_") as tmp:
        work=Path(tmp)
        for p in ROOT.iterdir():
            if p.is_file() and p.suffix in (".html",".json",".xml",".css",".js",
                                           ".webp",".png",".svg",".webmanifest",".txt"):
                shutil.copy2(p,work/p.name)
        shutil.copytree(ROOT/"video",work/"video")
        shutil.copytree(ROOT/"movzu",work/"movzu")
        (work/"video"/"PRESERVE_PAGE.html").write_text("DO_NOT_DELETE")
        env=os.environ.get("YOUTUBE_API_KEY")
        old=Path.cwd()
        try:
            os.chdir(work)
            os.environ["YOUTUBE_API_KEY"]="OFFLINE_MOCK_ONLY"
            urllib.request.urlopen=fake
            runpy.run_path(str(ROOT/"update_videos.py"),run_name="__main__")
        finally:
            os.chdir(old)
            urllib.request.urlopen=BACKEND
            if env is None:os.environ.pop("YOUTUBE_API_KEY",None)
            else:os.environ["YOUTUBE_API_KEY"]=env
        videos=json.loads((work/"all-videos.json").read_text())
        assert len(videos)==n
        assert len(json.loads((work/"channel-stats.json").read_text())["cityGames"]["ids"])==8
        assert (work/"video"/"PRESERVE_PAGE.html").read_text()=="DO_NOT_DELETE"
        assert (work/"movzu/qonaq.html").is_file()
        assert (work/"yumor-studiyasi.html").is_file()
        video=(work/"video"/(ids[0]+".html")).read_text()
        assert "BreadcrumbList" in video
        assert 'src="/city-metrics.js"' in video
        sitemap=ET.parse(work/"sitemap.xml")
        locs=[x.text for x in sitemap.iter() if x.tag.endswith("}loc")]
        assert len(locs)==n+23,(len(locs),n)
        assert "https://bizdebeledir.github.io/yumor-studiyasi.html" in locs
        assert "https://bizdebeledir.github.io/movzu/qonaq.html" in locs
        from site_doctor import audit
        assert not audit(work),audit(work)
        print("STUDIO_FULL_SYNC_MOCK_OK",n,"videos","sitemap_urls",len(locs),
              "portal_links_preserved","video_metrics_present")

if __name__=="__main__":
    scenario(81)
    scenario(123)
    print("STUDIO_FUTURE_VIDEO_SYNC_NO_REGRESSIONS")
