"use strict";
/* Games 2-10. Each is a working, independent local-first station. */
window.BBParkInstallA=function(games){
  const data=window.BBParkData;
  const topic=id=>data.topics.find(t=>t.id===id)||data.topics[0];
  const tokens=items=>items.filter(Boolean);
  const clear=(c)=>c.clear();
  function intro(c,label,note){
    c.h("span",label,"game-badge");
    if(note)c.h("p",note,"game-prompt");
  }
  function shareFallback(c,status,title,text,url){
    c.share(title,text,url).then(ok=>{
      if(!c.live())return;
      status.textContent=ok===true?"✅ Paylaşma əməliyyatı başladıldı və ya link kopyalandı.":
        ok===null?"Paylaşma ləğv edildi.":"Linki kopyala: "+url;
    });
  }
  function renderCards(c,vs,container=c.root){
    if(!vs.length){c.emptyVideos(container);return;}
    for(const v of vs)c.videoCard(v,container);
  }
  function topicPicker(c,choose,selected="phone"){
    const wrap=c.box("game-chips");
    for(const t of data.topics.slice(0,8)){
      const btn=c.btn(t.icon+" "+t.label,()=>choose(t.id),"game-chip",wrap);
      if(t.id===selected)btn.classList.add("chosen");
    }
    return wrap;
  }

  // 2: share an encoded 3-answer challenge and compare honest equal picks.
  games.duel=c=>{
    let invited=data.decodeDuel(new URLSearchParams(location.search).get("invite"));
    let answers=[],step=0;
    function draw(){
      clear(c);
      intro(c,"⚔️ GÜLÜŞ DUELİ","Hər sual üçün bir cavab seç. Dostunun cavabları linkdə kodlanır, serverdə saxlanmır.");
      c.h("div","Sual "+(step+1)+" / 3","game-round");
      const q=data.duelQuestions[step];
      c.h("h3",q.text,"game-question");
      const wrap=c.box("game-options");
      q.choices.forEach((txt,i)=>c.btn(txt,()=>{
        answers.push(i);
        if(step===2)finish();
        else{step++;draw();}
      },"game-option",wrap));
      if(step>0)c.btn("← Əvvəlki sual",()=>{answers.pop();step--;draw();});
    }
    function finish(){
      clear(c);
      const code=data.encodeDuel(answers);
      c.set("duel_last",code);
      const link=new URL("/yumor-parki.html",location.origin);
      link.searchParams.set("game","duel");
      link.searchParams.set("invite",code);
      const score=invited?data.compareDuel(invited,answers):null;
      intro(c,"🏁 DUELİN NƏTİCƏSİ","");
      const panel=c.box("game-result");
      c.h("strong",score===null?"Duelə hazırsan!":"Eyni seçimləriniz: "+score+" / 3", "",panel);
      c.h("p",score===null?"İndi linki dostuna göndər. O da həmin 3 suala cavab verəndə öz cavablarınla müqayisə olunacaq.":
        "Bu nəticə yalnız eyni cavabların sayıdır, şəxsi münasibət və xarakter testi deyil.","",panel);
      const state=c.status("Yalnız 3 seçim kodlanır. Ad, telefon nömrəsi yoxdur.");
      c.btn("↗ Dostunu duelə çağır",()=>shareFallback(c,state,"⚔️ Gülüş Dueli","3 suala cavab ver, uyğunluğumuzu yoxlayaq!",link.href),"game-primary");
      c.btn("↻ Təkrar oyna",()=>{answers=[];step=0;draw();});
      if(invited){
        c.btn("Yeni duel yarat",()=>{invited=null;answers=[];step=0;draw();});
      }
    }
    draw();
  };

  // 3: true 3-video personalized mini-marathon, loading YouTube only on tap.
  games.marathon=c=>{
    let chosen="phone",playlist=[],index=0,frame=null;
    intro(c,"🎬 3 REAL VİDEO","Bir mövzu seç. Səhnələr ardıcıl açılır. Video yalnız «Oynat» düyməsinə basanda yüklənir.");
    const controls=c.box("game-chips");
    const container=c.box("game-info");
    const status=c.status("Kanal videoları seçilir…");
    function stop(){
      if(frame)frame.replaceChildren();
    }
    c.cleanup(stop);
    function update(){
      stop();container.replaceChildren();
      if(!playlist.length){c.emptyVideos(container);return;}
      const v=playlist[index];
      c.h("span",(index+1)+" / "+playlist.length+" • "+topic(chosen).label,"game-badge",container);
      c.h("h3",data.titleOf(v,c.api),"game-headline",container);
      frame=c.h("div","","game-screen",container);
      const img=c.h("img",null,"",frame);
      img.src="https://i.ytimg.com/vi/"+encodeURIComponent(v.id)+"/hqdefault.jpg";
      img.loading="lazy";img.alt="Video posteri";
      c.btn("▶ Videonu oynat",()=>{
        frame.replaceChildren();
        const iframe=c.h("iframe",null,"",frame);
        iframe.src="https://www.youtube-nocookie.com/embed/"+encodeURIComponent(v.id)+"?autoplay=1&playsinline=1&rel=0";
        iframe.title="Bizdə Belədir: "+data.titleOf(v,c.api);
        iframe.allow="autoplay; encrypted-media; picture-in-picture; web-share";
        iframe.allowFullscreen=true;
        c.track("marathon_video_start",{video_id:v.id,position:index+1});
      },"game-primary",container);
      const row=c.box("game-remote",container);
      const back=c.btn("← Əvvəlki",()=>{if(index>0){index--;update();}},"game-secondary",row);
      back.disabled=index===0;
      const next=c.btn(index===playlist.length-1?"↻ Əvvələ":"Növbəti →",()=>{
        index=index===playlist.length-1?0:index+1;update();
      },"game-secondary",row);
      c.videoCard(v,container,"YouTube Shorts-da aç");
      status.textContent="Videoların oynadılması YouTube-un qaydalarından və bağlantıdan asılıdır.";
    }
    function choose(id){
      chosen=id;index=0;playlist=c.pick(id,data.dateBaku()+"marathon"+id,3);
      update();
      for(const b of controls.querySelectorAll?.("button")||[]){
        b.classList.toggle("chosen",b.dataset.topic===id);
      }
    }
    for(const t of data.topics.slice(0,8)){
      const b=c.btn(t.icon+" "+t.label,()=>choose(t.id),"game-chip",controls);
      b.dataset.topic=t.id;
    }
    c.videos().then(()=>{
      if(!c.live())return;
      choose("phone");
    });
  };

  // 4: interactive branching, based on actual choices, not fake generated clips.
  games.parallel=c=>{
    const steps=[
      {question:"Bu hadisənin əsas qəhrəmanı kimdir?",values:[
        {text:"👩 Ana",actor:"Ana",topic:"home"},{text:"👨 Qonşu",actor:"Qonşu",topic:"social"},
        {text:"🧒 Uşaq",actor:"Uşaq",topic:"kids"},{text:"📱 Mən",actor:"Sən",topic:"phone"}]},
      {question:"Hadisə harada baş verir?",values:[
        {text:"🏠 Evdə",place:"evdə",topic:"home"},{text:"🛒 Marketdə",place:"marketdə",topic:"shopping"},
        {text:"🚶 Küçədə",place:"küçədə",topic:"social"},{text:"💼 İşdə",place:"işdə",topic:"work"}]},
      {question:"Sonda hansı sürpriz olsun?",values:[
        {text:"☕ Çay söhbəti",ending:"bütün məsələ çay söhbətinə çevrilir",topic:"tea"},
        {text:"📱 Telefon zəngi",ending:"telefon ən pis anda zəng çalır",topic:"phone"},
        {text:"🧸 Uşaq zarafatı",ending:"uşaq hamını güldürür",topic:"kids"},
        {text:"🎭 Gözlənilməz qonaq",ending:"qapıdan qonaq girir",topic:"social"}]}
    ];
    let n=0,picked=[];
    function draw(){
      clear(c);intro(c,"🌀 PARALEL HƏYATLAR","Bu, yazdığın seçimlərdən qurulan xəyali komediya səhnəsidir.");
      c.h("div","Səhnə "+(n+1)+" / 3","game-round");
      c.h("h3",steps[n].question,"game-question");
      const box=c.box("game-options");
      steps[n].values.forEach((v,i)=>c.btn(v.text,()=>{
        picked.push(i);
        if(n===2)finish();
        else{n++;draw();}
      },"game-option",box));
      if(n>0)c.btn("← Geri",()=>{picked.pop();n--;draw();});
    }
    function finish(){
      const [who,where,end]=steps.map((q,i)=>q.values[picked[i]]);
      clear(c);intro(c,"🎭 SƏNİN PARALEL SƏHNƏN","");
      const box=c.box("game-result");
      c.h("strong",who.actor+" "+where.place+" bir işin dalınca gedir.","",box);
      c.h("p","Hər şey adi başlayır. Ancaq birdən "+end.ending+". Hamı bir-birinə baxıb gülür!","",box);
      const main=end.topic;
      c.videos().then(()=>{
        if(!c.live())return;
        c.h("h3","Oxşar real videolar","game-question");
        renderCards(c,c.pick(main,"parallel"+picked.join(""),2));
      });
      const st=c.status("Bu səhnə oyunun verdiyi mətn nəticəsidir, yeni video yaradılmayıb.");
      c.btn("↗ Səhnəni paylaş",()=>shareFallback(c,st,"Mənim paralel həyatımdan komediya",who.actor+" "+where.place+": "+end.ending+".",location.origin+"/yumor-parki.html?game=parallel"));
      c.btn("↻ Fərqli həyat qur",()=>{n=0;picked=[];draw();});
    }
    draw();
  };

  // 5: choose household remote control channels, using real catalogue.
  games.remote=c=>{
    intro(c,"🎛️ EVİN PULTU","Pultun düymələrinə bas. Hər düymə kanaldan uyğun real videonu tapır.");
    c.h("p","KANAL 00 · MƏİŞƏT FM","game-round");
    const panel=c.box("game-remote");
    const screen=c.box("game-card");
    const info=c.status("Videolar yüklənir…");
    function tune(id){
      screen.replaceChildren();
      const t=topic(id);
      c.h("span",t.icon+" "+t.label.toUpperCase(),"game-badge",screen);
      c.h("h3",t.line,"game-headline",screen);
      const picks=c.pick(id,data.dateBaku()+"remote"+id,2);
      if(picks.length)renderCards(c,picks,screen);
      else c.emptyVideos(screen);
      info.textContent="Kanal dəyişdi: "+t.label+". Video avtomatik oynadılmır.";
      c.track("remote_channel",{topic:id});
    }
    for(const t of data.topics){
      c.btn(t.icon+" "+t.label,()=>tune(t.id),"game-secondary",panel);
    }
    c.videos().then(()=>{if(c.live())tune("tea");});
  };

  // 6: use real uploaded titles, then reveal correct hidden video.
  games.detective=c=>{
    let round=0,correct=0;
    function next(){
      c.videos().then(()=>{
        if(!c.live())return;
        const items=c.currentVideos().filter(x=>String(x.title||"").length>18);
        if(items.length<4){c.clear();c.emptyVideos();return;}
        const target=data.pick(items,"detective:"+round+":"+data.dateBaku());
        const wrong=items.filter(x=>x.id!==target.id)
          .sort((a,b)=>data.hash("detective"+target.id+a.id)-data.hash("detective"+target.id+b.id))
          .slice(0,3);
        const choices=[target,...wrong].sort((a,b)=>data.hash(round+a.id)-data.hash(round+b.id));
        clear(c);intro(c,"🔍 DETEKTİV İŞİ","İpucu real videonun başlığından yaradılıb. Doğru videonu təxmin et.");
        c.h("div","Sual "+(round+1)+" / 3 · Xal "+correct,"game-round");
        const raw=data.titleOf(target,c.api);
        const category=c.api.categories(target);
        const clue=(category.length?topic(category[0]).icon+" Mövzu: "+topic(category[0]).label+" · ":"")+
          "Başlıqda təxminən "+raw.split(/\s+/).length+" söz var.";
        const mystery=c.box("game-card");
        c.h("h3","🎬 Bu hansı videodur?","game-question",mystery);
        c.h("p",clue,"",mystery);
        const answerBox=c.box("game-options");
        const status=c.status("Bir variant seç.");
        choices.forEach(v=>c.btn(data.titleOf(v,c.api),()=>{
          for(const b of answerBox.querySelectorAll?.("button")||[])b.disabled=true;
          const right=v.id===target.id;if(right)correct++;
          status.textContent=right?"✅ Doğrudur!":"❌ Bu dəfə olmadı. Düzgün cavab: "+raw;
          c.videoCard(target);
          c.btn(round===2?"🏆 Nəticəni gör":"Növbəti ipucu →",()=>{
            round++;
            if(round>=3){
              clear(c);
              const box=c.box("game-result");
              c.h("strong","Detektiv nəticəsi: "+correct+" / 3","",box);
              c.h("p","Nəticən bu brauzerdə hesablandı, başqa adamlarla müqayisə edilmir.","",box);
              c.btn("↻ Yenidən oyna",()=>{round=0;correct=0;next();},"game-primary");
            }else next();
          },"game-primary");
        },"game-option",answerBox));
      });
    }
    next();
  };

  // 7: functional channel-changing retro TV with user-initiated YouTube embed.
  games.tv=c=>{
    let channel=0,player=null,items=[];
    intro(c,"📺 KOMEDİYA TV","Kanallar arasında keç. YouTube oynadıcısı yalnız «▶ Oynat» basıldıqda yüklənəcək.");
    const tv=c.box("game-tv");
    const screen=c.box("game-screen",tv);
    const foot=c.box("game-tv-footer",tv);
    const controls=c.box("game-remote");
    const status=c.status("Kanallar yüklənir…");
    function draw(){
      screen.replaceChildren();foot.replaceChildren();
      if(!items.length){c.emptyVideos(screen);return;}
      const v=items[channel];
      const img=c.h("img",null,"",screen);
      img.src="https://i.ytimg.com/vi/"+encodeURIComponent(v.id)+"/hqdefault.jpg";
      img.alt="Video görüntüsü";
      img.loading="lazy";
      const overlay=c.box("game-screen-overlay",screen);
      c.h("span","📺 KANAL "+String(channel+1).padStart(2,"0")+" · "+data.titleOf(v,c.api),"",overlay);
      c.h("span","BİZDƏ BELƏDİR • TV","",foot);
      c.h("span",String(channel+1)+"/"+items.length,"",foot);
      status.textContent="Kanala bax: "+data.titleOf(v,c.api);
    }
    function switchTo(delta){
      channel=(channel+delta+items.length)%items.length;
      draw();c.track("tv_switch",{channel:channel+1});
    }
    c.btn("◀ Kanal −",()=>switchTo(-1),"game-secondary",controls);
    c.btn("▶ Oynat",()=>{
      if(!items.length)return;
      const v=items[channel];
      screen.replaceChildren();
      const iframe=c.h("iframe",null,"",screen);
      iframe.title="Komediya TV "+data.titleOf(v,c.api);
      iframe.allow="autoplay; encrypted-media; picture-in-picture; web-share";
      iframe.allowFullscreen=true;
      iframe.src="https://www.youtube-nocookie.com/embed/"+encodeURIComponent(v.id)+"?autoplay=1&playsinline=1&rel=0";
      c.track("tv_play",{video_id:v.id});
    },"game-primary",controls);
    c.btn("Kanal + ▶",()=>switchTo(1),"game-secondary",controls);
    c.link("▶ Bütün videolar","/videos.html","game-secondary");
    c.videos().then(()=>{
      if(!c.live())return;
      const list=c.currentVideos();
      const seen=new Set();
      items=data.topics.flatMap(t=>c.pick(t.id,"tv:"+t.id,3)).filter(v=>{
        if(seen.has(v.id))return false;seen.add(v.id);return true;
      });
      draw();
    });
  };

  // 8: one decisive scenario, discover an amusing archetype.
  games.role=c=>{
    intro(c,"🎭 HANSI OBRAZSAN?","Bu əyləncəli test psixoloji qiymətləndirmə deyil.");
    c.h("h3","Hamı bir işlə məşğuldur. Sən nə etməyi seçərdin?","game-question");
    const choice=c.box("game-options");
    const roleChoices=[
      {label:"☕ Çay dəmləyərdim",id:"tea"},
      {label:"📱 Telefonla məşğul olardım",id:"phone"},
      {label:"🏠 Hər şeyi təşkil edərdim",id:"home"},
      {label:"📡 Hamıya xəbər edərdim",id:"social"},
      {label:"💼 İş planını qurardım",id:"work"},
      {label:"🛒 Marketə gedərdim",id:"shopping"}
    ];
    function reveal(id){
      const role=data.roles.find(x=>x.id===id);
      clear(c);intro(c,"🏆 SƏNİN OBRAZIN","");
      const box=c.box("game-result");
      c.h("strong",role.emoji+" "+role.title,"",box);
      c.h("p",role.intro,"",box);
      c.videos().then(()=>{
        if(!c.live())return;
        c.h("h3","Obrazına uyğun videolar","game-question");
        renderCards(c,c.pick(id,"role:"+id+":"+data.dateBaku(),2));
      });
      const status=c.status("");
      c.btn("↗ Obrazını paylaş",()=>shareFallback(c,status,"Sən hansı obrazsan?",role.emoji+" Mənim obrazım: "+role.title,location.origin+"/yumor-parki.html?game=role"));
      c.btn("↻ Başqa rol seç",()=>{clear(c);games.role(c);});
      c.track("role_result",{role:id});
    }
    roleChoices.forEach(v=>c.btn(v.label,()=>reveal(v.id),"game-option",choice));
  };

  // 9: choose the real last two words of an actual YouTube headline.
  games.ending=c=>{
    let score=0,round=0;
    function next(){
      c.videos().then(()=>{
        if(!c.live())return;
        const all=c.currentVideos().filter(v=>data.titleOf(v,c.api).trim().split(/\s+/).length>=6);
        if(all.length<5){clear(c);c.emptyVideos();return;}
        const current=data.pick(all,"ending:"+data.dateBaku()+":"+round);
        const parts=data.titleOf(current,c.api).split(/\s+/);
        const hidden=parts.slice(-2).join(" ");
        const prompt=parts.slice(0,-2).join(" ");
        const wrong=data.distinct(
          [...all].filter(v=>v.id!==current.id).sort((a,b)=>
            data.hash(current.id+a.id)-data.hash(current.id+b.id)
          ).map(v=>data.titleOf(v,c.api).split(/\s+/).slice(-2).join(" "))
            .filter(v=>v!==hidden),
          x=>x
        ).slice(0,3);
        const options=[hidden,...wrong].sort((a,b)=>data.hash(String(round)+a)-data.hash(String(round)+b));
        clear(c);
        intro(c,"🧩 YARIMÇIQ BAŞLIQ","Gerçək video başlığının son iki sözünü seç.");
        c.h("div","Sual "+(round+1)+" / 3 · Xal "+score,"game-round");
        c.h("h3",prompt+" ... ?","game-headline");
        const wrap=c.box("game-options");
        const feedback=c.status("Bir sonluq seç.");
        options.forEach(value=>c.btn(value,()=>{
          for(const btn of wrap.querySelectorAll?.("button")||[])btn.disabled=true;
          const correct=value===hidden;
          if(correct)score++;
          feedback.textContent=correct?"✅ Tapdın!":"Düzgün sonluq: «"+hidden+"»";
          c.videoCard(current);
          c.btn(round===2?"Nəticə →":"Növbəti →",()=>{
            round++;
            if(round===3){
              clear(c);
              const card=c.box("game-result");
              c.h("strong","Sonluğu tapdın: "+score+" / 3","",card);
              c.btn("↻ Yenidən başla",()=>{round=0;score=0;next();},"game-primary");
            }else next();
          },"game-primary");
        },"game-option",wrap));
      });
    }
    next();
  };

  // 10: deterministic one-box-per-Baku-day, no invented total users.
  games.daily=c=>{
    const date=data.dateBaku();
    const opened=c.get("daily_opened");
    const story=data.pick(data.stories,"box-story:"+date);
    intro(c,"🎁 GÜNLÜK SÜRPRİZ","Hər Bakı təqvim günü üçün eyni sürpriz; saytı təzələmək yeni sürpriz yaratmır.");
    const card=c.box("game-result");
    c.h("strong",opened===date?"✅ Bu günün qutusu artıq açılıb":"🎁 "+date+" tarixinin qutusu","",card);
    const inside=c.box("game-info",card);
    const showGift=()=>{
      inside.replaceChildren();
      c.h("strong",story.speech,"",inside);
      c.h("p",story.text,"",inside);
      c.videos().then(()=>{
        if(!c.live())return;
        const video=c.pick(story.topic,"daily:"+date,1)[0];
        if(video)c.videoCard(video,inside,"Günün video hədiyyəsi");
        else c.emptyVideos(inside);
      });
    };
    if(opened===date)showGift();
    else{
      c.h("p","Qutunu açmaq üçün toxun.","",inside);
      c.btn("🎁 Aç!",()=>{
        c.set("daily_opened",date);
        showGift();
        c.track("daily_box_opened",{date});
      },"game-primary",card);
    }
    c.h("p","Bu yalnız əyləncəli gündəlik seçimdir. Real mükafat və pul qazancı yoxdur.","game-note");
  };
};
