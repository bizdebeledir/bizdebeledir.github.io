"use strict";
const assert=require("node:assert/strict");
const path=require("node:path");
const store=new Map(),callbacks={};
globalThis.localStorage={
 getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k),
 key:i=>[...store.keys()][i],get length(){return store.size;}
};
globalThis.document={addEventListener:(type,fn)=>callbacks[type]=fn};
globalThis.location={origin:"https://bizdebeledir.github.io",href:"https://bizdebeledir.github.io/gulus-seheri.html"};
globalThis.gtag=(...args)=>calls.push(args);
const calls=[];
const m=require(path.resolve(__dirname,"../city-metrics.js"));
const day=m.day();
assert.equal(m.counts()[ "search" ]||0,0);
assert(m.emit("search"));
assert(m.emit("mood"));
assert.equal(m.counts().search,1);
assert.equal(m.counts().mood,1);
assert.equal(m.emit("an_event_that_does_not_exist"),false);
assert.equal(m.summary().today.search,1);
assert.equal(m.summary().last7days.mood,1);
assert(calls.some(c=>c[1]==="bb_city_search"));
callbacks.click({
 target:{closest:()=>({href:"https://www.youtube.com/@bizde.beledir"})}
});
assert.equal(m.counts().youtube_outbound,1);
const cached=store.get("bb_city_events_"+day);
assert(cached.includes("search"));
assert(m.reset());
assert.deepEqual(m.counts(),{});
console.log("CITY_METRICS_LOCAL_PRIVACY_TRACKING_OK","GA_events",calls.length,"date",day);
