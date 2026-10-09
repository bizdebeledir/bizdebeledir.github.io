import json
import os
import html
import urllib.parse
import urllib.request
from datetime import datetime, timezone


API_KEY = os.environ["YOUTUBE_API_KEY"]
HANDLE = "@bizde.beledir"
SITE = "https://bizdebeledir.github.io"
GA_ID = "G-THZTTZJGRJ"


# ==================================================
# KÖMƏKÇİ FUNKSİYALAR
# ==================================================

def api_get(endpoint, params):
    params["key"] = API_KEY

    url = (
        "https://www.googleapis.com/youtube/v3/"
        + endpoint
        + "?"
        + urllib.parse.urlencode(params)
    )

    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0"
        }
    )

    with urllib.request.urlopen(
        request,
        timeout=30
    ) as response:
        return json.loads(
            response.read().decode("utf-8")
        )


def save_json(filename, data):
    with open(
        filename,
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            data,
            file,
            ensure_ascii=False,
            indent=2
        )


def format_views(number):
    return f"{int(number):,}"


def xml_escape(value):
    return html.escape(
        str(value or ""),
        quote=True
    )


# ==================================================
# 1. KANAL
# ==================================================

channel_data = api_get(
    "channels",
    {
        "part": "snippet,contentDetails,statistics",
        "forHandle": HANDLE
    }
)

if not channel_data.get("items"):
    raise RuntimeError(
        "YouTube channel not found."
    )

channel = channel_data["items"][0]

statistics = channel.get(
    "statistics",
    {}
)

channel_stats = {
    "channelId": channel["id"],

    "title": channel.get(
        "snippet",
        {}
    ).get(
        "title",
        "Bizdə Belədir"
    ),

    "subscribers": int(
        statistics.get(
            "subscriberCount",
            0
        )
    ),

    "views": int(
        statistics.get(
            "viewCount",
            0
        )
    ),

    "videos": int(
        statistics.get(
            "videoCount",
            0
        )
    ),

    "hiddenSubscriberCount":
        statistics.get(
            "hiddenSubscriberCount",
            False
        )
}

# Persist metadata only after video list is verified; prevent partial writes.



# ==================================================
# 2. BÜTÜN YÜKLƏNMİŞ VİDEOLAR (SƏHİFƏLƏMƏ)
# ==================================================
uploads_playlist = (
    channel["contentDetails"]
    ["relatedPlaylists"]
    ["uploads"]
)

video_ids = []
seen_ids = set()
next_page_token = None
seen_page_tokens = set()

# 20 səhifə = maksimum 1000 video. Limitə çatanda səssizcə kəsmə.
for page_no in range(20):
    params = {
        "part": "contentDetails",
        "playlistId": uploads_playlist,
        "maxResults": 50
    }

    if next_page_token:
        params["pageToken"] = next_page_token

    playlist_data = api_get("playlistItems", params)

    for item in playlist_data.get("items", []):
        video_id = item.get("contentDetails", {}).get("videoId")
        if video_id and video_id not in seen_ids:
            seen_ids.add(video_id)
            video_ids.append(video_id)

    next_page_token = playlist_data.get("nextPageToken")
    if not next_page_token:
        break

    if next_page_token in seen_page_tokens:
        raise RuntimeError("YouTube returned a repeated page token.")

    seen_page_tokens.add(next_page_token)
else:
    raise RuntimeError("Video playlist exceeds the 1000-video safety limit.")

if not video_ids:
    raise RuntimeError("No videos found.")


# ==================================================
# 3. VIDEO MƏLUMATLARI
# ==================================================

# YouTube videos.list bir sorğuda maksimum 50 ID qəbul edir.
video_items = []
for offset in range(0, len(video_ids), 50):
    video_data = api_get(
        "videos",
        {
            "part": "snippet,statistics,contentDetails",
            "id": ",".join(video_ids[offset:offset + 50])
        }
    )
    video_items.extend(video_data.get("items", []))


all_videos = []

for item in video_items:
    video_id = item["id"]

    snippet = item.get(
        "snippet",
        {}
    )

    stats = item.get(
        "statistics",
        {}
    )

    content = item.get(
        "contentDetails",
        {}
    )

    all_videos.append({
        "id":
            video_id,

        "title":
            snippet.get(
                "title",
                "Bizdə Belədir"
            ),

        "description":
            snippet.get(
                "description",
                ""
            ),

        "url":
            "https://www.youtube.com/watch?v="
            + video_id,

        "shortsUrl":
            "https://www.youtube.com/shorts/"
            + video_id,

        "embedUrl":
            "https://www.youtube.com/embed/"
            + video_id,

        "thumbnail":
            "https://i.ytimg.com/vi/"
            + video_id
            + "/hqdefault.jpg",

        "views":
            int(
                stats.get(
                    "viewCount",
                    0
                )
            ),

        "publishedAt":
            snippet.get(
                "publishedAt",
                ""
            ),

        "duration":
            content.get(
                "duration",
                ""
            )
    })


if not all_videos:
    raise RuntimeError(
        "No video details found."
    )


all_videos.sort(
    key=lambda item:
        item["publishedAt"],
    reverse=True
)


# Safe video list validation, sync status and 24h snapshot history.
from video_sync import prepare as prepare_video_sync
channel_stats = prepare_video_sync(all_videos, channel_stats)
# Keep the weekly 8-video bracket stable as views and uploads update.
from city_week import prepare as prepare_city_week
channel_stats = prepare_city_week(all_videos, channel_stats)
save_json("channel-stats.json", channel_stats)

save_json(
    "all-videos.json",
    all_videos
)


top_videos = sorted(
    all_videos,
    key=lambda item:
        item["views"],
    reverse=True
)[:3]


save_json(
    "videos.json",
    top_videos
)


# ==================================================
# 4. VIDEO QOVLUĞU
# ==================================================

# Köhnə video səhifələrini silmə: əvvəlki linklər işlək qalsın.
os.makedirs(
    "video",
    exist_ok=True
)


# ==================================================
# 5. VIDEO SƏHİFƏLƏRİ
# ==================================================

for video in all_videos:

    video_id = video["id"]
    title = video["title"]
    clean_title = title.split("#")[0].strip() or title

    description = (
        video["description"].strip()
        or
        "Bizdə Belədir kanalından Azərbaycan yumor videosu."
    )

    page_url = (
        SITE
        + "/video/"
        + video_id
        + ".html"
    )

    safe_title = html.escape(
        clean_title,
        quote=True
    )

    safe_description = html.escape(
        description
    )

    meta_description = html.escape(
        (clean_title + " · " + description.splitlines()[0].strip())[:150],
        quote=True
    )


    # ----------------------------------------------
    # 3 BAŞQA VIDEO
    # ----------------------------------------------

    recommendations = [
        item
        for item in all_videos
        if item["id"] != video_id
    ][:3]

    recommendations_html = ""

    for item in recommendations:

        rec_title = html.escape(
            item["title"],
            quote=True
        )

        rec_url = (
            SITE
            + "/video/"
            + item["id"]
            + ".html"
        )

        recommendations_html += f"""
        <a
          class="rec"
          href="{rec_url}"
          data-recommended-video="{item['id']}"
        >
          <img
            src="{item['thumbnail']}"
            alt="{rec_title}"
            loading="lazy"
            decoding="async"
          >
          <div class="rec-info">
            <strong>{rec_title}</strong>
            <span>
              👁 {format_views(item['views'])} baxış
            </span>
          </div>
        </a>
        """


    # ----------------------------------------------
    # VIDEOOBJECT
    # ----------------------------------------------

    video_object = {
        "@context":
            "https://schema.org",

        "@type":
            "VideoObject",

        "name":
            clean_title,

        "description":
            description,

        "thumbnailUrl": [
            video["thumbnail"]
        ],

        "uploadDate":
            video["publishedAt"],

        "duration":
            video["duration"],

        "embedUrl":
            video["embedUrl"],

        "url":
            page_url,

        "creator": {
            "@type":
                "Organization",

            "name":
                "Bizdə Belədir",

            "url":
                SITE + "/",
            "logo":
                SITE + "/profile.webp"
        },

        "interactionStatistic": {
            "@type":
                "InteractionCounter",

            "interactionType": {
                "@type":
                    "WatchAction"
            },

            "userInteractionCount":
                video["views"]
        }
    }


    json_ld = json.dumps(
        video_object,
        ensure_ascii=False
    ).replace(
        "</",
        "<\\/"
    )


    share_title_json = json.dumps(
        title,
        ensure_ascii=False
    )

    share_url_json = json.dumps(
        page_url
    )


    # ----------------------------------------------
    # HTML
    # ----------------------------------------------

    page = f"""<!DOCTYPE html>
<html lang="az">
<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
>

<!-- Google Analytics -->
<script
  async
  src="https://www.googletagmanager.com/gtag/js?id={GA_ID}"
></script>

<script>
  window.dataLayer = window.dataLayer || [];

  function gtag(){{
    dataLayer.push(arguments);
  }}

  gtag(
    "js",
    new Date()
  );

  gtag(
    "config",
    "{GA_ID}"
  );
</script>

<title>{safe_title} | Bizdə Belədir</title>

<meta
  name="description"
  content="{meta_description}"
>

<meta
  name="robots"
  content="index,follow"
>

<meta
  name="theme-color"
  content="#080808"
>

<link
  rel="canonical"
  href="{page_url}"
>

<meta
  property="og:type"
  content="video.other"
>

<meta
  property="og:title"
  content="{safe_title}"
>

<meta
  property="og:description"
  content="{meta_description}"
>

<meta
  property="og:image"
  content="{video['thumbnail']}"
>

<meta
  property="og:url"
  content="{page_url}"
>

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="{video['thumbnail']}">
<script type="application/ld+json">
{json_ld}
</script>

<style>

*{{
  box-sizing:border-box
}}

body{{
  margin:0;
  background:#080808;
  color:#fff;
  font-family:Arial,Helvetica,sans-serif
}}

.page{{
  width:100%;
  max-width:760px;
  margin:auto;
  padding:28px 17px 55px
}}

.brand{{
  display:inline-block;
  margin-bottom:24px;
  color:#aaa;
  text-decoration:none;
  font-weight:800
}}

h1{{
  margin:0 0 22px;
  font-size:clamp(27px,7vw,43px);
  line-height:1.1
}}

.player{{
  width:100%;
  aspect-ratio:9/16;
  max-height:75vh;
  border:1px solid #292929;
  border-radius:24px;
  overflow:hidden;
  background:#111
}}

iframe{{
  width:100%;
  height:100%;
  border:0
}}

.meta{{
  margin-top:18px;
  color:#aaa
}}

.description{{
  margin-top:18px;
  padding:20px;
  background:#111;
  border:1px solid #292929;
  border-radius:20px;
  color:#bbb;
  line-height:1.6;
  white-space:pre-wrap;
  overflow-wrap:anywhere
}}

.buttons{{
  display:grid;
  gap:12px;
  margin-top:20px
}}

.btn{{
  min-height:61px;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:14px;
  border:0;
  border-radius:18px;
  text-decoration:none;
  font:900 16px Arial;
  cursor:pointer
}}

.youtube{{
  background:#ff0033;
  color:#fff
}}

.share{{
  background:#fff;
  color:#080808
}}

.all{{
  background:#181818;
  border:1px solid #303030;
  color:#fff
}}

.message{{
  display:none;
  margin-top:12px;
  padding:12px;
  border-radius:14px;
  background:#151515;
  border:1px solid #303030;
  color:#ccc;
  text-align:center
}}

.recommend{{
  margin-top:46px
}}

.recommend h2{{
  margin-bottom:7px;
  font-size:28px
}}

.recommend>p{{
  margin-top:0;
  color:#888
}}

.rec-grid{{
  display:grid;
  gap:14px
}}

.rec{{
  display:grid;
  grid-template-columns:130px 1fr;
  gap:13px;
  padding:9px;
  background:#121212;
  border:1px solid #292929;
  border-radius:18px;
  color:#fff;
  text-decoration:none;
  align-items:center
}}

.rec img{{
  width:100%;
  aspect-ratio:16/9;
  object-fit:cover;
  border-radius:12px
}}

.rec-info{{
  min-width:0
}}

.rec strong{{
  display:-webkit-box;
  -webkit-line-clamp:2;
  -webkit-box-orient:vertical;
  overflow:hidden;
  line-height:1.35
}}

.rec span{{
  display:block;
  margin-top:8px;
  color:#999;
  font-size:12px
}}

@media(min-width:700px){{

  .buttons{{
    grid-template-columns:1fr 1fr
  }}

  .all{{
    grid-column:1/-1
  }}

  .rec-grid{{
    grid-template-columns:repeat(3,1fr)
  }}

  .rec{{
    display:block;
    padding:0;
    overflow:hidden
  }}

  .rec img{{
    border-radius:0
  }}

  .rec-info{{
    padding:14px
  }}
}}

</style>

</head>

<body>

<main class="page">

<a
  class="brand"
  href="{SITE}/"
>
  ← BİZDƏ BELƏDİR
</a>

<h1>
  {safe_title}
</h1>

<div class="player">

  <iframe
    src="{video['embedUrl']}"
    title="{safe_title}"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  ></iframe>

</div>

<div class="meta">
  👁 {format_views(video['views'])} baxış
</div>

<div class="description">
{safe_description}
</div>

<div class="buttons">

  <a
    class="btn youtube"
    id="youtube-watch"
    href="{video['shortsUrl']}"
    target="_blank"
    rel="noopener noreferrer"
  >
    ▶ YouTube-da izlə
  </a>

  <button
    class="btn share"
    id="share"
    type="button"
  >
    🔗 Videonu paylaş
  </button>

  <a
    class="btn all"
    href="{SITE}/videos.html"
  >
    🎬 Bütün videolara bax
  </a>

</div>

<div
  class="message"
  id="message"
></div>

<section class="recommend">

<h2>
  🔥 Bunlara da bax
</h2>

<p>
  Bizdə Belədir-dən başqa videolar.
</p>

<div class="rec-grid">
{recommendations_html}
</div>

</section>

</main>

<script>

const shareButton =
  document.getElementById("share");

const youtubeButton =
  document.getElementById("youtube-watch");

const message =
  document.getElementById("message");


function trackEvent(
  eventName,
  parameters = {{}}
) {{

  if (
    typeof gtag === "function"
  ) {{

    gtag(
      "event",
      eventName,
      parameters
    );

  }}

}}


// ==================================================
// YOUTUBE DÜYMƏSİ
// ==================================================

if (youtubeButton) {{

  youtubeButton.addEventListener(
    "click",
    () => {{

      trackEvent(
        "youtube_click",
        {{
          video_id: "{video_id}",
          video_title: {share_title_json}
        }}
      );

    }}
  );

}}


// ==================================================
// TÖVSİYƏ OLUNAN VİDEOLAR
// ==================================================

document
  .querySelectorAll(
    "[data-recommended-video]"
  )
  .forEach(
    link => {{

      link.addEventListener(
        "click",
        () => {{

          trackEvent(
            "recommended_video_click",
            {{
              source_video_id:
                "{video_id}",

              target_video_id:
                link.dataset.recommendedVideo
            }}
          );

        }}
      );

    }}
  );


// ==================================================
// PAYLAŞ DÜYMƏSİ
// ==================================================

if (shareButton) {{

  shareButton.addEventListener(
    "click",
    async () => {{

      const data = {{
        title: {share_title_json},

        text:
          "Bizdə Belədir videosuna bax 👀",

        url: {share_url_json}
      }};


      try {{

        if (navigator.share) {{

          await navigator.share(
            data
          );

          trackEvent(
            "share_video",
            {{
              video_id:
                "{video_id}",

              video_title:
                {share_title_json},

              share_method:
                "native_share"
            }}
          );

        }} else if (
          navigator.clipboard
        ) {{

          await navigator.clipboard.writeText(
            data.url
          );

          trackEvent(
            "share_video",
            {{
              video_id:
                "{video_id}",

              video_title:
                {share_title_json},

              share_method:
                "clipboard"
            }}
          );

          message.textContent =
            "✅ Video linki kopyalandı!";

          message.style.display =
            "block";

        }} else {{

          trackEvent(
            "share_video",
            {{
              video_id:
                "{video_id}",

              video_title:
                {share_title_json},

              share_method:
                "manual"
            }}
          );

          message.textContent =
            data.url;

          message.style.display =
            "block";
        }}

      }} catch (error) {{

        if (
          error.name !== "AbortError"
        ) {{

          message.textContent =
            "Linki paylaşmaq mümkün olmadı.";

          message.style.display =
            "block";
        }}

      }}

    }}
  );

}}

</script>
<script src="/discovery.js" defer></script>
<script src="/site-actions.js" defer></script>
<script src="/video-enhance.js" defer></script>
<script src="/phase2.js" defer></script>
<script src="/visitor.js" defer></script>

</body>
</html>
"""


    with open(
        os.path.join(
            "video",
            video_id + ".html"
        ),
        "w",
        encoding="utf-8"
    ) as file:
        # Add accurate breadcrumb / concise descriptions to the actual YouTube video page.
        from city_seo import enhance as enhance_city_video_seo
        file.write(enhance_city_video_seo(page, video))


# ==================================================
# 6. SITEMAP + VIDEO SEO
# ==================================================

today = datetime.now(
    timezone.utc
).date().isoformat()


lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',

    (
        '<urlset '
        'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
        'xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">'
    )
]


# ==================================================
# ANA SƏHİFƏ
# ==================================================

lines.extend([
    "  <url>",

    "    <loc>"
    + xml_escape(
        SITE + "/"
    )
    + "</loc>",

    "    <lastmod>"
    + today
    + "</lastmod>",

    "  </url>"
])


# ==================================================
# BÜTÜN VİDEOLAR SƏHİFƏSİ
# ==================================================

lines.extend([
    "  <url>",

    "    <loc>"
    + xml_escape(
        SITE + "/videos.html"
    )
    + "</loc>",

    "    <lastmod>"
    + today
    + "</lastmod>",

    "  </url>"
])


lines.extend([
    "  <url>",
    "    <loc>" + SITE + "/shorts.html</loc>",
    "  </url>"
])

for extra_page in ("favorites.html","trending.html","ideas.html","yumor-dnt.html","yumor-parki.html","gulus-seheri.html","yumor-studiyasi.html","movzular.html"):
    lines.extend([
        "  <url>",
        "    <loc>" + SITE + "/" + extra_page + "</loc>",
        "  </url>"
    ])

import re as _studio_re
for studio_topic in json.load(open("studio-topics.json",encoding="utf-8")):
    slug=studio_topic["slug"]
    if not _studio_re.fullmatch(r"[a-z]{2,15}",slug):
        raise ValueError("INVALID_STUDIO_TOPIC_SLUG")
    lines.extend(["  <url>","    <loc>" + SITE + "/movzu/" + slug + ".html</loc>","  </url>"])


# ==================================================
# HƏR VİDEO ÜÇÜN VIDEO SITEMAP
# ==================================================

for video in all_videos:

    video_id = video["id"]

    page_url = (
        SITE
        + "/video/"
        + video_id
        + ".html"
    )

    published_at = (
        video.get(
            "publishedAt"
        )
        or ""
    )

    published_date = (
        published_at[:10]
        if published_at
        else today
    )

    # Readable metadata from actual video title and opening description.
    # Strip repetitive hashtags / generic engagement boilerplate.
    from video_sitemap_quality import clean_video_text
    title, description = clean_video_text(video)

    thumbnail = (
        video.get(
            "thumbnail"
        )
        or ""
    )

    embed_url = (
        video.get(
            "embedUrl"
        )
        or ""
    )

    sitemap_description = (
        description[:1800]
    )


    lines.extend([
        "  <url>",

        "    <loc>"
        + xml_escape(
            page_url
        )
        + "</loc>",

        "    <lastmod>"
        + xml_escape(
            published_date
        )
        + "</lastmod>",

        "    <video:video>",

        "      <video:thumbnail_loc>"
        + xml_escape(
            thumbnail
        )
        + "</video:thumbnail_loc>",

        "      <video:title>"
        + xml_escape(
            title
        )
        + "</video:title>",

        "      <video:description>"
        + xml_escape(
            sitemap_description
        )
        + "</video:description>",

        "      <video:player_loc>"
        + xml_escape(
            embed_url
        )
        + "</video:player_loc>",

        "    </video:video>",

        "  </url>"
    ])


lines.append(
    "</urlset>"
)


with open(
    "sitemap.xml",
    "w",
    encoding="utf-8"
) as file:

    file.write(
        "\n".join(lines)
        + "\n"
    )


# ==================================================
# 7. NƏTİCƏ
# ==================================================

sitemap_url_count = (
    11 + len(json.load(open("studio-topics.json",encoding="utf-8"))) + len(all_videos)
)



# Check generated files before GitHub Actions stages any changes.
from site_doctor import audit as run_site_doctor
_site_errors = run_site_doctor(os.getcwd())
if _site_errors:
    raise RuntimeError("Site Doctor failed: " + "; ".join(_site_errors[:8]))
print("SITE_DOCTOR_OK")
