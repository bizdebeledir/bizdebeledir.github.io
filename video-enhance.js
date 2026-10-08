"use strict";
/* Related content + native social sharing on existing generated video pages. */
(() => {
  const d=window.BBDiscover;
  if(!d)return;
  const match=location.pathname.match(/\/video\/([A-Za-z0-9_-]{11})\.html$/);
  if(!match)return;
  const id=match[1];
  const url=new URL(location.pathname,location.origin).href;
  const main=document.querySelector("main");
  if(!main)return;
  const bar=document.createElement("div");
  bar.className="bb-share-strip";
  const caption=document.createElement("span");
  caption.textContent="😂 Dostuna göndər:";
  function link(label,target,platform) {
    const a=document.createElement("a");
    a.textContent=label;
    a.href=target;
    a.target="_blank";
    a.rel="noopener noreferrer";
    a.addEventListener("click",()=>{
      d.track("share",{content_type:"video",item_id:id,method:platform});
    });
    return a;
  }
  const wa=link("WhatsApp","https://api.whatsapp.com/send?text="+encodeURIComponent("Bizdə Belədir 😂 "+url),"whatsapp");
  const tg=link("Telegram","https://t.me/share/url?url="+encodeURIComponent(url)+"&text="+encodeURIComponent("Bizdə Belədir 😂"),"telegram");
  bar.append(caption,wa,tg);
  const recTitle=Array.from(main.querySelectorAll("h2")).find(x=>
    /oxşar|başqa|tövsiyə/i.test(x.textContent||""));
  if(recTitle)recTitle.insertAdjacentElement("beforebegin",bar);
  else main.appendChild(bar);

  const style=document.createElement("style");
  style.textContent=
    ".bb-share-strip{display:flex;gap:9px;align-items:center;flex-wrap:wrap;" +
    "margin:19px 0 23px;padding:12px;border:1px solid #303030;border-radius:15px;" +
    "background:#141414;color:white}" +
    ".bb-share-strip span{font-size:13px;font-weight:750}" +
    ".bb-share-strip a{padding:9px 12px;border-radius:10px;background:#252525;" +
    "color:white;text-decoration:none;font-size:12px;font-weight:800}" +
    ".bb-share-strip a:focus-visible{outline:3px solid #88e5c0}";
  document.head.appendChild(style);

  // Static recommendations are retained if the JSON request fails.
  const grid=main.querySelector(".rec-grid");
  if(!grid)return;
  fetch("/all-videos.json?v="+Math.floor(Date.now()/600000))
    .then(r=>{if(!r.ok)throw Error("Video index offline");return r.json();})
    .then(items=>{
      const videos=d.list(items);
      window.BBVids=videos;
      const current=videos.find(v=>v.id===id);
      const selected=d.preference()!=="all"
        ?d.preference()
        : current && d.categories(current)[0] || "all";
      const choices=d.recommend(videos,3,selected,id);
      if(!choices.length)return;
      const links=choices.map(v=>{
        const a=document.createElement("a");
        a.className="rec";
        a.href=d.videoURL(v);
        a.dataset.recommendedVideo=v.id;
        const img=document.createElement("img");
        img.loading="lazy";img.decoding="async";
        img.width=130;img.height=75;
        img.alt="";
        img.src="https://i.ytimg.com/vi/"+v.id+"/hqdefault.jpg";
        const body=document.createElement("div");
        body.className="rec-info";
        const title=document.createElement("strong");title.textContent=d.title(v);
        const label=document.createElement("span");
        label.textContent="👁 "+new Intl.NumberFormat("az-AZ").format(Number(v.views)||0)+" baxış";
        body.append(title,label);
        a.append(img,body);
        return a;
      });
      grid.replaceChildren(...links);
    })
    .catch(()=>{/* Offline: preserve existing recommendations */});
})();
