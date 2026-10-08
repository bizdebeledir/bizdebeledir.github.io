"use strict";
(() => {
  const d=window.BBDiscover;
  const root=document.getElementById("favorite-list");
  const recent=document.getElementById("recent-list");
  if(!d||!root||!recent)return;
  let videos=[];
  function card(v,canRemove){
    const article=document.createElement("article");article.className="ph-card";
    const link=document.createElement("a");link.href=d.videoURL(v);
    const img=document.createElement("img");img.alt="";img.loading="lazy";img.decoding="async";
    img.width=320;img.height=200;img.src="https://i.ytimg.com/vi/"+v.id+"/hqdefault.jpg";
    link.appendChild(img);
    const body=document.createElement("div");body.className="ph-card-body";
    const title=document.createElement("h3");title.textContent=d.title(v);
    const meta=document.createElement("div");meta.className="ph-card-meta";
    meta.textContent="👁 "+new Intl.NumberFormat("az-AZ").format(Number(v.views)||0)+" baxış";
    const play=document.createElement("a");play.className="ph-card-btn";play.href=d.videoURL(v);play.textContent="▶ İzlə";
    body.append(title,meta,play);
    if(canRemove){
      const remove=document.createElement("button");remove.className="ph-card-btn alt";
      remove.textContent="♥ Sil";remove.type="button";
      remove.addEventListener("click",()=>{
        d.toggleFavorite(v.id);
        d.track("bb_favorite_click",{action:"remove",video_id:v.id,source:"favorites"});
        render();
      });
      body.appendChild(remove);
    }
    article.append(link,body);return article;
  }
  function draw(container,ids,empty,canRemove){
    container.replaceChildren();
    const map=new Map(videos.map(v=>[v.id,v]));
    const found=ids.map(id=>map.get(id)).filter(Boolean);
    if(!found.length){
      const span=document.createElement("p");span.className="ph-empty";span.textContent=empty;
      container.appendChild(span);return;
    }
    container.append(...found.map(v=>card(v,canRemove)));
  }
  function render(){
    draw(root,d.favorites(),"Hələ sevimli videon yoxdur. Bir videoya baxıb ♥ işarəsini bas.",true);
    draw(recent,d.seen(),"Hələ bu brauzerdə izlənmiş videon yoxdur.",false);
  }
  fetch("/all-videos.json?v="+Math.floor(Date.now()/300000))
    .then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json();})
    .then(data=>{videos=d.list(data);render();})
    .catch(()=>{root.textContent="Video siyahısı indi yüklənmir. Daha sonra yenidən yoxla.";});
})();
