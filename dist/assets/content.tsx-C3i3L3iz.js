if(!window.__TIMELENS_INJECTED){window.__TIMELENS_INJECTED=!0;let e=`domain`,t=null,n=(t,n)=>{if(document.getElementById(`timelens-intervention-overlay`))return;e=n;let r=document.createElement(`div`);r.id=`timelens-intervention-overlay`,Object.assign(r.style,{position:`fixed`,top:`0`,left:`0`,width:`100vw`,height:`100vh`,backgroundColor:`rgba(255, 255, 255, 0.3)`,backdropFilter:`blur(12px)`,WebkitBackdropFilter:`blur(12px)`,zIndex:`999999999`,display:`flex`,alignItems:`center`,justifyContent:`center`,fontFamily:`system-ui, -apple-system, sans-serif`,opacity:`0`,transition:`opacity 0.8s ease-in-out`}),r.innerHTML=`
      <div style="
        background: white;
        padding: 40px;
        border-radius: 24px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        text-align: center;
        max-width: 400px;
        border: 1px solid #f0f0f0;
        transform: translateY(20px);
        transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
      " id="timelens-card">
        <div style="font-size: 48px; margin-bottom: 16px;">🌱</div>
        <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 24px; font-weight: 700;">该休息一下了</h2>
        <p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin-bottom: 32px;">
          ${t}
        </p>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <button id="tl-btn-rest" style="
            background: #10B981;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          ">休息 5 分钟</button>
          <button id="tl-btn-extend" style="
            background: #F3F4F6;
            color: #4B5563;
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          ">再延长 30 分钟</button>
        </div>
      </div>
    `,document.body.appendChild(r),requestAnimationFrame(()=>{r.style.opacity=`1`;let e=document.getElementById(`timelens-card`);e&&(e.style.transform=`translateY(0)`)});let i=document.getElementById(`tl-btn-rest`),s=document.getElementById(`tl-btn-extend`);i&&(i.addEventListener(`mouseenter`,()=>i.style.backgroundColor=`#059669`),i.addEventListener(`mouseleave`,()=>i.style.backgroundColor=`#10B981`),i.addEventListener(`click`,a)),s&&(s.addEventListener(`mouseenter`,()=>s.style.backgroundColor=`#E5E7EB`),s.addEventListener(`mouseleave`,()=>s.style.backgroundColor=`#F3F4F6`),s.addEventListener(`click`,o))},r=()=>{t&&=(clearInterval(t),null);let e=document.getElementById(`timelens-intervention-overlay`);e&&(e.style.opacity=`0`,setTimeout(()=>e.remove(),800))},i=n=>{let i=document.getElementById(`tl-btn-rest`),a=document.getElementById(`tl-btn-extend`);i&&(i.style.opacity=`0.7`,i.style.cursor=`not-allowed`,i.style.backgroundColor=`#10B981`),a&&(a.style.opacity=`0.5`,a.style.pointerEvents=`none`),t&&clearInterval(t);let o=n,s=()=>{i&&(i.innerText=`休息中... (${Math.floor(o/60)}:${(o%60).toString().padStart(2,`0`)})`)};s(),t=window.setInterval(()=>{o--,s(),o<=0&&(t&&clearInterval(t),r(),chrome.runtime.sendMessage({action:`REST_COMPLETED`,type:e}))},1e3)},a=()=>{chrome.runtime.sendMessage({action:`START_REST`,type:e},t=>{t&&t.status===`rest_started`&&e===`domain`&&i(300)})},o=()=>{r(),chrome.runtime.sendMessage({action:`EXTEND_TIME`,minutes:30,type:e})};chrome.runtime.onMessage.addListener((e,t,a)=>(e.action===`BLUR_PAGE`?(console.log(`[TimeLens Content] Received BLUR_PAGE (${e.type}) instruction`),n(e.message,e.type),a({status:`blurred`})):e.action===`REMOVE_BLUR`?(r(),a({status:`cleared`})):e.action===`REST_IN_PROGRESS`?(console.log(`[TimeLens Content] Resuming rest state: ${e.timeLeft}s left`),n(e.type===`global`?`全局休息中...请让眼睛离开屏幕。`:`休息时间还没结束，请继续远离屏幕。`,e.type),i(e.timeLeft),a({status:`rest_resumed`})):e.action===`SYNC_REST_TIMER`&&(console.log(`[TimeLens Content] Syncing global rest timer: ${e.timeLeft}s`),i(e.timeLeft),a({status:`timer_synced`})),!0))}