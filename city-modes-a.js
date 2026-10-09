"use strict";
/* Districts 2-6. Every vote is server-verified, never simulated. */
(function(host){
 const city=host.BBCity;
 const modes=host.BBCityModes||{};
 function mark(c,text,parent=c.root){return c.el("p",text,"city-small",parent);}
 function card(c,title,txt,parent=c.root){
  const el=c.block("city-card",parent);
  c.el("h3",title,"",el);
  if(txt)c.el("p",txt,"",el);
  return el;
 }
 function votesOf(polls,id,length){
  const p=polls?.find(x=>x.id===id);
  if(!p||!Array.isArray(p.counts)||p.counts.length!==length||
    !p.counts.every(v=>Number.isInteger(v)&&v>=0))return null;
  return p.counts;
 }
 modes.city=c=>{
  card(c,"🗺️ Şəhərdə haraya gedək?","Hər bina ayrıca funksiyaya açılır. Bu 3D mühərrik deyil, batareyaya qənaət edən interaktiv şəhər xəritəsidir.");
  const list=c.block("city-grid");
  for(const d of city.districts.filter(x=>x.id!=="city")){
   const tile=c.block("city-tile",list);
   c.el("span",d.emoji,"city-tile-icon",tile);
   c.el("h3",d.name,"",tile);
   c.el("p",d.desc,"",tile);
   c.button("Aç →",()=>c.open(d.id),"city-button",tile);
  }
 };
 modes.cup=c=>{
  card(c,"🏆 Həftənin Video Arenası","YouTube-un real videoları arasında 4 ikili duel. Səsvermənin nəticəsi yalnız serverdən gəlir. Baxış sayı səs sayına qarışdırılmır.");
  const stats=c.stats(),week=city.isoWeek();
  const state=c.status("Video siyahısı yüklənir…");
  const holder=c.block("city-list");
  let fixture=null,polls=null;
  async function getVotes(){
   try{
    const result=await c.request("/v1/city-polls?week="+encodeURIComponent(week));
    if(!c.live())return;
    if(result.status!==200||!result.data?.ok||result.data.week!==week)throw Error("NOT_CURRENT");
    polls=result.data.polls;
    state.textContent="✅ Canlı səsvermə bağlantısı işləyir. Hər cütlükdə bir dəfə səs verə bilərsən.";
   }catch{
    if(!c.live())return;
    polls=null;
    state.textContent="⚠️ Canlı səsvermə serveri əlçatan deyil. Videolar görünür, amma səs vermək hələ mümkün deyil.";
   }
   render();
  }
  function render(){
   if(!fixture)return;
   holder.replaceChildren();
   const byId=new Map(c.videos().map(x=>[x.id,x]));
   fixture.ids.forEach(()=>{});
   for(let match=0;match<4;match++){
    const a=byId.get(fixture.ids[2*match]),b=byId.get(fixture.ids[2*match+1]);
    if(!a||!b)continue;
    const box=card(c,"⚔️ Duel "+(match+1)+" / 4","",holder);
    const pair=c.block("city-duel",box);
    const counts=votesOf(polls,"city_cup_"+week+"_m"+match,2);
    [a,b].forEach((v,idx)=>{
      const item=c.block("",pair);
      const img=c.el("img",null,"",item);
      img.src="https://i.ytimg.com/vi/"+encodeURIComponent(v.id)+"/hqdefault.jpg";
      img.loading="lazy";img.alt="";img.width=200;img.height=115;
      c.el("h4",city.videoTitle(v),"",item);
      const link=c.link("▶ Videoya bax","/video/"+encodeURIComponent(v.id)+".html","city-secondary",item);
      link.style.display="inline-block";link.style.textDecoration="none";
      const old=c.safeRead("cup_"+week+"_m"+match,null);
      const vote=c.button("🗳️ Bu videoya səs ver",()=>cast(match,idx,vote),"city-button",item);
      vote.disabled=counts===null||old!==null;
      if(old===idx)c.el("small","✅ Sən bu videonu seçmisən.","city-small",item);
      if(counts!==null){
       const total=counts[0]+counts[1],pct=total?Math.round(counts[idx]*100/total):0;
       c.el("p",counts[idx]+" real səs · "+pct+"%","city-small",item);
       const rail=c.block("city-meter",item);
       const fill=c.el("span",null,"",rail);fill.style.width=pct+"%";
      }
    });
    if(counts!==null){
     const total=counts[0]+counts[1];
     const conclusion=total===0?"Hələ səs verilməyib.":
       counts[0]===counts[1]?"Hazırda bərabərlik var.":
       "İndiki lider: "+city.videoTitle(counts[0]>counts[1]?a:b);
     mark(c,conclusion,box);
    }else mark(c,"Təsdiqlənmiş səs sayı əlçatan deyil.",box);
   }
  }
  async function cast(match,idx,btn){
   if(!polls)return;
   btn.disabled=true;state.textContent="Səs yoxlanılır…";
   try{
    const id="city_cup_"+week+"_m"+match;
    const result=await c.request("/v1/vote",{pollId:id,optionIndex:idx,voterId:c.viewerId()});
    if(!c.live())return;
    if(result.status===200&&result.data?.ok){
     c.safeStore("cup_"+week+"_m"+match,idx);
     c.track("cup_vote");state.textContent="✅ Səsin qəbul edildi, real nəticə yenilənir.";
     await getVotes();
    }else if(result.status===409){
     state.textContent="Bu brauzerdən həmin duelə artıq səs verilib.";
     await getVotes();
    }else{
     state.textContent="Səs qəbul edilmədi. Server statusu: "+result.status;
     btn.disabled=false;
    }
   }catch{
    if(c.live()){state.textContent="Səsvermə bağlantısı kəsildi. Səs qəbul edildiyi təsdiqlənmədi.";btn.disabled=false;}
   }
  }
  c.data().then(()=>{
   if(!c.live())return;
   fixture=city.safeFixture(c.stats().cityGames,c.videos());
   if(!fixture || fixture.week!==week)fixture=city.fixture(c.videos(),week);
   if(fixture.ids.length!==8){holder.replaceChildren();c.empty(holder);return;}
   state.textContent="Həftə: "+week+" · 8 real video";
   getVotes();
  });
 };
 modes.dj=c=>{
  card(c,"🎧 Əhvalını seç","Bu, tibbi və ya psixoloji məsləhət deyil. Öz əhvalına əsasən yüngül əyləncə seçirsən.");
  const chooser=c.block("city-buttons");
  const results=c.block("city-card");
  function play(m,byUser=true){
   results.replaceChildren();
   c.el("h3",m.emoji+" "+m.title,"",results);
   c.el("p",m.script,"",results);
   if(byUser)c.track("mood");
   c.safeStore("last_mood",m.id);
   c.data().then(()=>{
    if(!c.live())return;
    const videos=city.recommendations(c.videos(),m.id);
    if(!videos.length){c.empty(results);return;}
    c.el("h3","Sənə 3 video","",results);
    for(const v of videos)c.video(v,results);
    c.link("🎡 Yumor Parkında oyun aç","/yumor-parki.html","city-primary",results);
   });
   chooser.querySelectorAll("button").forEach(b=>b.classList.toggle("selected",b.dataset.mood===m.id));
  }
  for(const mood of city.moods){
   const b=c.button(mood.emoji+" "+mood.title,()=>play(mood),"city-button",chooser);
   b.dataset.mood=mood.id;
  }
  const last=c.safeRead("last_mood");
  const m=city.moods.find(x=>x.id===last)||city.moods[0];
  play(m,false);
 };
 modes.missions=c=>{
  card(c,"🏅 Gündəlik Gülüş Missiyaları","Hesab açmadan bu brauzerdə gördüyün işlər üzrə şəxsi nişanlar. Real pul, hədiyyə və ictimai lider cədvəli yoxdur.");
  const area=c.block("city-card");
  const summary=c.metrics.summary();
  const today=summary.today,week=summary.last7days;
  const daily=city.missions.filter(m=>(today[m.key]||0)>=m.target);
  const weekly=city.missions.filter(m=>(week[m.key]||0)>=m.target);
  c.el("h3","Bu gün: "+daily.length+" / "+city.missions.length,"",area);
  c.el("p","Son 7 gündə yerinə yetirilmiş fərqli missiyalar: "+weekly.length+" / "+city.missions.length,"city-progress",area);
  const medals=c.block("city-collection",area);
  for(const m of city.missions){
   const chip=c.block("city-medal "+((today[m.key]||0)>=m.target?"earned":""),medals);
   c.el("span",m.emoji,"",chip);
   chip.title=m.title;
   chip.setAttribute("aria-label",m.title+((today[m.key]||0)>=m.target?" tamamlandı":" gözləyir"));
  }
  const list=c.block("city-grid");
  for(const m of city.missions){
   const done=(today[m.key]||0)>=m.target;
   const item=c.block("city-tile"+(done?" city-mission complete":""),list);
   c.el("div",m.emoji,"city-tile-icon",item);
   c.el("h3",m.title,"",item);
   c.el("p",done?"✅ Bu gün tamamlandı":"Hələ tamamlanmayıb","",item);
  }
  mark(c,"Nəticələr bu brauzerə məxsusdur. Başqa telefonda ayrıca başlanacaq.");
  c.button("↻ Missiyaları yenilə",()=>{c.open("missions");});
 };
 modes.doors=c=>{
  const query=new URLSearchParams(location.search);
  let door=city.doors.find(d=>d.id===query.get("door"))||city.doors[0];
  card(c,"🚪 Sürprizli Qapılar","Bir tapmaca seç. Cavab doğru olduqda real Shorts sürprizi açılır. Dostun üçün ayrıca link yarat.");
  const chooser=c.block("city-buttons");
  const box=c.block("city-card");
  const current=c.status("");
  function select(d){
   door=d;box.replaceChildren();
   c.el("p",d.emoji+" GİZLİ QAPI","city-eyebrow",box);
   c.el("div","🔒","city-door-lock",box);
   c.el("h3",d.question,"",box);
   const input=c.el("input",null,"city-input",box);
   input.placeholder="Cavabını yaz";input.maxLength=40;
   input.setAttribute("aria-label","Tapmacanın cavabı");
   let tries=0;
   function solve(){
    tries++;
    const correct=d.answers.some(answer=>city.fold(answer)===city.fold(input.value));
    if(correct){
     box.replaceChildren();
     c.el("div","🔓","city-door-lock",box);
     c.el("h3","Qapı açıldı!","",box);
     c.el("p","Dostun üçün seçilmiş yumor hədiyyəsi:","",box);
     c.track("door_solved");
     c.data().then(()=>{
      if(!c.live())return;
      const candidate=city.recommendations(c.videos(),
        d.topic==="tea"?"tired":d.topic==="phone"?"angry":"happy")[0]||
        c.videos().find(v=>city.topicMatches(v,d.topic))||c.videos()[0];
      if(candidate)c.video(candidate,box);
      else c.empty(box);
     });
     current.textContent="✅ Tapmaca həll olundu.";
    }else current.textContent=tries>=2?"Yanlış cavab. İpucu: "+d.hint:"Bir daha yoxla.";
   }
   c.button("🔑 Qapını aç",solve,"city-primary",box);
   input.addEventListener("keydown",e=>{if(e.key==="Enter")solve();});
   const share=c.button("↗ Dostuma tapmaca göndər",async()=>{
    const url=new URL("/gulus-seheri.html",location.origin);
    url.searchParams.set("zone","doors");url.searchParams.set("door",d.id);
    const ok=await c.share("🚪 Gizli Yumor Qapısı","Bu tapmacanı aça bilərsən?",url.href);
    current.textContent=ok===true?"Paylaşma açıldı və ya link kopyalandı.":
      ok===null?"Paylaşma ləğv edildi.":"Paylaşma dəstəklənmir. Keçid: "+url.href;
   },"city-secondary",box);
   share.style.display="block";
  }
  for(const d of city.doors)c.button(d.emoji+" "+d.id,()=>select(d),"city-button",chooser);
  select(door);
 };
 modes.search=c=>{
  card(c,"🔎 Azərbaycan dilində ağıllı axtarış","Məsələn: «qonwu», «gonaq», «telefon», «arvad», «çay». Başlıqdakı sözlər və AZ hərflərinin alternativ yazılışları tanınır.");
  const form=c.el("form",null,"city-search-form");
  const input=c.el("input",null,"",form);
  input.type="search";input.maxLength=60;input.placeholder="Video və ya situasiya axtar…";
  input.setAttribute("aria-label","Video axtarışı");
  const submit=c.el("button","Axtar","",form);submit.type="submit";
  const hint=c.status("İstədiyin sözü yaz. Nəticələr yalnız real kanal videolarıdır.");
  const list=c.block("city-list");
  const keys=c.block("city-buttons");
  let pending=0;
  function render(){
   const q=input.value.trim();list.replaceChildren();
   if(!q){hint.textContent="Məsələn: «qonaq» və ya «qonwu»";return;}
   const matches=city.search(c.videos(),q,24);
   hint.textContent=matches.length+" uyğun real video tapıldı.";
   if(!matches.length){
    const card=c.block("city-card",list);
    c.el("p","Bu sözlə uyğun video tapılmadı. Başqa sözlə yoxla.","",card);
   }
   matches.forEach(v=>c.video(v,list));
   if(c.ready())c.track("search");
  }
  form.addEventListener("submit",e=>{e.preventDefault();render();});
  input.addEventListener("input",()=>{
   clearTimeout(pending);pending=setTimeout(render,250);
  });
  c.cleanup(()=>clearTimeout(pending));
  for(const word of ["Qonaq","Çay","Telefon","Uşaq","Market","İş"]){
   c.button(word,()=>{input.value=word;render();},"city-button",keys);
  }
  c.data().then(()=>{if(c.live()&&input.value)render();});
 };
 host.BBCityModes=modes;
})(typeof window!=="undefined"?window:globalThis);
