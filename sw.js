"use strict";
/* Bizdə Belədir v2: opt-in local offline shell, network-first for fresh files.
No caching of API endpoints, private requests, or external video streams. */
const CACHE="bb-site-offline-v2";
const PREP=[
 "/offline.html","/gulus-seheri.html","/gulus-seheri.css",
 "/discovery.js","/city-core.js","/city-metrics.js","/city-modes-a.js",
 "/city-modes-b.js","/city-app.js","/icon-192.png","/icon-512.png"
];
const OPTIONAL=[
 "/yumor-parki.html","/yumor-parki.css","/park-engine.js",
 "/park-app.js","/park-games-a.js","/park-games-b.js",
 "/yumor-dnt.html","/yumor-dnt.css","/yumor-dnt-core.js","/yumor-dnt.js",
 "/all-videos.json",
 "/yumor-studiyasi.html","/yumor-studiyasi.css","/studio-core.js",
 "/studio-app.js","/studio-tools-a.js","/studio-tools-b.js",
 "/studio-topic-live.js","/vendor-qrcode.js","/movzular.html"
];
const eligible=new Set([...PREP,...OPTIONAL,"/","/index.html"]);
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(CACHE).then(async cache=>{
  // Failure to pre-cache a file should not break normal online service worker.
  const results=await Promise.allSettled(PREP.map(async path=>{
   const res=await fetch(path,{cache:"reload"});
   if(!res.ok||res.type==="opaque")throw Error("NOT_CACHEABLE "+path);
   await cache.put(path,res);
  }));
  const failed=results.filter(r=>r.status==="rejected");
  if(failed.length>0){
   // Keep the old worker active if core shell cannot be cached fully.
   throw Error("CORE_CACHE_NOT_READY");
  }
  self.skipWaiting();
 }));
});
self.addEventListener("activate",event=>{
 event.waitUntil(caches.keys().then(keys=>
  Promise.all(keys.filter(k=>k!==CACHE&&(k.startsWith("bb-site-")||k==="bizde-beledir-pwa-v1"))
   .map(k=>caches.delete(k)))
 ).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
 const req=event.request;
 if(req.method!=="GET")return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 if(url.pathname.startsWith("/video/"))return;
 if(url.pathname.startsWith("/v1/") || url.pathname==="/visitor-config.json" ||
    url.pathname==="/channel-stats.json" || url.pathname==="/sitemap.xml")return;
 if(!eligible.has(url.pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const key=url.pathname==="/"?"/":url.pathname;
  try{
   const response=await fetch(req);
   if(response.ok&&response.type!=="opaque")await cache.put(key,response.clone());
   return response;
  }catch{
   return await cache.match(key) ||
    (req.mode==="navigate"? await cache.match("/offline.html"):null)||
    Response.error();
  }
 })());
});
self.addEventListener("message",event=>{
 if(event.data?.type!=="BB_PREPARE_OFFLINE")return;
 const port=event.ports?.[0];
 if(!port)return;
 event.waitUntil((async()=>{
  try{
   const cache=await caches.open(CACHE);
   let stored=0;
   for(const path of [...PREP,...OPTIONAL]){
    const response=await fetch(path,{cache:"reload"});
    if(!response.ok||response.type==="opaque")throw Error("DOWNLOAD_FAILED "+path);
    await cache.put(path,response);
    stored++;
   }
   port.postMessage({ok:true,files:stored});
  }catch{
   port.postMessage({ok:false,error:"NOT_ALL_FILES_CACHED"});
  }
 })());
});
