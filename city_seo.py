"""Idempotent SEO enhancements for generated real YouTube video watch pages."""
from __future__ import annotations
import html
import json
import re

SITE="https://bizdebeledir.github.io"

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
    return source
