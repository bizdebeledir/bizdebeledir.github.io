"use strict";
/* Yumor Parkı bootstrap. Every scene is local-first, with video lazy loading. */
(() => {
  const data=window.BBParkData,api=window.BBDiscover;
  if(!data||!api)return;
  const $=id=>document.getElementById(id);
  const catalog=$("park-catalog"),grid=$("park-grid"),filters=$("park-filter");
  const stage=$("park-stage"),body=$("park-stage-body");
  if(!grid||!body||!catalog)return;
  let filter="Hamısı",active=null,epoch=0,cleanups=[];
  let allVideos=[],videoReady=false,videoError=false;
  const videoPromise=fetch("/all-videos.json?v="+Math.floor(Date.now()/300000),{cache:"default"})
    .then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json();})
    .then(v=>{allVideos=api.list(v);videoReady=true;return allVideos;})
    .catch(()=>{videoError=true;return [];});

  function make(tag,txt="",cl="",parent=null){
    const el=document.createElement(tag);
    if(cl)el.className=cl;
    if(txt!==null && txt!==undefined)el.textContent=String(txt);
    if(parent)parent.appendChild(el);
    return el;
  }
  function get(key,fallback=null){
    try{const v=localStorage.getItem("bb_park_"+key);return v===null?fallback:JSON.parse(v);}
    catch{return fallback;}
  }
  function set(key,value){
    try{localStorage.setItem("bb_park_"+key,JSON.stringify(value));return true;}
    catch{return false;}
  }
  function track(name,extra={}){
    try{api.track("bb_park_"+name,extra);}catch{}
  }
  function secretTokens(){const arr=get("tokens",[]);return Array.isArray(arr)?arr.filter(x=>Number.isInteger(x)&&x>=1&&x<=5):[];}
  function addToken(number){
    const old=secretTokens();
    const values=[...new Set([...old,number])].sort();
    set("tokens",values);
    track("secret_found",{count:values.length});
    alert(values.length===5?"🏆 5 gizli nişanı topladın! Xəzinə oyununu aç.":"✨ Gizli nişan tapdın! "+values.length+" / 5");
    renderCatalog();
  }
  function renderFilters(){
    filters.replaceChildren();
    for(const g of ["Hamısı",...new Set(data.modes.map(x=>x.group))]){
      const b=make("button",g,g===filter?"active":"",filters);
      b.type="button";b.setAttribute("aria-pressed",String(filter===g));
      b.addEventListener("click",()=>{
        filter=g;renderFilters();renderCatalog();
      });
    }
  }
  const secretMap=new Map([[4,1],[7,2],[10,3],[14,4],[20,5]]);
  function renderCatalog(){
    grid.replaceChildren();
    const list=data.modes.filter(x=>filter==="Hamısı"||x.group===filter);
    for(const m of list){
      const article=make("article","", "park-card",grid);
      article.dataset.group=m.group;
      const open=make("button","","park-card-open",article);
      open.type="button";open.setAttribute("aria-label","Oyunu aç: "+m.title);
      make("span","NO. "+String(m.num).padStart(2,"0"),"park-card-num",open);
      make("span",m.emoji,"park-card-icon",open).setAttribute("aria-hidden","true");
      make("h3",m.title,"",open);
      make("p",m.desc,"",open);
      const foot=make("div","","park-card-foot",open);
      make("span",m.effort,"",foot);
      make("strong","↗","",foot);
      open.addEventListener("click",()=>openMode(m.id));
      if(secretMap.has(m.num)){
        const found=secretTokens().includes(secretMap.get(m.num));
        const secret=make("button",found?"✦":"✧","park-secret",article);
        secret.type="button";
        secret.title=found?"Gizli nişan tapılıb":"Gizli nişanı kəşf et";
        secret.setAttribute("aria-label",found?"Tapılmış gizli nişan":"Gizli nişanı tap");
        secret.addEventListener("click",()=>addToken(secretMap.get(m.num)));
      }
    }
    if(!list.length)make("p","Bu kateqoriyada oyun yoxdur.","park-loading",grid);
  }
  function teardown(){
    for(const clean of cleanups.splice(0)){
      try{clean();}catch{}
    }
    try{speechSynthesis.cancel();}catch{}
    epoch++;
  }
  function back(){
    teardown();
    active=null;stage.hidden=true;catalog.hidden=false;
    try{history.replaceState(null,"","/yumor-parki.html");}catch{}
    if(matchMedia("(prefers-reduced-motion:reduce)").matches)catalog.scrollIntoView();
    else catalog.scrollIntoView({behavior:"smooth",block:"start"});
    track("return_catalog");
  }
  function makeContext(m,currentEpoch){
    const live=()=>epoch===currentEpoch;
    const ctx={
      mode:m,root:body,data,api,
      h:(tag,txt="",cl="",parent=body)=>make(tag,txt,cl,parent),
      box:(cl="game-card",parent=body)=>make("div","",""+cl,parent),
      btn:(label,fn,cl="game-secondary",parent=body)=>{
        const b=make("button",label,cl,parent);b.type="button";
        b.addEventListener("click",fn);return b;
      },
      link:(label,href,cl="game-primary",parent=body)=>{
        const a=make("a",label,cl,parent);a.href=href;return a;
      },
      status:(text,kind="note")=>{
        const el=make("p",text,"game-status",body);
        if(kind==="error")el.setAttribute("role","alert");
        return el;
      },
      clear:()=>body.replaceChildren(),
      get,set,track,live,
      cleanup:fn=>cleanups.push(fn),
      videos:()=>videoPromise,
      currentVideos:()=>allVideos,
      pick:(topic,seed,max=3,excluded=[])=>data.videosFor(allVideos,api,topic,seed,max,excluded),
      videoCard:(v,parent=body,note="▶ İzlə")=>{
        if(!v||!data.validID(v.id))return null;
        const a=make("a","","game-video",parent);
        a.href="/shorts.html?v="+encodeURIComponent(v.id);
        a.setAttribute("aria-label",data.titleOf(v,api));
        const img=make("img",null,"",a);
        img.src="https://i.ytimg.com/vi/"+encodeURIComponent(v.id)+"/hqdefault.jpg";
        img.alt="";img.loading="lazy";img.decoding="async";img.width=175;img.height=105;
        const content=make("div","","",a);
        make("strong",data.titleOf(v,api),"",content);
        make("small",note+" · "+new Intl.NumberFormat("az-AZ").format(Number(v.views)||0)+" baxış","",content);
        a.addEventListener("click",()=>track("video_open",{mode:m.id,video_id:v.id}));
        return a;
      },
      emptyVideos:(parent=body)=>{
        const box=make("div","","game-info",parent);
        make("p","Video siyahısı hazırda yüklənmir. Oyun işləyir, real videolar üçün siyahıya keç.","",box);
        const link=make("a","Bütün videolar →","game-secondary",box);link.href="/videos.html";
      },
      share:async (title,text,url)=>{
        try{
          if(navigator.share){await navigator.share({title,text,url});track("shared",{game:m.id,channel:"native"});return true;}
          if(navigator.clipboard?.writeText){
            await navigator.clipboard.writeText(text+" "+url);
            track("shared",{game:m.id,channel:"clipboard"});return true;
          }
        }catch(e){if(e?.name==="AbortError")return null;}
        return false;
      },
      endpoint:async()=>{
        const res=await fetch("/visitor-config.json?b="+Math.floor(Date.now()/600000),{cache:"no-store"});
        if(!res.ok)throw Error("CONFIG_UNAVAILABLE");
        const json=await res.json();
        const value=String(json?.endpoint||"").replace(/\/+$/,"");
        let url;
        try{url=new URL(value);}catch{throw Error("BAD_ENDPOINT");}
        if(url.protocol!=="https:" || !(
          /^[a-z0-9-]+\.trycloudflare\.com$/.test(url.hostname) ||
          /^bb-site-visitors\.[a-z0-9-]+\.workers\.dev$/.test(url.hostname)
        ))throw Error("UNSAFE_ENDPOINT");
        return value;
      },
      apiCall:async(path,payload)=>{
        const endpoint=await ctx.endpoint();
        const controller=new AbortController();
        const timer=setTimeout(()=>controller.abort(),10000);
        try{
          const opts={cache:"no-store",mode:"cors",credentials:"omit",signal:controller.signal};
          if(payload!==undefined){
            opts.method="POST";
            opts.headers={"Content-Type":"application/json"};
            opts.body=JSON.stringify(payload);
          }
          const res=await fetch(endpoint+path,opts);
          const response=await res.json();
          return {status:res.status,data:response};
        }finally{clearTimeout(timer);}
      },
      voterId:()=>{
        let id=get("anonymous_voter_id");
        if(typeof id==="string"&&/^[0-9a-f-]{36}$/.test(id))return id;
        if(!globalThis.crypto?.randomUUID)throw Error("Secure browser ID unavailable");
        id=crypto.randomUUID();set("anonymous_voter_id",id);
        return id;
      },
      open:openMode
    };
    return ctx;
  }
  function openMode(id){
    const m=data.modes.find(x=>x.id===id);
    if(!m)return;
    if(m.id==="dna"){track("open_dna");location.assign("/yumor-dnt.html");return;}
    teardown();
    active=m.id;
    const currentEpoch=epoch;
    body.replaceChildren();
    $("park-stage-index").textContent="OYUN "+String(m.num).padStart(2,"0")+" / 20";
    $("park-stage-emoji").textContent=m.emoji;
    $("park-stage-title").textContent=m.title;
    $("park-stage-description").textContent=m.desc;
    $("park-stage-group").textContent=m.group.toUpperCase();
    catalog.hidden=true;stage.hidden=false;
    try{
      const url=new URL("/yumor-parki.html",location.origin);
      url.searchParams.set("game",id);
      if(id==="duel"){
        const invite=new URLSearchParams(location.search).get("invite");
        if(data.decodeDuel(invite))url.searchParams.set("invite",invite);
      }
      history.replaceState(null,"",url);
    }catch{}
    const c=makeContext(m,currentEpoch);
    const impl=window.BBParkGames?.[id];
    try{
      if(typeof impl!=="function")throw Error("MODE_NOT_IMPLEMENTED");
      impl(c);
    }catch{
      c.clear();c.status("Bu oyunu açmaq mümkün olmadı. Başqa oyunu seç.", "error");
    }
    stage.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth",block:"start"});
    track("open_game",{id});
  }
  $("park-stage-back").addEventListener("click",back);
  $("park-other-game").addEventListener("click",()=>{
    const others=data.modes.filter(x=>x.id!==active&&x.id!=="dna");
    openMode(data.pick(others,data.dateBaku()+":"+Math.random())?.id||"daily");
  });
  $("park-subscribe")?.addEventListener("click",()=>track("subscribe_click"));
  const handlers={...(window.BBParkGames||{})};
  if(typeof window.BBParkInstallA==="function")window.BBParkInstallA(handlers);
  if(typeof window.BBParkInstallB==="function")window.BBParkInstallB(handlers);
  window.BBParkGames=Object.freeze(handlers);
  renderFilters();renderCatalog();
  const startId=new URLSearchParams(location.search).get("game");
  if(startId&&data.modes.some(x=>x.id===startId))openMode(startId);
})();
