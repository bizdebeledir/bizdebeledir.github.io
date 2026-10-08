/* Cloudflare Workers + D1 replacement for temporary phone tunnel.
 * Deploy only after authenticating Cloudflare and provisioning D1.
 */
const SITE = "https://bizdebeledir.github.io";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ORIGIN_HEADERS = {"Access-Control-Allow-Origin":SITE,"Vary":"Origin"};

function cors(origin) { return origin === SITE ? ORIGIN_HEADERS : {"Vary":"Origin"}; }
function json(body, status=200, origin="") {
  return new Response(JSON.stringify(body), {
    status, headers: {"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",
      "X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer",...cors(origin)}
  });
}
async function hashId(id, salt) {
  const te=new TextEncoder();
  const key=await crypto.subtle.importKey("raw",te.encode(salt),
    {name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const signature=await crypto.subtle.sign("HMAC",key,te.encode(id));
  return Array.from(new Uint8Array(signature),byte=>byte.toString(16).padStart(2,"0")).join("");
}
async function stats(db) {
  const now=Math.floor(Date.now()/1000);
  const counts=await db.prepare(
    "SELECT "+
    "COUNT(*) FILTER (WHERE last_seen >= ?) AS online, "+
    "COUNT(*) FILTER (WHERE last_seen >= ?) AS last24h, "+
    "COUNT(*) AS last7d FROM visitors WHERE last_seen >= ?")
    .bind(now-300,now-86400,now-604800).first();
  const meta=await db.prepare("SELECT value FROM meta WHERE key='tracked_since'").first();
  return {ok:true, online:Number(counts?.online||0),
    last24h:Number(counts?.last24h||0),last7d:Number(counts?.last7d||0),
    onlineWindowMinutes:5, updatedAt:now,
    trackedSince:Number(meta?.value||now),method:"anonymous-browser-unique",
    historicalBackfill:false};
}
export default {
  async fetch(req, env) {
    const url=new URL(req.url);
    const origin=req.headers.get("Origin")||"";
    if(req.method==="OPTIONS"){
      if(origin!==SITE || !["/v1/stats","/v1/ping"].includes(url.pathname))
        return json({ok:false},403,origin);
      return new Response(null,{status:204,headers:{...ORIGIN_HEADERS,
        "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
        "Access-Control-Allow-Headers":"Content-Type",
        "Access-Control-Max-Age":"600"}});
    }
    if(url.pathname==="/health" && req.method==="GET")
      return json({ok:true,version:1},200,origin);
    if(!env?.DB) return json({ok:false,error:"DATABASE_NOT_CONFIGURED"},503,origin);
    if(url.pathname==="/v1/stats" && req.method==="GET"){
      try{return json(await stats(env.DB),200,origin);}
      catch{return json({ok:false,error:"STATISTICS_UNAVAILABLE"},503,origin);}
    }
    if(url.pathname==="/v1/ping" && req.method==="POST"){
      if(origin!==SITE) return json({ok:false,error:"INVALID_ORIGIN"},403,origin);
      if(typeof env?.VISITOR_SALT!=="string" || env.VISITOR_SALT.length<24)
        return json({ok:false,error:"SECURITY_NOT_CONFIGURED"},503,origin);
      const length=Number(req.headers.get("Content-Length")||"0");
      if(length>1024 || length<0) return json({ok:false,error:"BAD_REQUEST"},400,origin);
      let value;
      try{
        const body=await req.text();
        if(body.length>1024)throw Error("Too long");
        value=JSON.parse(body);
      }catch{return json({ok:false,error:"BAD_REQUEST"},400,origin);}
      if(typeof value?.id!=="string" || !UUID.test(value.id))
        return json({ok:false,error:"BAD_REQUEST"},400,origin);
      try {
        const key=await hashId(value.id,env.VISITOR_SALT);
        const now=Math.floor(Date.now()/1000);
        await env.DB.prepare(
          "INSERT INTO visitors(id_hash,first_seen,last_seen) VALUES(?,?,?) "+
          "ON CONFLICT(id_hash) DO UPDATE SET last_seen=excluded.last_seen "+
          "WHERE visitors.last_seen < ?")
          .bind(key,now,now,now-120).run();
        return json(await stats(env.DB),200,origin);
      }catch{return json({ok:false,error:"TRACKING_UNAVAILABLE"},503,origin);}
    }
    return json({ok:false,error:"NOT_FOUND"},404,origin);
  },
  async scheduled(_event,env) {
    if(!env?.DB)return;
    const before=Math.floor(Date.now()/1000)-30*86400;
    await env.DB.prepare("DELETE FROM visitors WHERE last_seen < ?").bind(before).run();
  }
};
