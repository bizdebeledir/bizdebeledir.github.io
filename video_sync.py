"""YouTube -> GitHub safe sync metadata and honest 24-hour trend history.

All counts are from YouTube API observations, never estimated.
No existing video page is removed. Snapshots stored inside channel-stats.json
because the existing GitHub Actions workflow already commits that file.
"""
from __future__ import annotations
import json
from datetime import datetime, timezone
from pathlib import Path

def prepare(videos: list[dict], channel: dict, root=".") -> dict:
    root=Path(root)
    previous={}
    p=root/"channel-stats.json"
    try:
        data=json.loads(p.read_text(encoding="utf-8"))
        if isinstance(data,dict):
            previous=data
    except (FileNotFoundError,ValueError,UnicodeError):
        pass
    old_count=0
    try:
        old_videos=json.loads((root/"all-videos.json").read_text(encoding="utf-8"))
        if isinstance(old_videos,list):old_count=len(old_videos)
    except (FileNotFoundError,ValueError,UnicodeError):
        pass
    seen=set()
    for video in videos:
        if not isinstance(video,dict):raise ValueError("VIDEO_FORMAT_INVALID")
        vid=video.get("id")
        if not isinstance(vid,str) or len(vid)!=11:raise ValueError("VIDEO_ID_INVALID")
        if vid in seen:raise ValueError("DUPLICATE_VIDEO_ID")
        seen.add(vid)
        if not isinstance(video.get("views"),int) or video["views"]<0:
            raise ValueError("VIDEO_VIEWS_INVALID")
    if old_count>=20 and len(videos)<int(old_count*.7):
        raise RuntimeError("ABORT: public video list unexpectedly shrank; prior data preserved")
    now=int(datetime.now(timezone.utc).timestamp())
    history=previous.get("videoSnapshots") or []
    if not isinstance(history,list):history=[]
    valid=[]
    for snap in history:
        if not isinstance(snap,dict):continue
        at=snap.get("at")
        views=snap.get("views")
        if isinstance(at,int) and isinstance(views,dict) and 0<now-at<=4*86400:
            valid.append({"at":at,"views":views})
    valid.sort(key=lambda x:x["at"])
    baseline_candidates=[s for s in valid if 18*3600<=now-s["at"]<=30*3600]
    baseline=min(baseline_candidates,key=lambda s:abs((now-s["at"])-86400)) if baseline_candidates else None
    deltas=[]
    if baseline:
        for v in videos:
            old=baseline["views"].get(v["id"])
            if isinstance(old,int) and v["views"]>=old:
                deltas.append({"id":v["id"],"delta":v["views"]-old})
        deltas.sort(key=lambda x:x["delta"],reverse=True)
    snapshot={"at":now,"views":{v["id"]:v["views"] for v in videos}}
    valid=[s for s in valid if s["at"]!=now]
    valid.append(snapshot)
    channel["videoSnapshots"]=valid[-20:]
    trend_ready=baseline is not None and len(deltas)>0
    channel["trends"]={
        "available":trend_ready,
        "method":"YouTube Data API view count differences",
        "observedAt":now,
        "baselineAt":baseline["at"] if trend_ready else None,
        "windowHours":round((now-baseline["at"])/3600,2) if trend_ready else None,
        "videos":deltas[:25] if trend_ready else [],
        "note":("Observed view changes, not realtime analytics" if trend_ready else
                "A prior snapshot 18-30 hours old is required; no 24-hour result yet")
    }
    reported=channel.get("videos")
    channel["sync"]={
        "observedAt":now,
        "publicListedVideos":len(videos),
        "channelReportedVideos":int(reported) if isinstance(reported,int) else None,
        "previousListedVideos":old_count,
        "status":"difference" if isinstance(reported,int) and len(videos)!=reported else "ok",
        "note":"Channel videoCount may differ from public uploads (private or unlisted videos).",
    }
    return channel
