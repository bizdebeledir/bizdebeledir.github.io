let allVideos = [];

function formatNumber(number) {
  return new Intl.NumberFormat("az-AZ").format(
    Number(number) || 0
  );
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

function createVideoCard(video, options = {}) {
  const isNew = options.isNew || false;
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

  const rankHTML = rank
    ? `
      <div class="rank-badge rank-${rank}">
        ${medals[rank]} ${rank}-ci yer
      </div>
    `
    : "";

  const newHTML = isNew
    ? `<div class="new-badge">YENİ</div>`
    : "";

  const topClasses = rank
    ? ` top-card top-${rank}`
    : "";

  return `
    <a
      class="video-card${topClasses}"
      href="${localURL}">

      ${rankHTML}

      <div class="thumb-wrap">

        <img
          src="${escapeHTML(video.thumbnail)}"
          alt="${escapeHTML(video.title)}"
          loading="lazy">

        ${newHTML}

        <div class="play">▶</div>

      </div>

      <div class="video-info">

        <strong class="video-title">
          ${escapeHTML(video.title)}
        </strong>

        <div class="video-meta">

          <span class="views">
            👁 ${formatNumber(video.views)} baxış
          </span>

          <span>Bax →</span>

        </div>

      </div>

    </a>
  `;
}

async function loadStats() {
  try {
    const response = await fetch(
      "channel-stats.json?v=" + Date.now(),
      {
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error("Statistika yüklənmədi");
    }

    const stats = await response.json();

    document.getElementById("subscribers").textContent =
      stats.hiddenSubscriberCount
        ? "Gizli"
        : formatNumber(stats.subscribers);

    document.getElementById("total-views").textContent =
      formatNumber(stats.views);

    document.getElementById("video-count").textContent =
      formatNumber(stats.videos);

  } catch (error) {
    console.error("Statistika xətası:", error);

    document.getElementById("subscribers").textContent = "—";
    document.getElementById("total-views").textContent = "—";
    document.getElementById("video-count").textContent = "—";
  }
}

async function loadTopVideos() {
  const container =
    document.getElementById("top-videos");

  try {
    const response = await fetch(
      "videos.json?v=" + Date.now(),
      {
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error("TOP videolar yüklənmədi");
    }

    const videos = await response.json();

    if (!Array.isArray(videos) || videos.length === 0) {
      throw new Error("TOP video siyahısı boşdur");
    }

    container.innerHTML = videos
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

  } catch (error) {
    console.error("TOP video xətası:", error);

    container.innerHTML = `
      <div class="loading">
        TOP videolar hazırda göstərilə bilmir.
      </div>
    `;
  }
}

async function loadAllVideos() {
  const container =
    document.getElementById("latest-videos");

  try {
    const response = await fetch(
      "all-videos.json?v=" + Date.now(),
      {
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error("Videolar yüklənmədi");
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Video siyahısı boşdur");
    }

    allVideos = [...data].sort(
      (a, b) =>
        new Date(b.publishedAt) -
        new Date(a.publishedAt)
    );

    container.innerHTML = allVideos
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

  } catch (error) {
    console.error("Son videolar xətası:", error);

    allVideos = [];

    container.innerHTML = `
      <div class="loading">
        Son videolar hazırda göstərilə bilmir.
      </div>
    `;
  }
}

const randomButton =
  document.getElementById("random-video");

if (randomButton) {
  randomButton.addEventListener(
    "click",
    function () {

      if (!allVideos.length) {
        window.location.href = "videos.html";
        return;
      }

      const randomIndex =
        Math.floor(
          Math.random() * allVideos.length
        );

      const randomVideo =
        allVideos[randomIndex];

      window.location.href =
        "video/" +
        encodeURIComponent(randomVideo.id) +
        ".html";
    }
  );
}

const shareButton =
  document.getElementById("share-site");

if (shareButton) {
  shareButton.addEventListener(
    "click",
    async function () {

      const shareData = {
        title: "Bizdə Belədir",
        text:
          "Bizdə Belədir 🇦🇿 Gündəlik həyat, yumor və videolar.",
        url:
          "https://bizdebeledir.github.io/"
      };

      try {
        if (navigator.share) {
          await navigator.share(shareData);
          return;
        }

        if (navigator.clipboard) {
          await navigator.clipboard.writeText(
            shareData.url
          );

          alert("Saytın linki kopyalandı!");
          return;
        }

        alert(shareData.url);

      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(
            "Paylaşma xətası:",
            error
          );
        }
      }
    }
  );
}

loadStats();
loadTopVideos();
loadAllVideos();
