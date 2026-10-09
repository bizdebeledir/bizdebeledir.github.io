"use strict";
/* Studio tools A: 5×5 personal bingo and 9:16 text-only meme poster. */
(function(host){
 const tools=host.BBStudioTools||{};
 const W=720,H=1280;
 function background(ctx,palette){
  const grad=ctx.createLinearGradient(0,0,W,H);
  grad.addColorStop(0,palette[0]);grad.addColorStop(.62,palette[1]);grad.addColorStop(1,palette[2]);
  ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  ctx.fillStyle="#ffffff13";
  for(let i=0;i<23;i++){
   const x=(i*137+29)%W,y=(i*227+87)%H;
   ctx.beginPath();ctx.arc(x,y,3+(i%6)*3,0,Math.PI*2);ctx.fill();
  }
 }
 function rounded(ctx,x,y,w,h,r){
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);
 }
 function wrapText(ctx,text,limit,maxLines=5){
  const words=String(text).trim().split(/\s+/),lines=[];
  let current="";
  for(const w of words){
   const trial=current?current+" "+w:w;
   if(current&&ctx.measureText(trial).width>limit){lines.push(current);current=w;}
   else current=trial;
  }
  if(current)lines.push(current);
  return lines.slice(0,maxLines);
 }
 function textLines(ctx,lines,x,y,height=42){
  lines.forEach((line,i)=>ctx.fillText(line,x,y+i*height));
 }
 function save(c,canvas,name,status,metric){
  c.downloadCanvas(canvas,name,()=>c.metrics(metric)).then(ok=>{
   if(c.live())status.textContent=ok?
    "✅ PNG hazırlanıb. Telefonunda fayllar və ya endirmələr bölməsinə bax.":
    "Bu brauzerdə PNG yaratmaq mümkün olmadı.";
  });
 }
 tools.bingo=c=>{
  const entries=c.core.bingoGrid("bizde-bingo-v1");
  const preset=c.read("bingo_checks",[]);
  const checks=new Set(Array.isArray(preset)?preset.filter(i=>Number.isInteger(i)&&i>=0&&i<25):[]);
  c.el("p","Sənin də başına gələn hadisələri seç. 5×5 BINGO kartında 5 xanadan ibarət bütöv xətt tamamlayanda BINGO qazanırsan.","studio-muted");
  const progress=c.el("p","","studio-progress");
  const board=c.block("studio-bingo");
  const btns=[];
  const canvas=c.el("canvas",null,"studio-canvas");
  canvas.width=W;canvas.height=H;
  const note=c.status();
  let bingos=0;
  function calculate(){
   const lines=[];
   for(let row=0;row<5;row++)lines.push([0,1,2,3,4].map(i=>row*5+i));
   for(let col=0;col<5;col++)lines.push([0,1,2,3,4].map(i=>i*5+col));
   lines.push([0,6,12,18,24],[4,8,12,16,20]);
   return lines.filter(arr=>arr.every(i=>checks.has(i))).length;
  }
  function renderCanvas(){
   const ctx=canvas.getContext("2d");if(!ctx){note.textContent="Kanvas dəstəklənmir.";return;}
   background(ctx,["#172a2b","#263f38","#65513f"]);
   ctx.fillStyle="#c9ff8e";ctx.font="900 30px system-ui";ctx.textAlign="center";
   ctx.fillText("BİZDƏ BELƏDİR",W/2,86);
   ctx.fillStyle="#ffffff";ctx.font="900 69px system-ui";ctx.fillText("MƏİŞƏT BINGO",W/2,172);
   ctx.fillStyle="#dbe5dc";ctx.font="500 24px system-ui";ctx.fillText("Bunlardan neçəsi sənin də başına gəlib?",W/2,218);
   const margin=28,gap=7,left=margin,top=264,size=(W-2*margin-4*gap)/5,cellH=164;
   for(let i=0;i<25;i++){
    const x=left+(i%5)*(size+gap),y=top+Math.floor(i/5)*(cellH+gap);
    rounded(ctx,x,y,size,cellH,12);ctx.fillStyle=checks.has(i)?"#caff83":"#ffffff15";ctx.fill();
    ctx.strokeStyle=checks.has(i)?"#efffcc":"#ffffff2a";ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle=checks.has(i)?"#172a19":"#eff6ee";
    ctx.textAlign="center";ctx.font="700 17px system-ui";
    const words=wrapText(ctx,entries[i],size-12,6);
    const start=y+(cellH-words.length*23)/2+17;
    words.forEach((t,n)=>ctx.fillText(t,x+size/2,start+n*23));
    if(checks.has(i)){ctx.font="900 28px system-ui";ctx.fillText("✓",x+size-20,y+25);}
   }
   bingos=calculate();
   ctx.fillStyle="#d4ff9b";ctx.font="900 31px system-ui";
   ctx.fillText(checks.size+" / 25 SEÇİLDİ   •   "+bingos+" BINGO",W/2,1159);
   ctx.fillStyle="#e6f2e3";ctx.font="500 25px system-ui";
   ctx.fillText("bizdebeledir.github.io",W/2,1213);
  }
  function update(){
   btns.forEach((b,i)=>{
    const active=checks.has(i);b.classList.toggle("checked",active);
    b.setAttribute("aria-pressed",String(active));
   });
   progress.textContent=checks.size+" / 25 seçildi · "+calculate()+" BINGO xətti";
   c.write("bingo_checks",[...checks]);
   renderCanvas();
   if(calculate()>=1 && !c.read("bingo_first_line",false)){
    c.write("bingo_first_line",true);
    c.metrics("bingo_complete");
   }
  }
  entries.forEach((text,i)=>{
   const b=c.button(text,()=>{
    checks.has(i)?checks.delete(i):checks.add(i);
    update();
   },"",board);
   b.setAttribute("aria-pressed",String(checks.has(i)));btns.push(b);
  });
  c.el("p","İşarələdiyin xanalar yalnız bu brauzerdə qalır. Paylaşım kartında şəxsi məlumat yoxdur.","studio-muted");
  c.button("🖼️ BINGO kartını PNG kimi saxla",()=>save(c,canvas,"BIZDE_BELEDIR_BINGO.png",note,"bingo_export"),"studio-primary");
  c.button("↻ Kartı sıfırla",()=>{
   checks.clear();c.write("bingo_first_line",false);update();note.textContent="Kartın seçimləri təmizləndi.";
  });
  const share=c.button("↗ Oyunu dostuma göndər",()=>{
   c.share("🎯 Məişət BINGO","Gör bunlardan neçəsi sənin də başına gəlib!",
     location.origin+"/yumor-studiyasi.html?tab=bingo",ok=>{
       note.textContent=ok===true?"Paylaşım əməliyyatı açıldı və ya keçid kopyalandı.":
         ok===null?"Paylaşım ləğv edildi.":"Paylaşım dəstəklənmir.";
     });
  });
  const preview=c.block("studio-card");
  c.el("h3","Sənin kartının şəkil önbaxışı","",preview);
  preview.appendChild(canvas);
  update();
 };
 tools.poster=c=>{
  c.el("p","Hazır real video başlığını seç, üzərinə öz gülməli cümləni əlavə et. Bu, video kadrının surəti deyil: yeni yazı posteridir. Video YouTube-da qalır.","studio-muted");
  const form=c.block("studio-card");
  const topLabel=c.el("label","Yuxarı yazı (ən çox 70 işarə)","studio-field",form);
  const top=c.el("input",null,"studio-select",topLabel);
  top.maxLength=70;top.value="MƏN BİR DƏFƏ BAXIM DEDİM...";
  const bottomLabel=c.el("label","Aşağı sual (ən çox 65 işarə)","studio-field",form);
  const bottom=c.el("input",null,"studio-select",bottomLabel);
  bottom.maxLength=65;bottom.value="Sizdə də belə olur?";
  const searchLabel=c.el("label","Video başlığını axtar","studio-field",form);
  const search=c.el("input",null,"studio-select",searchLabel);
  search.type="search";search.placeholder="Məsələn: çay, qonaq, telefon";
  const choices=c.block("studio-card");
  const canvas=c.el("canvas",null,"studio-canvas");
  canvas.width=W;canvas.height=H;
  const state=c.status();
  let selected=null,all=[],previewList=[];
  function draw(){
   const ctx=canvas.getContext("2d");if(!ctx)return;
   background(ctx,["#192532","#4a2b4a","#273c30"]);
   ctx.textAlign="center";
   ctx.font="900 29px system-ui";ctx.fillStyle="#d6ffad";ctx.fillText("BİZDƏ BELƏDİR",W/2,81);
   ctx.font="900 48px system-ui";ctx.fillStyle="#fff";textLines(ctx,wrapText(ctx,top.value||"BU HADİSƏNİ TANIDIN?",W-90,3),W/2,165,56);
   const boxX=55,boxY=380;
   ctx.fillStyle="#1c2932";rounded(ctx,boxX,boxY,W-110,510,28);ctx.fill();
   ctx.strokeStyle="#c8ff955c";ctx.lineWidth=3;ctx.stroke();
   ctx.fillStyle="#caff8e";ctx.font="900 126px system-ui";ctx.fillText("😂",W/2,565);
   ctx.fillStyle="#f4fff0";ctx.font="900 43px system-ui";
   const summary=wrapText(ctx,selected?c.core.title(selected):"REAL VİDEONU SEÇ",W-160,6);
   textLines(ctx,summary,W/2,649,57);
   ctx.fillStyle="#0f1d1e";rounded(ctx,58,948,W-116,124,22);ctx.fill();
   ctx.fillStyle="#e6ffcc";ctx.font="900 32px system-ui";
   textLines(ctx,wrapText(ctx,bottom.value||"Sizdə də belə olur?",W-140,2),W/2,999,40);
   ctx.fillStyle="#dae9dd";ctx.font="500 25px system-ui";ctx.fillText("bizdebeledir.github.io",W/2,1167);
   ctx.font="400 20px system-ui";ctx.fillText(selected?"Videonu saytda başlığı ilə tap":"Azərbaycan gündəlik yumoru",W/2,1208);
  }
  function choose(v){
   selected=v;c.write("poster_video",v.id);
   c.el("p","Seçilən video: "+c.core.title(v),"studio-muted",form);
   draw();
  }
  function renderChoices(){
   choices.replaceChildren();
   const q=c.core.fold(search.value||"");
   const list=q?all.filter(v=>c.core.fold(c.core.title(v)).includes(q)):all;
   previewList=list.slice(0,9);
   if(!previewList.length)c.el("p","Uyğun video tapılmadı. Başqa sözlə yoxla.","studio-muted",choices);
   for(const v of previewList){
    const b=c.button("🎬 "+c.core.title(v),()=>{selected=v;c.write("poster_video",v.id);state.textContent="Seçildi: "+c.core.title(v);draw();},"studio-button",choices);
    b.style.display="block";b.style.width="100%";b.style.textAlign="left";
   }
  }
  search.addEventListener("input",renderChoices);
  top.addEventListener("input",draw);bottom.addEventListener("input",draw);
  const output=c.block("studio-card");
  c.el("h3","Posterə bax","",output);output.appendChild(canvas);
  c.button("🖼️ PNG şəkil kimi saxla",()=>save(c,canvas,"BIZDE_BELEDIR_MEM_KARTI.png",state,"poster_export"),"studio-primary");
  const linkBox=c.block("studio-card");
  const linkInfo=c.el("p","Seçilmiş videoya keçid burada görünəcək.","studio-muted",linkBox);
  c.button("↗ Videonu dostuna göndər",()=>{
   if(!selected){state.textContent="Əvvəl video seç.";return;}
   c.share("😂 Bizdə Belədir",c.core.title(selected),location.origin+"/video/"+selected.id+".html",result=>{
    state.textContent=result===true?"Paylaşım pəncərəsi açıldı və ya keçid kopyalandı.":
      result===null?"Paylaşım ləğv edildi.":"Paylaşım dəstəklənmir.";
   });
  });
  c.loaded().then(()=>{
   if(!c.live())return;
   all=c.get();
   selected=all.find(v=>v.id===c.read("poster_video"))||all[0]||null;
   linkInfo.textContent=selected?"Seçilmiş video: "+c.core.title(selected):"Video siyahısı əlçatan deyil.";
   renderChoices();draw();
  });
  draw();
 };
 host.BBStudioTools=tools;
})(typeof window!=="undefined"?window:globalThis);
