"""Idempotent SEO enhancements for generated real YouTube video watch pages."""
from __future__ import annotations
import html
import json
import re
from functools import lru_cache
from pathlib import Path

SITE="https://bizdebeledir.github.io"

def _words(value):
    mapping = {"ə":"e","ğ":"g","ı":"i","ö":"o","ş":"s","ç":"c","ü":"u"}
    folded = "".join(mapping.get(ch, ch) for ch in str(value or "").lower())
    return re.findall(r"[a-z0-9]+", folded)


@lru_cache(maxsize=1)
def _topics():
    try:
        data=json.loads(Path(__file__).with_name("studio-topics.json").read_text("utf-8"))
        return data if isinstance(data,list) else []
    except (OSError,ValueError):
        return []


def _topic_link(video):
    words=_words(str(video.get("title","")).split("#",1)[0])
    sentence=" "+" ".join(words)+" "
    best=None
    best_score=0
    for topic in _topics():
        if not isinstance(topic,dict):
            continue
        slug=topic.get("slug","")
        if not isinstance(slug,str) or not re.fullmatch(r"[a-z]{2,15}",slug):
            continue
        score=0
        for term in topic.get("terms",[]):
            pieces=_words(term)
            if not pieces:
                continue
            normalized=" ".join(pieces)
            if " "+normalized+" " in sentence:
                score+=2
            elif len(pieces)==1 and len(pieces[0])>=4 and any(
                word.startswith(pieces[0]) for word in words
            ):
                score+=1
        if score>best_score:
            best_score=score
            best=(slug,str(topic.get("label") or "Mövzu"))
    if best is None:
        return "/movzular.html","Bütün yumor mövzuları"
    return "/movzu/"+best[0]+".html",best[1]


def enhance(source,video):
    if not isinstance(video,dict) or not video.get("id"):return source
    clean=str(video.get("title","")).split("#")[0].strip()[:105] or "Bizdə Belədir videosu"
    natural=(clean+". Azərbaycan gündəlik həyat yumoru. Bu qısa səhnəyə bax, bəyəndiyin videoları kəşf et.")[:175]
    escaped=html.escape(natural,quote=True)
    for property,value in (("name","description"),("property","og:description")):
        pattern=(
            r'(<meta\s+'+property+r'="'+re.escape(value)+r'"\s+content=")'
            r'([^"]*)("\s*/?>)'
        )
        source,changed=re.subn(pattern,lambda m:m.group(1)+escaped+m.group(3),source,flags=re.I)
        if changed!=1:raise RuntimeError("SEO_META_MISSING "+value)
    ld_pattern=r'(<script\s+type="application/ld\+json">\s*)(\{.*?\})(\s*</script>)'
    found=False
    def update_schema(match):
        nonlocal found
        try:data=json.loads(match.group(2))
        except (TypeError,ValueError):return match.group(0)
        if not isinstance(data,dict) or data.get("@type")!="VideoObject":return match.group(0)
        data["description"]=natural
        data["name"]=clean
        found=True
        return match.group(1)+json.dumps(data,ensure_ascii=False).replace("</","<\\/")+match.group(3)
    source=re.sub(ld_pattern,update_schema,source,count=1,flags=re.S)
    if not found:raise RuntimeError("SEO_VIDEO_OBJECT_MISSING")
    if 'id="city-seo-nav"' not in source:
        breadcrumb={
            "@context":"https://schema.org",
            "@type":"BreadcrumbList",
            "itemListElement":[
                {"@type":"ListItem","position":1,"name":"Bizdə Belədir","item":SITE+"/"},
                {"@type":"ListItem","position":2,"name":"Bütün videolar","item":SITE+"/videos.html"},
                {"@type":"ListItem","position":3,"name":clean,"item":SITE+"/video/"+video["id"]+".html"}
            ]
        }
        schema='<script type="application/ld+json">'+json.dumps(breadcrumb,ensure_ascii=False)+'</script>\n'
        if source.count("</head>")!=1:raise RuntimeError("SEO_HEAD_INVALID")
        source=source.replace("</head>",schema+"</head>",1)
        nav=(
            '<nav id="city-seo-nav" aria-label="Video kəşfi və mövzu linkləri" '
            'style="display:flex;gap:9px;flex-wrap:wrap;margin:24px 0">'
            '<a href="/gulus-seheri.html?zone=search" '
            'style="padding:13px;color:#d9ffac;background:#1c2924;border-radius:12px;text-decoration:none">🔎 Oxşar videoları tap</a>'
            '<a href="/gulus-seheri.html?zone=discover" '
            'style="padding:13px;color:#e2f6e7;background:#222a30;border-radius:12px;text-decoration:none">🌍 Gülüş Şəhəri</a>'
            '</nav>\n'
        )
        if source.count("</main>")!=1:raise RuntimeError("SEO_MAIN_INVALID")
        source=source.replace("</main>",nav+"</main>",1)
    # Record only actual outbound YouTube clicks; no guessed subscribes.
    if 'src="/city-metrics.js"' not in source:
        if source.count("</head>")!=1:
            raise RuntimeError("VIDEO_META_HEAD_INVALID")
        source=source.replace("</head>",
          '<script defer src="/city-metrics.js"></script>\n</head>',1)
    # Every video links to a genuinely related topic, or the topic index.
    # Add it even to already-generated pages, without duplicated links.
    if 'data-bb-topic-link="1"' not in source and 'id="city-seo-nav"' in source:
        url,label=_topic_link(video)
        link=(
            '<a data-bb-topic-link="1" href="'+html.escape(url,quote=True)+'" '
            'style="padding:13px;color:#fff;background:#243447;'
            'border-radius:12px;text-decoration:none">📚 '
            +html.escape(label)+'</a>'
        )
        source,count=re.subn(
            r'(<nav id="city-seo-nav"[^>]*>.*?)(</nav>)',
            lambda match:match.group(1)+link+match.group(2),
            source,count=1,flags=re.S
        )
        if count!=1:
            raise RuntimeError("SEO_TOPIC_NAV_NOT_FOUND")
    return source
