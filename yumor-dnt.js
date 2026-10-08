"use strict";
/* Yumor DNT · interactive site-only experience. No AI API, no remote answer storage. */
(() => {
  const engine=window.BBDNA;
  const discover=window.BBDiscover;
  const $=id=>document.getElementById(id);
  if(!engine||!discover||!$("lab-start"))return;

  const intro=$("lab-intro"), quiz=$("lab-quiz"), result=$("lab-result");
  const qTitle=$("lab-question-title"), options=$("lab-options");
  const qs=engine.questions;
  let answers=[],step=0,lastResult=null,isShared=false;
  const params=new URLSearchParams(location.search);
  const shared=engine.decode(params.get("r"));
  let challenged=engine.decode(params.get("c"));

  function show(el){el.hidden=false;}
  function hide(el){el.hidden=true;}
  function view(name){
    for(const el of [intro,quiz,result])hide(el);
    show({intro,quiz,result}[name]);
    if(!matchMedia("(prefers-reduced-motion: reduce)").matches) window.scrollTo({top:0,behavior:"smooth"});
    else window.scrollTo(0,0);
  }
  function start(){
    answers=[];step=0;lastResult=null;isShared=false;
    view("quiz");drawQuestion();
    discover.track("bb_dna_started",{challenge:!!challenged});
  }
  function drawQuestion(){
    const question=qs[step];
    $("lab-step-label").textContent="Sual "+(step+1)+" / "+qs.length;
    $("lab-progress").setAttribute("aria-valuenow",String(step));
    $("lab-progress-fill").style.width=String(100*step/qs.length)+"%";
    $("lab-question-number").textContent=String(step+1).padStart(2,"0")+" / "+String(qs.length).padStart(2,"0");
    qTitle.textContent=question.text;
    options.replaceChildren();
    question.answers.forEach((item,i)=>{
      const btn=document.createElement("button");
      btn.className="lab-choice";btn.type="button";
      const emoji=document.createElement("span");
      emoji.textContent=item.emoji;emoji.className="lab-choice-icon";emoji.setAttribute("aria-hidden","true");
      const text=document.createElement("span");
      text.textContent=item.text;
      const idx=document.createElement("span");idx.textContent=String(i+1).padStart(2,"0");idx.className="lab-choice-idx";
      btn.append(emoji,text,idx);
      btn.addEventListener("click",()=>{
        answers[step]=i;
        if(step+1>=qs.length)showResult(answers,false);
        else{step++;drawQuestion();}
      });
      options.append(btn);
    });
    $("lab-back").disabled=false;
  }
  function reset(){
    challenged=null;isShared=false;answers=[];lastResult=null;
    try{history.replaceState(null,"",location.pathname);}catch{}
    hide($("lab-challenge-intro"));
    view("intro");
  }
  function profileBars(out){
    const root=$("lab-score");root.replaceChildren();
    const top=out.ranked.slice(0,3);
    const max=Math.max(1,...top.map(p=>out.scores[p.id]));
    for(const p of top){
      const row=document.createElement("div");row.className="lab-score-row";
      const label=document.createElement("strong");label.textContent=p.emoji+" "+p.name.split(" ").slice(0,2).join(" ");
      const rail=document.createElement("div");rail.className="lab-score-rail";
      const bar=document.createElement("div");bar.className="lab-score-fill";
      bar.style.width=(100*out.scores[p.id]/max).toFixed(1)+"%";
      bar.style.background=p.accent;
      rail.append(bar);
      const count=document.createElement("span");count.className="lab-score-points";
      count.textContent=String(out.scores[p.id]);
      row.append(label,rail,count);root.append(row);
    }
  }
  function strands(out){
    const root=$("lab-strands");root.replaceChildren();
    for(let i=0;i<11;i++){
      const item=document.createElement("span");
      const answer=out.answers[i%out.answers.length];
      item.style.transform="rotate("+((i%2?1:-1)*(17+answer*12))+"deg)";
      item.style.opacity=String(.4+answer*.14);
      root.append(item);
    }
  }
  function showResult(input,fromLink){
    const out=engine.evaluate(input);
    if(!out)return;
    lastResult=out;isShared=fromLink;
    view("result");
    $("lab-passport").style.setProperty("--dna-accent",out.profile.accent);
    $("lab-seal").textContent=out.profile.emoji;
    $("lab-result-title").textContent=out.profile.name;
    $("lab-motto").textContent="“"+out.profile.motto+"”";
    $("lab-result-description").textContent=out.profile.blurb;
    $("lab-passport-id").textContent="DNT-"+out.code.slice(3);
    profileBars(out);strands(out);
    const duel=$("lab-compare");
    if(challenged && !fromLink){
      const comp=engine.similarity(challenged,out.answers);
      const challenger=engine.evaluate(challenged);
      $("lab-compare-text").textContent="Sənin xarakterin: "+out.profile.name+
        ". Dostunun xarakteri: "+challenger.profile.name+
        ". Eyni seçimləriniz: "+comp.same+" / "+comp.total+".";
      show(duel);
    } else if (fromLink) {
      $("lab-compare-text").textContent="Bu, dostunun paylaşdığı nəticədir. Öz Yumor DNT-ni görmək üçün «Yenidən sına» düyməsini bas.";
      show(duel);
    }else hide(duel);
    $("lab-share-note").textContent="";
    discover.track("bb_dna_result_view",{profile:out.profile.id,shared_link:fromLink});
    loadVideos(out);
  }
  async function loadVideos(out){
    const root=$("lab-videos-list");
    root.replaceChildren();
    const message=document.createElement("p");
    message.className="lab-loading";message.textContent="Kanal videolarından seçilir…";
    root.append(message);
    try {
      const response=await fetch("/all-videos.json?v="+Math.floor(Date.now()/300000),{cache:"default"});
      if(!response.ok)throw new Error("JSON unavailable");
      const data=await response.json();
      // YouTube rounds recent Flow clips to around 11 seconds; older uploads vary.
      const all=discover.list(data);
      const ten=all.filter(v=>/^PT(?:10|11|12|13)S$/.test(String(v.duration||"")));
      const selection=engine.pickVideos(ten.length>=3?ten:all,discover,out,3);
      if(!selection.videos.length)throw new Error("No real videos");
      $("lab-match-note").textContent=selection.matched>0
        ? "Seçimlərinə yaxın mövzuda "+selection.matched+" video tapıldı. Digərləri kanaldan seçildi."
        : "Bu xarakter üçün uyğun mövzuda kifayət qədər video yoxdur. Kanalın başqa gülməli videolarını seçdik.";
      root.replaceChildren();
      selection.videos.forEach((v,i)=>{
        const link=document.createElement("a");
        link.className="lab-video-card";link.href="/shorts.html?v="+encodeURIComponent(v.id);
        const img=document.createElement("img");
        img.src="https://i.ytimg.com/vi/"+encodeURIComponent(v.id)+"/hqdefault.jpg";
        img.alt="";img.width=135;img.height=100;img.loading="lazy";img.decoding="async";
        const body=document.createElement("div");
        const title=document.createElement("strong");title.textContent=(i+1)+". "+discover.title(v);
        const caption=document.createElement("small");
        caption.textContent="▶ Bax · "+new Intl.NumberFormat("az-AZ").format(Number(v.views)||0)+" baxış";
        body.append(title,caption);link.append(img,body);root.append(link);
      });
    }catch{
      $("lab-match-note").textContent="Video siyahısı hazırda yüklənmədi.";
      root.replaceChildren();
      const link=document.createElement("a");link.href="/videos.html";
      link.textContent="Bütün videolara bax →";link.className="lab-home-link";
      root.append(link);
    }
  }
  function linkFor(kind){
    if(!lastResult)return location.origin+"/yumor-dnt.html";
    const url=new URL("/yumor-dnt.html",location.origin);
    url.searchParams.set(kind,lastResult.code);
    return url.href;
  }
  async function share(kind){
    if(!lastResult)return;
    const isDuel=kind==="c";
    const url=linkFor(kind);
    const title=isDuel?"⚔️ Gülüş duelində məni keçə bilərsən?":"🧬 Mənim Yumor DNT-m: "+lastResult.profile.name;
    const text=isDuel?"5 gülməli suala cavab ver, görək neçə seçimimiz eynidir!":"Mən "+lastResult.profile.name+" çıxdım 😂 Sənin xarakterin nədir?";
    try {
      if(navigator.share){
        await navigator.share({title,text,url});
        discover.track("bb_dna_share",{method:"native",type:kind});
        $("lab-share-note").textContent="Paylaşma pəncərəsi açıldı.";
      }else if(navigator.clipboard?.writeText){
        await navigator.clipboard.writeText(text+" "+url);
        discover.track("bb_dna_share",{method:"copy",type:kind});
        $("lab-share-note").textContent="✅ Keçid kopyalandı. Dostuna göndərə bilərsən.";
      }else{
        $("lab-share-note").textContent="Paylaşma linki: "+url;
      }
    }catch(error){
      if(error?.name!=="AbortError")
        $("lab-share-note").textContent="Paylaşmaq alınmadı. Keçid: "+url;
    }
  }
  function roundRect(ctx,x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
  }
  function wrap(ctx,text,x,y,maxWidth,lineHeight,maxLines=4){
    const words=String(text).split(" ");let line="",lines=0;
    for(const word of words){
      const next=line?line+" "+word:word;
      if(ctx.measureText(next).width>maxWidth && line){
        ctx.fillText(line,x,y);y+=lineHeight;lines++;line=word;
        if(lines>=maxLines-1)break;
      }else line=next;
    }
    if(line)ctx.fillText(line,x,y);
    return y+lineHeight;
  }
  async function saveImage(){
    if(!lastResult)return;
    const button=$("lab-image");
    button.disabled=true;
    try{
      const out=lastResult;
      const canvas=document.createElement("canvas");
      canvas.width=900;canvas.height=1200;
      const ctx=canvas.getContext("2d");
      if(!ctx)throw Error("Canvas unavailable");
      const grad=ctx.createLinearGradient(0,0,900,1200);
      grad.addColorStop(0,"#202631");grad.addColorStop(.6,"#10151b");grad.addColorStop(1,"#2a1f30");
      ctx.fillStyle=grad;ctx.fillRect(0,0,900,1200);
      ctx.strokeStyle=out.profile.accent+"aa";ctx.lineWidth=4;roundRect(ctx,25,25,850,1150,30);ctx.stroke();
      ctx.textAlign="center";
      ctx.font="bold 27px Arial";ctx.fillStyle="#dce8e3";ctx.fillText("BİZDƏ BELƏDİR",450,112);
      ctx.font="bold 22px Arial";ctx.fillStyle=out.profile.accent;ctx.fillText("YUMOR DNT LABORATORİYASI",450,163);
      ctx.beginPath();ctx.arc(450,304,100,0,Math.PI*2);ctx.fillStyle="#ffffff1a";ctx.fill();
      ctx.lineWidth=5;ctx.strokeStyle=out.profile.accent;ctx.stroke();
      ctx.font="112px Arial";ctx.fillText(out.profile.emoji,450,344);
      ctx.fillStyle="#b0bfc3";ctx.font="bold 23px Arial";ctx.fillText("SƏNİN YUMOR XARAKTERİN",450,460);
      ctx.font="bold 58px Arial";ctx.fillStyle="#fff";
      let y=wrap(ctx,out.profile.name,450,544,760,72,2);
      ctx.font="bold 30px Arial";ctx.fillStyle=out.profile.accent;
      y=wrap(ctx,out.profile.motto,450,y+30,730,44,2);
      ctx.font="25px Arial";ctx.fillStyle="#d5dedb";
      y=wrap(ctx,out.profile.blurb,450,y+58,715,39,4);
      let barY=Math.max(825,y+40);
      ctx.textAlign="left";
      const max=Math.max(1,...out.ranked.map(x=>out.scores[x.id]));
      out.ranked.slice(0,3).forEach((item,i)=>{
        const pos=barY+i*75;
        ctx.fillStyle="#d0dfd9";ctx.font="22px Arial";
        ctx.fillText(item.name.slice(0,26),108,pos);
        ctx.fillStyle="#3d454c";roundRect(ctx,108,pos+14,680,17,8);ctx.fill();
        ctx.fillStyle=item.accent;roundRect(ctx,108,pos+14,Math.max(18,680*out.scores[item.id]/max),17,8);ctx.fill();
      });
      ctx.textAlign="center";ctx.strokeStyle="#505967";ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(100,1070);ctx.lineTo(800,1070);ctx.stroke();
      ctx.font="bold 25px Arial";ctx.fillStyle="#fff";ctx.fillText("🧬 DNT-"+out.code.slice(3),450,1110);
      ctx.font="20px Arial";ctx.fillStyle="#bcc7c4";ctx.fillText("bizdebeledir.github.io/yumor-dnt.html",450,1150);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));
      if(!blob)throw Error("PNG unavailable");
      const url=URL.createObjectURL(blob);
      const link=document.createElement("a");
      link.href=url;link.download="BizdeBeledir_Yumor_DNT_"+out.code+".png";
      document.body.append(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1500);
      discover.track("bb_dna_passport_image",{profile:out.profile.id});
      $("lab-share-note").textContent="✅ Pasportun şəkli hazırlandı. Telefonun saxlanma bildirişini yoxla.";
    }catch{
      $("lab-share-note").textContent="Şəkil yaratmaq alınmadı. Pasportun ekran görüntüsünü saxlaya bilərsən.";
    }finally{button.disabled=false;}
  }

  $("lab-start").addEventListener("click",start);
  $("lab-back").addEventListener("click",()=>{
    if(step===0)view("intro");
    else{step--;drawQuestion();}
  });
  $("lab-restart").addEventListener("click",reset);
  $("lab-again").addEventListener("click",reset);
  $("lab-share").addEventListener("click",()=>share("r"));
  $("lab-challenge").addEventListener("click",()=>share("c"));
  $("lab-image").addEventListener("click",saveImage);

  if(challenged){
    $("lab-challenge-intro").textContent="⚔️ Dostun səni Gülüş Duelinə çağırıb! Cavablarını seç, sonda neçə cavabınızın eyni olduğunu gör.";
    show($("lab-challenge-intro"));
    $("lab-start").textContent="⚔️ Duelə başla →";
  }else if(shared) {
    showResult(shared,true);
  }
})();
