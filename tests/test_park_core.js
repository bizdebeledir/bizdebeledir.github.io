"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const base=path.resolve(__dirname,"..");
const d=require(base+"/park-engine.js"),api=require(base+"/discovery.js");
const videos=JSON.parse(fs.readFileSync(base+"/all-videos.json","utf8"));
assert.equal(d.modes.length,20);
assert.deepEqual(d.modes.map(x=>x.num),Array.from({length:20},(_,i)=>i+1));
assert.equal(new Set(d.modes.map(x=>x.id)).size,20);
assert.equal(d.polls.length,3);
assert(d.polls.every(p=>p.choices.length===4));
assert(d.stories.length>=9&&d.regions.length>=8);
assert.equal(d.encodeDuel([0,2,3]),"d1_023");
assert.deepEqual(d.decodeDuel("d1_023"),[0,2,3]);
assert.equal(d.compareDuel([0,1,2],[0,2,2]),2);
assert.equal(d.compareDuel([0,1,2],[3,2,1]),0);
for(const bad of ["","x1_000","d1_009","d1_00","d1_01233","d1_bad","d1_0<script>"]){
  assert.equal(d.decodeDuel(bad),null);
}
assert.equal(d.compareDuel([0,0,0],["0",0,0]),null);
assert(d.dateBaku().match(/^\d{4}[-/]\d\d[-/]\d\d$/));
const unique=api.list(videos);
assert(unique.length>=80,"Expected 80+ real, public videos");
for(const t of d.topics){
  const result=d.videosFor(unique,api,t.id,"park-test",3);
  assert.equal(result.length,3,"3 real videos for "+t.id);
  assert.equal(new Set(result.map(v=>v.id)).size,3);
  assert(result.every(v=>unique.some(x=>x.id===v.id)));
}
assert.deepEqual(d.videosFor(unique,api,"phone","fixed",3).map(v=>v.id),
 d.videosFor(unique,api,"phone","fixed",3).map(v=>v.id));
console.log("PARK_20_MODES_CORE_OK","videos",unique.length,"topics",d.topics.length,"polls",d.polls.length);
