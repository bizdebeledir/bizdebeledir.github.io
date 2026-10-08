"use strict";
(() => {
  const form=document.getElementById("idea-form");
  const textarea=document.getElementById("idea-text");
  const consent=document.getElementById("idea-consent");
  const count=document.getElementById("idea-count");
  const result=document.getElementById("idea-result");
  const submit=document.getElementById("idea-submit");
  if(!form||!textarea||!consent||!result||!submit)return;
  const API_LIMIT=450;
  let busy=false;
  textarea.addEventListener("input",()=>{count.textContent=String(textarea.value.length)+"/"+API_LIMIT;});
  form.addEventListener("submit",async e=>{
    e.preventDefault();
    if(busy)return;
    const idea=textarea.value.trim();
    if(idea.length<18||idea.length>API_LIMIT){
      result.textContent="İdeya 18–450 simvol olmalıdır.";result.className="ph-feedback ph-bad";return;
    }
    if(!consent.checked){
      result.textContent="Anonim göndərilməyə razılığı təsdiqlə.";result.className="ph-feedback ph-bad";return;
    }
    busy=true;submit.disabled=true;result.textContent="Göndərilir…";result.className="ph-feedback";
    try{
      const clock=Math.floor(Date.now()/60000);
      const config=await fetch("/visitor-config.json?t="+clock,{cache:"no-store"}).then(r=>{
        if(!r.ok)throw Error("Config unavailable");return r.json();
      });
      const endpoint=String(config?.endpoint||"").replace(/\/+$/,"");
      if(!/^https:\/\/(?:[a-z0-9-]+\.trycloudflare\.com|bb-site-visitors\.[a-z0-9-]+\.workers\.dev)$/.test(endpoint))
        throw Error("Backend is not configured");
      const ctrl=new AbortController();
      const timer=setTimeout(()=>ctrl.abort(),12000);
      let response;
      try{
        response=await fetch(endpoint+"/v1/idea",{
          method:"POST",mode:"cors",credentials:"omit",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({idea,consent:true}),signal:ctrl.signal
        });
      }finally{clearTimeout(timer);}
      if(response.status===202){
        textarea.value="";consent.checked=false;count.textContent="0/"+API_LIMIT;
        result.textContent="✅ Göndərildi. İdeya yoxlanılmaq üçün növbəyə düşdü.";
        result.className="ph-feedback ph-good";
        window.BBDiscover?.track("bb_idea_submitted");
      }else if(response.status===429){
        result.textContent="Bu gün üçün göndərmə limiti dolub. Sabah yenidən yoxla.";
        result.className="ph-feedback ph-bad";
      }else{
        result.textContent="Göndərmə alınmadı. İdeyanı saxla və sonra yenidən yoxla.";
        result.className="ph-feedback ph-bad";
      }
    }catch{
      result.textContent="Bağlantı hazırda əlçatan deyil. İdeyanı saxla və sonra yenidən yoxla.";
      result.className="ph-feedback ph-bad";
    }finally{busy=false;submit.disabled=false;}
  });
})();
