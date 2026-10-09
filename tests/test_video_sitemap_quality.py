#!/usr/bin/env python3
"""Video sitemap concise metadata tests: no invented content, no hashtags or boilerplate."""
from __future__ import annotations
from pathlib import Path
import json
import sys
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from video_sitemap_quality import clean_video_text

def run():
    videos=json.loads((ROOT/"all-videos.json").read_text(encoding="utf-8"))
    assert len(videos)>=80
    samples=[
        {"title":"Bildiriş yoxdu, yenə ekranı yoxlayırsan 😂#BizdəBelədir #Telefon",
         "description":"Bildiriş yoxdu, yenə ekranı yoxlayırsan 😂\n\n#BizdəBelədir #Telefon\n\nAzərbaycanda hamının yaşadığı tanış səhnələr, gülməli memlər"},
        {"title":"Marşrutda düşən var deyəndə 😂 #Shorts",
         "description":"Sürücüyə düşəcəyini deməyə utanan sərnişin.\n\nYeni videolara abunə ol"},
        {"title":"Qonşu ilə söhbət", "description":""},
    ]
    t,d=clean_video_text(samples[0])
    assert t=="Bildiriş yoxdu, yenə ekranı yoxlayırsan 😂"
    assert d.endswith(".") and "#" not in d
    assert "Azərbaycanda hamının yaşadığı" not in d
    t,d=clean_video_text(samples[1])
    assert t=="Marşrutda düşən var deyəndə 😂" and "sərnişin" in d
    t,d=clean_video_text(samples[2])
    assert "Azərbaycan" in d
    titles=[clean_video_text(x)[0] for x in videos]
    descriptions=[clean_video_text(x)[1] for x in videos]
    assert all(len(x)<=110 and "#" not in x for x in titles)
    assert all(len(x)<=221 and "#" not in x for x in descriptions)
    root=ET.parse(ROOT/"sitemap.xml").getroot()
    NS={"s":"http://www.sitemaps.org/schemas/sitemap/0.9",
        "v":"http://www.google.com/schemas/sitemap-video/1.1"}
    collected={}
    for item in root.findall("s:url",NS):
        loc=item.find("s:loc",NS)
        obj=item.find("v:video",NS)
        if loc is None or obj is None:continue
        vid=loc.text.rsplit("/",1)[-1].removesuffix(".html")
        title=obj.find("v:title",NS)
        desc=obj.find("v:description",NS)
        assert title is not None and desc is not None
        collected[vid]=(title.text,desc.text)
    assert len(collected)==len(videos)
    for item in videos:
        assert collected[item["id"]]==clean_video_text(item),(item["id"],collected[item["id"]])
    print("VIDEO_SITEMAP_81_REAL_PAGES_METADATA_PASS",len(collected))

if __name__=="__main__":
    run()
