"use strict";
/* Lightweight site-wide interaction analytics and smart subscription prompt. */
(() => {
  const discovery = window.BBDiscover;
  const SITE = "https://bizdebeledir.github.io";
  const SUBSCRIBE = "https://www.youtube.com/@bizde.beledir?sub_confirmation=1";
  let toastTimeout;

  function track(name, fields = {}) {
    if (discovery) discovery.track(name, fields);
    else if (typeof window.gtag === "function") window.gtag("event", name, fields);
  }

  function toast(message) {
    let node = document.getElementById("bb-toast");
    if (!node) {
      node = document.createElement("div");
      node.id = "bb-toast";
      node.className = "bb-toast";
      node.setAttribute("role", "status");
      node.setAttribute("aria-live", "polite");
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => node.classList.remove("show"), 2600);
  }

  async function share(video) {
    if (!video || !discovery?.valid(video)) return;
    const title = discovery.title(video);
    const url = new URL(discovery.videoURL(video), SITE).href;
    try {
      if (navigator.share) {
        await navigator.share({title, text: "Bizdə Belədir 😂", url});
        track("share", {method:"native", content_type:"video", item_id:video.id});
        return;
      }
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        track("share", {method:"copy", content_type:"video", item_id:video.id});
        toast("Video linki kopyalandı ✓");
        return;
      }
      toast("Link: " + url);
    } catch (error) {
      if (error?.name !== "AbortError") toast("Paylaşmaq mümkün olmadı");
    }
  }

  const dismissed = (() => {
    try { return sessionStorage.getItem("bb_subscribe_dismissed") === "1"; }
    catch (_) { return false; }
  })();

  function installSubscribe() {
    if (dismissed || document.querySelector(".bb-subscribe")) return;
    const bar = document.createElement("aside");
    bar.className = "bb-subscribe";
    bar.setAttribute("aria-label", "YouTube abunə");
    bar.innerHTML =
      '<span class="bb-subscribe-label">😂 Videolar xoşuna gəldi?</span>' +
      '<a class="bb-subscribe-link" target="_blank" rel="noopener noreferrer" ' +
      'href="' + SUBSCRIBE + '">🔔 Abunə ol</a>' +
      '<button type="button" class="bb-subscribe-close" aria-label="Bağla">×</button>';
    document.body.appendChild(bar);
    let ticking = false;
    const update = () => {
      const show = window.scrollY >= 400 && document.visibilityState === "visible";
      bar.classList.toggle("visible", show);
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, {passive:true});
    document.addEventListener("visibilitychange", update);
    bar.querySelector(".bb-subscribe-close")?.addEventListener("click", () => {
      try { sessionStorage.setItem("bb_subscribe_dismissed", "1"); } catch (_) {}
      bar.remove();
    });
    update();
  }

  document.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const shareButton = target.closest("[data-share-video]");
    if (shareButton) {
      event.preventDefault();
      const vid = shareButton.getAttribute("data-share-video") || "";
      // Read-only, validated video dataset already cached by discovery-home/feed.
      const video = window.BBVids?.find(v => v.id === vid) || {id:vid,title:shareButton.getAttribute("data-title") || ""};
      share(video);
      return;
    }
    const link = target.closest("a[href]");
    if (!link) return;
    const href = link.getAttribute("href") || "";
    const videoMatch = href.match(/(?:^|\/)video\/([A-Za-z0-9_-]{11})\.html(?:[?#]|$)/);
    if (videoMatch) {
      discovery?.remember(videoMatch[1]);
      track("select_content", {content_type:"video", content_id:videoMatch[1]});
    } else if (/(?:^|\/)movzu\/([a-z]{2,15})\.html(?:[?#]|$)/.test(href)) {
      const topic = href.match(/(?:^|\/)movzu\/([a-z]{2,15})\.html(?:[?#]|$)/);
      if (topic) track("topic_open", {topic:topic[1]});
    } else if (/(?:^|\/)movzular\.html(?:[?#]|$)/.test(href)) {
      track("topic_index_open");
    } else if (/(?:youtube\.com|youtu\.be)/i.test(href)) {
      track("subscribe_click", {link_type:href.includes("sub_confirmation") ? "subscribe" : "youtube"});
    } else if (/(?:instagram\.com|tiktok\.com|t\.me|facebook\.com|threads\.com)/i.test(href)) {
      track("social_click", {network: href.includes("instagram") ? "instagram" :
        href.includes("tiktok") ? "tiktok" : href.includes("t.me") ? "telegram" :
        href.includes("facebook") ? "facebook" : "threads"});
    } else if (href.includes("shorts.html")) {
      track("shorts_feed_open");
    }
  });

  window.BBAction = Object.freeze({track,share,toast});
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installSubscribe, {once:true});
  } else {
    installSubscribe();
  }
})();
