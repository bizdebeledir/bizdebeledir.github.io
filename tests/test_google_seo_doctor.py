"""Google SEO Doctor tests: baseline, missing tags, robots block, broken video metadata.

This test copies the public site snapshot into a temp directory and never
changes the live repository or connected Google accounts.
"""
from __future__ import annotations
import json
from pathlib import Path
import shutil
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from google_seo_doctor import audit

def make_copy(destination):
    pages=[
        "index.html","shorts.html","videos.html","favorites.html",
        "trending.html","ideas.html","yumor-dnt.html","yumor-parki.html",
        "gulus-seheri.html","yumor-studiyasi.html","movzular.html",
        "robots.txt","all-videos.json","studio-topics.json","sitemap.xml"
    ]
    for name in pages:
        shutil.copy2(ROOT/name,destination/name)
    shutil.copytree(ROOT/"video",destination/"video")
    shutil.copytree(ROOT/"movzu",destination/"movzu")

def replace_once(root,relative,original,replacement):
    path=root/relative
    source=path.read_text(encoding="utf-8")
    assert source.count(original)==1,(relative,original)
    path.write_text(source.replace(original,replacement,1),encoding="utf-8")
    return source

def run():
    problems,stats=audit(ROOT)
    assert not problems, problems
    assert stats["sitemapUrls"]==104
    assert stats["videoObjects"]==81
    assert stats["topicPages"]==12
    assert stats["analyticsId"]=="G-THZTTZJGRJ"
    print("GOOGLE_SEO_BASELINE_OK",stats)

    with tempfile.TemporaryDirectory(prefix="bb_google_audit_") as temporary:
        root=Path(temporary)
        make_copy(root)

        good,_=audit(root)
        assert not good,good
        changed=replace_once(root,"index.html","gtag/js?id=G-THZTTZJGRJ","gtag/js?id=G-XXXXXXXXXX")
        errors,_=audit(root)
        assert any("GOOGLE_MIXED_ANALYTICS_IDS" in issue for issue in errors),errors
        (root/"index.html").write_text(changed,encoding="utf-8")

        original=replace_once(root,"robots.txt","Allow: /","Disallow: /")
        errors,_=audit(root)
        assert "GOOGLE_ROBOTS_SITE_BLOCKED" in errors,errors
        (root/"robots.txt").write_text(original,encoding="utf-8")

        url="https://bizdebeledir.github.io/movzu/telefon.html"
        original=replace_once(root,"movzu/telefon.html",'<link rel="canonical" href="'+url+'"',
                              '<link rel="canonical" href="https://bizdebeledir.github.io/movzu/broken.html"')
        errors,_=audit(root)
        assert any("GOOGLE_CANONICAL_MISMATCH" in issue for issue in errors),errors
        (root/"movzu/telefon.html").write_text(original,encoding="utf-8")

        videos=json.loads((root/"all-videos.json").read_text(encoding="utf-8"))
        video_id=videos[0]["id"]
        page="video/"+video_id+".html"
        embed="https://www.youtube.com/embed/"+video_id
        original=replace_once(root,page,'"embedUrl": "'+embed+'"',
                              '"embedUrl": "https://www.youtube.com/embed/INVALID"')
        errors,_=audit(root)
        assert any("GOOGLE_VIDEO_SCHEMA_EMBED_BAD" in issue for issue in errors),errors
        (root/page).write_text(original,encoding="utf-8")

        original=replace_once(root,"sitemap.xml","</urlset>",
                              '<url><loc>https://bizdebeledir.github.io/movzu/other.html</loc></url></urlset>')
        errors,_=audit(root)
        assert any("GOOGLE_SITEMAP_EXTRA" in issue for issue in errors),errors
        (root/"sitemap.xml").write_text(original,encoding="utf-8")

        repaired,_=audit(root)
        assert not repaired,repaired
    print("GOOGLE_SEO_FAILURE_INJECTION_TESTS_PASSED","analytics","robots","canonical","video-schema","sitemap")

if __name__=="__main__":
    run()
