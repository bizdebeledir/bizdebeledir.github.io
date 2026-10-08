"use strict";
/* Bizdə Belədir Discovery 2.0. No repeated YouTube description boilerplate. */
(function (host) {
  const TOPICS = Object.freeze([
    {id:"all",label:"Hamısı"},
    {id:"couple",label:"❤️ Ər-arvad"},
    {id:"home",label:"🏠 Ev"},
    {id:"kids",label:"👶 Uşaq"},
    {id:"social",label:"🚶 Dost-qonşu"},
    {id:"work",label:"💼 İş"},
    {id:"shopping",label:"🛒 Market"},
    {id:"tea",label:"☕ Çay"},
    {id:"phone",label:"📱 Telefon"},
    {id:"transport",label:"🚌 Yol"}
  ]);
  const TERMS = Object.freeze({
    couple:["ər","arvad","həyat yoldaşı","sevgili","evlilik","qayınana","gəlin","bəy","kişi","qadın"],
    home:["ev","evdə","evdəki","otaq","qapı","divan","pult","televizor","yataq","soyuducu","mətbəx","ana","ata","ailə","qohum"],
    kids:["uşaq","uşaqlar","bala","oyuncaq","məktəb","körpə","oğlum","qızım","uşağı","oğlu"],
    social:["qonşu","dost","tanış","salam","qonaq","toy","məclis","küçə","hamı","qohumlar"],
    work:["iş","işdə","işçi","ofis","müdir","maaş","fasilə","rəhbər","işdən","işə","işləmək"],
    shopping:["market","mağaza","pul","qiymət","qiyməti","qiymətə","terminal","kassa","alışveriş","kart","satıcı","manat","alış-veriş"],
    tea:["çay","qənd","fincan","stəkan","qaşıq","çaydan","süfrə"],
    phone:["telefon","bildiriş","ekran","şarj","zəng","mesaj","whatsapp","wifi","internet","pult"],
    transport:["avtobus","marşrut","sürücü","taksi","dayanacaq","maşın","yol","piyada","sürət"]
  });
  const VALID_ID=/^[a-zA-Z0-9_-]{11}$/;
  const KEY_SEEN="bizde_videos_seen_v2";
  const KEY_FAVORITES="bizde_favorites_v1";
  const KEY_TOPIC="bizde_preferred_topic_v2";
  const KEY_EXPERIMENT="bizde_ab_cta_v1";

  function fold(input) {
    const map={"ə":"e","ğ":"g","ı":"i","ö":"o","ş":"s","ç":"c","ü":"u","Ə":"e","Ğ":"g","İ":"i","Ö":"o","Ş":"s","Ç":"c","Ü":"u"};
    return String(input??"").split("").map(c=>map[c]??c)
      .join("").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  }
  function storageGet(key) {try{return host.localStorage?.getItem(key)||"";}catch{return "";}}
  function storageSet(key,value) {try{host.localStorage?.setItem(key,value);}catch{}}
  function arrayGet(key,limit=80){
    try{
      const value=JSON.parse(storageGet(key)||"[]");
      return Array.isArray(value)?value.filter(x=>typeof x==="string"&&VALID_ID.test(x)).slice(0,limit):[];
    }catch{return [];}
  }
  function labelText(video){
    // Only the title before hashtags matters. The same generic description
    // is pasted onto many different videos and must not bias categories.
    return fold(String(video?.title||"").split("#")[0].slice(0,220));
  }
  const normalized=Object.fromEntries(
    Object.entries(TERMS).map(([id,words])=>[id,words.map(fold)])
  );
  function categories(video){
    const words=" "+labelText(video)+" ";
    return Object.entries(normalized).filter(([_topic,list])=>
      list.some(term=>words.includes(" "+term+" "))
    ).map(([id])=>id);
  }
  function topicMatch(video,id) {
    return !id||id==="all"||categories(video).includes(id);
  }
  function title(video) {
    return String(video?.title||"Bizdə Belədir").split("#")[0].trim().slice(0,100)||"Bizdə Belədir";
  }
  function valid(video) {return !!video && typeof video==="object" && VALID_ID.test(String(video.id||""));}
  function list(items){
    if(!Array.isArray(items))return [];
    const used=new Set();
    return items.filter(v=>{
      if(!valid(v)||used.has(v.id))return false;
      used.add(v.id);return true;
    });
  }
  function seen(){return arrayGet(KEY_SEEN,24);}
  function remember(id){
    if(!VALID_ID.test(String(id)))return;
    storageSet(KEY_SEEN,JSON.stringify([id,...seen().filter(x=>x!==id)].slice(0,24)));
  }
  function lastWatched(){return seen()[0]||null;}
  function favorites(){return arrayGet(KEY_FAVORITES,100);}
  function isFavorite(id){return favorites().includes(id);}
  function toggleFavorite(id){
    if(!VALID_ID.test(String(id)))return false;
    const current=favorites();
    const added=!current.includes(id);
    storageSet(KEY_FAVORITES,JSON.stringify((added?[id,...current]:current.filter(x=>x!==id)).slice(0,100)));
    return added;
  }
  function preference(){
    const value=storageGet(KEY_TOPIC);
    return TOPICS.some(x=>x.id===value)?value:"all";
  }
  function setPreference(id){
    if(TOPICS.some(x=>x.id===id))storageSet(KEY_TOPIC,id);
  }
  function localDay(){
    try{return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Baku",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());}
    catch{return new Date().toISOString().slice(0,10);}
  }
  function hash(str){
    let h=2166136261;
    for(const char of String(str)){
      h ^= char.charCodeAt(0);
      h=Math.imul(h,16777619);
    }
    return h>>>0;
  }
  function dayPick(items,day=localDay()){
    const videos=list(items).sort((a,b)=>(Date.parse(b.publishedAt)||0)-(Date.parse(a.publishedAt)||0));
    if(!videos.length)return null;
    const candidate=[...videos.slice(0,Math.min(20,videos.length))].sort((a,b)=>Number(b.views||0)-Number(a.views||0)).slice(0,12);
    return candidate[hash(day)%candidate.length];
  }
  function recommend(items,limit=3,selectedTopic=preference(),currentId=""){
    const videos=list(items).filter(v=>v.id!==currentId);
    if(!videos.length)return [];
    const hist=new Set(seen());
    const relevant=videos.filter(v=>topicMatch(v,selectedTopic));
    const candidates=[...relevant,...videos.filter(v=>!relevant.includes(v))];
    const maxView=Math.max(1,...videos.map(v=>Math.max(0,Number(v.views)||0)));
    const now=Date.now();
    return candidates.map(v=>{
      const age=Math.max(0,now-(Date.parse(v.publishedAt)||now))/86400000;
      const freshness=1/(1+age/30);
      const popularity=Math.log1p(Math.max(0,Number(v.views)||0))/Math.log1p(maxView);
      const match=selectedTopic!=="all"&&topicMatch(v,selectedTopic)?1:0;
      return {v,score:freshness*.45+popularity*.35+match*.2-(hist.has(v.id)?1.2:0)};
    }).sort((a,b)=>b.score-a.score||hash(a.v.id)-hash(b.v.id))
      .slice(0,Math.min(Math.max(1,limit),12)).map(x=>x.v);
  }
  function videoURL(v) {return valid(v)?"/video/"+encodeURIComponent(v.id)+".html":"/videos.html";}
  function track(event,fields={}){
    try {if(typeof host.gtag==="function")host.gtag("event",event,fields);}catch{}
  }
  function experimentGroup(){
    const existing=storageGet(KEY_EXPERIMENT);
    if(existing==="A"||existing==="B")return existing;
    const value=(host.crypto&&host.crypto.getRandomValues)
      ?host.crypto.getRandomValues(new Uint8Array(1))[0]%2?"B":"A"
      :hash(localDay())%2?"B":"A";
    storageSet(KEY_EXPERIMENT,value);
    return value;
  }
  host.BBDiscover=Object.freeze({
    topics:TOPICS.map(({id,label})=>({id,label})),valid,list,fold,title,categories,
    topicMatch,localDay,dayPick,recommend,videoURL,seen,remember,lastWatched,
    favorites,isFavorite,toggleFavorite,preference,setPreference,track,experimentGroup
  });
})(typeof window!=="undefined"?window:globalThis);
if(typeof module!=="undefined"&&module.exports)module.exports=globalThis.BBDiscover;
