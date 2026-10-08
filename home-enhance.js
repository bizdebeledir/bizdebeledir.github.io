"use strict";
/* #2 daily spotlight, #4 topics, #5 local recommendation rules */
(() => {
  const d = window.BBDiscover;
  if (!d) return;
  const nodes = {
    cover: document.getElementById("bb-feature-cover"),
    title: document.getElementById("bb-feature-title"),
    views: document.getElementById("bb-feature-views"),
    link: document.getElementById("bb-feature-link"),
    share: document.getElementById("bb-feature-share"),
    chips: document.getElementById("bb-topic-chips"),
    items: document.getElementById("bb-recommended"),
    label: document.getElementById("bb-topic-summary")
  };
  if (!nodes.link || !nodes.items) return;
  let vids = [];
  let selected = d.preference();

  function card(video) {
    const a = document.createElement("a");
    a.className = "bb-discovery-card";
    a.href = d.videoURL(video);
    a.setAttribute("aria-label", d.title(video));
    const img = document.createElement("img");
    img.src = "https://i.ytimg.com/vi/" + encodeURIComponent(video.id) + "/hqdefault.jpg";
    img.alt = "";
    img.width = 160;
    img.height = 100;
    img.loading = "lazy";
    img.decoding = "async";
    const text = document.createElement("span");
    text.className = "bb-discovery-copy";
    const title = document.createElement("strong");
    title.textContent = d.title(video);
    const caption = document.createElement("small");
    caption.textContent = "👁 " + new Intl.NumberFormat("az-AZ").format(Number(video.views) || 0) + " baxış";
    text.append(title, caption);
    a.append(img, text);
    return a;
  }

  function updateRecommendations() {
    if (!vids.length) return;
    const choice = d.recommend(vids, 3, selected);
    nodes.items.replaceChildren(...choice.map(card));
    if (nodes.label) {
      const topic = d.topics.find(x => x.id === selected);
      nodes.label.textContent = selected !== "all" && choice.some(v => d.topicMatch(v, selected))
        ? (topic?.label || "Seçilən mövzu") + " • Sənin üçün 3 video"
        : "Yeni və populyar videolardan seçildi";
    }
    for (const button of nodes.chips.querySelectorAll("button")) {
      const active = button.dataset.topic === selected;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    }
  }

  function update(videos) {
    vids = d.list(videos);
    if (!vids.length) return;
    window.BBVids = vids;
    const featured = d.dayPick(vids);
    if (featured) {
      nodes.link.href = d.videoURL(featured);
      nodes.link.setAttribute("aria-label", d.title(featured));
      nodes.cover.src = "https://i.ytimg.com/vi/" + encodeURIComponent(featured.id) + "/hqdefault.jpg";
      nodes.cover.alt = d.title(featured);
      nodes.title.textContent = d.title(featured);
      nodes.views.textContent = new Intl.NumberFormat("az-AZ").format(Number(featured.views) || 0) + " baxış";
      nodes.share.dataset.shareVideo = featured.id;
      nodes.share.dataset.title = d.title(featured);
      nodes.share.disabled = false;
      nodes.link.classList.add("ready");
    }
    const fragment = document.createDocumentFragment();
    d.topics.forEach(topic => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.textContent = topic.label;
      chip.className = "bb-topic-chip";
      chip.dataset.topic = topic.id;
      chip.addEventListener("click", () => {
        selected = topic.id;
        d.setPreference(selected);
        d.track("select_content", {content_type:"topic", content_id:selected});
        updateRecommendations();
      });
      fragment.appendChild(chip);
    });
    nodes.chips.replaceChildren(fragment);
    updateRecommendations();
  }

  window.addEventListener("bb:videos-ready", evt => update(evt.detail));
  if (Array.isArray(window.BBVids) && window.BBVids.length) update(window.BBVids);
})();
