"use strict";
/* Deterministic regression tests for all 4^5 Humour DNA outcomes. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const dna=require(path.join(root,"yumor-dnt-core.js"));
const discovery=require(path.join(root,"discovery.js"));
const items=JSON.parse(fs.readFileSync(path.join(root,"all-videos.json"),"utf8"));
const short=items.filter(v=>/^PT(?:10|11|12|13)S$/.test(String(v.duration||"")));
assert(short.length>=3,"Expected at least three published short videos");
const count={};
for(let n=0;n<1024;n++){
  let bits=n;
  const answers=Array.from({length:5},()=>{
    const answer=bits%4;
    bits=Math.floor(bits/4);
    return answer;
  });
  const code=dna.encode(answers);
  const decoded=dna.decode(code);
  assert.deepEqual(decoded,answers,"Share link round trip");
  const out=dna.evaluate(answers);
  assert(out && out.code===code);
  assert.equal(dna.similarity(answers,answers).same,5);
  assert.equal(dna.similarity(answers,[0,0,0,0,0]).total,5);
  const recommendation=dna.pickVideos(short,discovery,out,3);
  assert.equal(recommendation.videos.length,3);
  assert.equal(new Set(recommendation.videos.map(v=>v.id)).size,3);
  count[out.profile.id]=(count[out.profile.id]||0)+1;
}
for(const trait of dna.traits){
  assert(count[trait.id]>0,trait.id+" must be reachable");
}
for(const bad of [null,"","v1_0123","v1_01234zzz","v2_01234","v1_90000",{}]){
  assert.equal(dna.decode(bad),null);
}
assert.equal(dna.evaluate([0,1,2]),null);
assert.equal(dna.similarity([0,1,2],[0,1,2]),null);
assert(!discovery.categories({
  title:"Qonaq gəlir!",
  description:"Sosial media #Market #Telefon #Dost #Çay #İş"
}).includes("phone"),"Generic descriptions must not bias humor DNA");
console.log("DNA_1024_CORE_REGRESSION_OK",JSON.stringify(count),"short_video_pool",short.length);
