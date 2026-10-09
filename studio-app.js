"use strict";
/* Yumor Studiyası interaction shell. Video is never autoplayed. */
(function(){
 const core=window.BBStudio,api=window.BBDiscover;
 if(!core||!api)return;
 const get=id=>document.getElementById(id);
 const root=get("studio-panel-body"),nav=get("studio-nav");
 if(!root||!nav)return;
 const tabs=[
  {id:"bingo",emoji:"🎯",title:"Məişət BINGO-su",summary:"25 tanış situasiyanı işarələ, nəticəni 9:16 şəkil kimi saxla"},
  {id:"poster",emoji:"🖼️",title:"Yumor Mem Kartı",summary:"Real video başlığını öz gülməli ifadənlə 9:16 posterdə paylaş"},
  {id:"playlist",emoji:"📼",title:"Dostuma 5 video",summary:"Beş real video seç, sırala və bir keçidlə paylaş"},
  {id:"qr",emoji:"📱",title:"QR Yumor Dəvətnaməsi",summary:"Real videonu dostuna QR kodla ötür, kod cihazında yaradılır"},
  {id:"archive",emoji:"🕰️",title:"Video Zaman Maşını",summary:"Bu tarixdə yayımlanan köhnə səhnələri və arxivdən seçilənləri kəşf et"},
  {id:"series",emoji:"🎞️",title:"Məişət Mini-Serialları",summary:"Real videolardan mövzuya görə seçilən beş qısa kolleksiya"},
  {id:"insights",emoji:"📊",title:"Şəxsi Studiyam",summary:"Bu brauzerdəki istifadə tarixçəsinə və təsdiqlənmiş kliklərə bax"}
 ];
 if(navigator.serviceWorker?.register){
  navigator.serviceWorker.register("/sw.js").catch(()=>{});
 }
 let active=null,epoch=0,cleanups=[];
 let videos=[],loaded=false,error=false;
 const loading=fetch("/all-videos.json",{cache:"default"}).then(r=>{if(!r.ok)throw Error("VIDEO_LOAD_ERROR");return r.json();})
  .then(v=>{videos=api.list(v);loaded=true;return videos;})
  .catch(()=>{error=true;return [];});
 function el(tag,content=null,cl="",parent=root){
  const e=document.createElement(tag);
  if(content!==null)e.textContent=String(content);
  if(cl)e.className=cl;
  if(parent)parent.appendChild(e);
  return e;
 }
 function block(cls="studio-card",parent=root){return el("div",null,cls,parent);}
 function button(label,callback,cls="studio-button",parent=root){
  const b=el("button",label,cls,parent);b.type="button";b.addEventListener("click",callback);return b;
 }
 function link(label,href,cl="studio-primary",parent=root){
  const a=el("a",label,cl,parent);a.href=href;return a;
 }
 function status(message="",parent=root){const p=el("p",message,"studio-status",parent);p.setAttribute("role","status");return p;}
 function read(key,initial=null){
  try{const value=localStorage.getItem("bb_studio_"+key);return value===null?initial:JSON.parse(value);}catch{return initial;}
 }
 function write(key,value){
  try{localStorage.setItem("bb_studio_"+key,JSON.stringify(value));return true;}catch{return false;}
 }
 function metrics(event,area="studio"){
  try{window.BBMetrics?.emit(event,{area});}catch{}
 }
 function video(v,parent=root,note="▶ Videonu aç"){
  if(!api.valid(v))return null;
  const a=link("",api.videoURL(v),"studio-video",parent);
  a.setAttribute("aria-label",core.title(v));
  const img=el("img",null,"",a);
  img.src="https://i.ytimg.com/vi/"+encodeURIComponent(v.id)+"/hqdefault.jpg";
  img.alt="";img.loading="lazy";img.decoding="async";img.width=135;img.height=85;
  const item=el("div",null,"",a);
  el("strong",core.title(v),"",item);
  el("small",note+" · "+new Intl.NumberFormat("az-AZ").format(Number(v.views)||0)+" baxış","",item);
  // city-metrics.js handles actual anchor click once at document capture.
  return a;
 }
 function empty(parent=root){
  const box=block("studio-card",parent);
  el("p",error?"Video siyahısını yükləmək alınmadı. İnterneti yoxla.":"Bu mövzuda uyğun video yoxdur.","studio-muted",box);
  link("Bütün videolar →","/videos.html","studio-button",box);
 }
 async function share(title,text,url,after){
  try{
   if(navigator.share){
    await navigator.share({title,text,url});
    metrics("share");after?.(true);return true;
   }
   if(navigator.clipboard?.writeText){
    await navigator.clipboard.writeText((text||"")+" "+url);
    metrics("share");after?.(true);return true;
   }
  }catch(e){if(e?.name==="AbortError"){after?.(null);return null;}}
  after?.(false);return false;
 }
 function wrap(ctx,text,maxWidth,lineHeight,maxLines=8){
  let lines=[],current="";
  for(const part of String(text).split(/\s+/)){
   const next=current?current+" "+part:part;
   if(current&&ctx.measureText(next).width>maxWidth){lines.push(current);current=part;}
   else current=next;
  }
  if(current)lines.push(current);
  if(lines.length>maxLines){lines=lines.slice(0,maxLines);lines[maxLines-1]=lines[maxLines-1].slice(0,-1)+"…";}
  return lines;
 }
 function downloadCanvas(canvas,filename,onSuccess){
  if(typeof canvas.toBlob!=="function")return Promise.resolve(false);
  return new Promise(resolve=>{
   canvas.toBlob(blob=>{
    if(!blob){resolve(false);return;}
    const uri=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.download=filename;a.href=uri;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(uri),5000);
    onSuccess?.();resolve(true);
   },"image/png");
  });
 }
 function cleanup(){for(const f of cleanups.splice(0)){try{f();}catch{}}epoch++;}
 function open(id){
  const tab=tabs.find(x=>x.id===id);
  if(!tab)return;
  cleanup();active=id;
  root.replaceChildren();
  get("studio-panel-icon").textContent=tab.emoji;
  get("studio-panel-overline").textContent="YUMOR STUDİYASI";
  get("studio-panel-title").textContent=tab.title;
  get("studio-panel-summary").textContent=tab.summary;
  nav.querySelectorAll("a[href]").forEach(a=>{
   const current=new URL(a.href,location.origin).searchParams.get("tab")===id;
   a.classList.toggle("current",current);
   a.setAttribute("aria-current",current?"page":"false");
  });
  const url=new URL("/yumor-studiyasi.html",location.origin);url.searchParams.set("tab",id);
  if(id==="playlist"){
   const params=new URLSearchParams(location.search);
   if(params.get("v"))url.searchParams.set("v",params.get("v"));
  }
  try{history.replaceState(null,"",url);}catch{}
  const snapshot=epoch;
  const ctx={
   core,api,id,root,el,block,button,link,status,read,write,metrics,video,empty,share,wrap,downloadCanvas,
   get:()=>videos,loaded:()=>loading,live:()=>epoch===snapshot,
   onClose:fn=>cleanups.push(fn),clear:()=>root.replaceChildren(),open
  };
  const handler=window.BBStudioTools?.[id];
  try{if(typeof handler!=="function")throw Error("TOOL_MISSING");handler(ctx);}
  catch{
   root.replaceChildren();status("Bu bölmə hazırda açıla bilmədi. Başqasını yoxla.");
  }
  metrics("studio_open",id);
 }
 nav.querySelectorAll("a[href]").forEach(a=>a.addEventListener("click",e=>{
  const id=new URL(a.href,location.origin).searchParams.get("tab");
  if(tabs.some(t=>t.id===id)){e.preventDefault();open(id);}
 }));
 window.addEventListener("popstate",()=>open(new URLSearchParams(location.search).get("tab")||"bingo"));
 open(new URLSearchParams(location.search).get("tab")||"bingo");
})();
