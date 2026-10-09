"use strict";
/* Dynamic topic refresh: static HTML remains fully useful without JavaScript. */
(function(){
 const root=document.querySelector("[data-topic]"),core=window.BBStudio;
 if(!root||!core)return;
 const slug=root.dataset.topic;
 if(!core.topics.some(t=>t.slug===slug))return;
 try{window.BBMetrics?.emit("topic_open",{area:"topic"});}catch{}
 const holder=document.getElementById("topic-current-videos");
 if(!holder)return;
 fetch("/all-videos.json",{cache:"default"})
  .then(r=>{if(!r.ok)throw Error("UNAVAILABLE");return r.json();})
  .then(raw=>{
   if(!Array.isArray(raw))return;
   const videos=core.videosFor(raw,[slug],15);
   const exists=new Set([...holder.querySelectorAll("a[href]")].map(x=>new URL(x.href,location.href).pathname));
   let added=0;
   for(const v of videos){
    if(!/^[A-Za-z0-9_-]{11}$/.test(v.id))continue;
    const href="/video/"+v.id+".html";
    if(exists.has(href))continue;
    if(added===0 && holder.querySelectorAll(".studio-video").length===0)holder.replaceChildren();
    const card=document.createElement("a");
    card.className="studio-video topic-card";card.href=href;
    const img=document.createElement("img");
    img.src="https://i.ytimg.com/vi/"+encodeURIComponent(v.id)+"/hqdefault.jpg";
    img.loading="lazy";img.decoding="async";img.alt="";img.width=135;img.height=85;
    const text=document.createElement("div");
    const title=document.createElement("strong");
    title.textContent=core.title(v);
    const small=document.createElement("small");
    small.textContent="🎬 Real videonu aç ↗";
    text.append(title,small);card.append(img,text);
    holder.prepend(card);exists.add(href);added++;
   }
  }).catch(()=>{/* Keep crawlable static matches on network errors. */});
})();
