"use strict";
(() => {
  const d=window.BBDiscover;
  const root=document.getElementById("trending-list");
  const state=document.getElementById("trending-state");
  if(!d||!root||!state)return;
  const stamp=Math.floor(Date.now()/300000);
  Promise.all([
    fetch("/all-videos.json?v="+stamp).then(r=>{if(!r.ok)throw Error("Videos unavailable");return r.json();}),
    fetch("/channel-stats.json?v="+stamp).then(r=>{if(!r.ok)throw Error("Stats unavailable");return r.json();})
  ]).then(([data,stats])=>{
    const videos=d.list(data);
    const map=new Map(videos.map(v=>[v.id,v]));
    let list=[];
    let recent=false;
    const trends=stats?.trends;
    if(trends?.available && Number.isFinite(trends.observedAt) &&
      Date.now()/1000-trends.observedAt<=36*3600 &&
      trends.windowHours>=18 && trends.windowHours<=30) {
      list=(trends.videos||[]).map(t=>({
        video:map.get(t.id),
        delta:Number(t.delta)
      })).filter(x=>x.video && Number.isFinite(x.delta) && x.delta>=0);
      recent=list.length>0;
    }
    if(recent){
      state.textContent="Təsdiqlənmiş YouTube baxış dəyişimi: son təxminən "+
        Number(trends.windowHours).toFixed(1)+" saat. Real vaxt göstəricisi deyil.";
    }else{
      state.textContent="24 saatlıq trend üçün hələ kifayət qədər iki ayrı ölçmə yoxdur. Aşağıda yalnız ümumi baxışa görə populyar videolar göstərilir.";
      list=[...videos].sort((a,b)=>Number(b.views||0)-Number(a.views||0))
        .slice(0,12).map(video=>({video,delta:null}));
    }
    root.replaceChildren();
    for(const [i,item] of list.slice(0,12).entries()){
      const v=item.video;
      const art=document.createElement("article");art.className="ph-card";
      const img=document.createElement("img");
      img.src="https://i.ytimg.com/vi/"+v.id+"/hqdefault.jpg";
      img.loading="lazy";img.decoding="async";img.alt="";
      const link=document.createElement("a");
      link.href=d.videoURL(v);link.append(img);
      const body=document.createElement("div");body.className="ph-card-body";
      const title=document.createElement("h3");title.textContent=(i+1)+". "+d.title(v);
      const meta=document.createElement("span");meta.className="ph-card-meta";
      meta.textContent=item.delta===null
        ?new Intl.NumberFormat("az-AZ").format(Number(v.views)||0)+" ümumi baxış"
        :"+"+new Intl.NumberFormat("az-AZ").format(item.delta)+" baxış (ölçmə arası)";
      const view=document.createElement("a");
      view.href=d.videoURL(v);view.className="ph-card-btn";view.textContent="▶ İzlə";
      body.append(title,meta,view);art.append(link,body);root.append(art);
    }
  }).catch(()=>{
    state.textContent="Trend məlumatı hazırda əlçatan deyil.";root.replaceChildren();
  });
})();
