"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const base=path.resolve(__dirname,"..");
const core=require(base+"/city-core.js"),api=require(base+"/discovery.js");
const videos=JSON.parse(fs.readFileSync(base+"/all-videos.json","utf8"));
const stats=JSON.parse(fs.readFileSync(base+"/channel-stats.json","utf8"));
class Element{
 constructor(tag="div"){
  this.tagName=tag.toUpperCase();this.children=[];this.parent=null;this.attrs={};this.dataset={};
  this._text="";this.className="";this.value="";this.checked=false;this.hidden=false;this.disabled=false;
  this.handlers={};this.style={width:"",setProperty:()=>{}};
  this.classList={
   add:c=>{if(!this.className.split(/\s+/).includes(c))this.className+=" "+c;},
   remove:c=>this.className=this.className.split(/\s+/).filter(x=>x!==c).join(" "),
   toggle:(c,on)=>{
    if(on===undefined)on=!this.className.split(/\s+/).includes(c);
    this.classList[on?"add":"remove"](c);return on;
   }
  };
 }
 set textContent(s){this._text=String(s??"");this.children=[];}
 get textContent(){return this._text+this.children.map(c=>c.textContent||"").join("");}
 append(...cs){cs.forEach(c=>this.appendChild(c));}
 appendChild(c){this.children.push(c);c.parent=this;return c;}
 replaceChildren(...cs){this.children=[];this._text="";this.append(...cs);}
 setAttribute(k,v){this.attrs[k]=String(v);}
 addEventListener(k,f){(this.handlers[k]??=[]).push(f);}
 click(){for(const fn of this.handlers.click||[])fn({preventDefault(){},stopPropagation(){}});}
 scrollIntoView(){}
 querySelectorAll(query){
  const found=[];const walk=e=>{for(const x of e.children){if(query==="button"&&x.tagName==="BUTTON")found.push(x);if(query==="a"&&x.tagName==="A")found.push(x);walk(x);}};
  walk(this);return found;
 }
}
const ids=["city-hero","city-stage","city-stage-body","city-districts","city-back",
 "city-stage-number","city-stage-emoji","city-stage-title","city-stage-desc","city-stage-label"];
const nodes=Object.fromEntries(ids.map(id=>[id,new Element()]));
nodes["city-stage"].hidden=true;
const store=new Map(),counts={},allowed=new Set(["city_visit","district_open","search","mood","video_open","door_solved","cup_vote","director_vote","park_open","share","offline_ready","city_return"]);
const metrics={
 emit:(key)=>{if(allowed.has(key))counts[key]=(counts[key]||0)+1;return true;},
 summary:()=>({day:"2026-10-09",today:{city_visit:1},last7days:{city_visit:1}}),
 reset:()=>true
};
const location={origin:"https://bizdebeledir.github.io",pathname:"/gulus-seheri.html",search:"",href:"https://bizdebeledir.github.io/gulus-seheri.html"};
const polls={
 week:stats.cityGames.week,
 polls:[...Array.from({length:4},(_,i)=>({id:"city_cup_"+stats.cityGames.week+"_m"+i,counts:[0,0]})),
 {id:"city_director_"+stats.cityGames.week,counts:[0,0,0]}]
};
const sandbox={
 window:{BBCity:core,BBDiscover:api,BBMetrics:metrics,location,addEventListener(){}},
 document:{getElementById:id=>nodes[id]||null,createElement:tag=>new Element(tag),querySelectorAll:()=>[]},
 location,history:{replaceState(){}},
 localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},
 navigator:{},crypto:require("node:crypto").webcrypto,
 URL,URLSearchParams,Intl,Number,Date,Math,Object,Set,Map,console,
 matchMedia:()=>({matches:true}),performance,
 Event:class{constructor(t,v){this.type=t;this.detail=v?.detail;}},
 fetch:async(url)=>{
  const p=String(url);
  if(p.startsWith("/all-videos.json"))return {ok:true,status:200,json:async()=>videos};
  if(p.startsWith("/channel-stats.json"))return {ok:true,status:200,json:async()=>stats};
  if(p.startsWith("/visitor-config.json"))return {ok:true,status:200,json:async()=>({endpoint:"https://mock.trycloudflare.com"})};
  if(p.startsWith("https://mock.trycloudflare.com/v1/city-polls"))
   return {ok:true,status:200,json:async()=>({ok:true,...polls})};
  throw Error("Unexpected fetch "+p);
 },
 setTimeout,clearTimeout,AbortController
};
sandbox.window.navigator=sandbox.navigator;
const context=vm.createContext(sandbox);
for(const file of ["city-modes-a.js","city-modes-b.js","city-app.js"]){
 vm.runInContext(fs.readFileSync(base+"/"+file,"utf8"),context,{filename:file});
}
assert.equal(nodes["city-districts"].children.length,10);
async function settle(){await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>setImmediate(resolve));}
(async()=>{
 const checked=[];
 for(const [i,m] of core.districts.entries()){
  const link=nodes["city-districts"].children[i];link.click();await settle();
  assert.equal(nodes["city-stage"].hidden,false,m.id);
  assert.equal(nodes["city-stage-title"].textContent,m.name,m.id);
  assert(nodes["city-stage-body"].children.length>0,"empty "+m.id);
  assert(!nodes["city-stage-body"].textContent.includes("Bu məkan hazırda açılmadı"),"exception "+m.id);
  if(m.id==="cup")assert(nodes["city-stage-body"].textContent.includes("Duel 1 / 4"),"duel not rendered");
  if(m.id==="director")assert(nodes["city-stage-body"].textContent.includes("0 real səs"),"director no real votes");
  if(m.id==="insights")assert(nodes["city-stage-body"].textContent.includes("yalnız bu brauzerdə"),"local-only not stated");
  checked.push(m.id);nodes["city-back"].click();
  assert.equal(nodes["city-stage"].hidden,true);
 }
 assert.equal(checked.length,10);
 console.log("CITY_10_DISTRICTS_DOM_SMOKE_OK",checked.join(","));
 console.log("LOCAL_METRIC_EVENTS",JSON.stringify(counts));
})().catch(e=>{console.error(e);process.exitCode=1;});
