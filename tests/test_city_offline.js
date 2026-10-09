"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const source=fs.readFileSync(path.resolve(__dirname,"../sw.js"),"utf8");
const events={};const databases=new Map();
let online=true;
function cache(name){
 if(!databases.has(name))databases.set(name,new Map());
 const db=databases.get(name);
 return {
  async put(key,response){
   const uri=typeof key==="string"?key:new URL(key.url).pathname;
   db.set(uri,response.clone());
  },
  async match(key){
   const uri=typeof key==="string"?key:new URL(key.url).pathname;
   return db.get(uri)?.clone()||null;
  }
 };
}
const caches={
 open:async name=>cache(name),
 keys:async()=>[...databases.keys()],
 delete:async name=>databases.delete(name)
};
let cacheCount=0,claimCount=0;
const self={
 location:{origin:"https://bizdebeledir.github.io"},
 addEventListener:(event,handler)=>events[event]=handler,
 skipWaiting:()=>{cacheCount++;},
 clients:{claim:async()=>{claimCount++;}}
};
const sandbox=vm.createContext({
 self,caches,Request,Response,URL,Promise,console,
 fetch:async request=>{
  if(!online)throw Error("NO_CONNECTION");
  const url=typeof request==="string"?request:request.url;
  const p=url.startsWith("http")?new URL(url).pathname:url;
  return new Response("Cached site asset "+p,{status:200,headers:{"Content-Type":"text/plain"}});
 }
});
vm.runInContext(source,sandbox,{filename:"sw.js"});
assert(["install","activate","fetch","message"].every(x=>events[x]));
async function promiseEvent(type,evt={}) {
 let wait;
 events[type]({...evt,waitUntil:p=>{wait=p;}});
 await wait;
}
async function fetchEvent(uri){
 let response;
 const nav=new Request("https://bizdebeledir.github.io"+uri);
 Object.defineProperty(nav,"mode",{value:"navigate"});
 events.fetch({request:nav,respondWith:p=>{response=p;}});
 return response?await response:null;
}
(async()=>{
 await promiseEvent("install");
 assert(cacheCount===1);
 assert((await cache("bb-site-offline-v2").match("/offline.html"))!==null);
 databases.set("bizde-beledir-pwa-v1",new Map());
 await promiseEvent("activate");
 assert.equal(databases.has("bizde-beledir-pwa-v1"),false);
 assert.equal(claimCount,1);
 online=false;
 let r=await fetchEvent("/gulus-seheri.html");
 assert(r&&r.status===200);
 r=await fetchEvent("/yumor-parki.html");
 assert(r&&r.status===200,"Uncached navigation should show offline page");
 assert((await r.text()).includes("/offline.html"));
 let intercepted=false;
 events.fetch({request:new Request("https://bizdebeledir.github.io/v1/polls"),respondWith:()=>{intercepted=true;}});
 assert(!intercepted,"API must not be cached");
 intercepted=false;
 events.fetch({request:new Request("https://youtube.com/shorts/test"),respondWith:()=>{intercepted=true;}});
 assert(!intercepted,"External YouTube must not be cached");
 online=true;
 let message;
 await promiseEvent("message",{data:{type:"BB_PREPARE_OFFLINE"},ports:[{postMessage:m=>message=m}]});
 assert(message?.ok===true&&message.files>=20,message);
 online=false;
 r=await fetchEvent("/yumor-dnt.html");
 assert(r&&r.status===200,"User-prepared DNA should work offline");
 console.log("CITY_OFFLINE_SERVICE_WORKER_TEST_OK","precache",cacheCount,"optional",message.files,"API_and_video_excluded");
})().catch(e=>{console.error(e);process.exitCode=1;});
