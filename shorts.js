"use strict";
/* Swipe interface: never autoplay or prefetch video iframe. */
(() => {
  const d = window.BBDiscover;
  if (!d) return;
  const $ = id => document.getElementById(id);
  const stage = $("feed-stage"), frame=$("feed-frame"), poster=$("feed-poster");
  if (!stage || !frame || !poster) return;
  const play=$("feed-play"), hint=$("feed-hint"), name=$("feed-title"), stats=$("feed-views");
  const counter=$("feed-position"),prev=$("feed-previous"),next=$("feed-next"),share=$("feed-share"),youtube=$("feed-youtube");
  let list=[], index=0, playing=false, startTouch=null, lastWheel=0;
  const validId = /^[a-zA-Z0-9_-]{11}$/;

  function removePlayer() {
    const iframe=frame.querySelector("iframe");
    if (iframe) iframe.remove(); // Removing the iframe stops the previous video's audio.
    playing=false;
    poster.hidden=false;
    play.hidden=false;
    hint.hidden=false;
  }

  function show() {
    if (!list.length) return;
    removePlayer();
    const v = list[index];
    poster.src="https://i.ytimg.com/vi/"+encodeURIComponent(v.id)+"/hqdefault.jpg";
    poster.alt=d.title(v);
    name.textContent=d.title(v);
    stats.textContent="👁 "+new Intl.NumberFormat("az-AZ").format(Number(v.views)||0)+" baxış";
    counter.textContent=(index+1)+" / "+list.length+" • Azərbaycan yumoru";
    youtube.href="https://www.youtube.com/shorts/"+encodeURIComponent(v.id);
    share.dataset.shareVideo=v.id;
    share.dataset.title=d.title(v);
    prev.disabled=index===0;
    next.disabled=index===list.length-1;
    try { history.replaceState(null,"","/shorts.html?v="+encodeURIComponent(v.id)); } catch (_) {}
  }

  function move(dir) {
    const nextIndex=Math.max(0,Math.min(list.length-1,index+dir));
    if(nextIndex===index)return;
    index=nextIndex;
    show();
    d.track("shorts_feed_next",{position:index+1});
  }

  function startPlayback() {
    if (!list.length || playing) return;
    playing=true;
    const video=list[index];
    const iframe=document.createElement("iframe");
    iframe.title="Bizdə Belədir: "+d.title(video);
    iframe.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.referrerPolicy="strict-origin-when-cross-origin";
    iframe.allowFullscreen=true;
    iframe.src="https://www.youtube-nocookie.com/embed/"+encodeURIComponent(video.id)+
      "?autoplay=1&playsinline=1&rel=0";
    poster.hidden=true;
    play.hidden=true;
    hint.hidden=true;
    frame.appendChild(iframe);
    d.remember(video.id);
    d.track("video_start",{video_id:video.id,player:"shorts_feed"});
  }

  async function initialize() {
    try {
      const response=await fetch("/all-videos.json?v="+Math.floor(Date.now()/600000));
      if(!response.ok)throw new Error("HTTP "+response.status);
      list=d.list(await response.json()).sort((a,b)=>
        (Date.parse(b.publishedAt)||0)-(Date.parse(a.publishedAt)||0));
      if(!list.length)throw new Error("Empty list");
      window.BBVids=list;
      const desired=new URLSearchParams(location.search).get("v");
      if(desired && validId.test(desired)) {
        const n=list.findIndex(v=>v.id===desired);
        if(n>=0)index=n;
      }
      show();
    }catch(_) {
      name.textContent="Video siyahısı hazırda əlçatan deyil";
      stats.textContent="Bütün videolara keç";
      play.disabled=true;
      const a=document.createElement("a");
      a.textContent="Bütün videolar →";a.href="/videos.html";
      stats.append(" ");stats.append(a);
    }
  }
  play.addEventListener("click",startPlayback);
  prev.addEventListener("click",()=>move(-1));
  next.addEventListener("click",()=>move(1));
  frame.addEventListener("touchstart",e=>{
    if(e.touches.length===1)startTouch={x:e.touches[0].clientX,y:e.touches[0].clientY};
  },{passive:true});
  frame.addEventListener("touchend",e=>{
    if(!startTouch || !e.changedTouches.length)return;
    const dx=e.changedTouches[0].clientX-startTouch.x;
    const dy=e.changedTouches[0].clientY-startTouch.y;
    startTouch=null;
    if(Math.abs(dy)>70 && Math.abs(dy)>Math.abs(dx)*1.3)move(dy<0?1:-1);
  },{passive:true});
  window.addEventListener("wheel",event=>{
    const now=Date.now();if(now-lastWheel<500)return;
    if(Math.abs(event.deltaY)>20){lastWheel=now;move(event.deltaY>0?1:-1);}
  },{passive:true});
  document.addEventListener("keydown",event=>{
    if(["ArrowDown","ArrowRight"].includes(event.key)){event.preventDefault();move(1);}
    if(["ArrowUp","ArrowLeft"].includes(event.key)){event.preventDefault();move(-1);}
  });
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden)removePlayer();
  });
  initialize();
})();
