"use strict";
/* Studio tools B: 5-video collections, privacy-friendly QR, archive, mini-series, analytics. */
(function(host){
 const tools=host.BBStudioTools||{};
 function info(c,title,text,parent=c.root){
  const box=c.block("studio-card",parent);
  c.el("h3",title,"",box);
  if(text)c.el("p",text,"studio-muted",box);
  return box;
 }
 function picker(c,all,callback,parent,limit=12){
  parent.replaceChildren();
  for(const v of all.slice(0,limit)){
   const item=c.block("studio-video-choice",parent);
   const img=c.el("img",null,"",item);
   img.src="https://i.ytimg.com/vi/"+encodeURIComponent(v.id)+"/mqdefault.jpg";
   img.loading="lazy";img.alt="";img.width=75;img.height=48;
   const btn=c.button("＋ "+c.core.title(v),()=>callback(v),"studio-button",item);
   btn.style.flex="1";btn.style.textAlign="left";
  }
  if(!all.length)c.el("p","Uyğun video tapılmadı.","studio-muted",parent);
 }
 tools.playlist=c=>{
  info(c,"📼 Beş Video, Bir Dəvətnamə",
   "Öz zövqünlə ən çox 5 video seç. Sonra bir keçidlə dostuna göndər. Video faylı kopyalanmır və baxışlar saxtalaşdırılmır.");
  let chosen=[],all=[];
  const chosenBox=c.block("studio-card");
  const chooser=c.block("studio-card");
  c.el("h3","Video axtar və seç","",chooser);
  const query=c.el("input",null,"studio-select",chooser);
  query.type="search";query.placeholder="Başlıq: telefon, çay, qonaq...";query.maxLength=60;
  const options=c.block("studio-grid",chooser);
  const shareBox=c.block("studio-card");
  const state=c.status();
  function renderChosen(){
   chosenBox.replaceChildren();
   c.el("h3","Seçdiklərin: "+chosen.length+" / 5","",chosenBox);
   if(!chosen.length)c.el("p","Yuxarıdakı videolardan birini seç.","studio-muted",chosenBox);
   chosen.forEach((id,i)=>{
    const v=all.find(x=>x.id===id);if(!v)return;
    const entry=c.block("studio-video-choice",chosenBox);
    const img=c.el("img",null,"",entry);img.src="https://i.ytimg.com/vi/"+v.id+"/mqdefault.jpg";img.alt="";img.loading="lazy";
    c.el("strong",(i+1)+". "+c.core.title(v),"",entry).style.flex="1";
    c.button("✕",()=>{chosen.splice(i,1);renderChosen();renderOptions();},"studio-button",entry).setAttribute("aria-label","Video siyahıdan çıxarılsın");
   });
   shareBox.replaceChildren();
   if(chosen.length){
    const url=c.core.shareLink(chosen);
    c.el("p","Dostun bu linki açanda beş real videonu sənin seçdiyin sırada görəcək.","studio-muted",shareBox);
    c.el("p",url,"studio-sharebox",shareBox);
    c.button("↗ Beş videonu paylaş",()=>{
     c.share("🎬 Mənim 5 yumor videom","Bu videoları mütləq izlə!",url,result=>{
      if(result===true)c.metrics("playlist_shared");
      state.textContent=result===true?"Paylaşma pəncərəsi açıldı və ya keçid kopyalandı.":
        result===null?"Paylaşım ləğv edildi.":"Bu brauzer paylaşım dəstəkləmir. Linki yuxarıdan kopyala.";
     });
    },"studio-primary",shareBox);
   }
  }
  function select(v){
   if(chosen.includes(v.id)){state.textContent="Bu video artıq siyahıdadır.";return;}
   if(chosen.length>=5){state.textContent="Ən çox 5 video seçə bilərsən.";return;}
   chosen.push(v.id);
   c.write("playlist",chosen);
   renderChosen();renderOptions();
  }
  function renderOptions(){
   const q=c.core.fold(query.value||"");
   const filtered=all.filter(v=>!chosen.includes(v.id) &&
     (!q||c.core.fold(c.core.title(v)).includes(q)));
   picker(c,filtered,select,options,12);
  }
  query.addEventListener("input",renderOptions);
  c.loaded().then(()=>{
   if(!c.live())return;
   all=c.get();
   const param=new URLSearchParams(location.search).get("v");
   const invited=c.core.parseLink(param,all);
   chosen=invited||c.core.safePlaylist(c.read("playlist"),all)||[];
   if(invited){
    state.textContent="Dostunun göndərdiyi video paketi açıldı.";
    info(c,"📩 Dostundan gələn 5 video","Seçimlərin sırası bu paylaşım keçidində saxlanılıb. Heç bir hesab lazım deyil.");
   }
   renderChosen();renderOptions();
  });
 };
 tools.qr=c=>{
  info(c,"📱 QR Yumor Dəvətnaməsi",
   "Bu QR kod telefonun brauzerində yaradılır. Kod bir real video səhifəsinə aparır, heç bir məlumat xarici QR xidmətinə göndərilmir.");
  const holder=c.block("studio-card");
  const query=c.el("input",null,"studio-select",holder);query.type="search";query.placeholder="Video seçmək üçün başlığını yaz...";
  const list=c.block("studio-grid",holder);
  const view=c.block("studio-card");
  const state=c.status("Video seç, QR hazır olsun.");
  let current=null,videos=[];
  function choose(v){
   current=v;
   view.replaceChildren();
   c.el("h3",c.core.title(v),"",view);
   const url=location.origin+"/video/"+encodeURIComponent(v.id)+".html";
   if(typeof window.qrcode!=="function"){c.el("p","QR kitabxanası yüklənmədi, linki birbaşa paylaş.","studio-muted",view);return;}
   try{
    const qr=window.qrcode(0,"M");
    qr.addData(url);qr.make();
    // QR is rendered in a local canvas and truly exported as PNG.
    const count=qr.getModuleCount(),cell=8,border=32;
    const image=c.el("canvas",null,"",null);
    image.width=count*cell+border*2;image.height=image.width;
    const pixels=image.getContext("2d");
    if(!pixels)throw Error("QR_CANVAS_UNAVAILABLE");
    pixels.fillStyle="#ffffff";pixels.fillRect(0,0,image.width,image.height);
    pixels.fillStyle="#111827";
    for(let row=0;row<count;row++)for(let col=0;col<count;col++)
      if(qr.isDark(row,col))pixels.fillRect(border+col*cell,border+row*cell,cell,cell);
    const qrBox=c.block("studio-qr",view);
    const img=c.el("img",null,"",qrBox);
    img.src=image.toDataURL("image/png");
    img.alt="QR kod: "+c.core.title(v)+" videosuna keçid";
    img.width=240;img.height=240;
    c.el("p","Kameranı QR koda tutaraq videoya keç.","",qrBox);
    c.el("p",url,"studio-sharebox",view);
    c.button("📥 QR kodunu PNG kimi saxla",()=>{
     const a=c.el("a",null,"",null);
     a.href=img.src;a.download="BIZDE_BELEDIR_QR_"+v.id+".png";
     document.body.appendChild(a);a.click();a.remove();
     c.metrics("qr_export");state.textContent="✅ QR faylı üçün saxlama əməliyyatı başladı.";
    },"studio-primary",view);
    c.button("↗ Video keçidini paylaş",()=>{
     c.share("🎬 Bizdə Belədir",c.core.title(v),url,ok=>{
      state.textContent=ok===true?"Paylaşım açıldı və ya keçid kopyalandı.":
        ok===null?"Paylaşım ləğv edildi.":"Keçidi yuxarıdan kopyalaya bilərsən.";
     });
    },"studio-button",view);
    c.metrics("qr_generated");
   }catch(e){
    c.el("p","QR yaratmaq alınmadı, videonun linkini istifadə et.","studio-muted",view);
    c.el("p",url,"studio-sharebox",view);
   }
  }
  function render(){
   const q=c.core.fold(query.value||"");
   picker(c,videos.filter(v=>!q||c.core.fold(c.core.title(v)).includes(q)),choose,list,8);
  }
  query.addEventListener("input",render);
  c.loaded().then(()=>{
   if(!c.live())return;
   videos=c.get();render();
   if(videos.length)choose(videos[0]);else c.empty(view);
  });
 };
 tools.archive=c=>{
  info(c,"🕰️ Video Zaman Maşını",
   "Bir videonu köhnə tarixlərdən tap. Bu gündə əvvəlki illərə aid video yoxdursa, ən köhnə real videolardan nümunələr göstərilir. Tarixlər uydurulmur.");
  const box=c.block("studio-card");
  const status=c.status("Arxiv yüklənir...");
  c.loaded().then(()=>{
   if(!c.live())return;
   const items=c.get();
   if(!items.length){c.empty(box);return;}
   const now=new Date();
   const previous=c.core.archive(items,now);
   box.replaceChildren();
   c.el("h3",previous.exact?"Bu günün arxivində":"Arxivdən ilk videolar","",box);
   c.el("p",previous.exact?"Eyni təqvim günündə daha əvvəl yayımlanmış real videolar:":"Bu günə uyğun keçmiş il videosu yoxdur. Ona görə yayımlanan ən köhnə videolardan nümunələr göstərilir.","studio-muted",box);
   for(const v of previous.videos)c.video(v,box,"Tarix: "+(v.publishedAt||"").slice(0,10));
   status.textContent="Arxiv bazası: "+items.length+" real video.";
   c.metrics("archive_open");
  });
 };
 tools.series=c=>{
  info(c,"🎞️ Məişət Mini-Serialları",
   "Bunlar ayrıca çəkilmiş serial bölümləri deyil, mövzuya görə yığılmış real Shorts kolleksiyalarıdır. Hər video öz orijinal YouTube səhifəsinə aparır.");
  const nav=c.block("studio-grid");
  const results=c.block("studio-card");
  let all=[];
  function show(s){
   results.replaceChildren();
   c.el("h3",s.emoji+" "+s.title,"",results);
   c.el("p",s.desc,"studio-muted",results);
   const filtered=c.core.videosFor(all,s.topics,8);
   if(!filtered.length)c.empty(results);
   else filtered.forEach((v,i)=>c.video(v,results,"Seçilmiş video "+(i+1)));
   c.metrics("series_open");
  }
  for(const s of c.core.series)c.button(s.emoji+" "+s.title,()=>show(s),"studio-button",nav);
  c.loaded().then(()=>{
   if(!c.live())return;
   all=c.get();
   show(c.core.series[0]);
  });
 };
 tools.insights=c=>{
  info(c,"📊 Şəxsi Yumor Studiyam",
   "Bu panel yalnız bu brauzerdə saxlanılan klikləri göstərir. Bütün sayt auditoriyasının rəqəmləri deyil.");
  const summary=window.BBMetrics?.summary?.();
  const area=c.block("studio-card");
  if(!summary){c.el("p","Lokal ölçmə əlçatan deyil.","studio-muted",area);return;}
  c.el("h3","Bugün: "+summary.day,"",area);
  const labels={
   studio_open:"Studiya bölməsi açılışı",bingo_complete:"Tamamlanmış ilk BINGO xətti",
   bingo_export:"BINGO şəkli saxlama",poster_export:"Mem kartı saxlama",
   playlist_shared:"5-video paketi paylaşma",qr_generated:"QR kod yaradılması",
   qr_export:"QR şəkli saxlama",archive_open:"Arxiv bölməsi açılışı",
   series_open:"Mini-serial seçimi",topic_open:"Mövzu səhifəsinə keçid",
   video_open:"Video səhifəsinə klik",youtube_outbound:"YouTube-a keçid",share:"Paylaşma əməliyyatı",
   city_visit:"Gülüş Şəhərinə giriş"
  };
  for(const [key,label] of Object.entries(labels)){
   const today=summary.today[key]||0,week=summary.last7days[key]||0;
   const row=c.block("studio-analytics-row",area);
   c.el("span",label,"",row);
   c.el("strong",today+" bugün · "+week+" / 7 gün","",row);
  }
  c.el("p","Bu hadisələr klik və əməliyyat sayıdır. YouTube abunəsinin gerçəkləşdiyini göstərmir.","studio-muted",area);
  const doc=c.block("studio-card");
  c.el("h3","Bütün ziyarətçilərin statistikası","",doc);
  c.el("p","Tam sayt üzrə giriş, oyun, paylaşım və video keçidləri Google Analytics hesabında ayrıca yoxlanmalıdır. Bunun üçün sayt sahibi Google hesabı ilə daxil olmalıdır.","studio-muted",doc);
  const ga=c.link("🔐 Google Analytics-i aç","https://analytics.google.com/","studio-primary",doc);ga.target="_blank";ga.rel="noopener noreferrer";
  c.button("🧹 Bu brauzerin lokal ölçməsini sil",()=>{
   if(confirm("Yalnız bu brauzerin lokal Yumor Studiyası/Şəhər hadisələrini silmək istəyirsən?")){
    window.BBMetrics?.reset?.();c.open("insights");
   }
  },"studio-button",doc);
 };
 host.BBStudioTools=tools;
})(typeof window!=="undefined"?window:globalThis);
