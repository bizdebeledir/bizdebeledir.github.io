#!/usr/bin/env python3
"""Link doctor: check YouTube pages and only repair deterministic canonical-ID mismatches.
Runs after update_videos.py in existing GitHub Action. Never guesses replacement videos.
"""
import argparse,hashlib,html,io,json,re,tempfile
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,parse_qs
ROOT=Path(__file__).resolve().parent
ID=re.compile(r"^[A-Za-z0-9_-]{11}$")
BASE="https://bizdebeledir.github.io"
class Links(HTMLParser):
 def __init__(self):super().__init__();self.hrefs=[];self.embeds=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=="a" and a.get("href"):self.hrefs.append(a["href"])
  if tag=="iframe" and a.get("src"):self.embeds.append(a["src"])
def vid_from_url(uri):
 try:
  x=urlsplit(html.unescape(uri))
  if x.hostname not in ("youtube.com","www.youtube.com","m.youtube.com","youtu.be","www.youtube-nocookie.com"):return None
  if x.hostname=="youtu.be":candidate=x.path.strip("/").split("/")[0]
  else:
   part=x.path.split("/")
   candidate=part[2] if len(part)>=3 and part[1] in ("shorts","embed","live") else parse_qs(x.query).get("v",[""])[0]
  return candidate if ID.fullmatch(candidate) else None
 except (ValueError,TypeError):return None
def fix_canonical(page,source,video_id):
 """Fix only iframe inside player and the id=youtube-watch button, not recommendations."""
 new=source;repairs=[]
 pattern=r'(<iframe\b[^>]*\bsrc="https://www\.youtube\.com/embed/)([A-Za-z0-9_-]{11})(")'
 def embed(m):
  if m.group(2)!=video_id:repairs.append("embed_wrong_target")
  return m.group(1)+video_id+m.group(3)
 new=re.sub(pattern,embed,new,flags=re.I)
 pattern=r'(<a\s+class="btn youtube"\s+id="youtube-watch"\s+href="https://www\.youtube\.com/shorts/)([A-Za-z0-9_-]{11})(")'
 def link(m):
  if m.group(2)!=video_id:repairs.append("watch_link_wrong_target")
  return m.group(1)+video_id+m.group(3)
 new=re.sub(pattern,link,new,flags=re.I)
 return new,repairs
def audit(root=ROOT,repair=False):
 videos=json.loads((root/"all-videos.json").read_text(encoding="utf8"))
 ids={str(x.get("id")) for x in videos if isinstance(x,dict) and ID.fullmatch(str(x.get("id") or ""))}
 if len(ids)!=len(videos) or len(ids)<10:raise RuntimeError("CATALOG_INVALID")
 missing=[];wrong=[];changed=[];unknown=[];links=0;pages=0;fixes=0
 for video_id in sorted(ids):
  page=root/"video"/(video_id+".html")
  if not page.exists():missing.append(video_id);continue
  pages+=1;source=page.read_text(encoding="utf8")
  parser=Links();parser.feed(source)
  # Only the embed frame and watch anchor should point to this video; recommended links are different.
  fixed,issues=fix_canonical(page,source,video_id)
  if issues:
   wrong.append({"video_id":video_id,"problems":issues})
   if repair:
    # Original always backed by git prior commit; also create local sibling backup for rollback.
    backup=Path(tempfile.gettempdir())/("bb345_"+video_id+"_"+hashlib.sha256(source.encode()).hexdigest()[:12]+".html.bak")
    if not backup.exists():backup.write_text(source,encoding="utf8")
    page.write_text(fixed,encoding="utf8")
    changed.append(video_id);fixes+=len(issues)
  for u in parser.hrefs:
   uid=vid_from_url(u)
   if uid:
    links+=1
    if uid not in ids:unknown.append({"page":page.name,"target":uid})
  # Confirm each canonical route exists rather than trusting metadata only.
  if 'id="youtube-watch"' not in source or 'class="player"' not in source:
   missing.append("HTML_ELEMENT_MISSING:"+video_id)
 report={"ok":not (missing or unknown or (wrong and not repair)),
  "catalog":len(ids),"checked_pages":pages,"youtube_href_count":links,
  "missing_pages":missing[:30],"unknown_targets":unknown[:30],
  "canonical_mismatches":wrong[:30],"repaired_pages":changed,"repairs":fixes,
  "external_video_availability":"not_verified_by_static_checker"}
 return report
def selftest():
 with tempfile.TemporaryDirectory() as temp:
  d=Path(temp);(d/"video").mkdir()
  (d/"all-videos.json").write_text(json.dumps([{"id":"ABCDEFGHIJK"}]*10))
  # Fixture uses a distinct ID set to validate mapping.
  sample='<div class="player"><iframe src="https://www.youtube.com/embed/ZZZZZZZZZZZ"></iframe></div><a class="btn youtube" id="youtube-watch" href="https://www.youtube.com/shorts/ZZZZZZZZZZZ">İzlə</a>'
  output,issues=fix_canonical(d/"video/ABCDEFGHIJK.html",sample,"ABCDEFGHIJK")
  assert len(issues)==2 and "embed/ABCDEFGHIJK" in output and "shorts/ABCDEFGHIJK" in output
  assert vid_from_url("https://www.youtube.com/shorts/ABCDEFGHIJK")=="ABCDEFGHIJK"
  assert vid_from_url("https://www.youtube.com/shorts/ABC") is None
  print("SELFTEST_PASS")
if __name__=="__main__":
 p=argparse.ArgumentParser();p.add_argument("--repair",action="store_true");p.add_argument("--selftest",action="store_true")
 args=p.parse_args()
 if args.selftest:selftest()
 else:
  r=audit(repair=args.repair)
  print(json.dumps(r,ensure_ascii=False))
  if not r["ok"]:raise SystemExit(2)
