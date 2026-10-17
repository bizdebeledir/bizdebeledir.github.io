(() => {
  "use strict";

  const INTERVAL_MS = 6 * 60 * 60 * 1000;
  const list = document.querySelector("[data-latest-list]");
  const status = document.querySelector("[data-latest-status]");
  if (!list || !status) return;

  let lastSuccess = 0;
  let loading = false;

  const safeId = (value) => /^[A-Za-z0-9_-]{11}$/.test(String(value || ""));
  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("az-AZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Baku"
    }).format(date);
  };

  function makeCard(video) {
    const id = String(video.id || "");
    if (!safeId(id)) return null;

    const link = document.createElement("a");
    link.className = "latest-video-card";
    link.href = "https://www.youtube.com/shorts/" + encodeURIComponent(id);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", (video.title || "YouTube videosu") + " — YouTube-da aç");

    const image = document.createElement("img");
    image.className = "latest-video-card__thumb";
    image.src = "https://i.ytimg.com/vi/" + encodeURIComponent(id) + "/hqdefault.jpg";
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => { image.hidden = true; }, { once: true });
    link.append(image);

    const body = document.createElement("div");
    body.className = "latest-video-card__body";

    const title = document.createElement("p");
    title.className = "latest-video-card__title";
    title.textContent = String(video.title || "Başlıqsız video");
    body.append(title);

    const meta = document.createElement("div");
    meta.className = "latest-video-card__meta";
    const date = document.createElement("span");
    date.textContent = formatDate(video.publishedAt);
    meta.append(date);

    const views = Number(video.views);
    if (Number.isFinite(views) && views >= 0) {
      const count = document.createElement("span");
      count.textContent = new Intl.NumberFormat("az-AZ").format(views) + " baxış";
      meta.append(count);
    }
    body.append(meta);
    link.append(body);
    return link;
  }

  async function refresh() {
    if (loading) return;
    loading = true;
    status.textContent = "Yenilənir…";
    try {
      const url = new URL("/all-videos.json", window.location.origin);
      url.searchParams.set("t", String(Date.now()));
      const response = await fetch(url.toString(), {
        cache: "no-store",
        headers: { "Accept": "application/json" }
      });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Video siyahısı düzgün deyil");

      const videos = data
        .filter((video) => video && safeId(video.id))
        .sort((a, b) => Date.parse(b.publishedAt || "") - Date.parse(a.publishedAt || ""))
        .map(makeCard)
        .filter(Boolean)
        .slice(0, 6);

      if (!videos.length) throw new Error("Video tapılmadı");
      const fragment = document.createDocumentFragment();
      videos.forEach((video) => fragment.append(video));
      list.replaceChildren(fragment);
      lastSuccess = Date.now();
      status.textContent = "Son yoxlama: " + new Intl.DateTimeFormat("az-AZ", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Baku"
      }).format(lastSuccess) + " (Bakı)";
    } catch (_) {
      status.textContent = lastSuccess
        ? "Son yenilənmə alınmadı; əvvəlki siyahı saxlanılıb."
        : "Siyahı yüklənmədi; arxiv linki aşağıdadır.";
    } finally {
      loading = false;
    }
  }

  refresh();
  window.setInterval(refresh, INTERVAL_MS);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && Date.now() - lastSuccess > 10 * 60 * 1000) refresh();
  });
})();
