"""Stable weekly fixtures using the public YouTube upload list, no fake statistics."""
from __future__ import annotations
from datetime import datetime
from zoneinfo import ZoneInfo

def week_id(now=None):
    date=(now or datetime.now(ZoneInfo("Asia/Baku"))).date()
    c=date.isocalendar()
    return f"{c.year}W{c.week:02d}"

def fnv32(text):
    h=2166136261
    for char in str(text):
        h=((h ^ ord(char))*16777619)&0xffffffff
    return h

def prepare(videos,channel,previous=None,now=None):
    week=week_id(now)
    if previous is None:
        try:
            import json
            from pathlib import Path
            previous=json.loads(Path("channel-stats.json").read_text(encoding="utf-8"))
        except (FileNotFoundError,UnicodeError,ValueError):
            previous={}
    old=previous if isinstance(previous,dict) else {}
    ids={v.get("id") for v in videos if isinstance(v,dict)}
    existing=old.get("cityGames") or channel.get("cityGames")
    if (isinstance(existing,dict) and existing.get("week")==week
      and isinstance(existing.get("ids"),list) and len(existing["ids"])==8
      and len(set(existing["ids"]))==8
      and all(i in ids for i in existing["ids"])):
        channel["cityGames"]={"week":week,"ids":existing["ids"],"source":"YouTube public upload list"}
        return channel
    shortlist=[v for v in videos if v.get("duration") in ("PT10S","PT11S","PT12S","PT13S")]
    if len(shortlist)<8:shortlist=videos
    unique={v["id"]:v for v in shortlist if isinstance(v,dict) and isinstance(v.get("id"),str)}
    chosen=sorted(unique,key=lambda key:fnv32(week+":"+key))[:8]
    if len(chosen)!=8:raise RuntimeError("CITY_FIXTURE_NEEDS_EIGHT_REAL_VIDEOS")
    channel["cityGames"]={"week":week,"ids":chosen,"source":"YouTube public upload list"}
    return channel
