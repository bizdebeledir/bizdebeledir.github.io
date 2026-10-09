"use strict";
/* Phase II: local favorites, A/B CTA, navigation, opt-in notification routes. */
(() => {
  if(!window.BBMetrics && !document.querySelector('script[data-bb-city-metrics]')){
    const m=document.createElement("script");
    m.src="/city-metrics.js";m.defer=true;m.dataset.bbCityMetrics="true";
    document.head.appendChild(m);
  }
  const d=window.BBDiscover;
  if(!d)return;
  const css=document.createElement("link");
  css.rel="stylesheet";
  css.href="/phase2.css";
  document.head.appendChild(css);

  function a(label,href,extraClass="") {
    const el=document.createElement("a");
    el.href=href;el.textContent=label;
    if(extraClass)el.className=extraClass;
    return el;
  }
  function favoriteButton(videoId) {
    const button=document.createElement("button");
    button.type="button";
    button.className="bb-favorite";
    button.setAttribute("aria-label","Videonu sevimlilərə əlavə et");
    const refresh=()=>{
      const selected=d.isFavorite(videoId);
      button.textContent=selected?"❤️ Sevimlilərdə":"🤍 Sevimlilərə əlavə et";
      button.setAttribute("aria-pressed",String(selected));
      button.setAttribute("aria-label",selected?"Videonu sevimlilərdən çıxar":"Videonu sevimlilərə əlavə et");
    };
    button.addEventListener("click",()=>{
      const added=d.toggleFavorite(videoId);
      d.track("bb_favorite_click",{video_id:videoId,action:added?"add":"remove"});
      refresh();
    });
    refresh();
    return {button,refresh};
  }

  const match=location.pathname.match(/\/video\/([A-Za-z0-9_-]{11})\.html$/);
  if(match){
    const area=document.querySelector("main .buttons")||document.querySelector("main");
    if(area){
      const fav=favoriteButton(match[1]);
      const row=document.createElement("div");
      row.className="phase2-video-actions";
      row.append(fav.button,a("❤️ Sevimlilərə bax","/favorites.html","bb-action-link"));
      area.insertAdjacentElement("afterend",row);
    }
  }

  if(location.pathname.endsWith("/shorts.html")){
    const controls=document.querySelector(".feed-controls");
    if(controls) {
      let current=null;
      let currentId="";
      const btn=document.createElement("button");
      btn.type="button";btn.id="feed-favorite";btn.title="Sevimlilər";
      btn.textContent="♡";btn.setAttribute("aria-label","Videonu sevimlilərə əlavə et");
      btn.addEventListener("click",()=>{
        if(!currentId)return;
        const added=d.toggleFavorite(currentId);
        d.track("bb_favorite_click",{video_id:currentId,action:added?"add":"remove",source:"shorts"});
        showFavorite();
      });
      function showFavorite(){
        const saved=!!currentId&&d.isFavorite(currentId);
        btn.textContent=saved?"♥":"♡";
        btn.setAttribute("aria-pressed",String(saved));
        btn.disabled=!currentId;
      }
      controls.appendChild(btn);
      controls.appendChild(a("♥","/favorites.html","feed-favs-link"));
      window.addEventListener("bb:feed-change",ev=>{
        currentId=d.valid(ev.detail)?ev.detail.id:"";
        showFavorite();
      });
      showFavorite();
    }
  }

  const hero=document.querySelector("header.hero");
  if(hero){
    const nav=document.createElement("nav");
    nav.className="phase2-nav";
    nav.setAttribute("aria-label","Yeni video bölmələri");
    nav.append(
      a("🎡 20 Oyun","/yumor-parki.html"),
      a("🧬 Yumor DNT","/yumor-dnt.html"),
      a("🔥 Trenddə","/trending.html"),
      a("❤️ Sevimlilər","/favorites.html"),
      a("💡 İdeya göndər","/ideas.html")
    );
    const target=hero.querySelector(".main-social");
    if(target){
      target.insertAdjacentElement("afterend",nav);
      // Local A/B comparison: randomized once per browser, no claim of uplift.
      const variant=d.experimentGroup();
      const label=target.querySelector(".main-social-left span:last-child");
      if(label){
        label.textContent=variant==="B"?"😂 Daha çox video üçün YouTube-a keç":"YouTube kanalına keç";
      }
      target.dataset.abVariant=variant;
      let marked=false;
      try{
        const stamp="bb_ab_seen_"+variant+"_"+d.localDay();
        if(sessionStorage.getItem(stamp)!=="1"){
          sessionStorage.setItem(stamp,"1");
          marked=true;
        }
      }catch{marked=true;}
      if(marked)d.track("bb_ab_exposure",{experiment:"youtube_cta_v1",variant});
      target.addEventListener("click",()=>d.track("bb_ab_click",{
        experiment:"youtube_cta_v1",variant
      }));
    }
    const last=d.lastWatched();
    if(last){
      const resume=a("▶ Son baxdığın videoya qayıt",d.videoURL({id:last}),"phase2-resume");
      nav.insertAdjacentElement("afterend",resume);
    }
    const notify=document.createElement("section");
    notify.className="phase2-notification";
    notify.setAttribute("aria-label","Yeni videolardan xəbərdar ol");
    const h=document.createElement("strong");
    h.textContent="🔔 Yeni videoları qaçırma";
    const p=document.createElement("p");
    p.textContent="Bildiriş üçün Telegram kanalını izlə və ya YouTube-da zəngi aktiv et.";
    const links=document.createElement("div");
    const tele=a("Telegram kanalı ↗","https://t.me/Bizdebeledir");
    const youtube=a("YouTube-da abunə ol ↗","https://www.youtube.com/@bizde.beledir?sub_confirmation=1");
    for(const item of [tele,youtube]){
      item.target="_blank";item.rel="noopener noreferrer";
      item.addEventListener("click",()=>d.track("bb_notification_optin_click",{destination:item===tele?"telegram":"youtube"}));
    }
    links.append(tele,youtube);
    notify.append(h,p,links);
    nav.insertAdjacentElement("afterend",notify);
  }
})();
