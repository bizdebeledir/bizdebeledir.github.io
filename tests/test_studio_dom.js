"use strict";
/* 7 studio tabs, 25 bingo switches, 5-video selection, local QR rendering.
   A deterministic DOM simulation; never calls public APIs. */
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const studio=require(root+"/studio-core.js"),discovery=require(root+"/discovery.js");
const qrcode=require(root+"/vendor-qrcode.js");
const videos=JSON.parse(fs.readFileSync(root+"/all-videos.json","utf8"));
const metrics={events:{},emit(key){this.events[key]=(this.events[key]||0)+1;return true;},
 summary(){return {day:"2026-10-09",today:{studio_open:3,video_open:1},last7days:{studio_open:5,video_open:2}};},reset(){this.events={};return true;}};
class Element{
 constructor(tag="div"){
  this.tagName=tag.toUpperCase();this.children=[];this.parent=null;this._text="";
  this.className="";this.attrs={};this.handlers={};this.style={};this.dataset={};
  this.hidden=false;this.disabled=false;this.value="";this.width=0;this.height=0;
  this.classList={add:c=>{if(!this.className.split(/\s+/).includes(c))this.className+=" "+c;},
   remove:c=>{this.className=this.className.split(/\s+/).filter(x=>x!==c).join(" ");},
   toggle:(c,flag)=>{
    const yes=flag===undefined?!this.className.split(/\s+/).includes(c):flag;
    this.classList[yes?"add":"remove"](c);return yes;
   }};
 }
 get textContent(){return this._text+this.children.map(x=>x.textContent).join("");}
 set textContent(v){this._text=String(v??"");this.children=[];}
 append(...els){els.forEach(x=>this.appendChild(x));}
 appendChild(x){this.children.push(x);x.parent=this;return x;}
 replaceChildren(...els){this.children=[];this._text="";this.append(...els);}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);}
 addEventListener(name,fn){(this.handlers[name]??=[]).push(fn);}
 click(){for(const fn of this.handlers.click||[])fn({preventDefault(){},stopPropagation(){}});}
 setAttribute(k,v){this.attrs[k]=String(v);}
 querySelectorAll(query){
  const found=[];const walk=e=>{
   for(const x of e.children){
    if(query==='a[href]'&&x.tagName==='A'&&x.href)found.push(x);
    if(query==='button'&&x.tagName==='BUTTON')found.push(x);
    walk(x);
   }
  };walk(this);return found;
 }
 getContext(){
  const context={textAlign:"",fillStyle:"",strokeStyle:"",font:"",lineWidth:1,
   createLinearGradient(){return {addColorStop(){}};},
   beginPath(){},roundRect(){},arc(){},fillRect(){},fill(){},stroke(){},fillText(){},
   measureText(s){return {width:String(s).length*13};}};
  return context;
 }
 toDataURL(mime){return "data:image/png;base64,iVBORw0KGgo=";}
 toBlob(fn,mime){fn(new Blob(["test"],{type:"image/png"}));}
}
const nav=new Element(),body=new Element(),icon=new Element(),overline=new Element(),title=new Element(),summary=new Element();
const ids={"studio-nav":nav,"studio-panel-body":body,"studio-panel-icon":icon,"studio-panel-overline":overline,"studio-panel-title":title,"studio-panel-summary":summary};
const tabs=["bingo","poster","playlist","qr","archive","series","insights"];
for(const t of tabs){const a=new Element("a");a.href="https://bizdebeledir.github.io/yumor-studiyasi.html?tab="+t;nav.appendChild(a);}
const store=new Map(),location={origin:"https://bizdebeledir.github.io",pathname:"/yumor-studiyasi.html",search:"?tab=bingo",href:"https://bizdebeledir.github.io/yumor-studiyasi.html?tab=bingo"};
const document={getElementById:k=>ids[k]||null,createElement:k=>new Element(k),body:new Element("body")};
const window={BBStudio:studio,BBDiscover:discovery,BBMetrics:metrics,qrcode,
 addEventListener(){}};
const sandbox={window,document,location,URL,URLSearchParams,Blob,Intl,Math,Date,Number,JSON,console,
 navigator:{serviceWorker:undefined,share:async()=>{}},
 history:{replaceState:(_,__,url)=>{location.search=url.search;location.href=url.href;}},
 localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},
 fetch:async()=>({ok:true,json:async()=>videos}),
 setTimeout,clearTimeout,confirm:()=>true};
window.location=location;window.navigator=sandbox.navigator;
const context=vm.createContext(sandbox);
for(const file of ["studio-tools-a.js","studio-tools-b.js","studio-app.js"])
 vm.runInContext(fs.readFileSync(root+"/"+file,"utf8"),context,{filename:file});
function walk(root){
 return [root,...root.children.flatMap(walk)];
}
async function settle(){await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));}
function show(tab){
 const a=nav.children[tabs.indexOf(tab)];
 assert(a,"Unknown tab "+tab);a.click();
}
(async()=>{
 await settle();
 assert(title.textContent.includes("BINGO"),"Bingo default");
 const bingoGrid=walk(body).find(x=>x.className==="studio-bingo");
 assert(bingoGrid&&bingoGrid.children.length===25);
 for(let n=0;n<5;n++)bingoGrid.children[n].click();
 assert(body.textContent.includes("1 BINGO xətti"));
 assert(metrics.events.bingo_complete>=1);
 show("poster");await settle();
 assert(body.textContent.includes("PNG"));
 assert(walk(body).some(x=>x.tagName==="CANVAS"),"poster Canvas missing");
 show("playlist");await settle();
 let choiceGrid=walk(body).find(x=>x.className==="studio-grid");
 for(let i=0;i<5;i++){
  assert(choiceGrid.children[0],"Video picker empty at "+i);
  const b=walk(choiceGrid.children[0]).find(x=>x.tagName==="BUTTON");
  assert(b);b.click();
  choiceGrid=walk(body).find(x=>x.className==="studio-grid");
 }
 assert(body.textContent.includes("Seçdiklərin: 5 / 5"));
 assert(body.textContent.includes("yumor-studiyasi.html?tab=playlist&v="));
 show("qr");await settle();
 assert(walk(body).some(x=>x.tagName==="IMG"&&String(x.src).startsWith("data:image/png")),"PNG QR not generated");
 show("archive");await settle();
 assert(body.textContent.includes("Arxivdən")||body.textContent.includes("arxivində"));
 show("series");await settle();
 assert(body.textContent.includes("Qonaq gəlir"));
 show("insights");await settle();
 assert(body.textContent.includes("yalnız bu brauzerdə"),"local analytics disclaimer");
 assert.equal(nav.children.length,7);
 console.log("STUDIO_7_TABS_DOM_SMOKE_OK","bingo25","posterCanvas","playlist5","qrPNG","archive","series","analytics");
})().catch(e=>{console.error(e);process.exitCode=1;});
