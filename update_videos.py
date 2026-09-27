import json
import os
import html
import shutil
import urllib.parse
import urllib.request
from datetime import datetime, timezone

API_KEY = os.environ["YOUTUBE_API_KEY"]
HANDLE = "@bizde.beledir"
SITE = "https://bizdebeledir.github.io"


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
        headers={"User-Agent": "Mozilla/5.0"}
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

save_json(
    "channel-stats.json",
    channel_stats
)


# ==================================================
# 2. SON 50 VIDEO
# ==================================================

uploads_playlist = (
    channel["contentDetails"]
    ["relatedPlaylists"]
    ["uploads"]
)

playlist_data = api_get(
    "playlistItems",
    {
        "part": "contentDetails",
        "playlistId": uploads_playlist,
        "maxResults": 50
    }
)

video_ids = [
    item.get(
        "contentDetails",
        {}
    ).get(
        "videoId"
    )
    for item
    in playlist_data.get(
        "items",
        []
    )
]

video_ids = [
    video_id
    for video_id in video_ids
    if video_id
]

if not video_ids:
    raise RuntimeError(
        "No videos found."
    )


# ==================================================
# 3. VIDEO MƏLUMATLARI
# ==================================================

video_data = api_get(
    "videos",
    {
        "part":
            "snippet,statistics,contentDetails",
        "id":
            ",".join(video_ids)
    }
)

all_videos = []

for item in video_data.get(
    "items",
    []
):

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
        "id": video_id,

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

if os.path.exists("video"):
    shutil.rmtree("video")

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
        title,
        quote=True
    )

    safe_description = html.escape(
        description
    )

    meta_description = html.escape(
        description[:250],
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
        <a class="rec" href="{rec_url}">
          <img
            src="{item['thumbnail']}"
            alt="{rec_title}"
            loading="lazy"
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
            title,

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
                SITE + "/"
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

const message =
  document.getElementById("message");

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

        await navigator.share(data);

      }} else if (
        navigator.clipboard
      ) {{

        await navigator.clipboard.writeText(
          data.url
        );

        message.textContent =
          "✅ Video linki kopyalandı!";

        message.style.display =
          "block";

      }} else {{

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

</script>

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
        file.write(page)


# ==================================================
# 6. SITEMAP
# ==================================================

today = datetime.now(
    timezone.utc
).date().isoformat()


sitemap_urls = [
    (
        SITE + "/",
        today
    ),
    (
        SITE + "/videos.html",
        today
    )
]


for video in all_videos:

    published_date = (
        video["publishedAt"][:10]
        if video["publishedAt"]
        else today
    )

    sitemap_urls.append(
        (
            SITE
            + "/video/"
            + video["id"]
            + ".html",

            published_date
        )
    )


lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
]


for url, lastmod in sitemap_urls:

    lines.extend([
        "  <url>",
        "    <loc>"
        + html.escape(url)
        + "</loc>",
        "    <lastmod>"
        + lastmod
        + "</lastmod>",
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

print(
    "Channel:",
    channel_stats["title"]
)

print(
    "Subscribers:",
    channel_stats["subscribers"]
)

print(
    "Total views:",
    channel_stats["views"]
)

print(
    "Channel videos:",
    channel_stats["videos"]
)

print(
    "Loaded videos:",
    len(all_videos)
)

print(
    "Created video pages:",
    len(all_videos)
)

print(
    "Sitemap URLs:",
    len(sitemap_urls)
  )
