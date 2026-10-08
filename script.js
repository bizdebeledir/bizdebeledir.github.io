"use strict";

let allVideos = [];

const SITE_URL = "https://bizdebeledir.github.io/";

const elements = {
  subscribers: document.getElementById("subscribers"),
  totalViews: document.getElementById("total-views"),
  videoCount: document.getElementById("video-count"),
  topVideos: document.getElementById("top-videos"),
  latestVideos: document.getElementById("latest-videos"),
  randomButton: document.getElementById("random-video"),
  shareButton: document.getElementById("share-site")
};


/* =========================
   KÖMƏKÇİ FUNKSİYALAR
========================= */

function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return new Intl.NumberFormat("az-AZ").format(number);
}


function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}


function safeThumbnail(url) {
  if (typeof url !== "string") {
    return "";
  }

  if (
    url.startsWith("https://") ||
    url.startsWith("http://")
  ) {
    return escapeHTML(url);
  }

  return "";
}


async function fetchJSON(file) {
  const response = await fetch(
    `${file}?v=${Math.floor(Date.now() / 300000)}`,
    {
      cache: "default"
    }
  );

  if (!response.ok) {
    throw new Error(
      `${file}: HTTP ${response.status}`
    );
  }

  return response.json();
}


/* =========================
   VİDEO KARTI
========================= */

function createVideoCard(video, options = {}) {
  if (!video || !video.id) {
    return "";
  }

  const isNew = Boolean(options.isNew);
  const rank = options.rank || null;

  const localURL =
    "video/" +
    encodeURIComponent(video.id) +
    ".html";

  const medals = {
    1: "🥇",
    2: "🥈",
    3: "🥉"
  };

  let rankHTML = "";

  if (rank && medals[rank]) {
    rankHTML = `
      <div class="rank-badge rank-${rank}">
        ${medals[rank]} ${rank}-ci yer
      </div>
    `;
  }

  const newHTML = isNew
    ? `<div class="new-badge">YENİ</div>`
    : "";

  const topClass = rank
    ? ` top-card top-${rank}`
    : "";

  const title =
    escapeHTML(video.title || "Bizdə Belədir");

  const thumbnail =
    safeThumbnail(video.thumbnail);

  return `
    <a
      class="video-card${topClass}"
      href="${localURL}"
      aria-label="${title}">

      ${rankHTML}

      <div class="thumb-wrap">

        <img
          src="${thumbnail}"
          alt="${title}"
          loading="lazy"
          decoding="async"
          width="480"
          height="270">

        ${newHTML}

        <div class="play" aria-hidden="true">
          ▶
        </div>

      </div>

      <div class="video-info">

        <strong class="video-title">
          ${title}
        </strong>

        <div class="video-meta">

          <span class="views">
            👁 ${formatNumber(video.views)} baxış
          </span>

          <span>
            Bax →
          </span>

        </div>

      </div>

    </a>
  `;
}


/* =========================
   KANAL STATİSTİKASI
========================= */

function renderStats(stats) {
  if (!stats) {
    throw new Error(
      "Statistika məlumatı tapılmadı"
    );
  }

  if (elements.subscribers) {
    elements.subscribers.textContent =
      stats.hiddenSubscriberCount
        ? "Gizli"
        : formatNumber(stats.subscribers);
  }

  if (elements.totalViews) {
    elements.totalViews.textContent =
      formatNumber(stats.views);
  }

  if (elements.videoCount) {
    elements.videoCount.textContent =
      formatNumber(stats.videos);
  }
}


function renderStatsError() {
  if (elements.subscribers) {
    elements.subscribers.textContent = "—";
  }

  if (elements.totalViews) {
    elements.totalViews.textContent = "—";
  }

  if (elements.videoCount) {
    elements.videoCount.textContent = "—";
  }
}


/* =========================
   TOP 3
========================= */

function renderTopVideos(videos) {
  if (!elements.topVideos) {
    return;
  }

  if (!Array.isArray(videos) || !videos.length) {
    throw new Error(
      "TOP video siyahısı boşdur"
    );
  }

  const html = videos
    .filter(video => video && video.id)
    .slice(0, 3)
    .map(
      (video, index) =>
        createVideoCard(
          video,
          {
            rank: index + 1
          }
        )
    )
    .join("");

  if (!html) {
    throw new Error(
      "TOP video kartları yaradıla bilmədi"
    );
  }

  elements.topVideos.innerHTML = html;
}


function renderTopError() {
  if (!elements.topVideos) {
    return;
  }

  elements.topVideos.innerHTML = `
    <div class="loading">
      TOP videolar hazırda göstərilə bilmir.
    </div>
  `;
}


/* =========================
   SON VİDEOLAR
========================= */

function renderLatestVideos(videos) {
  if (!elements.latestVideos) {
    return;
  }

  if (!Array.isArray(videos) || !videos.length) {
    throw new Error(
      "Video siyahısı boşdur"
    );
  }

  allVideos = videos
    .filter(video => video && video.id)
    .sort(
      (a, b) =>
        new Date(b.publishedAt || 0) -
        new Date(a.publishedAt || 0)
    );

  if (!allVideos.length) {
    throw new Error(
      "Etibarlı video tapılmadı"
    );
  }

  elements.latestVideos.innerHTML =
    allVideos
      .slice(0, 3)
      .map(
        video =>
          createVideoCard(
            video,
            {
              isNew: true
            }
          )
      )
      .join("");
}


function renderLatestError() {
  allVideos = [];

  if (!elements.latestVideos) {
    return;
  }

  elements.latestVideos.innerHTML = `
    <div class="loading">
      Son videolar hazırda göstərilə bilmir.
    </div>
  `;
}


/* =========================
   MƏLUMATLARI YÜKLƏ
========================= */

async function loadPageData() {
  const [
    statsResult,
    topResult,
    allResult
  ] = await Promise.allSettled([
    fetchJSON("channel-stats.json"),
    fetchJSON("videos.json"),
    fetchJSON("all-videos.json")
  ]);


  /* Statistika */

  if (statsResult.status === "fulfilled") {
    try {
      renderStats(statsResult.value);
    } catch (error) {
      console.error(
        "Statistika göstərilmədi:",
        error
      );

      renderStatsError();
    }
  } else {
    console.error(
      "Statistika yüklənmədi:",
      statsResult.reason
    );

    renderStatsError();
  }


  /* TOP 3 */

  if (topResult.status === "fulfilled") {
    try {
      renderTopVideos(topResult.value);
    } catch (error) {
      console.error(
        "TOP videolar göstərilmədi:",
        error
      );

      renderTopError();
    }
  } else {
    console.error(
      "TOP videolar yüklənmədi:",
      topResult.reason
    );

    renderTopError();
  }


  /* Son videolar */

  if (allResult.status === "fulfilled") {
    try {
      renderLatestVideos(allResult.value);
      window.BBVids = allVideos;
      window.dispatchEvent(new CustomEvent("bb:videos-ready", {detail: allVideos}));
    } catch (error) {
      console.error(
        "Son videolar göstərilmədi:",
        error
      );

      renderLatestError();
    }
  } else {
    console.error(
      "Son videolar yüklənmədi:",
      allResult.reason
    );

    renderLatestError();
  }
}


/* =========================
   TƏSADÜFİ VİDEO
========================= */

if (elements.randomButton) {
  elements.randomButton.addEventListener(
    "click",
    function () {
      if (!allVideos.length) {
        window.location.href =
          "videos.html";

        return;
      }

      const index =
        Math.floor(
          Math.random() *
          allVideos.length
        );

      const video =
        allVideos[index];

      window.location.href =
        "video/" +
        encodeURIComponent(video.id) +
        ".html";
    }
  );
}


/* =========================
   SAYTI PAYLAŞ
========================= */

if (elements.shareButton) {
  elements.shareButton.addEventListener(
    "click",
    async function () {
      const shareData = {
        title: "Bizdə Belədir",
        text:
          "Bizdə Belədir 🇦🇿 Gündəlik həyat, yumor və videolar.",
        url: SITE_URL
      };

      try {
        if (navigator.share) {
          await navigator.share(
            shareData
          );

          return;
        }

        if (navigator.clipboard) {
          await navigator.clipboard.writeText(
            SITE_URL
          );

          alert(
            "Saytın linki kopyalandı!"
          );

          return;
        }

        alert(SITE_URL);

      } catch (error) {
        if (
          error &&
          error.name !== "AbortError"
        ) {
          console.error(
            "Paylaşma xətası:",
            error
          );
        }
      }
    }
  );
}


/* =========================
   PWA SERVICE WORKER
========================= */

if ("serviceWorker" in navigator) {
  window.addEventListener(
    "load",
    function () {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(error => {
          console.error(
            "Service Worker qeydiyyat xətası:",
            error
          );
        });
    }
  );
}


/* =========================
   BAŞLAT
========================= */

loadPageData();
