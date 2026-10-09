"use strict";
/* Gülüş Şəhəri: pure client-safe algorithms. No AI key, account, or external dependency. */
(function(host){
 const districts=[
  ["city","🌆","Gülüş Şəhəri","İnteraktiv şəhərin 10 binası"],
  ["cup","🏆","Video Çempionlar Liqası","4 həftəlik real video dueli"],
  ["dj","🎧","Gülüş DJ","Əhvalına uyğun 3 real video"],
  ["missions","🏅","Gülüş Missiyaları","Gündəlik nişan və şəxsi kolleksiya"],
  ["doors","🚪","Gizli Qapılar","Dostuna tapmacalı sürpriz göndər"],
  ["search","🔎","Ağıllı Video Axtarışı","AZ hərfləri və sadə yazı səhvləri"],
  ["director","🎬","Tamaşaçı Seçir","Növbəti mövzuya real səs ver"],
  ["offline","📲","Offline Mini-App","Oflayn oyun dəstini hazırla"],
  ["insights","📊","Şəxsi Göstəricilər","Bu cihazdakı istifadə hadisələri"],
  ["discover","🌍","Google Video Kəşfi","Mövzulu videoların indekslənən səhifələri"]
 ].map(([id,emoji,name,desc],i)=>({id,emoji,name,desc,num:i+1}));
 const moods=[
  ["tired","😴","Yorğunam",["tea","home"],"Bir az çay və tanış ev səhnələri"],
  ["angry","😤","Əsəbiyəm",["phone","social"],"Xırda problemləri yumora çevirək"],
  ["happy","🥳","Şənəm",["social","kids"],"Bu əhvalın davam etsin"],
  ["bored","🥱","Darıxıram",["shopping","work"],"Gündəlik paradokslar səni gözləyir"],
  ["nostalgic","🥹","Uşaqlığı xatırlayıram",["kids","home"],"Uşaq məntiqi və ev səhnələri"],
  ["stressed","🫠","Başım qarışıb",["tea","transport"],"Tanış hadisələrlə dincəl"]
 ].map(([id,emoji,title,topics,script])=>({id,emoji,title,topics,script}));
 const missions=[
  ["visit","🚶","Şəhərə daxil ol","city_visit"],
  ["search","🔎","Ağıllı axtarış et","search"],
  ["mood","🎧","Əhvalını seç","mood"],
  ["video","🎬","Real video aç","video_open"],
  ["door","🚪","Gizli qapı aç","door_solved"],
  ["cup","🏆","Həftəlik duelə səs ver","cup_vote"],
  ["director","🎤","Növbəti mövzunu seç","director_vote"],
  ["game","🎡","Yumor Parkında oyun aç","park_open"],
  ["share","↗","Sürpriz linki paylaş","share"],
  ["offline","📲","Offline dəsti hazırla","offline_ready"]
 ].map(([id,emoji,title,key])=>({id,emoji,title,key,target:1}));
 const doors=[
  {id:"tea",emoji:"☕",question:"İki qəndlə daha yaxşı olan nədir?",answers:["cay","çay"],topic:"tea",hint:"Süfrənin ayrılmaz hissəsi"},
  {id:"phone",emoji:"📱",question:"Əlində ola-ola axtardığın cihaz nədir?",answers:["telefon"],topic:"phone",hint:"Zəng etmədən də axtarılır"},
  {id:"neighbor",emoji:"🚪",question:"Qapıdan xəbərlə girən kimdir?",answers:["qonsu","qonşu"],topic:"social",hint:"Məhəllədə hamı tanıyır"},
  {id:"remote",emoji:"📺",question:"Divanın altında itən əşya nədir?",answers:["pult"],topic:"home",hint:"Televizoru idarə edir"}
 ];
 const directorOptions=[
  {id:"family",label:"🏠 Ailə və ev",topic:"home"},
  {id:"neighbors",label:"🚶 Dost və qonşu",topic:"social"},
  {id:"work",label:"💼 İş və gündəlik həyat",topic:"work"}
 ];
 const aliases={
  phone:["telefon","zeng","zəng","mobil","ekran","mesaj","bildiris","bildiriş"],
  social:["qonşu","qonsu","tanis","tanış","dost","qonaq","gonaq","salam"],
  home:["ev","evde","evdə","ailə","aile","divan","pult","qapi","qapı"],
  tea:["cay","çay","qend","qənd","stakan","stəkan","süfrə"],
  kids:["usaq","uşaq","ogul","oğul","qiz","qız","məktəb","mekteb"],
  shopping:["market","magaza","mağaza","kassa","pul","qiymət","qiymet","endirim"],
  work:["iş","is","mudir","müdir","maaş","ofis","isci","işçi"],
  transport:["masin","maşın","marşrut","marsrut","avtobus","sürücü","surucu","taksi"],
  couple:["ər","er","arvad","yoldaş","yoldas","sevgili","gəlin","gelin"]
 };
 const translit={"ə":"e","ğ":"g","ı":"i","ö":"o","ş":"s","ç":"c","ü":"u"};
 function fold(txt){return String(txt||"").toLocaleLowerCase("az-AZ").split("").map(ch=>translit[ch]||ch).join("").replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");}
 function dice(key){let n=2166136261;for(const ch of String(key))n=Math.imul(n^ch.charCodeAt(0),16777619);return n>>>0;}
 function isoWeek(date=new Date()){
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Baku",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date);
  const n=Object.fromEntries(parts.map(x=>[x.type,Number(x.value)]));
  const d=new Date(Date.UTC(n.year,n.month-1,n.day));d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));
  const year=d.getUTCFullYear(),jan=new Date(Date.UTC(year,0,1));
  return year+"W"+String(Math.ceil((((d-jan)/86400000)+1)/7)).padStart(2,"0");
 }
 function localDay(date=new Date()){
  const p=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Baku",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date);
  const n=Object.fromEntries(p.map(x=>[x.type,x.value]));
  return n.year+"-"+n.month+"-"+n.day;
 }
 function normalizeVideos(raw){
  if(!Array.isArray(raw))return [];
  const seen=new Set();
  return raw.filter(v=>{
   if(!v||!(/^[A-Za-z0-9_-]{11}$/).test(v.id)||seen.has(v.id))return false;
   seen.add(v.id);return true;
  });
 }
 function videoTitle(v){return String(v?.title||"Video").split("#")[0].trim().slice(0,110);}
 function topicMatches(v,topic){
  const title=" "+fold(videoTitle(v))+" ";
  return (aliases[topic]||[]).some(w=>title.includes(" "+fold(w)+" "));
 }
 function distance(a,b,max=2){
  if(Math.abs(a.length-b.length)>max)return max+1;
  let prev=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
   const row=[i];for(let j=1;j<=b.length;j++)row[j]=Math.min(prev[j]+1,row[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
   if(Math.min(...row)>max)return max+1;
   prev=row;if(Math.min(...row)>max)return max+1;
  }
  return prev[b.length];
 }
 function search(videos,query,limit=24){
  const clean=fold(query);if(!clean)return [];
  const words=clean.split(" ").filter(Boolean).slice(0,6);
  const matchedTopics=Object.keys(aliases).filter(t=>aliases[t].some(a=>words.some(w=>distance(fold(a),w,1)<=1)));
  return normalizeVideos(videos).map(v=>{
   const title=fold(videoTitle(v)),tokens=title.split(" ");let score=0;
   for(const word of words){
    if((" "+title+" ").includes(" "+word+" ")){score+=4;continue;}
    if(word.length>=3&&tokens.some(x=>x.startsWith(word))){score+=3;continue;}
    if(word.length>=4&&tokens.some(x=>distance(word,x,word.length>6?2:1)<= (word.length>6?2:1))){score+=2;continue;}
    if(matchedTopics.some(t=>topicMatches(v,t)))score+=1;
   }
   return {video:v,score,views:Number(v.views)||0,published:Date.parse(v.publishedAt)||0};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||b.published-a.published||b.views-a.views)
    .slice(0,Math.min(Math.max(1,limit),60)).map(x=>x.video);
 }
 function recommendations(videos,mood,seen=[]){
  const selected=moods.find(m=>m.id===mood)||moods[0];
  const excluded=new Set(seen),pool=normalizeVideos(videos).filter(v=>!excluded.has(v.id));
  const priority=pool.filter(v=>selected.topics.some(t=>topicMatches(v,t)));
  const rest=pool.filter(v=>!priority.includes(v));
  const sort=list=>list.sort((a,b)=>(Date.parse(b.publishedAt)||0)-(Date.parse(a.publishedAt)||0));
  return [...sort(priority),...sort(rest)].slice(0,3);
 }
 function fixture(videos,week=isoWeek()){
  const safe=normalizeVideos(videos),shorts=safe.filter(v=>/^PT(?:10|11|12|13)S$/.test(String(v.duration||"")));
  const pool=shorts.length>=8?shorts:safe;
  const ranked=[...pool].sort((a,b)=>dice(week+":"+a.id)-dice(week+":"+b.id));
  return {week,ids:ranked.slice(0,8).map(v=>v.id)};
 }
 function safeFixture(f,videos){
  if(!f||!/^\d{4}W\d{2}$/.test(String(f.week))||!Array.isArray(f.ids)||f.ids.length!==8)return null;
  const ids=new Set(normalizeVideos(videos).map(v=>v.id));
  return new Set(f.ids).size===8&&f.ids.every(id=>ids.has(id))?{week:f.week,ids:[...f.ids]}:null;
 }
 host.BBCity=Object.freeze({districts,moods,missions,doors,directorOptions,aliases,fold,dice,isoWeek,localDay,normalizeVideos,videoTitle,topicMatches,distance,search,recommendations,fixture,safeFixture});
})(typeof window!=="undefined"?window:globalThis);
if(typeof module!=="undefined"&&module.exports)module.exports=globalThis.BBCity;
