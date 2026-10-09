"use strict";
/* Privacy-first, per-browser event counts. No raw IP, cookies or user-supplied text. */
(function(host){
 const PREFIX="bb_city_events_";
 const allowed=new Set(["city_visit","district_open","search","mood","video_open","door_solved","cup_vote",
  "director_vote","park_open","share","offline_ready","mission_view","youtube_outbound","city_return",
  "studio_open","bingo_complete","bingo_export","poster_export","playlist_shared",
  "qr_generated","qr_export","archive_open","series_open","topic_open"]);
 const CACHE_DAYS=30,DAILY_MAX_EVENTS=500;
 function day(){
  try{
   const parts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Baku",year:"numeric",month:"2-digit",day:"2-digit"})
    .formatToParts(new Date());
   const v=Object.fromEntries(parts.map(x=>[x.type,x.value]));
   return v.year+"-"+v.month+"-"+v.day;
  }catch{return new Date().toISOString().slice(0,10);}
 }
 function safeGet(key){try{return host.localStorage?.getItem(key)||null;}catch{return null;}}
 function safeSet(key,val){try{host.localStorage?.setItem(key,JSON.stringify(val));return true;}catch{return false;}}
 function parse(raw){try{const value=JSON.parse(raw);return typeof value==="object"&&value&&!Array.isArray(value)?value:{};}catch{return {};}}
 function counts(date=day()){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date)))return {};
  const value=parse(safeGet(PREFIX+date));
  return Object.fromEntries(Object.entries(value).filter(([k,v])=>allowed.has(k)&&Number.isInteger(v)&&v>=0&&v<=DAILY_MAX_EVENTS));
 }
 function cleanup(){
  try{
   const today=new Date(day()+"T12:00:00Z").getTime();
   for(let i=host.localStorage.length-1;i>=0;i--){
    const key=host.localStorage.key(i);
    if(!key?.startsWith(PREFIX))continue;
    const date=key.slice(PREFIX.length);
    const ts=Date.parse(date+"T12:00:00Z");
    if(!Number.isFinite(ts)||today-ts>CACHE_DAYS*86400000||ts>today+86400000)host.localStorage.removeItem(key);
   }
  }catch{}
 }
 function emit(name,attrs={}){
  if(!allowed.has(name))return false;
  const d=day(),obj=counts(d);
  const total=Object.values(obj).reduce((a,b)=>a+b,0);
  if(total>=DAILY_MAX_EVENTS)return false;
  obj[name]=Math.min(DAILY_MAX_EVENTS,(obj[name]||0)+1);
  safeSet(PREFIX+d,obj);
  try{
   if(typeof host.gtag==="function"){
    const safe={source:"bizde_city"};
    if(typeof attrs.area==="string" && /^[a-z0-9_]{1,32}$/.test(attrs.area))safe.area=attrs.area;
    if(typeof attrs.variant==="string" && /^[a-z0-9_]{1,32}$/.test(attrs.variant))safe.variant=attrs.variant;
    host.gtag("event","bb_city_"+name,safe);
   }
  }catch{}
  return true;
 }
 function summary(){
  const now=new Date(day()+"T12:00:00Z"),days=[];
  const sum={};
  for(let n=0;n<7;n++){
   const dt=new Date(now.getTime()-n*86400000).toISOString().slice(0,10);
   const row=counts(dt);days.push({date:dt,counts:row});
   for(const [key,v] of Object.entries(row))sum[key]=(sum[key]||0)+v;
  }
  return {day:day(),today:counts(),last7days:sum,history:days,scope:"THIS_BROWSER_ONLY"};
 }
 function reset(){
  try{
   for(let i=host.localStorage.length-1;i>=0;i--){
    const k=host.localStorage.key(i);
    if(k?.startsWith(PREFIX))host.localStorage.removeItem(k);
   }
   return true;
  }catch{return false;}
 }
 function recordLink(e){
  try{
   const a=e.target?.closest?.("a[href]");
   if(!a)return;
   const url=new URL(a.href,host.location.href);
   if(url.hostname==="youtube.com"||url.hostname==="www.youtube.com"||url.hostname==="m.youtube.com"||url.hostname==="youtu.be"){
    emit("youtube_outbound");return;
   }
   if(url.origin===host.location.origin&&
      (url.pathname.startsWith("/video/")||url.pathname==="/shorts.html")){
    emit("video_open");
   }
   if(url.origin===host.location.origin&&url.pathname==="/yumor-parki.html")emit("park_open");
  }catch{}
 }
 try{host.document?.addEventListener("click",recordLink,{capture:true,passive:true});}catch{}
 cleanup();
 host.BBMetrics=Object.freeze({emit,counts,summary,reset,day,allowed:Object.freeze([...allowed])});
})(typeof window!=="undefined"?window:globalThis);
if(typeof module!=="undefined"&&module.exports)module.exports=globalThis.BBMetrics;
