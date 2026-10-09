"use strict";
/* Bizdə Belədir · independent, local-only creative studio data. */
(function(host){
 const topics=[
  {slug:"qonaq",label:"Qonaq gələndə",emoji:"🚪",category:"social",terms:["qonaq","qonaqlıq","qonaqlar"],intro:"Qapı döyülməmiş evdə başlayan hazırlıq, süfrə söhbəti və gözlənilməz qonaq hadisələri.",insight:"Qonaq gələcəyini eşidəndə evin hansı otağı birinci yığışdırılır? Gündəlik həyatımızda hamının tanıdığı belə xırda məqamlar ən təbii yumor mənbələrindəndir.",prompts:["Qonaq gələndə evdə ilk kim tələsir?","Qonaq gedən kimi ilk nə edirsən?"]},
  {slug:"toy",label:"Toy və məclis",emoji:"💃",category:"social",terms:["toy","toya","toyda","məclis"],intro:"Toy masasında gecikən yemək, uzun çıxışlar və hər kəsə tanış məclis anları.",insight:"Toyda hər adamın öz kiçik planı olur. Biri yeməyi gözləyir, biri musiqiyə qulaq asır, biri isə tanış axtarır. Bu fərqli gözləntilərdən məişət zarafatları yaranır.",prompts:["Toyda ən çox nəyi gözləyirsən?","Səncə, toyda hamının başına gələn hadisə hansıdır?"]},
  {slug:"qonsu",label:"Qonşu və məhəllə",emoji:"🏘️",category:"social",terms:["qonşu","qonşular","məhəllə","salamlaş"],intro:"Qonşunun səsi, yoldakı salamlaşmalar və məhəllədə gözlənilməz söhbətlər.",insight:"Bəzən bir salamla başlayan qısa görüş uzun söhbətə çevrilir. Qonşu mövzusu tanış münasibətlərin gülməli tərəfini göstərir və ayrı-ayrı insanların eyni hadisəyə fərqli reaksiyalarını üzə çıxarır.",prompts:["Qonşu ilə söhbətə düşəndə vaxt necə keçir?","Sənin məhəlləndə ən tanış vəziyyət hansıdır?"]},
  {slug:"telefon",label:"Telefon və bildirişlər",emoji:"📱",category:"phone",terms:["telefon","bildiriş","zəng","ekran","mesaj","şarj"],intro:"Telefon əlində ola-ola onu axtarmaq və bildiriş gəlməsə də ekrana baxmaq.",insight:"Telefon gündəlik həyatın ayrılmaz hissəsidir. Heç bir mesaj gəlməsə də ekranı yoxlamaq, vacib zəngi gözləmək, şarj cihazını axtarmaq kimi hadisələr demək olar ki, hər yerdə baş verir.",prompts:["Bir bildirişi neçə dəfə yoxlamısan?","Telefonu əlində ola-ola axtarmısan?"]},
  {slug:"market",label:"Market və qiymətlər",emoji:"🛒",category:"shopping",terms:["market","qiymət","kassa","endirim","pul","terminal","satıcı"],intro:"Kassadakı gözlənilməz məbləğ, qiymət soruşmaq və endirim hesablamaları.",insight:"Marketə bir şey almağa gedib başqa şeylərlə qayıtmaq bəzən bir dəqiqəyə baş verir. Qiymət etiketini iki dəfə yoxlamaq və kassada qərarı dəyişmək tanış komediya səhnələri üçün yaxşı başlanğıcdır.",prompts:["Qiyməti görəndə fikrini dəyişmisən?","Endirim görəndə siyahını unudursan?"]},
  {slug:"cay",label:"Çay süfrəsi",emoji:"☕",category:"tea",terms:["çay","qənd","stəkan","çaydan","fincan"],intro:"Çay süzülən kimi hamının yadına çay düşməsi və süfrədəki kiçik hadisələr.",insight:"Çay süfrəsi yalnız içki içmək deyil, həm də söhbət məkanıdır. Hamı özünə çay süzməyə hazırlaşanda birdən başqa stəkanlar da uzanır. Xırda təsadüflər yumorun ən təbii yeridir.",prompts:["Çayı kimə süzəndə hamı istəyir?","Qəndlə yoxsa şəkərsiz içirsən?"]},
  {slug:"usaq",label:"Uşaq məntiqi",emoji:"🧸",category:"kids",terms:["uşaq","oğlum","qızım","bala","məktəb","körpə"],intro:"Uşaqların gözlənilməz sualları, oyunları və böyükləri təəccübləndirən məntiqi.",insight:"Uşaq üçün sadə görünən bir oyun böyük adam üçün həqiqi tapmacaya çevrilə bilir. Uşağın gözlərini bağlayıb özünü görünməz sayması kimi hadisələr şirin məişət yumorudur.",prompts:["Uşağın verdiyi ən çətin sadə sual nə idi?","Evdə hansı oyun hamını güldürür?"]},
  {slug:"ev",label:"Evdəki hadisələr",emoji:"🏠",category:"home",terms:["ev","evdə","otaq","divan","qapı","pult","mətbəx"],intro:"Evdə itən pult, yer dəyişən əşyalar və qonaq gələn kimi başlayan hazırlıq.",insight:"Ev içində hər kəsin öz vərdişi var. Bir nəfər pultun yerini xatırlayır, digəri həmin pultun yerini dəyişir. Hər gün baş verən bu xırda anlaşılmazlıqlar video səhnələrə asanlıqla çevrilə bilir.",prompts:["Evdə ən çox hansı əşya itir?","Qapı döyüləndə kim birinci qalxır?"]},
  {slug:"is",label:"İş və maaş",emoji:"💼",category:"work",terms:["iş","müdir","maaş","ofis","işçi","işə","işdən"],intro:"Müdir görünən kimi başlayan tələskənlik, iş fasiləsi və maaşla bağlı gülməli hadisələr.",insight:"İş günündə hər kəsin öz ritmi olur. Fasilənin tez bitməsi, xırda işlərin birdən böyüməsi, gözlənilməz çağırışlar insanları eyni anda həm təəccübləndirə, həm güldürə bilir.",prompts:["İşdə ən tez nə vaxt saat yoxlayırsan?","Hansı iş ifadəsi hamıya tanışdır?"]},
  {slug:"yol",label:"Yol və nəqliyyat",emoji:"🚌",category:"transport",terms:["taksi","avtobus","marşrut","dayanacaq","sürücü","maşın"],intro:"Marşrutda düşəcəyini deməyə utanmaq, taksidə ünvan izah etmək və yol hadisələri.",insight:"Yolda hər kəs bir istiqamətə gedir, amma hamının düşüncəsi eyni olmur. Dayanacaqdan əvvəl düşmək istəyən, yol soruşan və sürücüdən xırda gözləyən adamlar gündəlik komediyanın personajlarıdır.",prompts:["Marşrutda düşəcəyini gec demisən?","Taksi sürücüsünə yolu neçə dəfə izah etmisən?"]},
  {slug:"aile",label:"Ailə söhbətləri",emoji:"❤️",category:"couple",terms:["arvad","ər","yoldaş","həyat yoldaşı","ana","ata","gəlin"],intro:"Ər-arvad arasında tanış dialoqlar və ailənin gündəlik kiçik anlaşılmazlıqları.",insight:"Ailədə hər kəsin bir zarafatı olur. Eyni cümləni iki nəfər tam fərqli başa düşə bilir. Bu fərqli baxışları gülməli səhnəyə çevirmək üçün hadisəni alçaltmadan, təbii göstərmək daha təsirlidir.",prompts:["Evdə pult sonuncu kimdə olur?","Ailə söhbətində ən məşhur cümlə nədir?"]},
  {slug:"dost",label:"Dostlar və tanışlar",emoji:"🤝",category:"social",terms:["dost","tanış","salam","görüş","hesab","məhlə"],intro:"Uzaqdan tanış bilmək, dostlarla hesablaşmaq və gülməli salamlaşmalar.",insight:"Dostla kiçik anlaşılmazlıq bəzən günün ən yadda qalan hadisəsinə çevrilir. Uzaqdan birini tanışa oxşadıb yaxınlaşanda səhvini anlamaq kimi məqamlar bir çox adamın yaşadığı səhnələrdir.",prompts:["Uzaqdan adamı səhv salmısan?","Dostlarla hesab gələndə nə baş verir?"]}
 ];
 const bingo=[
  "Telefon əlimdə ola-ola onu axtarmışam","Çayı özümə süzən kimi başqaları da istəyib",
  "Qonaq gələndə birdən otaq yığışdırmışam","Uzaqdan tanışı başqa adamla səhv salmışam",
  "Marşrutda «düşən var» deməyə utanmışam","Qiyməti soruşub almadan çıxmışam",
  "Qapı zəngini eşidib hamıdan əvvəl baxmışam","Müdir gələndə bir anda məşğul görünmüşəm",
  "Marketdə yalnız bir şey alacaqdım, beşini almışam","Telefon bildirişi gəlməsə də ekranı açmışam",
  "Toyda yeməyin gəlməsini gözləmişəm","Divanın altında pult axtarmışam",
  "Yuxuya gedərkən sabahki işlərimi planlaşdırmışam","Bir dostuma beş dəqiqə deyib gecikmişəm",
  "Qonşuya salam deyib uzun söhbətə düşmüşəm","Telefonun şarjını 1%-də görmüşəm",
  "Süfrədə axırıncı tikəni heç kim götürməyib","Kassada xırda pul axtarmışam",
  "Bir şeyi niyə axtardığımı unutmuşam","Səhv qapını döymüşəm",
  "Evdən çıxıb nəyisə unutduğum üçün qayıtmışam","Bir mesajı yazıb sonra silmişəm",
  "Qonaq gedəndən sonra rahat nəfəs almışam","Ekranın vaxtına baxıb yenə unutmuşam",
  "Qapını bağlayıb bağlamadığımı yenidən yoxlamışam","Yoldakı tanışa uzaqdan əl etmişəm",
  "Pult yanımda olduğu halda axtarmışam","Dostla görüş üçün yer seçmək uzanıb",
  "Mətbəxə gedib nə istədiyimi unutmuşam","Avtobusun dayanacağını ötürmüşəm",
  "Qəhvə əvəzinə çay içməyi seçmişəm","Əhəmiyyətli zəngi gözləyərkən hər zəngə baxmışam",
  "Qiymət etiketini iki dəfə oxumuşam","Sözümü bitirəndən sonra başqa şey yadıma düşüb",
  "Telefonla danışa-danışa telefonu axtarmışam","Mənim üçün saxlanan yeməyi başqası yeyib"
 ];
 const series=[
  {id:"qonaq",title:"Qonaq gəlir!",emoji:"🚪",topics:["qonaq","ev"],desc:"Qapı döyüləndə başlayan məişət səhnələrindən seçilmiş kolleksiya"},
  {id:"telefon",title:"Telefonun işləri",emoji:"📱",topics:["telefon"],desc:"Zəng, bildiriş və telefonla bağlı yumor videoları"},
  {id:"cay",title:"Çay hazırdır",emoji:"☕",topics:["cay","toy"],desc:"Süfrə ətrafındakı kiçik, amma tanış hadisələr"},
  {id:"market",title:"Market macəraları",emoji:"🛒",topics:["market"],desc:"Qiymət, alış-veriş və kassada yaşananlar"},
  {id:"yol",title:"Yol yoldaşları",emoji:"🚌",topics:["yol"],desc:"Avtobus, taksi və dayanacaq hadisələri"}
 ];
 function fold(t){
  const m={"ə":"e","ğ":"g","ı":"i","ö":"o","ş":"s","ç":"c","ü":"u"};
  return String(t||"").toLocaleLowerCase("az-AZ").split("").map(c=>m[c]||c).join("").replace(/[^a-z0-9]+/g," ").trim();
 }
 function hash(s){let x=2166136261;for(const c of String(s)){x=Math.imul(x^c.charCodeAt(0),16777619);}return x>>>0;}
 function title(v){return String(v?.title||"").split("#")[0].trim().slice(0,120);}
 function matches(v,t){
  const topic=topics.find(x=>x.slug===t);
  if(!topic)return false;
  const text=" "+fold(title(v))+" ";
  return topic.terms.some(q=>{
   const w=fold(q);
   if(w==="er"||w==="is"||w==="ev")return text.includes(" "+w+" ");
   return text.includes(" "+w+" ")||w.length>=4&&text.split(" ").some(x=>x.startsWith(w));
  });
 }
 function videosFor(videos,slugs,limit=12){
  const found=[],ids=new Set();
  for(const v of Array.isArray(videos)?videos:[]){
   if(!v||!(/^[A-Za-z0-9_-]{11}$/).test(v.id)||ids.has(v.id))continue;
   if(slugs.some(s=>matches(v,s))){found.push(v);ids.add(v.id);}
  }
  return found.slice(0,limit);
 }
 function safePlaylist(ids,validVideos){
  if(!Array.isArray(ids)||ids.length>5||ids.length<1)return null;
  const allowed=new Set((validVideos||[]).map(v=>v.id));
  return new Set(ids).size===ids.length&&ids.every(id=>/^[A-Za-z0-9_-]{11}$/.test(id)&&allowed.has(id))?[...ids]:null;
 }
 function shareLink(ids){
  if(!Array.isArray(ids)||ids.length<1||ids.length>5||!ids.every(id=>/^[A-Za-z0-9_-]{11}$/.test(id)))return null;
  return "https://bizdebeledir.github.io/yumor-studiyasi.html?tab=playlist&v="+ids.join(".");
 }
 function parseLink(raw,all){
  if(typeof raw!=="string"||raw.length>60||!(/^[-_A-Za-z0-9]{11}(?:\.[-_A-Za-z0-9]{11}){0,4}$/).test(raw))return null;
  return safePlaylist(raw.split("."),all);
 }
 function bingoGrid(seed="v1"){
  const items=[...bingo].map((s,i)=>({s,k:hash(seed+":"+i)})).sort((a,b)=>a.k-b.k);
  return items.slice(0,25).map(x=>x.s);
 }
 function archive(videos,day=new Date()){
  const parser=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Baku",year:"numeric",month:"2-digit",day:"2-digit"});
  const parts=stamp=>Object.fromEntries(parser.formatToParts(stamp).map(x=>[x.type,Number(x.value)]));
  const target=parts(day);
  const all=[...(videos||[])].filter(x=>Number.isFinite(Date.parse(x.publishedAt)));
  const matches=all.filter(v=>{
   const p=parts(new Date(v.publishedAt));
   return p.year<target.year && p.month===target.month && p.day===target.day;
  });
  if(matches.length)return {exact:true,videos:matches.slice(0,6)};
  const older=all.filter(v=>Date.parse(v.publishedAt)<day.getTime()).sort((a,b)=>Date.parse(a.publishedAt)-Date.parse(b.publishedAt));
  return {exact:false,videos:older.slice(0,6)};
 }
 host.BBStudio=Object.freeze({topics,bingo,series,fold,title,matches,videosFor,safePlaylist,shareLink,parseLink,bingoGrid,archive,hash});
})(typeof window!=="undefined"?window:globalThis);
if(typeof module!=="undefined"&&module.exports)module.exports=globalThis.BBStudio;
