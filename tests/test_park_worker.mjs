"use strict";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {pathToFileURL} from "node:url";
import path from "node:path";
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const {default:worker}=await import(pathToFileURL(path.resolve("infra/cloudflare-visitors/src/index.mjs")).href);
const origin="https://bizdebeledir.github.io";
const votes=new Map();
let writeCount=0;
const db={
  prepare(sql){
    return {
      bind(...args){
        return {
          async first(){
            if(sql.includes("FROM park_votes") && sql.includes("SELECT 1")){
              return votes.has(args[0]+":"+args[1])?{duplicate:1}:null;
            }
            if(sql.includes("FROM park_vote_limits"))return null;
            if(sql.includes("COUNT("))return {online:1,last24h:2,last7d:3};
            if(sql.includes("SELECT value"))return {value:1791502000};
            return null;
          },
          async run(){
            if(sql.includes("INSERT INTO park_votes")){
              const key=args[0]+":"+args[1];
              if(votes.has(key))return {success:true,meta:{changes:0}};
              votes.set(key,{pollId:args[0],index:args[2]});
            }
            writeCount++;
            return {success:true,meta:{changes:1}};
          }
        };
      },
      async all(){
        if(sql.includes("FROM park_votes")){
          const records=[...votes.values()];
          const counts=new Map();
          for(const v of records){
            const key=v.pollId+":"+v.index;
            counts.set(key,(counts.get(key)||0)+1);
          }
          return {results:[...counts].map(([key,v])=>{
            const [poll_id,index]=key.split(":");
            return {poll_id,option_index:Number(index),votes:v};
          })};
        }
        return {results:[]};
      },
      async first(){return {value:1791502000};}
    };
  }
};
const env={DB:db,VISITOR_SALT:"UNIT_TEST_SECRET_32_CHARS_NOT_PUBLISHED"};
const uuid="00000000-0000-4000-8000-000000000000";
async function call(path,method="GET",postOrigin=origin,body=null){
  const request=new Request("https://unit.workers.dev"+path,{
    method,headers:{"Origin":postOrigin,"Content-Type":"application/json","CF-Connecting-IP":"198.51.100.31"},
    ...(body!==null?{body:JSON.stringify(body)}:{})
  });
  return worker.fetch(request,env);
}
let r=await call("/health");
assert.equal(r.status,200);
r=await call("/v1/polls");
assert.equal(r.status,200);
assert((await r.json()).polls.every(x=>x.counts.every(v=>v===0)));
r=await call("/v1/vote","POST","https://evil.example",{pollId:"phone",optionIndex:1,voterId:uuid});
assert.equal(r.status,403);
r=await call("/v1/vote","POST",origin,{pollId:"phone",optionIndex:10,voterId:uuid});
assert.equal(r.status,400);
r=await call("/v1/vote","POST",origin,{pollId:"phone",optionIndex:1,voterId:uuid});
assert.equal(r.status,200);
r=await call("/v1/vote","POST",origin,{pollId:"phone",optionIndex:1,voterId:uuid});
assert.equal(r.status,409);
r=await call("/v1/polls");
const after=(await r.json()).polls.find(p=>p.id==="phone");
assert.deepEqual(after.counts,[0,1,0,0]);
r=await call("/v1/ping","POST",origin,{id:uuid});
assert.equal(r.status,200);
r=await call("/v1/stats");
assert.equal(r.status,200);
r=await call("/v1/vote","OPTIONS");
assert.equal(r.status,204);
console.log("CLOUDFLARE_D1_PARK_POLLS_MOCK_OK","votes",votes.size,"writes",writeCount,"origin_and_duplicates_checked");
