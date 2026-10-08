"use strict";
/* Yumor DNT engine. Entertainment only; no server, user identity or AI key. */
(function(host){
  const TRAITS=Object.freeze([
    {id:"tea",name:"Çay diplomatı",emoji:"☕",accent:"#ffc46b",code:"CAY",
      motto:"Söz bitə bilər, çay heç vaxt!",blurb:"Gərgin situasiyalarda əvvəl çay süzən, sonra məsələni həll edən komandadasan."},
    {id:"phone",name:"Telefon kamuflyaj ustası",emoji:"📱",accent:"#86d8ff",code:"TEL",
      motto:"Telefon cibdədir, plan həmişə hazırdır.",blurb:"Gözlənilməz vəziyyətdə ekranla məşğul görünmə texnikan işə düşür."},
    {id:"social",name:"Qonşu radarı",emoji:"📡",accent:"#cfadff",code:"QON",
      motto:"Küçədə xəbər səndən gizlənməz.",blurb:"Qapı açılanda, salam gələndə və qonaq görünəndə radarın dərhal işə düşür."},
    {id:"home",name:"Ev rejissoru",emoji:"🏠",accent:"#ff98b7",code:"EV",
      motto:"Hər evdə bir serial var!",blurb:"Adi ev hadisəsindən də komediya səhnəsi çıxarmağı bacarırsan."},
    {id:"shopping",name:"Market detektivi",emoji:"🛒",accent:"#9bf6c7",code:"MRK",
      motto:"Qiymət etiketinin də sirri var.",blurb:"Endirimlər, alış-veriş siyahısı və kassadakı vəziyyətlər sənin mövzundur."},
    {id:"work",name:"İş ustası",emoji:"💼",accent:"#ffe083",code:"IS",
      motto:"İş görürəm. Ən azından elə görünür!",blurb:"Hər qarışıq vəziyyət üçün praktik bəhanə və hazır cavab tapırsan."},
    {id:"kids",name:"Uşaq dünyasının eksperti",emoji:"🧸",accent:"#a0f0ff",code:"USA",
      motto:"Uşaqların məntiqi həmişə qalibdir.",blurb:"Uşaqların qəribə, amma çox şirin məntiqinə dərhal uyğunlaşırsan."}
  ]);
  const QUESTIONS=Object.freeze([
    {text:"Qapı döyülür, gözlənilməz qonaqdır. İlk hərəkətin?",
     answers:[
       {text:"Çayı ocağa qoyuram",emoji:"☕",trait:"tea",secondary:"home"},
       {text:"Pəncərədən kim olduğunu yoxlayıram",emoji:"👀",trait:"social",secondary:"phone"},
       {text:"Evi iki dəqiqəyə yığışdırıram",emoji:"🏠",trait:"home",secondary:"work"},
       {text:"Telefonda çox məşğul görünürəm",emoji:"📱",trait:"phone",secondary:"work"}]},
    {text:"Telefonun şarjı 1%-dir. Nə edirsən?",
     answers:[
       {text:"Şarj cihazını tapmaq üçün qaçıram",emoji:"⚡",trait:"phone",secondary:"home"},
       {text:"Uşağın cizgi filmi yarımçıq qalmasın deyə qaçıram",emoji:"🧸",trait:"kids",secondary:"phone"},
       {text:"Son iş mesajını göndərirəm",emoji:"💼",trait:"work",secondary:"phone"},
       {text:"Marketdən powerbank almağa çıxıram",emoji:"🛒",trait:"shopping",secondary:"phone"}]},
    {text:"Marketdə endirim görürsən. Reaksiyan?",
     answers:[
       {text:"Əvvəlki qiyməti də hesablayıram",emoji:"🧮",trait:"shopping",secondary:"work"},
       {text:"Çay və qənd alıb çıxıram",emoji:"🍵",trait:"tea",secondary:"shopping"},
       {text:"Evdəki siyahını yoxlayıram",emoji:"📝",trait:"home",secondary:"shopping"},
       {text:"Hamıya endirimi xəbər verirəm",emoji:"📣",trait:"social",secondary:"shopping"}]},
    {text:"Uşaq gözünü yumub «Məni tap!» deyir. Düz qarşındadır. Sən?",
     answers:[
       {text:"Divanın arxasında axtarıram",emoji:"🧸",trait:"kids",secondary:"home"},
       {text:"Ev boyu teatr qururam",emoji:"🎭",trait:"home",secondary:"kids"},
       {text:"Telefonla axtarma oyunu çəkirəm",emoji:"📱",trait:"phone",secondary:"kids"},
       {text:"Qonşudan kömək istəyirəm",emoji:"📡",trait:"social",secondary:"kids"}]},
    {text:"Qonşu səni uzaqdan görür. Nə baş verir?",
     answers:[
       {text:"Salamı 20 metrdən verirəm",emoji:"👋",trait:"social",secondary:"tea"},
       {text:"Birdən telefona baxmağa başlayıram",emoji:"📱",trait:"phone",secondary:"work"},
       {text:"İşə gecikirmiş kimi qaçıram",emoji:"🏃",trait:"work",secondary:"phone"},
       {text:"«Gəl çay içək!» deyirəm",emoji:"☕",trait:"tea",secondary:"social"}]}
  ]);
  const VERSION="v1_";
  function valid(answers){
    return Array.isArray(answers)&&answers.length===QUESTIONS.length&&
      answers.every(n=>Number.isInteger(n)&&n>=0&&n<4);
  }
  function encode(answers){return valid(answers)?VERSION+answers.join(""):null;}
  function decode(value){
    if(typeof value!=="string" || !/^v1_[0-3]{5}$/.test(value))return null;
    return value.slice(VERSION.length).split("").map(Number);
  }
  function evaluate(answers){
    if(!valid(answers))return null;
    const points=Object.fromEntries(TRAITS.map(t=>[t.id,0]));
    QUESTIONS.forEach((q,i)=>{
      const answer=q.answers[answers[i]];
      points[answer.trait]+=3;
      if(answer.secondary&&answer.secondary!==answer.trait)points[answer.secondary]+=1;
    });
    // Tie-breaking is deterministic and favours earliest explicitly selected archetype.
    const first=TRAITS.map(t=>t.id);
    const ranked=[...TRAITS].sort((a,b)=>points[b.id]-points[a.id]||
      answers.map((choice,i)=>QUESTIONS[i].answers[choice].trait).indexOf(a.id)-
      answers.map((choice,i)=>QUESTIONS[i].answers[choice].trait).indexOf(b.id)||
      first.indexOf(a.id)-first.indexOf(b.id));
    return {profile:ranked[0],scores:points,ranked,answers:[...answers],code:encode(answers)};
  }
  function similarity(left,right){
    if(!valid(left)||!valid(right))return null;
    const same=left.reduce((sum,choice,i)=>sum+(choice===right[i]?1:0),0);
    return {same,total:QUESTIONS.length,percent:same*100/QUESTIONS.length};
  }
  function pickVideos(items,api,profile,limit=3){
    if(!api?.list||!api.categories||!profile?.profile)return {videos:[],matched:0};
    const list=api.list(items);
    const main=profile.profile.id;
    const second=profile.ranked[1]?.id||"";
    const sorted=list.map(v=>{
      const tags=api.categories(v);
      const rank=tags.includes(main)?2:tags.includes(second)?1:0;
      const views=Math.max(0,Number(v.views)||0);
      const freshness=Date.parse(v.publishedAt)||0;
      return {v,rank,views,freshness};
    }).sort((a,b)=>b.rank-a.rank||b.freshness-a.freshness||b.views-a.views);
    const selected=sorted.slice(0,Math.max(0,Math.min(6,limit)));
    return {videos:selected.map(x=>x.v),matched:selected.filter(x=>x.rank>0).length};
  }
  host.BBDNA=Object.freeze({traits:TRAITS,questions:QUESTIONS,encode,decode,valid,evaluate,similarity,pickVideos});
})(typeof window!=="undefined"?window:globalThis);
if(typeof module!=="undefined"&&module.exports)module.exports=globalThis.BBDNA;
