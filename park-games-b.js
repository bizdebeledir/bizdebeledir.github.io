"use strict";
/* Games 11-20: atlas, audio clue, reaction, story, secrets, passport, fortune, poll, director, chain. */
window.BBParkInstallB=function(games){
  const data=window.BBParkData;
  const topic=id=>data.topics.find(t=>t.id===id)||data.topics[0];
  function intro(c,label,note){
    c.h("span",label,"game-badge");
    if(note)c.h("p",note,"game-prompt");
  }
  function actionShare(c,status,title,text,url){
    c.share(title,text,url).then(ok=>{
      if(!c.live())return;
      status.textContent=ok===true?"✅ Paylaşma pəncərəsi açıldı və ya mətn kopyalandı.":
        ok===null?"Paylaşma ləğv edildi.":"Bu keçidi paylaş: "+url;
    });
  }
  function showMatch(c,id,seed,parent=c.root){
    const v=c.pick(id,seed,2);
    if(!v.length){c.emptyVideos(parent);return;}
    v.forEach(x=>c.videoCard(x,parent));
  }
  function getNum(s,max=4){return Number.isInteger(s)&&s>=0&&s<max?s:0;}

  // 11: region-themed fictional vignette, not actual geo/audience statistics.
  games.atlas=c=>{
    intro(c,"🗺️ SİTUASİYA ATLASI",
      "Bu, coğrafi baxış statistikası deyil. Bölgə adları ilə qurulmuş xəyali məişət səhnələridir.");
    c.h("h3","Hansı şəhərdən başlayaq?","game-question");
    const buttons=c.box("game-chips");
    const stage=c.box("game-card");
    function choose(region){
      stage.replaceChildren();
      c.h("span",region.emoji+" "+region.name,"game-badge",stage);
      c.h("h3",region.intro,"game-headline",stage);
      c.h("p","Bu situasiya uydurma oyun səhnəsidir. Videolar kanalın real bazasından gəlir.","",stage);
      c.videos().then(()=>{
        if(!c.live())return;
        const picks=c.pick(region.topic,"atlas:"+region.name+":"+data.dateBaku(),2);
        if(picks.length)picks.forEach(v=>c.videoCard(v,stage));
        else c.emptyVideos(stage);
      });
      c.track("atlas_region",{region:region.name});
    }
    for(const reg of data.regions){
      c.btn(reg.emoji+" "+reg.name,()=>choose(reg),"game-chip",buttons);
    }
    choose(data.regions[0]);
  };

  // 12: synthetic speech, not extracted or copyrighted YouTube audio.
  games.audio=c=>{
    let score=0,round=0;
    const hasSpeech=typeof window.speechSynthesis!=="undefined" && typeof window.SpeechSynthesisUtterance!=="undefined";
    function chooseScene(){
      return data.pick(data.stories,"audio:"+data.dateBaku()+":"+round);
    }
    function draw(){
      c.clear();
      intro(c,"🎧 SƏSLİ TAPMACA",
        "Səs ipucunu telefonun brauzeri oxuyur. Bu, YouTube videosundan götürülmüş səs deyil.");
      c.h("div","Sual "+(round+1)+" / 3 · Xal "+score,"game-round");
      const mystery=chooseScene();
      c.h("h3","Bu söz hansı hadisəyə aiddir?","game-headline");
      const audioStatus=c.status(hasSpeech?"🔊 Səsi eşitmək üçün düyməyə bas.":"Bu brauzerdə səsli oxuma yoxdur. İpucunu yazı kimi göstərə bilərsən.");
      function voice(){
        if(!hasSpeech){
          audioStatus.textContent="İpucu: «"+mystery.speech+"»";return;
        }
        try{
          speechSynthesis.cancel();
          const u=new SpeechSynthesisUtterance(mystery.speech);
          const az=speechSynthesis.getVoices().find(x=>(x.lang||"").toLowerCase().startsWith("az"));
          if(az)u.voice=az;
          u.lang=az?.lang||"az-AZ";
          u.rate=.9;
          speechSynthesis.speak(u);
          audioStatus.textContent=az?"Səsli ipucu oxunur.":"Azərbaycan səsi cihazda olmaya bilər. Səhv oxunursa mətni göstər.";
        }catch{audioStatus.textContent="Səsli oxuma alınmadı. İpucu: "+mystery.speech;}
      }
      c.btn("🔊 İpucunu dinlə",voice,"game-primary");
      c.btn("👁 Mətnlə ipucu",()=>{audioStatus.textContent="İpucu: «"+mystery.speech+"»";});
      const options=c.box("game-options");
      const keys=[mystery,...data.stories.filter(x=>x.id!==mystery.id)
        .sort((a,b)=>data.hash("sound"+round+a.id)-data.hash("sound"+round+b.id)).slice(0,3)]
        .sort((a,b)=>data.hash("audio_sort"+round+a.id)-data.hash("audio_sort"+round+b.id));
      const feedback=c.status("Cavabını seç.");
      for(const s of keys){
        c.btn(s.text,()=>{
          try{speechSynthesis.cancel();}catch{}
          for(const b of options.querySelectorAll?.("button")||[])b.disabled=true;
          const right=s.id===mystery.id;
          if(right)score++;
          feedback.textContent=right?"✅ Tapdın!":"Düzgün cavab: "+mystery.text;
          c.videos().then(()=>{
            if(!c.live())return;
            const match=c.pick(mystery.topic,"audio:"+round,1)[0];
            if(match)c.videoCard(match);
          });
          c.btn(round===2?"🏆 Nəticəni gör":"Növbəti səs →",()=>{
            round++;
            if(round>=3){
              c.clear();
              const card=c.box("game-result");
              c.h("strong","Səsli nəticən: "+score+" / 3","",card);
              c.btn("↻ Yenidən oyna",()=>{score=0;round=0;draw();},"game-primary");
            }else draw();
          },"game-primary");
        },"game-option",options);
      }
    }
    c.cleanup(()=>{try{speechSynthesis.cancel();}catch{}});
    draw();
  };

  // 13: measured browser reaction time; false starts are handled.
  games.reaction=c=>{
    intro(c,"⚡ REAKSİYA ÖLÇƏN","Qırmızı düymə yaşıl olanda toxun. Vaxt performans saatı ilə millisaniyə olaraq hesablanır.");
    c.h("p","Bir dəfə «Başla» bas, sonra yaşıl siqnalı gözlə.","game-prompt");
    const box=c.box("game-reaction");
    const state=c.status("Hazır olanda başla.");
    const best=Number(c.get("reaction_best",0))||0;
    c.h("p",best>0?"Bu brauzerdə ən yaxşı nəticən: "+Math.round(best)+" ms":"Hələ ölçülmüş nəticən yoxdur.","game-note");
    let timer=0,phase="idle",start=0;
    function reset(){
      clearTimeout(timer);
      phase="idle";box.className="game-reaction";box.textContent="⚡ Başla";state.textContent="Siqnalı gözlə.";
    }
    function press(){
      if(phase==="idle"||phase==="done"){
        clearTimeout(timer);
        phase="waiting";box.className="game-reaction waiting";
        box.textContent="🔴 Hələ toxunma!";
        state.textContent="Yaşıl siqnalı gözlə...";
        const ms=900+Math.floor(Math.random()*2800);
        timer=setTimeout(()=>{
          if(!c.live())return;
          phase="ready";start=performance.now();
          box.className="game-reaction ready";box.textContent="🟢 İNDİ!";
        },ms);
        return;
      }
      if(phase==="waiting"){
        clearTimeout(timer);
        phase="idle";box.className="game-reaction";
        box.textContent="🚫 Çox tez!";
        state.textContent="Səhv start. Yenidən başlamaq üçün toxun.";
        c.track("reaction_false_start");return;
      }
      if(phase==="ready"){
        const ms=Math.round(performance.now()-start);
        phase="done";box.className="game-reaction";box.textContent=ms+" ms";
        state.textContent="✅ Reaksiya müddətin: "+ms+" ms. Yenidən oynamaq üçün toxun.";
        const previous=Number(c.get("reaction_best",0))||0;
        if(!previous||ms<previous)c.set("reaction_best",ms);
        c.track("reaction_result",{bucket:ms<250?"fast":ms<500?"medium":"slow"});
      }
    }
    box.setAttribute("role","button");box.tabIndex=0;box.textContent="⚡ Başla";
    box.setAttribute("aria-label","Reaksiya oyunu düyməsi");
    box.addEventListener("click",press);
    box.addEventListener("keydown",event=>{
      if(event.key===" "||event.key==="Enter"){event.preventDefault();press();}
    });
    c.cleanup(()=>{clearTimeout(timer);});
    c.btn("↻ Sıfırla",reset);
  };

  // 14: exactly three authored choices produce a personal comedy story.
  games.story=c=>{
    const steps=[
      {q:"Əsas qəhrəman kim olsun?",options:[
        {text:"🧓 Baba",value:"Baba",topic:"home"},
        {text:"👩 Ana",value:"Ana",topic:"home"},
        {text:"🧒 Uşaq",value:"Uşaq",topic:"kids"},
        {text:"👨 Mən",value:"Mən",topic:"phone"}
      ]},
      {q:"Hadisə harada başlasın?",options:[
        {text:"🏠 Evdə",value:"evdə",topic:"home"},
        {text:"🛒 Marketdə",value:"marketdə",topic:"shopping"},
        {text:"🚌 Avtobusda",value:"avtobusda",topic:"transport"},
        {text:"💼 İşdə",value:"işdə",topic:"work"}
      ]},
      {q:"Sonda nə baş versin?",options:[
        {text:"☕ Çay süzülür",value:"birdən hamı çay istəyir",topic:"tea"},
        {text:"📱 Telefon itir",value:"telefonun elə əlində olduğu üzə çıxır",topic:"phone"},
        {text:"🚶 Qonşu gəlir",value:"qonşu ən gözlənilməz anda görünür",topic:"social"},
        {text:"🧸 Uşaq sual verir",value:"uşağın sualına cavab tapan olmur",topic:"kids"}
      ]}
    ];
    let i=0,answers=[];
    function choose(){
      c.clear();
      intro(c,"📖 KOMEDİYA SƏNARİSİ","3 seçimdən yaranan yazılı mini-hekayə. Video avtomatik yaradılmır.");
      c.h("div","Seçim "+(i+1)+" / 3","game-round");
      c.h("h3",steps[i].q,"game-question");
      const opts=c.box("game-options");
      steps[i].options.forEach((o,n)=>c.btn(o.text,()=>{
        answers[i]=n;
        if(i===2)finish();
        else{i++;choose();}
      },"game-option",opts));
      if(i>0)c.btn("← Geri",()=>{i--;choose();});
    }
    function finish(){
      const chosen=steps.map((x,n)=>x.options[answers[n]]);
      const text=chosen[0].value+" "+chosen[1].value+" hər şeyi normal zənn edir. Amma "+chosen[2].value+". Nəticədə hamı gülür! 😂";
      c.clear();intro(c,"🎬 SƏNİN HEKAYƏN","");
      const card=c.box("game-result");
      c.h("strong","Bir gün...", "",card);c.h("p",text,"",card);
      c.h("p","İdeya istəyirsənsə, «Sən Rejissorsan» bölməsində təklif göndərə bilərsən.","game-note");
      c.videos().then(()=>{
        if(!c.live())return;
        c.h("h3","Hekayənə yaxın real videolar","game-question");
        showMatch(c,chosen[2].topic,"story:"+answers.join(""),c.root);
      });
      const status=c.status("");
      c.btn("↗ Hekayəni paylaş",()=>actionShare(c,status,"Mənim komediya hekayəm",text,location.origin+"/yumor-parki.html?game=story"),"game-primary");
      c.btn("↻ Yeni ssenari yaz",()=>{answers=[];i=0;choose();});
      c.track("story_created",{topic:chosen[2].topic});
    }
    choose();
  };

  // 15: collect 5 actual hidden icons on cards numbered 4/7/10/14/20.
  games.eggs=c=>{
    const found=c.get("tokens",[]);
    const valid=Array.isArray(found)?new Set(found.filter(x=>Number.isInteger(x)&&x>=1&&x<=5)):new Set();
    intro(c,"🪄 GİZLİ XƏZİNƏ","Parkın kartlarında kiçik ✧ işarəsi var. Beşini tap, gizli sürprizi aç.");
    c.h("h3","Topladığın nişanlar: "+valid.size+" / 5","game-question");
    const board=c.box("game-board");
    for(let n=1;n<=5;n++){
      const btn=c.btn(valid.has(n)?"✦":"?",()=>{},valid.has(n)?"game-tile found":"game-tile",board);
      btn.disabled=true;btn.setAttribute("aria-label","Gizli nişan "+n+(valid.has(n)?" toplanıb":" hələ tapılmayıb"));
    }
    if(valid.size===5){
      const prize=c.box("game-result");
      c.h("strong","🏆 Yumor xəzinəsini açdın!","",prize);
      c.h("p","İndi sənə bugünkü gizli video hədiyyəsini göstəririk.","",prize);
      c.videos().then(()=>{
        if(!c.live())return;
        const videos=c.pick("social","secret:"+data.dateBaku(),1);
        if(videos.length)c.videoCard(videos[0],prize);
        else c.emptyVideos(prize);
      });
      c.set("secret_completed",true);
      c.track("secrets_completed");
    }else{
      const box=c.box("game-info");
      c.h("p","Kart nömrələrini diqqətlə axtar: 04, 07, 10, 14, 20. Tapdıqların yalnız bu brauzerdə yadda qalır.","",box);
      c.btn("🔎 Parka qayıt",()=>document.getElementById("park-stage-back")?.click(),"game-primary");
    }
  };

  // 16: the passport is the existing, fully tested DNA PNG export.
  games.passport=c=>{
    intro(c,"🏅 YUMOR PASPORTU","Şəxsi pasportu Yumor DNT Laboratoriyasında şəkil kimi yarada bilərsən.");
    const card=c.box("game-result");
    c.h("strong","🧬 5 sual → 7 xarakter → PNG pasport","",card);
    c.h("p","Yumor DNT-də seçimlərini tamamla. Nəticədə «Pasportu şəkil kimi saxla» düyməsi var. Şəkil brauzerində yaradılır.","",card);
    c.link("🖼️ Pasportumu yarat","/yumor-dnt.html","game-primary");
    c.h("p","Nəticə hazır olmadan şəxsiyyət məlumatı və ya hazır uydurma pasport göstərilmir.","game-note");
  };

  // 17: entertainment-only daily prediction with reproducible Baku tomorrow date.
  games.tomorrow=c=>{
    const tomorrow=data.dateBaku(1);
    const scenario=data.pick(data.stories,"prediction:"+tomorrow);
    const lucky=data.pick(data.topics,"lucky:"+tomorrow);
    intro(c,"🔮 SABAHIN YUMOR FALI",
      "Bu, hər kəs üçün eyni tarixə əsaslanan əyləncəli təsadüfi səhnədir. Həqiqi gələcəyi proqnozlaşdırmır.");
    const card=c.box("game-result");
    c.h("span","📅 Sabah · "+tomorrow,"game-badge",card);
    c.h("h3",scenario.text,"game-headline",card);
    c.h("p","Günün yumor işarəsi: "+lucky.icon+" "+lucky.label+". Gülməli vəziyyət üçün hazır ol!","",card);
    c.videos().then(()=>{
      if(!c.live())return;
      showMatch(c,scenario.topic,"prediction_video:"+tomorrow,card);
    });
    const status=c.status("");
    c.btn("↗ Dostuma yumor falı göndər",()=>
      actionShare(c,status,"Sabahın gülməli falı 😂",scenario.text+" • Yalnız əyləncə üçündür.",
        location.origin+"/yumor-parki.html?game=tomorrow"),"game-primary");
    c.h("p","Saytı təzələsən də, sabah üçün bu səhnə dəyişməyəcək.","game-note");
  };

  // 18: real vote totals only; never fabricate numbers during API downtime.
  games.poll=c=>{
    intro(c,"🧠 HAMİ BELƏ EDİR?",
      "Səsvermədə yalnız serverin həqiqətən qaytardığı səslər göstərilir. Offline rejimdə rəqəm uydurulmur.");
    let selected=0,poll=data.polls[selected],stats=null,busy=false;
    const switchers=c.box("game-remote");
    const content=c.box("game-card");
    const note=c.status("Real səsvermə məlumatları yüklənir…");
    function show(){
      content.replaceChildren();
      const p=data.polls[selected];
      c.h("h3",p.title,"game-question",content);
      const server=stats?.polls?.find(x=>x.id===p.id);
      if(!server||!Array.isArray(server.counts)||server.counts.length!==p.choices.length){
        c.h("p","Canlı səsvermə xidməti hazırda əlçatan deyil. Təxmini rəqəm göstərilmir.","game-note",content);
        return;
      }
      const votes=server.counts.reduce((a,b)=>a+b,0);
      c.h("p","Təsdiqlənmiş səslər: "+votes+" (unikal brauzer üzrə təxmini qoruma)","game-round",content);
      const oldVotes=c.get("votes",[]);
      const already=Array.isArray(oldVotes)&&oldVotes.includes(p.id);
      const opts=c.box("game-options",content);
      p.choices.forEach((choice,i)=>{
        const btn=c.btn(choice,()=>vote(p.id,i),"game-option",opts);
        if(already)btn.disabled=true;
      });
      if(already)c.h("p","Bu brauzerdən artıq səs verilmiş ola bilər. Başqa cihazlardan səsvermə ayrıca sayılır.","game-note",content);
      for(let i=0;i<p.choices.length;i++){
        const count=Number(server.counts[i])||0;
        const pct=votes?Math.round(100*count/votes):0;
        const row=c.box("game-poll-row",content);
        const header=c.h("header","","",row);
        c.h("span",p.choices[i],"",header);
        c.h("span",count+" • "+pct+"%","",header);
        const rail=c.box("game-meter",row);
        const bar=c.h("span",null,"",rail);bar.style.width=pct+"%";
      }
    }
    async function refresh(){
      note.textContent="Server məlumatları yenilənir…";
      try {
        const res=await c.apiCall("/v1/polls");
        if(!c.live())return;
        if(res.status!==200||res.data?.ok!==true)throw Error("Service unavailable");
        stats=res.data;note.textContent="✅ Real nəticələr yeniləndi.";show();
      }catch {
        if(!c.live())return;
        stats=null;show();
        note.textContent="Serverə bağlanmaq olmur. Real səslər hazırda göstərilmir.";
      }
    }
    async function vote(id,option){
      if(busy)return;
      busy=true;note.textContent="Səs yoxlanılır…";
      try{
        const voterId=c.voterId();
        const result=await c.apiCall("/v1/vote",{pollId:id,optionIndex:option,voterId});
        if(!c.live())return;
        if(result.status===200&&result.data?.ok){
          const old=c.get("votes",[]);
          c.set("votes",[...new Set([...(Array.isArray(old)?old:[]),id])]);
          c.track("poll_voted",{poll_id:id});
          note.textContent="✅ Səsin qəbul edildi.";
          await refresh();
        }else if(result.status===409){
          note.textContent="Bu brauzer artıq səs verib.";
          await refresh();
        }else note.textContent="Səsvermə alınmadı. Heç bir səs əlavə olunmadı.";
      }catch{if(c.live())note.textContent="Bağlantı xətası. Səsvermə alınmadı.";}
      finally{busy=false;}
    }
    data.polls.forEach((p,i)=>{
      const b=c.btn("№"+(i+1)+" "+p.title,()=>{selected=i;show();},"game-secondary",switchers);
      b.dataset.poll=p.id;
    });
    c.btn("↻ Canlı səsləri yenilə",refresh);
    refresh();
  };

  // 19: movie idea director, uses existing moderated anonymous idea API.
  games.director=c=>{
    intro(c,"🎤 SƏN REJİSSORSAN",
      "Mövzu, məkan və final seç. Yalnız razılıq verdikdən sonra ideyan yoxlama növbəsinə göndərilir.");
    const label=c.h("h3","Öz məişət komediyanı qur","game-headline");
    const panel=c.box("game-info");
    const theme=c.h("div","","game-options",panel);
    const places=c.h("div","","game-options",panel);
    const twists=c.h("div","","game-options",panel);
    const topics=data.topics.slice(0,6);
    const locations=["evdə","marketdə","küçədə","işdə"];
    const finales=["hamı çay istəyir","telefon elə əlində çıxır","qonşu qəfil gəlir","uşaq gülməli sual verir"];
    let selected={topic:0,place:0,end:0};
    function buttonsFor(group,items,key){
      items.forEach((item,i)=>{
        const btn=c.btn(item,()=>{
          selected[key]=i;
          for(const b of group.querySelectorAll?.("button")||[])
            b.classList.toggle("chosen",Number(b.dataset.value)===i);
          preview.textContent=build();
        },"game-option",group);
        btn.dataset.value=String(i);if(i===0)btn.classList.add("chosen");
      });
    }
    c.h("p","1. Mövzu","game-round",panel);
    buttonsFor(theme,topics.map(t=>t.icon+" "+t.label),"topic");
    c.h("p","2. Məkan","game-round",panel);
    buttonsFor(places,locations,"place");
    c.h("p","3. Gülməli final","game-round",panel);
    buttonsFor(twists,finales,"end");
    const previewBox=c.box("game-result");
    c.h("strong","Ssenarinin başlanğıcı:","",previewBox);
    const preview=c.h("p","","",previewBox);
    function build(){
      return "Mövzu: "+topics[selected.topic].label+". Məkan: "+locations[selected.place]+
        ". Hadisə adi başlayır, sonda "+finales[selected.end]+".";
    }
    preview.textContent=build();
    const text=c.h("textarea",null,"game-textarea");
    text.placeholder="İstəyə görə əlavə detal yaz (maksimum 130 simvol)";
    text.maxLength=130; text.setAttribute("aria-label","Ssenariyə əlavə detal");
    const checkWrap=c.box("game-info");
    const chk=c.h("input",null,"",checkWrap);
    chk.type="checkbox";chk.id="game-director-consent";
    const labelEl=c.h("label"," İdeyamın anonim şəkildə moderasiya növbəsinə göndərilməsinə razıyam.","",checkWrap);
    labelEl.htmlFor=chk.id;
    const feedback=c.status("İdeyalar avtomatik yayımlanmır, əvvəlcə yoxlanılır.");
    const submit=c.btn("✉️ Təklifi göndər",async()=>{
      if(!chk.checked){feedback.textContent="Əvvəl göndərmə razılığını təsdiqlə.";return;}
      const idea=build()+(text.value.trim()? " Əlavə detal: "+text.value.trim():"");
      if(idea.length>450){feedback.textContent="Mətn çox uzundur.";return;}
      submit.disabled=true;feedback.textContent="Göndərilir…";
      try{
        const res=await c.apiCall("/v1/idea",{idea,consent:true});
        if(!c.live())return;
        if(res.status===202&&res.data?.ok){
          feedback.textContent="✅ Təklif moderasiya növbəsinə qəbul edildi. Avtomatik dərc olunmur.";
          chk.checked=false;text.value="";
          c.track("director_idea_sent",{topic:topics[selected.topic].id});
        }else if(res.status===429)feedback.textContent="Bu günün göndərmə limitinə çatmısan.";
        else feedback.textContent="Göndərmə alınmadı. Ssenarini saxlayıb sonra yenidən cəhd et.";
      }catch{if(c.live())feedback.textContent="Serverə bağlantı olmadı. Ssenari göndərilmədi.";}
      finally{submit.disabled=false;}
    },"game-primary");
  };

  // 20: follow a topic-based chain through real channel videos. Repeat only after exhaustion.
  games.chain=c=>{
    intro(c,"🌐 YUMOR ZƏNCİRİ","Bir videodan mövzusuna yaxın digərinə keç. 81 video sonsuz sayda fərqli deyil: siyahı bitəndə dövr təkrarlanır.");
    const board=c.box("game-card");
    const status=c.status("Video zənciri hazırlanır…");
    c.videos().then(()=>{
      if(!c.live())return;
      const all=c.currentVideos();
      if(!all.length){c.emptyVideos(board);return;}
      let seen=c.get("chain_seen",[]);
      if(!Array.isArray(seen))seen=[];
      seen=seen.filter(id=>all.some(v=>v.id===id)).slice(-all.length);
      let id=seen[seen.length-1]||data.pick(all,data.dateBaku()+"chain")?.id;
      function display(){
        board.replaceChildren();
        const v=all.find(x=>x.id===id)||all[0];
        const cats=c.api.categories(v);
        c.h("span","🔗 ZƏNCİR HALQASI · "+Math.min(seen.length+1,all.length),"game-badge",board);
        c.videoCard(v,board,"Zəncirin bu halqasını izlə");
        c.h("p","Bu videonun mövzuları: "+(cats.map(t=>topic(t).label).join(", ")||"Ümumi yumor"),"game-note",board);
        status.textContent=seen.length+" fərqli video bu brauzerdə zəncirə əlavə olunub.";
        const opts=c.box("game-remote",board);
        const next=(related)=>{
          if(!seen.includes(v.id))seen.push(v.id);
          let candidates=all.filter(x=>x.id!==v.id && !seen.includes(x.id));
          if(!candidates.length){
            seen=[]; // old progress is intentionally reset only after exhaustion
            candidates=all.filter(x=>x.id!==v.id);
            status.textContent="Mövcud videoların hamısını gördün. Zəncir yenidən başlayır.";
          }
          const matched=related?candidates.filter(x=>{
            const t=c.api.categories(x);
            return cats.some(category=>t.includes(category));
          }):[];
          const pool=matched.length?matched:candidates;
          const nextVideo=data.pick(pool,"chain:"+v.id+":"+(seen.length)+":"+data.dateBaku());
          if(nextVideo)id=nextVideo.id;
          c.set("chain_seen",seen);
          c.track("chain_next",{related,shown:seen.length});
          display();
        };
        c.btn("🔗 Oxşar videoya keç",()=>next(true),"game-primary",opts);
        c.btn("🎲 Başqa mövzu",()=>next(false),"game-secondary",opts);
      }
      display();
    });
  };
};
