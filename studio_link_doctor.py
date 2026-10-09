#!/usr/bin/env python3
"""Read-only link/SEO doctor for Bingo studio and 12 topic pages. No network calls."""
from __future__ import annotations
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json,re
import xml.etree.ElementTree as ET
from typing import Iterable

ROOT=Path(__file__).resolve().parent
SITE="https://bizdebeledir.github.io"
class Links(HTMLParser):
 def __init__(self):
  super().__init__();self.hrefs=[];self.assets=[];self.title_count=0;self.h1_count=0
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=="a" and "href" in a:self.hrefs.append(a["href"])
  if tag in ("script","link"):
   candidate=a.get("src",a.get("href",""))
   if candidate.endswith((".js",".css")):self.assets.append(candidate)
  if tag=="title":self.title_count+=1
  if tag=="h1":self.h1_count+=1

def audit(root=ROOT):
 base=Path(root);errors=[]
 try:
  videos=json.loads((base/"all-videos.json").read_text(encoding="utf-8"))
  topics=json.loads((base/"studio-topics.json").read_text(encoding="utf-8"))
  sitemap=ET.parse(base/"sitemap.xml")
  urls={(e.text or "") for e in sitemap.iter() if e.tag.endswith("}loc")}
 except (OSError,ValueError,ET.ParseError) as exc:
  return ["STUDIO_DATA_MISSING:"+type(exc).__name__]
 if len(topics)!=12:errors.append("STUDIO_TOPIC_COUNT_NOT_12")
 slugs=[t.get("slug") for t in topics]
 if len(set(slugs))!=12:errors.append("STUDIO_DUPLICATE_TOPIC_SLUG")
 pages=["yumor-studiyasi.html","movzular.html"]+["movzu/"+str(s)+".html" for s in slugs]
 for rel in pages:
  file=base/rel
  if not file.is_file():
   errors.append("STUDIO_PAGE_MISSING "+rel);continue
  text=file.read_text(encoding="utf-8")
  parsed=Links()
  try:parsed.feed(text)
  except Exception:errors.append("STUDIO_HTML_INVALID "+rel);continue
  if parsed.title_count!=1 or parsed.h1_count!=1:
   errors.append("STUDIO_HEADING_INVALID "+rel)
  uri=SITE+"/"+rel
  if uri not in urls:errors.append("STUDIO_SITEMAP_MISSING "+rel)
  if '<link rel="canonical" href="'+uri+'"' not in text:
   errors.append("STUDIO_CANONICAL_MISSING "+rel)
  if rel.startswith("movzu/") and len(text)<3500:
   errors.append("STUDIO_THIN_EDITORIAL "+rel)
  for address in parsed.hrefs+parsed.assets:
   if not address or address.startswith(("#","mailto:","tel:","javascript:")):continue
   u=urlsplit(address)
   if u.scheme not in ("","http","https"):continue
   if u.netloc and u.netloc not in ("bizdebeledir.github.io","www.bizdebeledir.github.io"):continue
   path=unquote(u.path)
   if not path:continue
   if path=="/":relpath=Path("index.html")
   elif path.startswith("/"):relpath=Path(path.lstrip("/"))
   else:relpath=Path(rel).parent/Path(path)
   normalized=(base/relpath).resolve()
   if base.resolve() not in normalized.parents:
    errors.append("STUDIO_URL_TRAVERSAL "+rel);continue
   if normalized.is_file():continue
   if path.startswith("/video/") and normalized.name.endswith(".html"):
    errors.append("STUDIO_VIDEO_LINK_BROKEN "+str(normalized.name));continue
   errors.append("STUDIO_LOCAL_LINK_MISSING "+rel+" → "+path)
 ids={x["id"] for x in videos if isinstance(x,dict) and x.get("id")}
 for t in topics:
  if not isinstance(t.get("prompts"),list) or len(t["prompts"])<2:errors.append("STUDIO_TOPIC_PROMPTS")
  if len(str(t.get("insight","")))<90:errors.append("STUDIO_TOPIC_TEXT_TOO_SHORT")
 if len(ids)!=len(videos):errors.append("STUDIO_VIDEO_DUPLICATE_IDS")
 if len(videos)>0 and len(urls)!=len(videos)+23:
  errors.append("STUDIO_SITEMAP_SIZE "+str(len(urls)))
 return errors

if __name__=="__main__":
 errors=audit()
 if errors:
  print("STUDIO_LINK_DOCTOR_FAILED",len(errors))
  for i in errors[:45]:print("ERROR",i)
  raise SystemExit(1)
 print("STUDIO_LINK_DOCTOR_OK 12 portals, 2 feature pages, canonical, links, sitemap")
