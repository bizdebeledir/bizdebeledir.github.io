"use strict";
/* Bizdə Belədir · 20-in-1 Yumor Parkı: static configuration, no API keys. */
(function(host){
  const modes=[
    {id:"dna",num:1,emoji:"🧬",title:"Yumor DNT",desc:"5 suala cavab ver, yumor pasportunu kəşf et",group:"Kəşf",effort:"1 dəqiqə"},
    {id:"duel",num:2,emoji:"⚔️",title:"Gülüş Dueli",desc:"Dostunla 3 seçim üzrə uyğunluğunu ölç",group:"Dostlarla",effort:"40 saniyə"},
    {id:"marathon",num:3,emoji:"🎬",title:"Şəxsi mini-komediya",desc:"Sənə uyğun 3 video ilə qısa marafon",group:"Videolar",effort:"3 video"},
    {id:"parallel",num:4,emoji:"🌀",title:"Paralel Həyatlar",desc:"Seçimlərin hekayəni başqa istiqamətə aparsın",group:"Hekayə",effort:"3 seçim"},
    {id:"remote",num:5,emoji:"🎛️",title:"Azərbaycan Evinin Pultu",desc:"Pultdan müxtəlif məişət kanallarını aç",group:"Videolar",effort:"Sərbəst"},
    {id:"detective",num:6,emoji:"🔍",title:"Yumor Detektivi",desc:"Kiçik ipucundan gizli videonu tap",group:"Oyun",effort:"30 saniyə"},
    {id:"tv",num:7,emoji:"📺",title:"Komediya TV",desc:"Retro televizorda kanal dəyiş və video aç",group:"Videolar",effort:"Sərbəst"},
    {id:"role",num:8,emoji:"🎭",title:"Sən hansı obrazsan?",desc:"Seçiminlə məişət komediyasındakı rolunu tap",group:"Kəşf",effort:"20 saniyə"},
    {id:"ending",num:9,emoji:"🧩",title:"Sonluğu tap",desc:"Gülməli video başlığının sonunu təxmin et",group:"Oyun",effort:"30 saniyə"},
    {id:"daily",num:10,emoji:"🎁",title:"Günün Sürpriz Qutusu",desc:"Hər gün bir yeni səhnə və kiçik mükafat",group:"Hər gün",effort:"Gündə 1"},
    {id:"atlas",num:11,emoji:"🗺️",title:"Situasiya Atlası",desc:"Bölgə seç, orada təsəvvür edilən yumor səhnəsini aç",group:"Hekayə",effort:"Sərbəst"},
    {id:"audio",num:12,emoji:"🎧",title:"Səsli Tapmaca",desc:"Brauzerin oxuduğu ipucundan hadisəni tap",group:"Oyun",effort:"30 saniyə"},
    {id:"reaction",num:13,emoji:"⚡",title:"Reaksiya Oyunu",desc:"Yaşıl siqnalı görən kimi düyməyə toxun",group:"Oyun",effort:"10 saniyə"},
    {id:"story",num:14,emoji:"📖",title:"Öz Hekayəni Qur",desc:"3 seçimdən şəxsi komediya hekayəsi düzəlt",group:"Hekayə",effort:"40 saniyə"},
    {id:"eggs",num:15,emoji:"🪄",title:"Gizli Yumor Xəzinəsi",desc:"Parkda gizlənən 5 yumor nişanını topla",group:"Kəşf",effort:"Tapmaca"},
    {id:"passport",num:16,emoji:"🏅",title:"Yumor Pasportu",desc:"Yumor DNT nəticəni şəkil kimi saxla",group:"Kəşf",effort:"1 dəqiqə"},
    {id:"tomorrow",num:17,emoji:"🔮",title:"Sabah nə olacaq?",desc:"Tamamilə əyləncə üçün yumor proqnozu",group:"Hər gün",effort:"10 saniyə"},
    {id:"poll",num:18,emoji:"🧠",title:"Hamı Belə Edir?",desc:"Real anonim səsvermədə öz cavabını seç",group:"Dostlarla",effort:"20 saniyə"},
    {id:"director",num:19,emoji:"🎤",title:"Sən Rejissorsan",desc:"Mövzu və final seçib yeni video təklif et",group:"Hekayə",effort:"1 dəqiqə"},
    {id:"chain",num:20,emoji:"🌐",title:"Yumor Zənciri",desc:"Bir videodan mövzusuna yaxın o birinə keç",group:"Videolar",effort:"Sərbəst"}
  ];
  const topics=[
    {id:"tea",icon:"☕",label:"Çay",line:"Çay yenə hamının yadına düşdü!"},
    {id:"phone",icon:"📱",label:"Telefon",line:"Bildiriş gəlmədi, ekran yenə yoxlanır."},
    {id:"social",icon:"🚶",label:"Dost-qonşu",line:"Tanışa salam vermək bəzən ayrıca sınaqdır."},
    {id:"home",icon:"🏠",label:"Ev",line:"Pult divanın altından çıxdı!"},
    {id:"shopping",icon:"🛒",label:"Market",line:"Qiymət kağızına iki dəfə baxmaq lazım oldu."},
    {id:"work",icon:"💼",label:"İş",line:"Müdir gələn kimi hamı birdən məşğul oldu."},
    {id:"kids",icon:"🧸",label:"Uşaq",line:"Uşaq gizləndi, hamı görsə də axtarır."},
    {id:"transport",icon:"🚌",label:"Yol",line:"Marşrutda düşəcəyin dayanacaq yenə keçildi."},
    {id:"couple",icon:"❤️",label:"Ər-arvad",line:"Evdə son sözü deyən kimdir, görəsən?"}
  ];
  const stories=[
    {id:"door",speech:"Qapını aç, qonaq gəlir!",text:"Qonaq gələcəyini bir dəqiqə əvvəl xəbər verdi.",answer:"home",topic:"home"},
    {id:"tea",speech:"Çayı kim süzür?",text:"Hamı çay istəyir, amma çaydan boşdur.",answer:"tea",topic:"tea"},
    {id:"phone",speech:"Telefon harda qaldı?",text:"Telefonu axtarırsan, amma elə əlindədir.",answer:"phone",topic:"phone"},
    {id:"neighbor",speech:"Qonşu, bir dəqiqə!",text:"Qonşu səni gördü, sən birdən tələsdin.",answer:"social",topic:"social"},
    {id:"market",speech:"Kart keçir, ya yox?",text:"Kassada hamı sənə baxanda terminal gözləyir.",answer:"shopping",topic:"shopping"},
    {id:"work",speech:"Müdir gəlir!",text:"Müdir görünən kimi iş sürətlənir.",answer:"work",topic:"work"},
    {id:"child",speech:"Məni tap, gözünü yum!",text:"Uşaq düz qarşında gizlənib.",answer:"kids",topic:"kids"},
    {id:"taxi",speech:"Düşən var, saxlayın!",text:"Dayanacağın qabağından ötəndə yadına düşdü.",answer:"transport",topic:"transport"},
    {id:"couple",speech:"Mən bunu deməmişdim!",text:"Söhbəti kim başladıb, heç kim xatırlamır.",answer:"couple",topic:"couple"}
  ];
  const polls=[
    {id:"tea_sugar",title:"Çayı necə sevirsən?",choices:["Qəndlə ☕","Şəkərsiz 😎","Limonla 🍋","Çay içmirəm 🙃"]},
    {id:"alarm",title:"Zəngli saat çalanda nə edirsən?",choices:["Dərhal dururam 🏃","5 dəqiqə də yatıram 😴","3-cü zəngdə dururam ⏰","Oyanmamışam 😂"]},
    {id:"phone",title:"Telefonun əlində ola-ola onu axtarmısan?",choices:["Bəli, çox dəfə 😂","Bir-iki dəfə 😅","Yox, heç vaxt 😎","İndi də axtarıram 📱"]}
  ];
  const duelQuestions=[
    {text:"Qonaq gələndə birinci nə edərsən?",choices:["Çayı qoyuram","Otağı yığışdırıram","Telefonu yoxlayıram","Evdəkilərə səslənirəm"]},
    {text:"Marketdə endirim görsən?",choices:["Qiyməti hesablayıram","Dostuma deyirəm","Dərhal alıram","Heç nə etmirəm"]},
    {text:"Bir dostunu uzaqdan görsən?",choices:["Səsləyirəm","Telefonuma baxıram","Əl edirəm","Yanına gedirəm"]}
  ];
  const regions=[
    {name:"Bakı",emoji:"🌊",topic:"phone",intro:"Bakı küçəsində tələsərkən telefonun zəng çalır."},
    {name:"Şirvan",emoji:"☀️",topic:"tea",intro:"Şirvanda bir həyət söhbəti başlayır və çay gəlir."},
    {name:"Gəncə",emoji:"🌳",topic:"social",intro:"Gəncə parkında uzaqdan tanış birini görürsən."},
    {name:"Şəki",emoji:"🏡",topic:"home",intro:"Şəkidə ailə evinə gözlənilməz qonaq gəlir."},
    {name:"Lənkəran",emoji:"🍃",topic:"tea",intro:"Lənkəranda evə qayıdanda çay süfrəsi hazırdır."},
    {name:"Naxçıvan",emoji:"⛰️",topic:"work",intro:"Naxçıvanda işə gecikdiyin vaxt sürpriz zəng gəlir."},
    {name:"Quba",emoji:"🍏",topic:"shopping",intro:"Qubada marketə bir şey almağa girib siyahını unudursan."},
    {name:"Sumqayıt",emoji:"🏙️",topic:"transport",intro:"Sumqayıtda avtobusdan bir dayanacaq gec düşürsən."}
  ];
  const roles=[
    {id:"tea",emoji:"☕",title:"Sakitləşdirici çay ustası",intro:"Sən qarışıqlığı əvvəl bir stəkan çayla həll edirsən."},
    {id:"phone",emoji:"📱",title:"Plan B mütəxəssisi",intro:"Gözlənilməz vəziyyətdə telefon yaxşı bəhanə olur."},
    {id:"home",emoji:"🏠",title:"Evin baş rejissoru",intro:"Hadisənin mərkəzində həmişə evdəki səhnə var."},
    {id:"social",emoji:"📡",title:"Məhəllə radarı",intro:"Qonşu xəbərləri radarından yan keçmir."},
    {id:"work",emoji:"💼",title:"İşə girişən",intro:"Nə baş versə, bir iş planı tapırsan."},
    {id:"shopping",emoji:"🛒",title:"Endirim ovçusu",intro:"Qiymətlər səndən qaça bilməz."}
  ];
  function hash(value){let v=2166136261;for(const ch of String(value)){v^=ch.charCodeAt(0);v=Math.imul(v,16777619);}return v>>>0;}
  function pick(arr,seed){return arr.length?arr[hash(seed)%arr.length]:null;}
  function distinct(arr,key){const seen=new Set();return arr.filter(x=>{const id=key?key(x):x;if(seen.has(id))return false;seen.add(id);return true;});}
  function dateBaku(offset=0){
    const now=new Date(Date.now()+offset*86400000);
    try{return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Baku",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);}
    catch{return now.toISOString().slice(0,10);}
  }
  function validID(id){return /^[A-Za-z0-9_-]{11}$/.test(String(id||""));}
  function videosFor(all,api,topic,seed="",max=5,excluded=[]){
    if(!api?.list)return [];
    const veto=new Set(excluded);
    const list=api.list(all).filter(v=>!veto.has(v.id));
    const relevant=list.filter(v=>api.categories?.(v).includes(topic));
    const rest=list.filter(v=>!relevant.includes(v));
    const bySeed=arr=>[...arr].sort((a,b)=>hash(seed+a.id)-hash(seed+b.id));
    return [...bySeed(relevant),...bySeed(rest)].slice(0,Math.max(0,max));
  }
  function titleOf(video,api){return api?.title?api.title(video):String(video?.title||"Video");}
  function safeCode(arr,min=3,max=5){
    return Array.isArray(arr) && arr.length>=min&&arr.length<=max&&
      arr.every(v=>Number.isInteger(v)&&v>=0&&v<=3);
  }
  function encodeDuel(arr){return safeCode(arr,3,3)?"d1_"+arr.join(""):null;}
  function decodeDuel(s){return /^d1_[0-3]{3}$/.test(String(s||""))?s.slice(3).split("").map(Number):null;}
  function compareDuel(a,b){return safeCode(a,3,3)&&safeCode(b,3,3)?a.filter((n,i)=>n===b[i]).length:null;}
  host.BBParkData=Object.freeze({modes,topics,stories,polls,duelQuestions,regions,roles,hash,pick,distinct,dateBaku,validID,videosFor,titleOf,encodeDuel,decodeDuel,compareDuel});
})(typeof window!=="undefined"?window:globalThis);
if(typeof module!=="undefined"&&module.exports)module.exports=globalThis.BBParkData;
