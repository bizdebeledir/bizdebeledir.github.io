"use strict";
/* Browser-flow test using a minimal DOM stub. No browser download or npm needed. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const dna=require(path.join(root,"yumor-dnt-core.js"));
const discover=require(path.join(root,"discovery.js"));
const videos=JSON.parse(fs.readFileSync(path.join(root,"all-videos.json"),"utf8"));
const code=fs.readFileSync(path.join(root,"yumor-dnt.js"),"utf8");
const IDS=["lab-start","lab-intro","lab-quiz","lab-result","lab-step-label","lab-progress",
  "lab-progress-fill","lab-question-number","lab-question-title","lab-options",
  "lab-back","lab-restart","lab-challenge-intro","lab-passport","lab-seal","lab-result-title",
  "lab-motto","lab-result-description","lab-passport-id","lab-score","lab-strands",
  "lab-compare","lab-compare-text","lab-share-note","lab-videos-list","lab-match-note",
  "lab-again","lab-share","lab-challenge","lab-image"];
class Element{
  constructor(tag="div"){
    this.tagName=tag;this.textContent="";this.hidden=false;this.children=[];
    this.dataset={};this.attrs={};this.disabled=false;
    this.style={props:{},setProperty:(k,v)=>this.style.props[k]=v};
    this.handlers={};
  }
  setAttribute(k,v){this.attrs[k]=v;}
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this.children=children;}
  addEventListener(k,callback){this.handlers[k]=callback;}
  click(){if(this.handlers.click)this.handlers.click({preventDefault(){}});}
}
async function runScenario(search,choices,verify) {
 const els=Object.fromEntries(IDS.map(id=>[id,new Element()]));
 for(const id of ["lab-quiz","lab-result","lab-challenge-intro","lab-compare"]){
   els[id].hidden=true; // Mirrors initial HTML hidden attributes
 }
 const shares=[];
 const origin="https://bizdebeledir.github.io";
 const location={origin,pathname:"/yumor-dnt.html",search};
 const calls=[];
 const sandbox={
   window:{BBDNA:dna,BBDiscover:discover,scrollTo(){},location},
   document:{getElementById:id=>els[id],createElement:tag=>new Element(tag)},
   location,URL,URLSearchParams,Intl,console,Math,Date,
   navigator:{share:async payload=>shares.push(payload)},
   history:{replaceState(){}},
   matchMedia:()=>({matches:true}),
   fetch:async url=>{
     calls.push(url);
     return {ok:true,json:async()=>videos};
   },
   setTimeout:(fn)=>{fn();return 0;},
   clearTimeout(){}
 };
 vm.runInNewContext(code,sandbox,{filename:"yumor-dnt.js"});
 assert.equal(els["lab-quiz"].hidden,true);
 if(choices){
   els["lab-start"].click();
   assert.equal(els["lab-quiz"].hidden,false);
   for(let i=0;i<choices.length;i++){
     assert.equal(els["lab-options"].children.length,4);
     els["lab-options"].children[choices[i]].click();
   }
 }
 await new Promise(resolve=>setImmediate(resolve));
 await new Promise(resolve=>setImmediate(resolve));
 verify({els,shares,calls});
}
(async()=>{
 await runScenario("",[0,1,2,3,0],({els,calls})=>{
   assert.equal(els["lab-result"].hidden,false);
   assert(els["lab-result-title"].textContent.length>3);
   assert.equal(els["lab-videos-list"].children.length,3);
   assert.equal(calls.length,1);
 });
 await runScenario("?c=v1_00000",[0,0,0,0,0],({els})=>{
   assert.equal(els["lab-compare"].hidden,false);
   assert(els["lab-compare-text"].textContent.includes("5 / 5"));
 });
 await runScenario("?r=v1_01230",null,({els})=>{
   assert.equal(els["lab-result"].hidden,false);
   assert(els["lab-compare-text"].textContent.includes("dostunun paylaşdığı"));
 });
 console.log("DNA_UI_SIMULATED_FLOW_OK normal_quiz share_challenge shared_result real_video_loading");
})().catch(e=>{console.error(e);process.exitCode=1;});
