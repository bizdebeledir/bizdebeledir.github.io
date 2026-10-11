#!/usr/bin/env python3
"""Public YouTube view-statistics collector for GitHub Actions.
Stores only publicly visible video IDs/titles/counts on a separate cloud-data
branch. Reads the pre-existing GitHub Actions YOUTUBE_API_KEY secret. Does not
run Google Analytics, publish videos, read comments, or write YouTube data.
"""
import argparse
import datetime as dt
import json
import os
import pathlib
import urllib.request
import urllib.parse
import urllib.error

UTC=dt.timezone.utc
HORIZONS=(2880,10080)

def utcnow():
    return dt.datetime.now(UTC)

def stamp(t):
    return t.astimezone(UTC).isoformat(timespec="seconds").replace("+00:00","Z")

def parse_stamp(s):
    try:
        a=dt.datetime.fromisoformat(str(s).replace("Z","+00:00"))
        return a.replace(tzinfo=UTC) if a.tzinfo is None else a.astimezone(UTC)
    except (ValueError,TypeError):
        return None

def api(resource,params):
    key=os.getenv("YOUTUBE_API_KEY","").strip()
    if not key:raise RuntimeError("GITHUB_YOUTUBE_SECRET_NOT_CONFIGURED")
    url="https://www.googleapis.com/youtube/v3/"+resource+"?"+urllib.parse.urlencode({**params,"key":key})
    try:
        req=urllib.request.Request(url,headers={"Accept":"application/json","User-Agent":"ELMAR-OS-CloudStats/1.0"})
        with urllib.request.urlopen(req,timeout=25) as r:return json.load(r)
    except urllib.error.HTTPError as e:raise RuntimeError("YOUTUBE_HTTP_"+str(e.code)) from None

def select(videos,now):
    out=[]
    for video_id,v in videos.items():
        when=parse_stamp(v.get("publishedAt"))
        if not when:continue
        age=(now-when).total_seconds()/60
        if age<0:continue
        obs=v.get("observations") or []
        last=[float(x.get("ageMin") or 0) for x in obs]
        if age<=1560 or any(target<=age<=target+1440 and not any(target<=y<=target+1440 for y in last) for target in HORIZONS):
            out.append(video_id)
    return out[:90]

def run(inputs,site_videos,channel_id,fetch=api,now=None):
    now=now or utcnow()
    day=stamp(now)
    minute=day[:16]
    if not channel_id.startswith("UC") or len(channel_id)!=24:raise RuntimeError("INVALID_CHANNEL_ID")
    video_map=dict(inputs.get("videos") or {})
    for x in site_videos:
        vid=str(x.get("id") or "")
        published=x.get("publishedAt")
        if len(vid)!=11 or not parse_stamp(published):continue
        age=(now-parse_stamp(published)).total_seconds()/86400
        if 0<=age<=9:
            entry=video_map.setdefault(vid,{"title":str(x.get("title") or "")[:180],"publishedAt":published,"observations":[]})
            if not entry.get("publishedAt"):entry["publishedAt"]=published
    upload="UU"+channel_id[2:]
    feed=fetch("playlistItems",{"part":"snippet,contentDetails","playlistId":upload,"maxResults":10})
    for item in feed.get("items",[]):
        vid=str((item.get("contentDetails") or {}).get("videoId") or "")
        meta=item.get("snippet") or {}
        published=(item.get("contentDetails") or {}).get("videoPublishedAt") or meta.get("publishedAt")
        if len(vid)!=11 or not parse_stamp(published):continue
        obj=video_map.setdefault(vid,{"title":meta.get("title","")[:180],"publishedAt":published,"observations":[]})
        obj["publishedAt"]=published
        obj["title"]=str(meta.get("title") or obj.get("title") or "")[:180]
    ids=select(video_map,now)
    updated=0
    for offset in range(0,len(ids),50):
        chunk=ids[offset:offset+50]
        stats=fetch("videos",{"part":"statistics","id":",".join(chunk)})
        lookup={z.get("id"):z.get("statistics") or {} for z in stats.get("items",[])}
        for vid in chunk:
            st=lookup.get(vid)
            if not st:continue
            v=video_map[vid]
            last=v.setdefault("observations",[])
            pub=parse_stamp(v["publishedAt"])
            age=(now-pub).total_seconds()/60
            if any(x.get("at","")[:16]==minute for x in last):continue
            last.append({"at":day,"ageMin":round(age,2),
                         "views":int(st.get("viewCount") or 0),
                         "likes":int(st.get("likeCount") or 0),
                         "comments":int(st.get("commentCount") or 0)})
            if len(last)>440:del last[:-440]
            updated+=1
    # Keep old enough entries only until 7-day observation has been recorded.
    for key,v in list(video_map.items()):
        pub=parse_stamp(v.get("publishedAt"))
        if pub and (now-pub).total_seconds()>9*86400:
            del video_map[key]
    runs=(inputs.get("runs") or [])[-47:]
    if not runs or runs[-1].get("at","")[:16]!=minute:
        runs.append({"at":day,"tracked":len(ids),"updated":updated})
    return {"version":1,"source":"GitHub Actions, YouTube Data API public stats",
            "channel_id":channel_id,"last_run":day,"runs":runs,"videos":video_map}

def selftest():
    now=dt.datetime(2026,10,11,12,0,tzinfo=UTC)
    pub=stamp(now-dt.timedelta(minutes=42))
    items=[{"id":"0123456789A","publishedAt":pub,"title":"Test"}]
    def fake(r,p):
        if r=="playlistItems":return {"items":[]}
        assert r=="videos"
        return {"items":[{"id":"0123456789A","statistics":{"viewCount":"42","likeCount":"3","commentCount":"2"}}]}
    result=run({},items,"UC"+"a"*22,fake,now)
    assert len(result['videos'])==1 and result['videos']['0123456789A']['observations'][0]['views']==42
    second=run(result,items,"UC"+"a"*22,fake,now)
    assert len(second['videos']['0123456789A']['observations'])==1
    assert second['last_run']==result['last_run']
    print("CLOUD_PUBLIC_SNAPSHOT_SELFTEST_PASS 4")

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--input")
    parser.add_argument("--output")
    parser.add_argument("--selftest",action="store_true")
    args=parser.parse_args()
    if args.selftest:selftest();raise SystemExit(0)
    if not args.input or not args.output:raise SystemExit("MISSING_IO_PATH")
    state=json.loads(pathlib.Path(args.input).read_text()) if pathlib.Path(args.input).exists() else {}
    site_videos=json.loads(pathlib.Path("all-videos.json").read_text())
    config=json.loads(pathlib.Path("channel-stats.json").read_text())
    result=run(state,site_videos,str(config.get("channelId") or ""))
    path=pathlib.Path(args.output)
    path.write_text(json.dumps(result,ensure_ascii=False,separators=(",",":"))+"\n")
    print("CLOUD_PUBLIC_SNAPSHOT_OK",result["last_run"],len(result["videos"]),result["runs"][-1]["updated"])
