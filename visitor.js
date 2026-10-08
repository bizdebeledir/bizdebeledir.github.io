"use strict";

/* Bizdə Belədir: anonymous, lightweight visitor counts since deployment. */
(() => {
  const ROOT = "https://bizdebeledir.github.io";
  if (location.origin !== ROOT) return;

  const onlineElement = document.getElementById("visitor-now");
  const dayElement = document.getElementById("visitor-day");
  const weekElement = document.getElementById("visitor-week");
  const infoElement = document.getElementById("visitor-info");
  const signal = document.getElementById("visitor-signal");
  const isHome = Boolean(onlineElement && dayElement && weekElement);
  let endpoint = "";
  let visitorId = "";
  let working = false;

  function offline() {
    if (!isHome) return;
    for (const element of [onlineElement, dayElement, weekElement]) {
      element.textContent = "—";
    }
    if (signal) { signal.classList.remove("connected"); signal.textContent = "BAĞLANTI YOX"; }
    if (infoElement) infoElement.textContent = "Canlı məlumat hazırda əlçatan deyil";
  }

  function id() {
    const key = "bizde_site_anon_visitor_v1";
    try {
      const existing = localStorage.getItem(key);
      if (existing && /^[0-9a-f-]{36}$/.test(existing)) return existing;
    } catch (_) {
      // Browsers may block localStorage. In-memory fallback follows.
    }
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 15) | 64;
    b[8] = (b[8] & 63) | 128;
    const h = [...b].map(n => n.toString(16).padStart(2, "0")).join("");
    const result = [
      h.slice(0, 8),
      h.slice(8, 12),
      h.slice(12, 16),
      h.slice(16, 20),
      h.slice(20)
    ].join("-");
    try { localStorage.setItem(key, result); } catch (_) { }
    return result;
  }

  async function fetchLimited(url, options = {}) {
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 8000);
    try {
      const response = await fetch(url, {
        cache: "no-store",
        mode: "cors",
        credentials: "omit",
        signal: abort.signal,
        ...options
      });
      if (!response.ok) throw new Error("HTTP " + response.status);
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  async function config() {
    const response = await fetchLimited(
      "/visitor-config.json?v=" + Math.floor(Date.now() / 60000),
      {mode: "same-origin"}
    );
    const url = typeof response.endpoint === "string"
      ? response.endpoint.trim().replace(/\/+$/, "")
      : "";
    if (!/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/.test(url)) {
      throw new Error("Visitor backend not configured");
    }
    endpoint = url;
  }

  function render(data) {
    if (!isHome) return;
    if (!data || !data.ok ||
        !["online", "last24h", "last7d"].every(
          key => Number.isSafeInteger(data[key]) && data[key] >= 0
        )) {
      offline();
      return;
    }

    const fmt = number => new Intl.NumberFormat("az-AZ").format(number);
    onlineElement.textContent = fmt(data.online);
    dayElement.textContent = fmt(data.last24h);
    weekElement.textContent = fmt(data.last7d);
    if (signal) { signal.classList.add("connected"); signal.textContent = "CANLI"; }

    const started = Number(data.trackedSince) || 0;
    let note = "İndi: son 5 dəqiqə • Fərqli brauzerlər";
    if (started && Date.now() - started * 1000 < 604800000) {
      note = "Ölçmə başladığı gündən • İndi: son 5 dəqiqə";
    }
    if (infoElement) infoElement.textContent = note;
  }

  async function heartbeat() {
    if (working || document.visibilityState !== "visible") return;
    working = true;
    try {
      if (!endpoint) await config();
      const ping = async () => fetchLimited(endpoint + "/v1/ping", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({id: visitorId})
      });
      let result;
      try {
        result = await ping();
      } catch (_) {
        // Tunnel URL may change after a phone/network restart.
        await config();
        result = await ping();
      }
      render(result);
    } catch (_) {
      offline();
    } finally {
      working = false;
    }
  }

  visitorId = id();
  heartbeat();

  // Low overhead: one small request every 90 seconds, only while visible.
  setInterval(heartbeat, 90000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") heartbeat();
  });
})();
