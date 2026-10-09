#!/usr/bin/env python3
"""Generate 12 original, crawlable topic pages from real YouTube titles.
Run manually: python studio_build_pages.py
JS studio-topic-live.js adds newest matches in visitors' browsers.
"""
from __future__ import annotations
from html import escape as x
from pathlib import Path
from datetime import datetime
import json,re,unicodedata

ROOT=Path(__file__).resolve().parent
TOPICS=json.loads((ROOT/"studio-topics.json").read_text(encoding="utf-8"))
VIDEOS=json.loads((ROOT/"all-videos.json").read_text(encoding="utf-8"))
SITE="https://bizdebeledir.github.io"
def fold(t):
    vals={'ə':'e','ğ':'g','ı':'i','ö':'o','ş':'s','ç':'c','ü':'u'}
    s=str(t or '').lower()
    s=''.join(vals.get(i,i) for i in s)
    return ' '.join(re.findall(r'[a-z0-9]+',s))
def title(v):return str(v.get("title","")).split("#")[0].strip()[:110]
def matches(v,t):
    z=fold(title(v));whole=" "+z+" "
    for word in t['terms']:
        k=fold(word)
        if " "+k+" " in whole:return True
        if len(k)>=4 and any(part.startswith(k) for part in z.split()):return True
    return False
def schema(data):
    return json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c').replace('>','\\u003e')
def head(name,desc,canonical):
    data={"@context":"https://schema.org","@type":"CollectionPage",
          "name":name,"description":desc,"inLanguage":"az","url":canonical,
          "isPartOf":{"@type":"WebSite","name":"Bizdə Belədir","url":SITE+"/"}}
    return f'''<!doctype html><html lang="az"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#11151f"><title>{x(name)}</title>
<meta name="description" content="{x(desc,quote=True)}"><link rel="canonical" href="{x(canonical,quote=True)}">
<link rel="icon" href="/icon-192.png">
<meta property="og:type" content="website"><meta property="og:title" content="{x(name,quote=True)}">
<meta property="og:description" content="{x(desc,quote=True)}">
<meta property="og:image" content="{SITE}/profile.webp">
<meta property="og:url" content="{x(canonical,quote=True)}">
<script type="application/ld+json">{schema(data)}</script>
<link rel="stylesheet" href="/yumor-studiyasi.css">
<script defer src="/studio-core.js"></script>
<script defer src="/city-metrics.js"></script>
<script defer src="/studio-topic-live.js"></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-THZTTZJGRJ"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments);}}gtag("js",new Date());gtag("config","G-THZTTZJGRJ");</script>
</head><body class="studio"><header class="studio-header">
<a href="/">← Bizdə Belədir</a><span>📚 YUMOR MÖVZULARI</span><a href="/yumor-studiyasi.html">🎯 Studiya</a>
</header><main class="studio-shell">'''
def footer():
    return '''</main><footer class="studio-footer">
<a href="/">Ana səhifə</a> · <a href="/movzular.html">12 mövzu</a> · <a href="/privacy.html">Məxfilik</a>
<p>Video siyahısı real kanal bazasına əsaslanır. Əlaqəli videolar mövzudan kənar ola bilər. Süni baxış və nəticələr yaradılmır.</p>
</footer></body></html>'''
def card(v):
    vid=v.get('id','')
    if not re.fullmatch(r'[A-Za-z0-9_-]{11}',vid):return ""
    txt=x(title(v))
    return f'''<a class="studio-video topic-card" href="/video/{vid}.html">
<img src="https://i.ytimg.com/vi/{vid}/hqdefault.jpg" loading="lazy" decoding="async" width="135" height="85" alt="">
<div><strong>{txt}</strong><small>🎬 Real videonu aç ↗</small></div></a>'''
pdir=ROOT/"movzu"
pdir.mkdir(parents=True,exist_ok=True)
for t in TOPICS:
    slug=t['slug']
    assert re.fullmatch(r'[a-z]{2,15}',slug),slug
    found=[v for v in VIDEOS if matches(v,t)]
    others=[v for v in VIDEOS if v.get('id') not in {i['id'] for i in found}][:4]
    related=[q for q in TOPICS if q['slug']!=slug][:4]
    name=t['emoji']+" "+t['label']+" | Bizdə Belədir"
    desc=(t['intro']+" Azərbaycan gündəlik yumorundan real qısa videolar, tanış vəziyyətlər və əlaqəli mövzu keçidləri.")[:215]
    body=f'''<div data-topic="{slug}">
<section class="topic-hero">
<span class="studio-kicker">AZƏRBAYCAN MƏİŞƏT YUMORU</span>
<h1>{x(t['emoji'])} {x(t['label'])}</h1><p>{x(t['intro'])}</p>
<div class="topic-breadcrumb"><a href="/">Ana səhifə</a> › <a href="/movzular.html">Mövzular</a> › {x(t['label'])}</div>
</section>
<article class="topic-editorial">
<h2>Bu vəziyyət niyə tanışdır?</h2><p>{x(t['insight'])}</p>
<p>{x(t['intro'])} Buradakı seçmələr videoların həqiqi başlıqlarına görə qurulub; nəticəyə süni baxış və ya bəyənmə əlavə edilmir.</p>
<h2>🗣️ Sənin cavabın necə olar?</h2>
<div class="topic-questions">{''.join('<p>❝ '+x(q)+' ❞</p>' for q in t['prompts'])}</div></article>
<section class="topic-videos"><h2>🎬 Bu mövzuda real videolar</h2>
<p class="studio-muted">Başlıqları uyğun gələn real YouTube videoları. Yeni videolar yükləndikcə siyahı canlı yenilənir.</p>
<div id="topic-current-videos" class="topic-video-grid">
{''.join(card(v) for v in found) or '<p class="studio-muted">Hələ bu mövzuda dəqiq uyğun video yoxdur.</p>'}</div></section>
<section class="topic-videos"><h2>🌟 Başqa tanış səhnələr</h2>
<p class="studio-muted">Aşağıdakılar kanalın başqa mövzularından seçilib, yuxarıdakı mövzuya aid olmaya bilər.</p>
<div class="topic-video-grid">{''.join(card(v) for v in others)}</div></section>
<section class="topic-related"><h2>📚 Digər məişət mövzuları</h2>
<div class="topic-chips">{''.join('<a href="/movzu/'+q['slug']+'.html">'+x(q['emoji'])+' '+x(q['label'])+'</a>' for q in related)}</div>
<a href="/ideas.html" class="studio-primary">💡 Öz situasiyanı göndər ↗</a></section></div>'''
    (pdir/(slug+".html")).write_text(head(name,desc,SITE+"/movzu/"+slug+".html")+body+footer(),encoding="utf-8")
    print("TOPIC_GENERATED",slug,"matched",len(found))
summary="Azərbaycan məişət yumorunun 12 mövzusu: qonaq, toy, qonşu, telefon, market, çay, uşaq, ev, iş, yol, ailə və dostlar. Real video keçidləri."
tiles=''.join(f'''<a class="topic-tile" href="/movzu/{t['slug']}.html">
<span>{x(t['emoji'])}</span><h2>{x(t['label'])}</h2>
<p>{x(t['intro'])}</p><strong>Bölməyə keç ↗</strong></a>''' for t in TOPICS)
index=f'''<section class="topic-hero"><span class="studio-kicker">12 AYRI MÖVZU</span>
<h1>📚 Həyatın gülməli mövzuları</h1><p>{x(summary)}</p>
<p class="studio-muted">Burada hər bölmənin öz izahı, sualları və real video seçməsi var.</p></section>
<section class="topic-grid">{tiles}</section>
<section class="studio-topic-cta"><div><span>🎯 YARADICILIQ MƏRKƏZİ</span>
<h2>Öz BINGO kartını düz!</h2><p>25 tanış situasiyanı işarələ və şəkil kimi paylaş.</p></div>
<a href="/yumor-studiyasi.html?tab=bingo">BINGO-ya keç ↗</a></section>'''
(ROOT/"movzular.html").write_text(head("12 Yumor Mövzusu | Bizdə Belədir",summary,SITE+"/movzular.html")+index+footer(),encoding="utf-8")
print("TOPIC_INDEX_GENERATED",len(TOPICS))
