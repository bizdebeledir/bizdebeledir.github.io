"use strict";
/* Simulated Chrome-style DOM smoke tests for all 20 interactive modules. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const crypto=require("node:crypto").webcrypto;
const base=path.resolve(__dirname,"..");
const models=require(base+"/park-engine.js");
const api=require(base+"/discovery.js");
const videos=JSON.parse(fs.readFileSync(base+"/all-videos.json","utf8"));
class MiniElement{
  constructor(tag){
    this.tagName=tag.toUpperCase();this.children=[];this.parent=null;
    this._text="";this.className="";this.attrs={};this.dataset={};
    this.handlers={};this.hidden=false;this.disabled=false;this.type="";
    this.value="";this.checked=false;this.style={width:"",setProperty(){}};
    this.classList={
      add:cl=>{if(!this.className.split(/\s+/).includes(cl))this.className+=" "+cl;},
      remove:cl=>{this.className=this.className.split(/\s+/).filter(x=>x!==cl).join(" ");},
      toggle:(cl,on)=>{
        const yes=on===undefined?!this.className.split(/\s+/).includes(cl):on;
        this.classList[yes?"add":"remove"](cl);return yes;
      }
    };
  }
  set textContent(v){this._text=String(v??"");this.children=[];}
  get textContent(){return this._text+this.children.map(x=>x.textContent||"").join("");}
  appendChild(c){this.children.push(c);c.parent=this;return c;}
  append(...c){c.forEach(v=>this.appendChild(v));}
  replaceChildren(...c){this.children=[];this._text="";this.append(...c);}
  setAttribute(k,v){this.attrs[k]=String(v);}
  addEventListener(t,f){(this.handlers[t]??=[]).push(f);}
  click(){for(const f of this.handlers.click||[])f({preventDefault(){},stopPropagation(){}});}
  querySelectorAll(selector){
    const output=[];
    function walk(e){
      for(const c of e.children){
        if(selector==="button"&&c.tagName==="BUTTON")output.push(c);
        walk(c);
      }
    }
    walk(this);return output;
  }
  scrollIntoView(){}
}
const IDs=["park-hero","park-catalog","park-filter","park-grid","park-stage",
  "park-stage-back","park-stage-index","park-stage-emoji","park-stage-title",
  "park-stage-description","park-stage-group","park-stage-body",
  "park-other-game","park-subscribe"];
const nodes=Object.fromEntries(IDs.map(id=>[id,new MiniElement("div")]));
nodes["park-stage"].hidden=true;
const fakeLocal=new Map();
const timerRegistry=new Set();
const location={
  pathname:"/yumor-parki.html",search:"",origin:"https://bizdebeledir.github.io",
  assign(v){this.assigned=v;}
};
const fakePolls=models.polls.map(p=>({id:p.id,counts:[0,0,0,0]}));
const document={
  getElementById:id=>nodes[id]||null,
  createElement:tag=>new MiniElement(tag)
};
const ctx={
  window:{BBParkData:models,BBDiscover:api,crypto},
  document,localStorage:{getItem:k=>fakeLocal.get(k)||null,setItem:(k,v)=>fakeLocal.set(k,v)},
  matchMedia:()=>({matches:true}),
  alert(){},
  location,
  history:{replaceState(){}},
  navigator:{share:async()=>{},clipboard:{writeText:async()=>{}}},
  crypto,
  AbortController,
  setTimeout:(fn,ms)=>{
    const id=setTimeout(fn,ms);timerRegistry.add(id);return id;
  },
  clearTimeout:id=>{clearTimeout(id);timerRegistry.delete(id);},
  speechSynthesis:{cancel(){}},
  Intl,Date,JSON,Math,Number,Object,Array,Set,Map,
  URL,URLSearchParams,console,performance,
  fetch:async(url,opts={})=>{
    const v=String(url);
    if(v.includes("all-videos.json"))return {ok:true,status:200,json:async()=>videos};
    if(v.includes("visitor-config.json"))return {ok:true,status:200,json:async()=>({endpoint:"https://mock.trycloudflare.com"})};
    if(v.includes("/v1/polls"))return {ok:true,status:200,json:async()=>({ok:true,polls:fakePolls})};
    if(v.includes("/v1/vote"))return {ok:true,status:200,json:async()=>({ok:true})};
    if(v.includes("/v1/idea"))return {ok:true,status:202,json:async()=>({ok:true})};
    throw Error("Unexpected mocked fetch: "+v);
  }
};
ctx.window.location=location;
ctx.window.navigator=ctx.navigator;
const sandbox=vm.createContext(ctx);
for(const name of ["park-games-a.js","park-games-b.js","park-app.js"]){
  vm.runInContext(fs.readFileSync(base+"/"+name,"utf8"),sandbox,{filename:name});
}
assert.equal(nodes["park-grid"].children.length,20,"all game cards on homepage");
function clickMode(id){
  const pos=models.modes.findIndex(x=>x.id===id);
  assert(pos>=0);
  const card=nodes["park-grid"].children[pos];
  assert(card?.children?.[0],id+" card missing");
  card.children[0].click();
}
function hasError(){
  return nodes["park-stage-body"].textContent.includes("Bu oyunu açmaq mümkün olmadı");
}
const modesChecked=[];
async function settle(){await new Promise(done=>setImmediate(done));await new Promise(done=>setImmediate(done));}
(async()=>{
  for(const mode of models.modes){
    if(mode.id==="dna")continue;
    clickMode(mode.id);
    await settle();
    assert.equal(nodes["park-stage"].hidden,false,mode.id);
    assert(nodes["park-stage-body"].children.length>0,mode.id+" empty");
    assert(!hasError(),mode.id+" exception suppressed by UI");
    modesChecked.push(mode.id);
    nodes["park-stage-back"].click();
    assert.equal(nodes["park-stage"].hidden,true);
  }
  clickMode("duel");
  for(let i=0;i<3;i++){
    const body=nodes["park-stage-body"];
    const answerGroup=body.children.find(x=>x.className.includes("game-options"));
    assert(answerGroup && answerGroup.children.length===4,"duel question "+i);
    answerGroup.children[i].click();
  }
  assert(nodes["park-stage-body"].textContent.includes("Duelə hazırsan"),"duel result not visible");
  nodes["park-stage-back"].click();
  clickMode("poll");
  await settle();
  assert(nodes["park-stage-body"].textContent.includes("Təsdiqlənmiş səslər: 0"),"fake poll API visible");
  nodes["park-stage-back"].click();
  clickMode("chain");
  await settle();
  const before=nodes["park-stage-body"].textContent;
  assert(before.includes("ZƏNCİR HALQASI"),"chain active");
  for(const id of timerRegistry)clearTimeout(id);
  console.log("PARK_ALL_19_NEW_MODES_DOM_SMOKE_OK",modesChecked.join(","));
  console.log("PARK_CATALOG_GAME_COUNT",nodes["park-grid"].children.length);
  console.log("PARK_DUEL_POLL_CHAIN_INTERACTION_OK");
})().catch(err=>{console.error(err);process.exitCode=1;});
