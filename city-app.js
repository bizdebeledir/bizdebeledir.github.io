"use strict";
/* Gülüş Şəhəri orchestrator, no polling loops or heavyweight 3D engine. */
(function(){
 const city=window.BBCity,metrics=window.BBMetrics;
 const api=window.BBDiscover,host=window;
 if(!city||!metrics||!api)return;
 const $=id=>document.getElementById(id);
 const root=$("city-stage"),body=$("city-stage-body"),hero=$("city-hero");
 if(!root||!body||!hero)return;
 let epoch=0,current="",cleanups=[];
 let videos=[],stats={},dataReady=false;
 let installEvent=null;
 // Direct entries also install the lightweight offline shell; never block rendering.
 if("serviceWorker" in navigator){
  navigator.serviceWorker.register("/sw.js").catch(()=>{});
 }
 const dataTask=Promise.all([
  fetch("/all-videos.json?v="+Math.floor(Date.now()/300000),{cache:"default"}).then(r=>{if(!r.ok)throw Error("VIDEOS_UNAVAILABLE");return r.json();}),
  fetch("/channel-stats.json?v="+Math.floor(Date.now()/300000),{cache:"default"}).then(r=>{if(!r.ok)throw Error("STATS_UNAVAILABLE");return r.json();})
 ]).then(([data,channel])=>{
  videos=city.normalizeVideos(data);
  stats=channel&&typeof channel==="object"?channel:{};
  dataReady=true;
  return true;
 }).catch(()=>false);
 function el(tag,text=null,cls="",parent=null){
  const x=document.createElement(tag);
  if(cls)x.className=cls;
  if(text!==null)x.textContent=String(text);
  if(parent)parent.append(x);
  return x;
 }
 function block(cls="city-card",parent=body){return el("div",null,cls,parent);}
 function button(txt,fn,cls="city-button",parent=body){
  const b=el("button",txt,cls,parent);b.type="button";b.addEventListener("click",fn);return b;
 }
 function link(txt,href,cls="city-primary",parent=body){
  const a=el("a",txt,cls,parent);a.href=href;
  return a;
 }
 function status(txt="",cls="city-status",parent=body){
  const p=el("p",txt,cls,parent);p.setAttribute("role","status");return p;
 }
 function safeStore(k,v){try{localStorage.setItem("bb_city_"+k,JSON.stringify(v));return true;}catch{return false;}}
 function safeRead(k,initial=null){
  try{const raw=localStorage.getItem("bb_city_"+k);return raw===null?initial:JSON.parse(raw);}catch{return initial;}
 }
 function viewerId(){
  let value=safeRead("client_id");
  if(typeof value==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value))return value;
  if(!crypto?.randomUUID)throw Error("BROWSER_NOT_SECURE");
  value=crypto.randomUUID();
  safeStore("client_id",value);
  return value;
 }
 async function endpoint(){
  const response=await fetch("/visitor-config.json?v="+Math.floor(Date.now()/600000),{cache:"no-store"});
  if(!response.ok)throw Error("NO_SERVICE_CONFIG");
  const data=await response.json();
  let target;
  try{target=new URL(data?.endpoint||"");}catch{throw Error("BAD_URL");}
  if(target.protocol!=="https:"||!(/^[a-z0-9-]+\.trycloudflare\.com$/.test(target.hostname)||
     /^bb-site-visitors\.[a-z0-9-]+\.workers\.dev$/.test(target.hostname)))
   throw Error("UNSAFE_BACKEND");
  return target.origin;
 }
 async function request(path,payload){
  const base=await endpoint();
  const ctl=new AbortController();
  const timer=setTimeout(()=>ctl.abort(),12000);
  try{
   const opts={credentials:"omit",mode:"cors",cache:"no-store",signal:ctl.signal};
   if(payload!==undefined){
    opts.method="POST";opts.headers={"Content-Type":"application/json"};opts.body=JSON.stringify(payload);
   }
   const r=await fetch(base+path,opts);
   const data=await r.json();
   return {status:r.status,data};
  }finally{clearTimeout(timer);}
 }
 async function share(title,description,url){
  try{
   if(navigator.share){await navigator.share({title,text:description,url});metrics.emit("share");return true;}
   if(navigator.clipboard?.writeText){
    await navigator.clipboard.writeText(description+" "+url);metrics.emit("share");return true;
   }
  }catch(e){if(e?.name==="AbortError")return null;}
  return false;
 }
 function video(v,parent=body,note="▶ Videoya bax"){
  if(!v || !(/^[A-Za-z0-9_-]{11}$/).test(v.id))return null;
  const a=link("", "/video/"+encodeURIComponent(v.id)+".html","city-video",parent);
  a.setAttribute("aria-label",city.videoTitle(v));
  const img=el("img",null,"",a);
  img.loading="lazy";img.decoding="async";img.alt="";img.width=153;img.height=97;
  img.src="https://i.ytimg.com/vi/"+encodeURIComponent(v.id)+"/hqdefault.jpg";
  const container=el("div",null,"city-video-body",a);
  el("strong",city.videoTitle(v),"",container);
  el("small",note+" · "+new Intl.NumberFormat("az-AZ").format(Math.max(0,Number(v.views)||0))+" baxış","",container);
  return a;
 }
 function destroy(){
  for(const f of cleanups.splice(0)){try{f();}catch{}}
  epoch++;
 }
 function back(){
  destroy();root.hidden=true;hero.hidden=false;current="";
  try{history.replaceState(null,"","/gulus-seheri.html");}catch{}
  hero.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth",block:"start"});
  metrics.emit("city_return");
 }
 function open(id){
  const zone=city.districts.find(d=>d.id===id);
  if(!zone)return false;
  destroy();
  current=id;
  const now=epoch;
  body.replaceChildren();
  $("city-stage-number").textContent="MƏKAN "+String(zone.num).padStart(2,"0")+" / 10";
  $("city-stage-emoji").textContent=zone.emoji;
  $("city-stage-title").textContent=zone.name;
  $("city-stage-desc").textContent=zone.desc;
  $("city-stage-label").textContent="GÜLÜŞ ŞƏHƏRİ";
  hero.hidden=true;root.hidden=false;
  try{
   const url=new URL("/gulus-seheri.html",location.origin);
   url.searchParams.set("zone",id);
   if(id==="doors"){
    const door=new URLSearchParams(location.search).get("door");
    if(city.doors.some(d=>d.id===door))url.searchParams.set("door",door);
   }
   history.replaceState(null,"",url);
  }catch{}
  const live=()=>epoch===now;
  const ctx={
   city,api,metrics,root:body,zone,el,block,button,link,status,live,open,back,
   safeRead,safeStore,viewerId,request,endpoint,share,video,
   data:()=>dataTask, videos:()=>videos,stats:()=>stats,ready:()=>dataReady,
   track:(event,area=id)=>metrics.emit(event,{area}),
   cleanup:cb=>cleanups.push(cb),
   clear:()=>body.replaceChildren(),
   empty:(parent=body)=>{const note=block("city-card",parent);el("p","Video məlumatları hazırda əlçatan deyil. İnternetə qoşulduqdan sonra yenidən yoxla.","city-small",note);link("Bütün videolar →","/videos.html","city-primary",note);},
   notify:(txt)=>status(txt),
   installed:()=>installEvent,
   setInstalled:(v)=>{installEvent=v}
  };
  const fn=window.BBCityModes?.[id];
  try{
   if(typeof fn!=="function")throw Error("MODE_NOT_FOUND");
   fn(ctx);
  }catch(e){
   body.replaceChildren();
   status("Bu məkan hazırda açılmadı. Şəhərə qayıdıb yenidən yoxla.","city-status error");
  }
  root.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth",block:"start"});
  metrics.emit("district_open",{area:id});
  return true;
 }
 function renderNav(){
  const container=$("city-districts");container.replaceChildren();
  city.districts.forEach(d=>{
   const a=link(d.emoji+" "+d.name,"?zone="+encodeURIComponent(d.id),"",container);
   a.addEventListener("click",e=>{e.preventDefault();open(d.id);});
  });
  document.querySelectorAll?.(".city-building[data-zone]").forEach(g=>{
   const id=g.dataset.zone;
   if(!city.districts.some(d=>d.id===id))return;
   g.setAttribute("role","button");g.setAttribute("tabindex","0");
   g.setAttribute("aria-label","Aç: "+city.districts.find(d=>d.id===id).name);
   g.addEventListener("click",()=>open(id));
   g.addEventListener("keydown",e=>{
    if(e.key==="Enter"||e.key===" "){e.preventDefault();open(id);}
   });
  });
 }
 host.addEventListener("beforeinstallprompt",e=>{
  e.preventDefault();installEvent=e;
 });
 $("city-back").addEventListener("click",back);
 renderNav();
 const zoneParam=new URLSearchParams(location.search).get("zone");
 if(!zoneParam||!open(zoneParam))metrics.emit("city_visit");
})();
