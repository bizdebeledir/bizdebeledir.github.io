"use strict";
/* Bizdə Belədir: deterministik video tövsiyələri. AI API və yeni xərc tələb etmir. */
(function (host) {
  const TOPICS = Object.freeze([
    { id: "all", label: "Hamısı", pattern: null },
    { id: "couple", label: "❤️ Ər-arvad", pattern: /\b(er|arvad|heyat yoldasi|kisi qadin|evlilik|gelin|qay[nıi]ana)\b/ },
    { id: "home", label: "🏠 Ev", pattern: /\b(evde|evdeki|ev|otaq|divan|yataq|soyuducu|qapi|metbex|ana|ata)\b/ },
    { id: "kids", label: "👶 Uşaq", pattern: /\b(usaq|usaqlar|bala|oyuncaq|mekteb|korp[eə]|ogl[ua]|qizim)\b/ },
    { id: "social", label: "🚶 Dost-qonşu", pattern: /\b(qonsu|dost|tanis|salam|qonaq|toy|meslis|kuc[eə])\b/ },
    { id: "work", label: "💼 İş", pattern: /\b(is|isde|isci|ofis|mudir|maas|fasil[eə]|rehber|isci)\b/ },
    { id: "shopping", label: "🛒 Market", pattern: /\b(market|magaza|pul|qiymet|terminal|kassa|alisveris|kart|satici)\b/ }
  ]);
  const VALID_ID = /^[a-zA-Z0-9_-]{11}$/;
  const HISTORY = "bizde_videos_seen_v2";
  const TOPIC = "bizde_preferred_topic_v2";

  function fold(input) {
    const chars = { "ə":"e","ğ":"g","ı":"i","ö":"o","ş":"s","ç":"c","ü":"u",
      "Ə":"e","Ğ":"g","İ":"i","Ö":"o","Ş":"s","Ç":"c","Ü":"u" };
    return String(input || "").split("").map(c => chars[c] || c)
      .join("").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  }

  function title(video) {
    return String(video?.title || "Bizdə Belədir").split("#")[0].trim()
      .slice(0, 100) || "Bizdə Belədir";
  }

  function categories(video) {
    const words = fold([video?.title || "", video?.description || ""].join(" "));
    return TOPICS.filter(t => t.pattern && t.pattern.test(words)).map(t => t.id);
  }

  function topicMatch(video, id) {
    return !id || id === "all" || categories(video).includes(id);
  }

  function valid(v) {
    return v && typeof v === "object" && VALID_ID.test(String(v.id || ""));
  }

  function list(items) {
    if (!Array.isArray(items)) return [];
    const seen = new Set();
    return items.filter(v => {
      if (!valid(v) || seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });
  }

  function storageGet(key) {
    try { return host.localStorage?.getItem(key) || ""; } catch (_) { return ""; }
  }
  function storageSet(key, val) {
    try { host.localStorage?.setItem(key, val); } catch (_) { /* private browsing */ }
  }

  function seen() {
    try {
      const arr = JSON.parse(storageGet(HISTORY) || "[]");
      return Array.isArray(arr) ? arr.filter(x => VALID_ID.test(x)).slice(0, 24) : [];
    } catch (_) { return []; }
  }
  function remember(videoId) {
    if (!VALID_ID.test(String(videoId))) return;
    const history = [videoId, ...seen().filter(x => x !== videoId)].slice(0, 24);
    storageSet(HISTORY, JSON.stringify(history));
  }
  function preference() {
    const v = storageGet(TOPIC);
    return TOPICS.some(x => x.id === v) ? v : "all";
  }
  function setPreference(id) {
    if (TOPICS.some(x => x.id === id)) storageSet(TOPIC, id);
  }

  function localDay() {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Baku", year: "numeric", month: "2-digit", day: "2-digit"
      }).format(new Date());
    } catch (_) {
      return new Date().toISOString().slice(0, 10);
    }
  }
  function hash(text) {
    let h = 2166136261;
    for (const c of String(text)) {
      h ^= c.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function dayPick(items, day = localDay()) {
    const vids = list(items).sort((a, b) =>
      (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0));
    if (!vids.length) return null;
    const freshest = vids.slice(0, Math.min(20, vids.length));
    // Fresh candidates are weighted by verified YouTube views. Only real JSON data.
    const candidates = [...freshest].sort((a, b) =>
      Number(b.views || 0) - Number(a.views || 0)).slice(0, Math.min(12, freshest.length));
    return candidates[hash(day) % candidates.length];
  }

  function recommend(items, limit = 3, selectedTopic = preference(), currentId = "") {
    const videos = list(items).filter(v => v.id !== currentId);
    const history = new Set(seen());
    if (!videos.length) return [];
    const now = Date.now();
    const primary = videos.filter(v => topicMatch(v, selectedTopic));
    const candidates = primary.length >= Math.min(limit, videos.length)
      ? primary
      : [...primary, ...videos.filter(v => !primary.some(x => x.id === v.id))];
    const maxViews = Math.max(1, ...candidates.map(v => Number(v.views) || 0));
    return candidates.map((v, i) => {
      const age = Math.max(0, now - (Date.parse(v.publishedAt) || now)) / 86400000;
      const recency = 1 / (1 + age / 30);
      const popularity = Math.log1p(Math.max(0, Number(v.views) || 0)) / Math.log1p(maxViews);
      const tagScore = selectedTopic !== "all" && topicMatch(v, selectedTopic) ? 1 : 0;
      const already = history.has(v.id) ? -2 : 0;
      return {v,score:recency * .45 + popularity * .35 + tagScore * .20 + already,
        stable: hash(String(v.id) + i) / 4294967296};
    }).sort((a,b) => (b.score-a.score) || (a.stable-b.stable))
      .slice(0,Math.min(Math.max(1,limit),12)).map(item => item.v);
  }

  function videoURL(video) {
    return valid(video) ? "/video/" + encodeURIComponent(video.id) + ".html" : "/videos.html";
  }

  function track(event, params = {}) {
    try {
      if (typeof host.gtag === "function") host.gtag("event", event, params);
    } catch (_) { /* analytics is optional */ }
  }

  host.BBDiscover = Object.freeze({
    topics: TOPICS.map(({id,label}) => ({id,label})), valid, list, fold,
    title, categories, topicMatch, localDay, dayPick, recommend, videoURL,
    seen, remember, preference, setPreference, track
  });
})(typeof window !== "undefined" ? window : globalThis);

if (typeof module !== "undefined" && module.exports) {
  module.exports = globalThis.BBDiscover;
}
