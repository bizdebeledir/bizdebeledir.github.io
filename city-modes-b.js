"use strict";
/* Districts 7-10: audience vote, offline kit, private local insights and SEO discovery. */
(function(host){
 const city=host.BBCity;
 const modes=host.BBCityModes||{};
 function info(c,title,text,parent=c.root){
  const b=c.block("city-card",parent);
  c.el("h3",title,"",b);
  if(text)c.el("p",text,"",b);
  return b;
 }
 modes.director=c=>{
  info(c,"🎬 Tamaşaçı mövzunu seçir","3 mövzudan birinə real səs ver. Nəticələr serverdən gəlir və videonun çəkiləcəyinə zəmanət verilmir.");
  const week=city.isoWeek(),pollId="city_director_"+week;
  const state=c.status("Canlı səsvermə yoxlanılır…");
  const area=c.block("city-card");
  let counts=null;
  async function fetchCounts(){
   try{
    const res=await c.request("/v1/city-polls?week="+encodeURIComponent(week));
    if(!c.live())return;
    const poll=res.data?.polls?.find(p=>p.id===pollId);
    if(res.status!==200 || !res.data?.ok || !poll || !Array.isArray(poll.counts) ||
       poll.counts.length!==3 || !poll.counts.every(v=>Number.isInteger(v)&&v>=0))
      throw Error("STATS_UNAVAILABLE");
    counts=poll.counts;
    state.textContent="✅ Real səsvermə işləyir. Həftə: "+week;
   }catch{
    if(!c.live())return;
    counts=null;state.textContent="⚠️ Səsvermə serveri hazırda əlçatan deyil, uydurma nəticə yoxdur.";
   }
   render();
  }
  function render(){
   area.replaceChildren();
   const total=counts?.reduce((a,b)=>a+b,0)||0;
   c.el("h3",total+" real səs","",area);
   const opted=c.safeRead("director_"+week,null);
   city.directorOptions.forEach((option,i)=>{
    const row=c.block("city-card",area);
    c.el("h3",option.label,"",row);
    if(counts){
     const pct=total?Math.round(100*counts[i]/total):0;
     c.el("p",counts[i]+" səs · "+pct+"%","city-small",row);
     const rail=c.block("city-meter",row);
     const fill=c.el("span",null,"",rail);fill.style.width=pct+"%";
    }
    const b=c.button(opted===i?"✅ Sənin seçimin":"Bu mövzuya səs ver",()=>cast(i,b),"city-button",row);
    b.disabled=counts===null||opted!==null;
   });
   c.el("p","Bu seçim növbəti videoya zəmanət deyil. Yekun qərarı kanal sahibi verir.","city-small",area);
  }
  async function cast(index,button){
   button.disabled=true;state.textContent="Səs yoxlanılır…";
   try{
    const r=await c.request("/v1/vote",{pollId,optionIndex:index,voterId:c.viewerId()});
    if(!c.live())return;
    if(r.status===200 && r.data?.ok){
     c.safeStore("director_"+week,index);c.track("director_vote");
     state.textContent="✅ Səsin qəbul edildi.";
     await fetchCounts();
    }else if(r.status===409){
     state.textContent="Bu brauzerdən artıq səs verilib.";
     await fetchCounts();
    }else{state.textContent="Səs qəbul edilmədi, təkrar yoxla.";button.disabled=false;}
   }catch{if(c.live()){state.textContent="Bağlantı xətası. Səsin qəbulunu təsdiqləyə bilmirəm.";button.disabled=false;}}
  }
  c.link("🎤 Öz video situasiyanı da göndər","/ideas.html","city-primary");
  fetchCounts();
 };
 modes.offline=c=>{
  info(c,"📲 Offline Mini-App","Saytı telefona əlavə edib uyğun oyunları internetsiz aça bilərsən. YouTube videoları offline açılmır.");
  const block=c.block("city-card");
  c.el("h3","Brauzer və keş vəziyyəti","",block);
  const state=c.status("Cihazın imkanları yoxlanılır…","city-status",block);
  const ready=navigator.serviceWorker&&"caches" in host;
  const label=c.el("p",ready?"✅ Offline faylları saxlamaq texniki olaraq mümkündür.":
    "Bu brauzer offline rejimi dəstəkləmir. Saytdan adi qaydada istifadə edə bilərsən.","city-small",block);
  if(ready){
   const prep=c.button("📦 Oyunları offline üçün hazırla",async()=>{
    prep.disabled=true;state.textContent="Offline faylları yoxlanılır…";
    try{
     const reg=await navigator.serviceWorker.ready;
     const worker=reg.active||navigator.serviceWorker.controller;
     if(!worker)throw Error("WORKER_NOT_ACTIVE");
     const channel=new MessageChannel();
     const response=new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error("TIMEOUT")),13000);
      channel.port1.onmessage=e=>{clearTimeout(timer);resolve(e.data);};
     });
     worker.postMessage({type:"BB_PREPARE_OFFLINE"},[channel.port2]);
     const result=await response;
     if(!c.live())return;
     if(result?.ok===true){
      c.track("offline_ready");
      state.textContent="✅ Əsas offline oyun faylları hazırdır. İndi uçuş rejimində açıb sınaya bilərsən.";
     }else throw Error("CACHE_FAILED");
    }catch{
     if(c.live())state.textContent="Offline faylları tam hazırlanmadı. İnternetlə yenidən cəhd et.";
    }finally{prep.disabled=false;}
   },"city-primary",block);
  }
  const p=c.block("city-card");
  c.el("h3","İnternetsiz nələr işləyir?","",p);
  c.el("p","✅ Gülüş Şəhərinin xəritəsi, tapmacalar, tapılmış nişanlar və offline ekranı (keş hazırlanıbsa).","city-small",p);
  c.el("p","⚠️ Real video baxışı, səsvermə, canlı ziyarətçi sayı və yeni video sinxronizasiyası internet tələb edir.","city-small",p);
  c.link("📴 Offline ekranı aç","/offline.html","city-primary",p);
  const add=c.installed();
  if(add){
   const btn=c.button("📲 Telefona quraşdır",async()=>{
    try{
     await add.prompt();
     await add.userChoice;
     state.textContent="Quraşdırma seçimi telefona göndərildi.";
     c.setInstalled(null);
    }catch{state.textContent="Quraşdırma pəncərəsi açıla bilmədi.";}
   },"city-secondary",block);
  }else c.el("p","Telefona proqram kimi quraşdırmaq üçün Chrome menyusundan «Ana ekrana əlavə et» və ya «Tətbiqi quraşdır» seç.","city-small",block);
 };
 modes.insights=c=>{
  info(c,"📊 Şəxsi İzləmə Paneli","Burada göstərilən kliklər və tamamlanmış missiyalar yalnız bu brauzerdə qeydə alınıb. Bütün sayt ziyarətçilərinin statistikası DEYİL.");
  const summary=c.metrics.summary();
  const rows=c.block("city-card");
  c.el("h3","Bu gün · "+summary.day,"",rows);
  const label={
   city_visit:"Şəhərə giriş",district_open:"Məkan açılışı",search:"Video axtarışı",mood:"Əhval seçimi",
   video_open:"Saytdakı videoya keçid",door_solved:"Tapılmış gizli qapı",cup_vote:"Duelə səs",
   director_vote:"Mövzuya səs",park_open:"20 oyunlu parka keçid",share:"Paylaşma əməliyyatı",
   offline_ready:"Offline dəsti hazırlama",youtube_outbound:"YouTube-a klik",city_return:"Xəritəyə qayıtma"
  };
  const keys=Object.keys(label);
  let has=false;
  for(const key of keys){
   const today=summary.today[key]||0,week=summary.last7days[key]||0;
   if(today===0 && week===0)continue;
   has=true;
   const row=c.block("city-analytics-row",rows);
   c.el("span",label[key],"",row);
   c.el("strong",today+" bugün · "+week+" / 7 gün","city-count",row);
  }
  if(!has)c.el("p","Hələ ölçülmüş klik yoxdur. Oyuna daxil olub fəaliyyət et, sonra yenidən bax.","city-small",rows);
  const stats=c.block("city-card");
  c.el("h3","YouTube-un ümumi göstəriciləri","",stats);
  c.data().then(()=>{
   if(!c.live())return;
   const a=c.stats();
   if(!Number.isInteger(a.views)||!Number.isInteger(a.videos)){c.el("p","YouTube məlumatları əlçatan deyil.","city-small",stats);return;}
   c.el("p","Kanalın API göstəriciləri: "+new Intl.NumberFormat("az-AZ").format(a.views)+
     " ümumi baxış, "+a.videos+" video. Bu göstəricilər saytın trafik statistikası deyil.","city-small",stats);
  });
  c.el("h3","Tam saytın analitikasına necə baxılır?","",c.root);
  const n=c.block("city-card");
  c.el("p","Yalnız sayt sahibinin Google hesabı ilə giriş etdiyi Google Analytics paneli bütün ziyarətçi hadisələrini göstərə bilər. Buradakı şəxsi məlumatlar ilə qarışdırılmır.","city-small",n);
  const ga=c.link("🔐 Google Analytics-ə keç","https://analytics.google.com/","city-primary",n);
  ga.rel="noopener noreferrer";ga.target="_blank";
  const control=c.block("city-card");
  c.el("p","Bu brauzerdəki lokal ölçmə tarixçəsini istəsən təmizləyə bilərsən. Bu, Google Analytics-dəki qeydləri silmir.","city-small",control);
  c.button("🧹 Yalnız bu brauzerin ölçmələrini sil",()=>{
   const ok=confirm("Yalnız bu brauzerin son 30 günlük Gülüş Şəhəri ölçmələrini silmək istəyirsən?");
   if(ok){c.metrics.reset();c.open("insights");}
  },"city-secondary",control);
 };
 modes.discover=c=>{
  info(c,"🌍 Google üçün Video Kəşfi","Yeni videolar üçün ayrıca izləmə səhifəsi, mövzu bağlantıları və sayt xəritəsi istifadə olunur. Google indekslənməsi zəmanətli deyil.");
  const browse=c.block("city-buttons");
  for(const [topic,word] of [["phone","Telefon"],["tea","Çay"],["home","Ev"],["social","Qonşu"],["kids","Uşaq"],["shopping","Market"],["work","İş"],["transport","Yol"]]){
   c.button("🎬 "+word,()=>{c.open("search");const input=document.querySelector("#city-stage-body input[type=search]");if(input){input.value=word;input.dispatchEvent(new Event("input",{bubbles:true}));}},"city-button",browse);
  }
  c.data().then(()=>{
   if(!c.live())return;
   const items=c.videos();
   const featured=[...items].sort((a,b)=>(Date.parse(b.publishedAt)||0)-(Date.parse(a.publishedAt)||0)).slice(0,6);
   const b=c.block("city-card");
   c.el("h3","Ən yeni 6 izləmə səhifəsi","",b);
   if(!featured.length){c.empty(b);return;}
   featured.forEach(v=>c.video(v,b));
  });
  const links=c.block("city-card");
  c.el("h3","Saytın indeksləmə infrastrukturu","",links);
  c.el("p","Hər video səhifəsinin canonical ünvanı, YouTube videonun struktur məlumatları və sitemap mövcuddur. Search Console ayrıca indeksləmə statusunu göstərəcək.","city-small",links);
  c.link("📄 Video siyahısına bax","/videos.html","city-secondary",links);
  c.link("🗺️ XML sayt xəritəsinə bax","/sitemap.xml","city-secondary",links);
  c.link("🔎 Video axtarışına keç","/gulus-seheri.html?zone=search","city-primary",links);
 };
 host.BBCityModes=modes;
})(typeof window!=="undefined"?window:globalThis);
