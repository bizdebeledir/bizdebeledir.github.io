"use strict";
/* No network: verifies all 12 topic models, 36 Bingo prompts and safe URL encoding. */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const s=require(root+"/studio-core.js");
const videos=JSON.parse(fs.readFileSync(root+"/all-videos.json","utf8"));
const topics=JSON.parse(fs.readFileSync(root+"/studio-topics.json","utf8"));
assert.equal(s.topics.length,12);assert.equal(topics.length,12);
assert.deepEqual(s.topics.map(t=>t.slug),topics.map(t=>t.slug));
assert.equal(s.bingo.length,36);
assert.equal(new Set(s.bingo).size,36);
assert.equal(s.bingoGrid("v1").length,25);
assert.deepEqual(s.bingoGrid("v1"),s.bingoGrid("v1"));
assert.equal(new Set(s.bingoGrid("v1")).size,25);
assert.equal(s.series.length,5);
assert.equal(s.fold("ÇAY, QONŞU, ZƏNG!"),"cay qonsu zeng");
for(const t of topics){
 assert(t.prompts.length===2&&t.insight.length>90);
 assert(/^[a-z]{2,15}$/.test(t.slug));
 const found=s.videosFor(videos,[t.slug],81);
 assert(found.length>0,"Topic should have a real match "+t.slug);
 assert(found.every(v=>videos.some(x=>x.id===v.id)),t.slug);
}
const ids=videos.slice(0,5).map(v=>v.id);
assert.deepEqual(s.safePlaylist(ids,videos),ids);
assert.deepEqual(s.parseLink(ids.join("."),videos),ids);
assert.equal(s.parseLink(ids.join(".")+".garbage",videos),null);
assert.equal(s.parseLink("notvalid",videos),null);
assert.equal(s.parseLink(ids[0]+"."+ids[0],videos),null);
assert.equal(s.parseLink("../../../etc/passwd",videos),null);
assert.equal(s.safePlaylist(Array(6).fill(ids[0]),videos),null);
const l=s.shareLink(ids);
assert(l.startsWith("https://bizdebeledir.github.io/yumor-studiyasi.html?tab=playlist&v="));
const fake=[{id:"UNKN0WN0000",title:"Not in current videos",publishedAt:"2016-10-09T10:00:00Z"}];
const older=s.archive(fake,new Date("2026-10-09T11:00:00Z"));
assert.equal(older.exact,true);assert.equal(older.videos.length,1);
const empty=s.archive(videos,new Date("2026-10-09T08:00:00Z"));
assert(empty.videos.length>0);
console.log("STUDIO_CORE_TEST_OK",s.topics.length,"topics",s.bingo.length,"Bingo prompts",s.series.length,"series",videos.length,"live video entries");
